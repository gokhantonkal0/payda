from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import models


# ---------- Yardımcılar ----------

def _today_start_end():
    today = date.today()
    start = datetime(today.year, today.month, today.day)
    end = datetime(today.year, today.month, today.day, 23, 59, 59)
    return start, end


# ---------- Beneficiary Seçme ----------

def assign_beneficiary(db: Session):
    """
    En yüksek öncelikli, doğrulanmış ihtiyaç sahibini seçer.
    role: beneficiary veya both olanlar
    """
    beneficiary = (
        db.query(models.User)
        .filter(
            models.User.role.in_(["beneficiary", "both"]),
            models.User.is_verified.is_(True)
        )
        .order_by(models.User.priority.desc())
        .first()
    )
    return beneficiary


# ---------- Kupon Oluşturma ----------

def create_coupon(db: Session, coupon_type_id: int):
    """
    Havuz dolduğunda kupon üretir ve uygun ihtiyaç sahibine atar.
    """

    coupon_type = db.query(models.CouponType).filter(models.CouponType.id == coupon_type_id).first()
    if not coupon_type:
        return None

    beneficiary = assign_beneficiary(db)

    coupon = models.Coupon(
        coupon_type_id=coupon_type_id,
        beneficiary_id=beneficiary.id if beneficiary else None,
        status="assigned" if beneficiary else "created"
    )

    db.add(coupon)
    db.commit()
    db.refresh(coupon)

    return coupon


# ---------- Bağış İşlemi ----------

def donate(db: Session, user_id: int, amount: float, coupon_type_id: int = 1):
    """
    Bağış akışı:
    1) Kullanıcının bakiyesini ve günlük limitini kontrol et
    2) Bakiyeden düş
    3) Donation kaydı oluştur
    4) Havuzu güncelle
    5) Havuz dolduysa kupon oluştur
    """

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {"status": "error", "message": "Kullanıcı bulunamadı"}

    if user.balance < amount:
        return {"status": "error", "message": "Yetersiz bakiye"}

    # Günlük limit kontrolü KALDIRILDI - Gönüllüler istediği kadar bağış yapabilir
    # (Kod yorum satırına alındı, limit kontrolü yapılmıyor)

    # 1-2) Bakiyeden düş
    user.balance -= amount

    # 3) Donation kaydı
    donation = models.Donation(
        user_id=user.id,
        amount=amount,
        coupon_type_id=coupon_type_id
    )
    db.add(donation)

    # 4) Havuzu bul ve güncelle
    pool = db.query(models.Pool).filter(models.Pool.coupon_type_id == coupon_type_id).first()
    if not pool:
        return {"status": "error", "message": "Havuz bulunamadı"}

    # Kupon tipi bilgisini al
    coupon_type = db.query(models.CouponType).filter(models.CouponType.id == coupon_type_id).first()
    if not coupon_type:
        return {"status": "error", "message": "Kupon tipi bulunamadı"}

    pool.current_balance += amount

    created_coupons = []
    created_count = 0

    # 5) Havuz dolduysa, her target_amount için bir kupon üret
    # Örneğin: target_amount=6000, coupon_amount=1000 ise, 6 kupon oluşturulmalı
    while pool.current_balance >= pool.target_amount:
        pool.current_balance -= pool.target_amount
        created_coupon = create_coupon(db, coupon_type_id)
        if created_coupon:
            created_coupons.append({
                "id": created_coupon.id,
                "beneficiary_id": created_coupon.beneficiary_id,
                "status": created_coupon.status,
            })
            created_count += 1

    db.commit()
    db.refresh(user)
    db.refresh(pool)

    response = {
        "status": "success",
        "message": "Bağış alındı",
        "user_balance": user.balance,
        "donor_balance": user.balance,  # Frontend için
        "pool_current": pool.current_balance,
        "created_coupons_count": created_count,
        "coupon_type_name": coupon_type.name,  # Bildirim için
        "merchant_name": coupon_type.merchant.name  # Bildirim için
    }

    if created_coupons:
        response["coupons"] = created_coupons
        response["message"] = f"Bağış alındı ve {created_count} kupon oluşturuldu"

    return response


# ---------- Kullanıcı → Kullanıcı Transfer ----------

def transfer(db: Session, sender_id: int, receiver_id: int, amount: float):
    sender = db.query(models.User).filter(models.User.id == sender_id).first()
    receiver = db.query(models.User).filter(models.User.id == receiver_id).first()

    if not sender or not receiver:
        return {"status": "error", "message": "Kullanıcı bulunamadı"}

    if sender.balance < amount:
        return {"status": "error", "message": "Yetersiz bakiye"}

    sender.balance -= amount
    receiver.balance += amount

    transfer_rec = models.Transfer(
        sender_id=sender.id,
        receiver_id=receiver.id,
        amount=amount
    )
    db.add(transfer_rec)
    db.commit()
    db.refresh(sender)
    db.refresh(receiver)

    return {
        "status": "success",
        "message": "Transfer tamamlandı",
        "sender_balance": sender.balance,
        "receiver_balance": receiver.balance
    }


# ---------- İşletme Geri Bağış ----------

def merchant_backflow(db: Session, coupon_id: int):
    """
    İşletmenin kupon tutarının belirli oranını havuza geri göndermesini simüle eder.
    backflow_rate: örn. %10 → 0.10
    """

    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        return {"status": "error", "message": "Kupon bulunamadı"}

    coupon_type = coupon.coupon_type
    merchant = coupon_type.merchant
    pool = coupon_type.pool

    back_amount = coupon_type.amount * merchant.backflow_rate
    pool.current_balance += back_amount

    db.commit()
    db.refresh(pool)

    return {
        "status": "success",
        "backflow_amount": back_amount,
        "pool_current": pool.current_balance,
    }


# ---------- Kupon Kullanım ----------

def use_coupon(db: Session, coupon_id: int):
    """Kupon kullanımı - İşletmeye para ekle, günlük limit kontrolü yap, %10 otomatik bağış"""
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        return {"status": "error", "message": "Kupon bulunamadı"}

    if coupon.status == "used":
        return {"status": "error", "message": "Kupon zaten kullanılmış"}

    coupon_type = coupon.coupon_type
    merchant = coupon_type.merchant
    
    # İşletme kullanıcısını bul (merchant_id ile user.id eşleşmeli)
    merchant_user = db.query(models.User).filter(
        models.User.id == merchant.id,
        models.User.role.in_(["merchant", "seller"])
    ).first()
    
    if not merchant_user:
        # Merchant ID ile user ID farklı olabilir, merchant_id'yi user_id olarak kullan
        merchant_user = db.query(models.User).filter(models.User.id == merchant.id).first()
    
    if not merchant_user:
        return {"status": "error", "message": "İşletme kullanıcısı bulunamadı"}
    
    coupon_amount = coupon_type.amount
    today = date.today()
    
    # Günlük kazanç kaydını bul veya oluştur
    daily_earning = db.query(models.MerchantDailyEarnings).filter(
        models.MerchantDailyEarnings.merchant_id == merchant.id,
        func.date(models.MerchantDailyEarnings.date) == today
    ).first()
    
    if not daily_earning:
        daily_earning = models.MerchantDailyEarnings(
            merchant_id=merchant.id,
            date=datetime.utcnow(),
            daily_earnings=0.0,
            daily_limit=2000.0,
            total_earnings=0.0,
            total_donated_back=0.0
        )
        db.add(daily_earning)
    
    # Günlük limit kontrolü
    if daily_earning.daily_earnings + coupon_amount > daily_earning.daily_limit:
        return {
            "status": "error",
            "message": f"Günlük kazanç limiti aşıldı. Limit: {daily_earning.daily_limit} TL, Bugünkü kazanç: {daily_earning.daily_earnings:.2f} TL"
        }
    
    # İşletmeye para ekle
    merchant_user.balance += coupon_amount
    
    # Günlük kazanç güncelle
    daily_earning.daily_earnings += coupon_amount
    daily_earning.total_earnings += coupon_amount
    
    # Kazancın %10'unu otomatik bağış olarak ekle
    backflow_amount = coupon_amount * 0.10
    daily_earning.total_donated_back += backflow_amount
    
    # Otomatik bağışı sisteme ekle (genel havuz veya en yüksek öncelikli ihtiyaç)
    # En yüksek öncelikli ihtiyacı bul
    top_need = db.query(models.Need).filter(
        models.Need.status == "active"
    ).order_by(models.Need.target_amount - models.Need.current_amount).first()
    
    if top_need:
        top_need.current_amount += backflow_amount
        if top_need.current_amount >= top_need.target_amount:
            top_need.status = "completed"
            top_need.completed_at = datetime.utcnow()
    
    # Kupon durumunu güncelle
    coupon.status = "used"
    coupon.used_at = datetime.utcnow()
    
    db.commit()
    db.refresh(coupon)
    db.refresh(merchant_user)
    db.refresh(daily_earning)
    
    return {
        "status": "success",
        "message": "Kupon kullanıldı",
        "coupon_id": coupon.id,
        "merchant_earnings": coupon_amount,
        "daily_earnings": daily_earning.daily_earnings,
        "daily_limit": daily_earning.daily_limit,
        "auto_donation": backflow_amount,
        "merchant_balance": merchant_user.balance
    }

    if coupon.status == "used":
        return {"status": "error", "message": "Kupon zaten kullanılmış"}

    coupon.status = "used"
    coupon.used_at = datetime.utcnow()
    db.commit()
    db.refresh(coupon)

    return {
        "status": "success",
        "message": "Kupon kullanıldı",
        "coupon_id": coupon.id
    }


# ---------- Otomatik Bağış Kurallarını Çalıştırma (Simülasyon) ----------

def run_auto_donations(db: Session):
    """
    Tüm aktif otomatik bağış kurallarını çalıştırır (simülasyon).
    Gerçek cron yok, bu endpoint manuel çağrılır.
    """

    rules = db.query(models.AutoDonation).filter(models.AutoDonation.is_active.is_(True)).all()
    results = []

    for rule in rules:
        result = donate(
            db=db,
            user_id=rule.user_id,
            amount=rule.amount,
            coupon_type_id=rule.coupon_type_id
        )
        rule.last_run = datetime.utcnow()
        results.append({
            "rule_id": rule.id,
            "user_id": rule.user_id,
            "amount": rule.amount,
            "result": result
        })

    db.commit()
    return {"status": "success", "results": results}

