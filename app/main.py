from sqlalchemy import func
from fastapi import FastAPI, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

# ======================================
# CORS EKLENDİ (React → FastAPI çalışsın)
# ======================================
from fastapi.middleware.cors import CORSMiddleware

# Kendi dosya yapına uygun importlar
from app.database import Base, engine, get_db
from app import models, logic

# Tabloları oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dijital Gönüllülük Platformu Backend")

# ======================================
# CORS MIDDLEWARE → EN KRİTİK KISIM!
# OPTIONS → 200 döner, POST çalışır.
# ======================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Tüm frontendlere izin
    allow_credentials=True,
    allow_methods=["*"],          # GET, POST, PUT, DELETE, OPTIONS HER ŞEY
    allow_headers=["*"],          # Header kısıtlaması yok
)

# ---------------------------------------------------------
# ŞEMALAR (Pydantic Models)
# ---------------------------------------------------------

class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    password: Optional[str] = None
    role: str = "donor"
    balance: float = 0.0

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    priority: int = 0
    is_verified: bool = False
    max_daily_donation: float = 1000.0
    company_name: Optional[str] = None  # Şirket adı (merchant için)

class UserLogin(BaseModel):
    username: str
    password: str

class TopUpRequest(BaseModel):
    user_id: int
    amount: float

class TransferRequest(BaseModel):
    sender_id: int
    receiver_id: int
    amount: float

class DonateRequest(BaseModel):
    user_id: int
    amount: float
    coupon_type_id: int = 1

class BackflowRequest(BaseModel):
    coupon_id: int

class AutoDonationCreate(BaseModel):
    user_id: int
    coupon_type_id: int
    amount: float
    frequency: str = "daily"

class UseCouponRequest(BaseModel):
    coupon_id: int

class AssignCouponRequest(BaseModel):
    coupon_id: int
    beneficiary_id: int

class NeedCreate(BaseModel):
    user_id: int
    title: str
    description: Optional[str] = None
    category: str
    target_amount: float

class NeedDonateRequest(BaseModel):
    donor_id: int
    need_id: int
    amount: float

class PovertyVerificationRequest(BaseModel):
    user_id: int
    document_url: Optional[str] = None

class ApprovalBandCreate(BaseModel):
    merchant_id: int
    daily_limit: float = 10000.0
    government_guarantee: bool = True

class CouponTypeCreate(BaseModel):
    merchant_id: int
    name: str
    amount: float
    category: str
    target_amount: float  # Pool için hedef tutar

class VolunteerApplicationCreate(BaseModel):
    name: str  # Ad Soyad
    email: Optional[str] = None  # E-posta
    phone: Optional[str] = None  # Telefon
    edevlet_document_url: Optional[str] = None  # E-devlet belgesi URL'i
    edevlet_qr_data: Optional[str] = None  # E-devlet QR kod verisi
    document_file: Optional[str] = None  # Base64 encoded belge dosyası

class BeneficiaryRegistrationCreate(BaseModel):
    name: str  # Ad Soyad
    email: Optional[str] = None  # E-posta
    password: Optional[str] = None  # Şifre
    sgk_document_file: Optional[str] = None  # Base64 encoded SGK döküm evrağı
    sgk_document_url: Optional[str] = None  # SGK belgesi URL'i


# ---------------------------------------------------------
# ENDPOINTLER
# ---------------------------------------------------------

@app.get("/",
         summary="API Durumu",
         description="API'nin çalışıp çalışmadığını kontrol eder")
def home():
    """
    API ana sayfası
    
    API çalışıyorsa başarı mesajı döner.
    Veri setlerini görmek için:
    - `/users/list` - Tüm kullanıcılar ve şifreleri
    - `/reports/summary` - Platform özet raporu
    """
    return {
        "message": "API çalışıyor",
        "endpoints": {
            "users_list": "/users/list - Kullanıcı listesi ve şifreleri",
            "reports": "/reports/summary - Platform özet raporu",
            "docs": "/docs - API dokümantasyonu"
        }
    }


# VERİTABANINI TEMİZLE (Tüm kullanıcıları sil)
@app.delete("/users/clear",
            summary="Tüm Kullanıcıları Sil",
            description="Veritabanındaki tüm kullanıcıları siler (demo veriler dahil)")
def clear_all_users(db: Session = Depends(get_db)):
    """
    Tüm kullanıcıları veritabanından siler
    
    ⚠️ DİKKAT: Bu işlem geri alınamaz!
    Demo veriler ve yeni kayıt olan tüm kullanıcılar silinir.
    """
    try:
        # Tüm kullanıcıları sil
        deleted_count = db.query(models.User).count()
        db.query(models.User).delete()
        db.commit()
        return {
            "status": "success",
            "message": f"{deleted_count} kullanıcı silindi. Artık sadece yeni kayıt olanlar görünecek.",
            "deleted_count": deleted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Hata: {str(e)}")


# DEMO DATA
@app.post("/init-demo")
def init_demo(db: Session = Depends(get_db)):
    if db.query(models.User).first():
        return {"status": "ok", "message": "Demo zaten hazır"}

    donor = models.User(
        name="Ahmet Bağışçı",
        role="donor",
        balance=5000.0,
        is_verified=True,
        max_daily_donation=3000.0,
    )

    beneficiary = models.User(
        name="Ayşe İhtiyaç",
        role="beneficiary",
        balance=0.0,
        is_verified=True,
        max_daily_donation=0.0,
    )

    admin = models.User(
        name="admin",
        role="user",
        balance=10000.0,
        is_verified=True,
        max_daily_donation=5000.0,
    )

    merchant = models.Merchant(name="Lezzet Dünyası", backflow_rate=0.10)
    merchant2 = models.Merchant(name="TeknoStore", backflow_rate=0.05)
    merchant3 = models.Merchant(name="Dost Kitabevi", backflow_rate=0.08)
    merchant4 = models.Merchant(name="Moda Evi", backflow_rate=0.12)

    coupon_type_1 = models.CouponType(
        name="Öğrenci Menüsü Desteği", amount=50.0, category="food", merchant=merchant
    )
    coupon_type_2 = models.CouponType(
        name="Tablet Bağışı", amount=2000.0, category="tech", merchant=merchant2
    )
    coupon_type_3 = models.CouponType(
        name="Kitap Seti Desteği", amount=150.0, category="kırtasiye", merchant=merchant3
    )
    coupon_type_4 = models.CouponType(
        name="Okul Kıyafeti Desteği", amount=300.0, category="giyim", merchant=merchant4
    )
    coupon_type_5 = models.CouponType(
        name="Yemek Kartı", amount=200.0, category="food", merchant=merchant
    )
    coupon_type_6 = models.CouponType(
        name="Laptop Desteği", amount=5000.0, category="tech", merchant=merchant2
    )

    # Pool'lar - bazıları tamamlanmış, bazıları devam ediyor
    pool_1 = models.Pool(coupon_type=coupon_type_1, target_amount=5000.0, current_balance=5000.0)  # Tamamlandı
    pool_2 = models.Pool(coupon_type=coupon_type_2, target_amount=20000.0, current_balance=8000.0)  # Devam ediyor
    pool_3 = models.Pool(coupon_type=coupon_type_3, target_amount=3000.0, current_balance=3000.0)  # Tamamlandı
    pool_4 = models.Pool(coupon_type=coupon_type_4, target_amount=6000.0, current_balance=6000.0)  # Tamamlandı
    pool_5 = models.Pool(coupon_type=coupon_type_5, target_amount=4000.0, current_balance=2000.0)  # Devam ediyor
    pool_6 = models.Pool(coupon_type=coupon_type_6, target_amount=25000.0, current_balance=12000.0)  # Devam ediyor

    db.add_all([donor, beneficiary, admin, merchant, merchant2, merchant3, merchant4, 
                coupon_type_1, coupon_type_2, coupon_type_3, coupon_type_4, coupon_type_5, coupon_type_6,
                pool_1, pool_2, pool_3, pool_4, pool_5, pool_6])
    db.commit()

    # Pool'lar tamamlandığında kuponları oluştur
    # Tamamlanmış pool'lar için kupon oluştur
    completed_pools = [pool_1, pool_3, pool_4]
    for pool in completed_pools:
        # Her tamamlanmış pool için 5 kupon oluştur
        for i in range(5):
            coupon = models.Coupon(
                coupon_type_id=pool.coupon_type_id,
                status="created"  # Henüz atanmamış
            )
            db.add(coupon)
    
    db.commit()

    return {"status": "ok", "message": "Demo veriler eklendi"}


# LOGIN
@app.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # Kullanıcı adını case-insensitive (büyük/küçük harf duyarsız) arama
    user = db.query(models.User).filter(
        func.lower(models.User.name) == func.lower(user_data.username)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Kullanıcı bulunamadı")

    # Şifre kontrolü: Önce kullanıcının kayıtlı şifresini kontrol et, yoksa varsayılan "123" kullan
    user_password = user.password if user.password else "123"
    if user_data.password != user_password:
        raise HTTPException(status_code=400, detail="Şifre hatalı")

    # Frontend uyumu için rolleri dönüştür
    role_for_frontend = user.role
    if user.role == "merchant":
        role_for_frontend = "merchant"  # Frontend'de 'merchant' veya 'seller' kontrolü var
    elif user.role == "admin" or user.role == "beneficiary":
        role_for_frontend = "user"  # Admin ve beneficiary frontend'de 'user' olarak görünür
    
    return {
        "message": "Giriş başarılı",
        "username": user.name,
        "role": role_for_frontend,
        "id": user.id
    }


# ITEMS (Dashboard vitrin)
@app.get("/items")
def get_items(merchant_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """Kupon tiplerini listele, opsiyonel olarak merchant_id ile filtrele"""
    query = db.query(models.Pool)
    if merchant_id:
        # Merchant'a ait kupon tiplerini filtrele
        query = query.join(models.CouponType).filter(models.CouponType.merchant_id == merchant_id)
    pools = query.all()
    result = []
    for p in pools:
        # Bu pool için oluşturulmuş kupon sayısını bul
        coupon_count = db.query(models.Coupon).filter(
            models.Coupon.coupon_type_id == p.coupon_type_id
        ).count()
        
        # Tamamlanmış pool'lar için mevcut kupon sayısını göster
        # Pool tamamlandıysa, henüz atanmamış (status="created") kuponları say
        available_coupons = db.query(models.Coupon).filter(
            models.Coupon.coupon_type_id == p.coupon_type_id,
            models.Coupon.status == "created"
        ).count()
        
        # Potansiyel kupon sayısını hesapla (mevcut bakiye / hedef tutar)
        # Örneğin: 6000 TL toplandı, hedef 1000 TL ise, 6 kupon oluşturulabilir
        potential_coupons = int(p.current_balance / p.target_amount) if p.target_amount > 0 else 0
        
        result.append({
            "id": p.id,
            "pool_id": p.id,
            "coupon_type_id": p.coupon_type_id,  # Bağış için gerekli
            "title": p.coupon_type.name,
            "description": f"{p.coupon_type.merchant.name} tarafından sağlanan destek.",
            "company": p.coupon_type.merchant.name,
            "category": p.coupon_type.category,
            "totalAmount": p.target_amount,
            "collected": p.current_balance,
            "coupon_count": coupon_count,  # Toplam oluşturulmuş kupon sayısı
            "available_coupons": available_coupons,  # Henüz alınmamış kupon sayısı
            "potential_coupons": potential_coupons,  # Mevcut bakiye ile oluşturulabilecek kupon sayısı
            "is_completed": p.current_balance >= p.target_amount
        })
    return result


# KULLANICI OLUŞTURMA
@app.post("/users")
def create_user(req: UserCreate, db: Session = Depends(get_db)):
    try:
        # Aynı isimde kullanıcı var mı kontrol et (case-insensitive)
        existing_user = db.query(models.User).filter(
            func.lower(models.User.name) == func.lower(req.name)
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kullanılıyor")
        
        # User modeline veri ekle (password dahil)
        user_data = req.dict()
        company_name = user_data.pop('company_name', None)  # company_name'i çıkar (User modelinde yok)
        
        user = models.User(**user_data)
        db.add(user)
        db.flush()  # commit() öncesi ID'yi almak için
        
        # Eğer merchant ise Merchant tablosuna da kayıt yap
        if req.role == "merchant" and company_name:
            merchant = models.Merchant(
                name=company_name,  # Şirket adı
                backflow_rate=0.10  # Varsayılan backflow oranı
            )
            db.add(merchant)
        
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "message": "Kullanıcı başarıyla oluşturuldu"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Kullanıcı oluşturulurken hata: {str(e)}")


@app.put("/users/{user_id}")
def update_user(user_id: int, req: UserUpdate, db: Session = Depends(get_db)):
    """Kullanıcı profil bilgilerini güncelle"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        if req.name:
            user.name = req.name
        if req.email is not None:
            user.email = req.email
        if req.phone is not None:
            user.phone = req.phone
        if req.address is not None:
            user.address = req.address
        if req.bio is not None:
            user.bio = req.bio
        
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "address": user.address,
            "bio": user.bio,
            "role": user.role,
            "message": "Profil başarıyla güncellendi"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Profil güncellenirken hata: {str(e)}")


@app.post("/users/{user_id}/change-password")
def change_password(user_id: int, req: ChangePasswordRequest, db: Session = Depends(get_db)):
    """Kullanıcı şifresini değiştir"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        # Mevcut şifre kontrolü
        if user.password:
            if user.password != req.current_password:
                raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
        else:
            # Şifre yoksa, test için "123" kabul et
            if req.current_password != "123":
                raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
        
        # Yeni şifreyi kaydet
        user.password = req.new_password
        db.commit()
        
        return {
            "status": "success",
            "message": "Şifre başarıyla değiştirildi"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Şifre değiştirilirken hata: {str(e)}")


# USER LIST
@app.get("/users")
def list_users(role: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(models.User)
    if role:
        q = q.filter(models.User.role == role)
    return q.all()


# USER UPDATE
@app.put("/users/{user_id}")
def update_user(user_id: int, req: UserUpdate, db: Session = Depends(get_db)):
    """Kullanıcı profil bilgilerini güncelle"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        if req.name:
            user.name = req.name
        if req.email is not None:
            user.email = req.email
        if req.phone is not None:
            user.phone = req.phone
        if req.address is not None:
            user.address = req.address
        if req.bio is not None:
            user.bio = req.bio
        
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "address": user.address,
            "bio": user.bio,
            "role": user.role,
            "message": "Profil başarıyla güncellendi"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Profil güncellenirken hata: {str(e)}")


# CHANGE PASSWORD
@app.post("/users/{user_id}/change-password")
def change_password(user_id: int, req: ChangePasswordRequest, db: Session = Depends(get_db)):
    """Kullanıcı şifresini değiştir"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        # Mevcut şifre kontrolü
        if user.password:
            if user.password != req.current_password:
                raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
        else:
            # Şifre yoksa, test için "123" kabul et
            if req.current_password != "123":
                raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
        
        # Yeni şifreyi kaydet
        user.password = req.new_password
        db.commit()
        
        return {
            "status": "success",
            "message": "Şifre başarıyla değiştirildi"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Şifre değiştirilirken hata: {str(e)}")


# USER LIST WITH DETAILS (Kullanıcı listesi detaylı)
@app.get("/users/list", 
         summary="Kullanıcı Listesi ve Şifreleri",
         description="Veritabanındaki tüm kullanıcıları, şifre durumlarını ve detaylı bilgilerini listeler")
def list_users_detailed(db: Session = Depends(get_db)):
    """
    Tüm kullanıcıları detaylı bilgilerle listele
    
    - **total_count**: Toplam kullanıcı sayısı
    - **users**: Kullanıcı listesi (id, name, email, role, balance, şifre durumu)
    """
    users = db.query(models.User).all()
    return {
        "total_count": len(users),
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "balance": u.balance,
                "is_verified": u.is_verified,
                "password": "123 (varsayılan - tüm test kullanıcıları için)",
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ]
    }


# USER LIST WITH DETAILS (Kullanıcı listesi detaylı)
@app.get("/users/list")
def list_users_detailed(db: Session = Depends(get_db)):
    """Tüm kullanıcıları detaylı bilgilerle listele"""
    users = db.query(models.User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "balance": u.balance,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]


# USER DETAIL
@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        return {"status": "error", "message": "Kullanıcı bulunamadı"}
    return u


# WALLET TOPUP
@app.post("/wallet/topup")
def wallet_topup(req: TopUpRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not user:
        return {"status": "error", "message": "Kullanıcı bulunamadı"}
    user.balance += req.amount
    db.commit()
    return {"status": "success", "new_balance": user.balance}


@app.post("/wallet/topup-all",
          summary="Tüm Kullanıcılara Para Ekle",
          description="Tüm kullanıcı hesaplarına belirtilen miktarda para ekler")
def topup_all_users(amount: float = 500.0, db: Session = Depends(get_db)):
    """Tüm kullanıcılara para ekle (demo/test için)"""
    try:
        users = db.query(models.User).all()
        updated_count = 0
        
        for user in users:
            user.balance += amount
            updated_count += 1
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"{updated_count} kullanıcıya ₺{amount} eklendi",
            "amount": amount,
            "users_updated": updated_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Para eklenirken hata: {str(e)}")


@app.post("/wallet/topup-donors",
          summary="Gönüllülere Para Ekle",
          description="Sadece donor rolündeki kullanıcılara belirtilen miktarda para ekler")
def topup_donors(amount: float = 5000.0, db: Session = Depends(get_db)):
    """Gönüllülere para ekle"""
    try:
        donors = db.query(models.User).filter(models.User.role == "donor").all()
        updated_count = 0
        
        for donor in donors:
            donor.balance += amount
            updated_count += 1
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"{updated_count} gönüllüye ₺{amount} eklendi",
            "amount": amount,
            "donors_updated": updated_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Para eklenirken hata: {str(e)}")


@app.post("/wallet/topup-user",
          summary="Belirli Kullanıcıya Para Ekle",
          description="İsme göre kullanıcı bulup para ekler")
def topup_user_by_name(name: str, amount: float = 5000.0, db: Session = Depends(get_db)):
    """İsme göre kullanıcı bulup para ekle"""
    try:
        user = db.query(models.User).filter(
            func.lower(models.User.name) == func.lower(name)
        ).first()
        
        if not user:
            raise HTTPException(status_code=404, detail=f"'{name}' isimli kullanıcı bulunamadı")
        
        old_balance = user.balance
        user.balance += amount
        
        # Para akışı kaydı ekle
        try:
            money_flow = models.MoneyFlow(
                user_id=user.id,
                transaction_type="topup",
                amount=amount,
                balance_before=old_balance,
                balance_after=user.balance,
                description=f"Manuel para ekleme - {name}"
            )
            db.add(money_flow)
        except:
            pass  # MoneyFlow tablosu yoksa devam et
        
        db.commit()
        db.refresh(user)
        
        return {
            "status": "success",
            "message": f"'{name}' kullanıcısına ₺{amount} eklendi",
            "user_id": user.id,
            "user_name": user.name,
            "old_balance": old_balance,
            "new_balance": user.balance,
            "amount": amount
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Para eklenirken hata: {str(e)}")


@app.get("/database/overview",
         summary="Veritabanı Genel Bakış",
         description="Tüm tabloların özet bilgilerini döner")
def database_overview(db: Session = Depends(get_db)):
    """Veritabanı genel bakış"""
    try:
        users = db.query(models.User).all()
        donations = db.query(models.Donation).all()
        transfers = db.query(models.Transfer).all()
        needs = db.query(models.Need).all()
        coupons = db.query(models.Coupon).all()
        
        # Para akışı (eğer tablo varsa)
        money_flows = []
        try:
            money_flows = db.query(models.MoneyFlow).order_by(models.MoneyFlow.created_at.desc()).limit(50).all()
        except:
            pass
        
        total_balance = sum(u.balance for u in users)
        total_donations = sum(d.amount for d in donations)
        total_transfers = sum(t.amount for t in transfers)
        
        return {
            "users": {
                "total": len(users),
                "by_role": {
                    role: len([u for u in users if u.role == role])
                    for role in set(u.role for u in users)
                },
                "total_balance": total_balance
            },
            "donations": {
                "total": len(donations),
                "total_amount": total_donations
            },
            "transfers": {
                "total": len(transfers),
                "total_amount": total_transfers
            },
            "needs": {
                "total": len(needs),
                "active": len([n for n in needs if n.status == "active"]),
                "completed": len([n for n in needs if n.status == "completed"])
            },
            "coupons": {
                "total": len(coupons),
                "by_status": {
                    status: len([c for c in coupons if c.status == status])
                    for status in set(c.status for c in coupons)
                }
            },
            "recent_money_flows": [
                {
                    "id": mf.id,
                    "user_id": mf.user_id,
                    "user_name": db.query(models.User).filter(models.User.id == mf.user_id).first().name if mf.user_id else None,
                    "transaction_type": mf.transaction_type,
                    "amount": mf.amount,
                    "balance_before": mf.balance_before,
                    "balance_after": mf.balance_after,
                    "description": mf.description,
                    "created_at": mf.created_at.isoformat() if mf.created_at else None
                }
                for mf in money_flows
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Veritabanı bilgisi alınırken hata: {str(e)}")


@app.get("/money-flows",
         summary="Para Akışı Geçmişi",
         description="Tüm para giriş/çıkış işlemlerini listeler (kupon bağışları dahil)")
def get_money_flows(
    user_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Para akışı geçmişi - kupon bağışları dahil"""
    try:
        flows = []
        
        # MoneyFlow kayıtları
        try:
            query = db.query(models.MoneyFlow)
            if user_id:
                query = query.filter(models.MoneyFlow.user_id == user_id)
            money_flows = query.order_by(models.MoneyFlow.created_at.desc()).limit(limit).all()
            
            for mf in money_flows:
                user = db.query(models.User).filter(models.User.id == mf.user_id).first() if mf.user_id else None
                flows.append({
                    "id": f"mf_{mf.id}",
                    "user_id": mf.user_id,
                    "user_name": user.name if user else None,
                    "transaction_type": mf.transaction_type,
                    "amount": mf.amount,
                    "balance_before": mf.balance_before,
                    "balance_after": mf.balance_after,
                    "description": mf.description,
                    "created_at": mf.created_at.isoformat() if mf.created_at else None
                })
        except:
            pass
        
        # Kupon bağışları (Donation tablosundan)
        try:
            donations_query = db.query(models.Donation).filter(
                models.Donation.coupon_type_id.isnot(None)
            )
            if user_id:
                donations_query = donations_query.filter(models.Donation.user_id == user_id)
            
            donations = donations_query.order_by(models.Donation.created_at.desc()).limit(limit).all()
            
            for donation in donations:
                donor = db.query(models.User).filter(models.User.id == donation.user_id).first()
                coupon_type = db.query(models.CouponType).filter(models.CouponType.id == donation.coupon_type_id).first()
                merchant = db.query(models.Merchant).filter(models.Merchant.id == coupon_type.merchant_id).first() if coupon_type else None
                
                flows.append({
                    "id": f"don_{donation.id}",
                    "user_id": donation.user_id,
                    "user_name": donor.name if donor else None,
                    "transaction_type": "coupon_donation",
                    "amount": donation.amount,
                    "balance_before": None,
                    "balance_after": None,
                    "description": f"Kupon bağışı - {coupon_type.name if coupon_type else 'Bilinmeyen'} ({merchant.name if merchant else 'Bilinmeyen İşletme'})",
                    "created_at": donation.created_at.isoformat() if donation.created_at else None,
                    "coupon_type_name": coupon_type.name if coupon_type else None,
                    "merchant_name": merchant.name if merchant else None
                })
        except:
            pass
        
        # Tarihe göre sırala ve limit uygula
        flows.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        flows = flows[:limit]
        
        return flows
    except Exception as e:
        return []


# ============================================
# E-DEVLET FAKİRLİK DURUMU TESCİLİ
# ============================================

@app.post("/poverty-verification",
          summary="Fakirlik Durumu Tescili Başvurusu",
          description="E-devlet belgesi ile fakirlik durumu tescili başvurusu yapar")
def create_poverty_verification(req: PovertyVerificationRequest, db: Session = Depends(get_db)):
    """Fakirlik durumu tescili başvurusu"""
    try:
        user = db.query(models.User).filter(models.User.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        # Mevcut başvuru var mı kontrol et
        existing = db.query(models.PovertyVerification).filter(
            models.PovertyVerification.user_id == req.user_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Bu kullanıcı için zaten bir başvuru mevcut")
        
        verification = models.PovertyVerification(
            user_id=req.user_id,
            document_url=req.document_url,
            verification_status="pending"
        )
        db.add(verification)
        db.commit()
        db.refresh(verification)
        
        return {
            "status": "success",
            "message": "Fakirlik durumu tescili başvurusu oluşturuldu",
            "verification_id": verification.id,
            "status": verification.verification_status
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Başvuru oluşturulurken hata: {str(e)}")


@app.get("/poverty-verifications",
         summary="Fakirlik Durumu Başvuruları",
         description="Tüm fakirlik durumu başvurularını listeler")
def list_poverty_verifications(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Fakirlik durumu başvurularını listele"""
    try:
        query = db.query(models.PovertyVerification)
        if status:
            query = query.filter(models.PovertyVerification.verification_status == status)
        
        verifications = query.all()
        
        return [
            {
                "id": v.id,
                "user_id": v.user_id,
                "user_name": db.query(models.User).filter(models.User.id == v.user_id).first().name,
                "document_url": v.document_url,
                "verification_status": v.verification_status,
                "verified_at": v.verified_at.isoformat() if v.verified_at else None,
                "verified_by": v.verified_by,
                "created_at": v.created_at.isoformat() if v.created_at else None
            }
            for v in verifications
        ]
    except Exception as e:
        return []


@app.post("/poverty-verification/{verification_id}/approve",
          summary="Fakirlik Durumu Onayla (Devlet/Admin)",
          description="Devlet/Admin tarafından fakirlik durumu onaylanır")
def approve_poverty_verification(
    verification_id: int,
    admin_id: int = Query(..., description="Onaylayan admin kullanıcı ID"),
    db: Session = Depends(get_db)
):
    """Fakirlik durumu onayla"""
    try:
        verification = db.query(models.PovertyVerification).filter(
            models.PovertyVerification.id == verification_id
        ).first()
        
        if not verification:
            raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
        
        user = db.query(models.User).filter(models.User.id == verification.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        verification.verification_status = "approved"
        verification.verified_at = func.now()
        verification.verified_by = admin_id
        
        # Kullanıcının priority'sini artır (daha fakir = daha yüksek priority)
        user.priority = min(user.priority + 10, 100)  # Max 100
        user.is_verified = True
        
        db.commit()
        db.refresh(verification)
        
        return {
            "status": "success",
            "message": "Fakirlik durumu onaylandı",
            "verification_id": verification.id,
            "user_priority": user.priority
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Onaylama sırasında hata: {str(e)}")


@app.post("/poverty-verification/{verification_id}/reject",
          summary="Fakirlik Durumu Reddet (Devlet/Admin)",
          description="Devlet/Admin tarafından fakirlik durumu reddedilir")
def reject_poverty_verification(
    verification_id: int,
    admin_id: int = Query(..., description="Reddeden admin kullanıcı ID"),
    db: Session = Depends(get_db)
):
    """Fakirlik durumu reddet"""
    try:
        verification = db.query(models.PovertyVerification).filter(
            models.PovertyVerification.id == verification_id
        ).first()
        
        if not verification:
            raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
        
        verification.verification_status = "rejected"
        verification.verified_at = func.now()
        verification.verified_by = admin_id
        
        db.commit()
        
        return {
            "status": "success",
            "message": "Fakirlik durumu reddedildi",
            "verification_id": verification.id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reddetme sırasında hata: {str(e)}")


# ============================================
# ONAY BANDI SİSTEMİ (İŞLETMELERE GÜNLÜK DESTEK)
# ============================================

@app.post("/approval-bands",
          summary="Onay Bandı Oluştur",
          description="İşletme için günlük destek onay bandı oluşturur (Devlet teminatı ile)")
def create_approval_band(req: ApprovalBandCreate, db: Session = Depends(get_db)):
    """Onay bandı oluştur"""
    try:
        merchant = db.query(models.Merchant).filter(models.Merchant.id == req.merchant_id).first()
        if not merchant:
            raise HTTPException(status_code=404, detail="İşletme bulunamadı")
        
        # Mevcut onay bandı var mı kontrol et
        existing = db.query(models.ApprovalBand).filter(
            models.ApprovalBand.merchant_id == req.merchant_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Bu işletme için zaten bir onay bandı mevcut")
        
        approval_band = models.ApprovalBand(
            merchant_id=req.merchant_id,
            daily_limit=req.daily_limit,
            government_guarantee=req.government_guarantee,
            is_active=True
        )
        db.add(approval_band)
        db.commit()
        db.refresh(approval_band)
        
        return {
            "status": "success",
            "message": "Onay bandı oluşturuldu",
            "approval_band_id": approval_band.id,
            "daily_limit": approval_band.daily_limit,
            "government_guarantee": approval_band.government_guarantee
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Onay bandı oluşturulurken hata: {str(e)}")


@app.get("/approval-bands",
         summary="Onay Bandları Listesi",
         description="Tüm işletme onay bandlarını listeler")
def list_approval_bands(db: Session = Depends(get_db)):
    """Onay bandları listesi"""
    try:
        bands = db.query(models.ApprovalBand).all()
        
        return [
            {
                "id": b.id,
                "merchant_id": b.merchant_id,
                "merchant_name": db.query(models.Merchant).filter(models.Merchant.id == b.merchant_id).first().name,
                "daily_limit": b.daily_limit,
                "used_today": b.used_today,
                "remaining_today": b.daily_limit - b.used_today,
                "is_active": b.is_active,
                "government_guarantee": b.government_guarantee,
                "last_reset_date": b.last_reset_date.isoformat() if b.last_reset_date else None
            }
            for b in bands
        ]
    except Exception as e:
        return []


@app.post("/approval-bands/{band_id}/reset",
          summary="Günlük Limit Sıfırla",
          description="Onay bandının günlük kullanımını sıfırlar (günlük reset)")
def reset_approval_band(band_id: int, db: Session = Depends(get_db)):
    """Günlük limit sıfırla"""
    try:
        band = db.query(models.ApprovalBand).filter(models.ApprovalBand.id == band_id).first()
        if not band:
            raise HTTPException(status_code=404, detail="Onay bandı bulunamadı")
        
        band.used_today = 0.0
        band.last_reset_date = func.now()
        
        db.commit()
        
        return {
            "status": "success",
            "message": "Günlük limit sıfırlandı",
            "band_id": band.id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Sıfırlama sırasında hata: {str(e)}")


# ============================================
# KUPON ALMA - FAKİRLİK KRİTERİ KONTROLÜ
# ============================================

@app.get("/coupons/check-eligibility/{user_id}",
         summary="Kupon Alma Uygunluk Kontrolü",
         description="Kullanıcının kupon alabilme durumunu kontrol eder (fakirlik kriteri)")
def check_coupon_eligibility(user_id: int, db: Session = Depends(get_db)):
    """Kupon alma uygunluk kontrolü"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        # Fakirlik durumu kontrolü
        verification = db.query(models.PovertyVerification).filter(
            models.PovertyVerification.user_id == user_id
        ).first()
        
        is_verified = verification and verification.verification_status == "approved"
        
        # Kullanıcının aldığı kupon sayısı
        received_coupons = db.query(models.Coupon).filter(
            models.Coupon.beneficiary_id == user_id
        ).count()
        
        # Priority'ye göre maksimum kupon sayısı
        # Priority 0-30: 3 kupon, 31-60: 5 kupon, 61-100: 10 kupon
        max_coupons = 3
        if user.priority >= 31 and user.priority <= 60:
            max_coupons = 5
        elif user.priority >= 61:
            max_coupons = 10
        
        can_receive = is_verified and received_coupons < max_coupons
        
        return {
            "user_id": user_id,
            "user_name": user.name,
            "is_verified": is_verified,
            "verification_status": verification.verification_status if verification else "none",
            "priority": user.priority,
            "received_coupons": received_coupons,
            "max_coupons": max_coupons,
            "can_receive": can_receive,
            "remaining_coupons": max(0, max_coupons - received_coupons)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kontrol sırasında hata: {str(e)}")


# TRANSFER
@app.post("/wallet/transfer")
def wallet_transfer(req: TransferRequest, db: Session = Depends(get_db)):
    return logic.transfer(db, req.sender_id, req.receiver_id, req.amount)


# DONATE
@app.post("/donate")
def donate_endpoint(req: DonateRequest, db: Session = Depends(get_db)):
    return logic.donate(db, req.user_id, req.amount, req.coupon_type_id)


# BACKFLOW

@app.get("/merchants/{merchant_id}/earnings",
         summary="İşletme Kazanç Bilgileri",
         description="İşletmenin günlük ve toplam kazanç bilgilerini getirir")
def get_merchant_earnings(merchant_id: int, db: Session = Depends(get_db)):
    """İşletme kazanç bilgilerini getir"""
    from datetime import date
    from sqlalchemy import func
    
    today = date.today()
    
    # Günlük kazanç kaydını bul
    daily_earning = db.query(models.MerchantDailyEarnings).filter(
        models.MerchantDailyEarnings.merchant_id == merchant_id,
        func.date(models.MerchantDailyEarnings.date) == today
    ).first()
    
    # Eğer bugün için kayıt yoksa, sıfır değerlerle başlat
    if not daily_earning:
        daily_earning = models.MerchantDailyEarnings(
            merchant_id=merchant_id,
            date=datetime.utcnow(),
            daily_earnings=0.0,
            daily_limit=2000.0,
            total_earnings=0.0,
            total_donated_back=0.0
        )
        db.add(daily_earning)
        db.commit()
        db.refresh(daily_earning)
    
    # Toplam kazanç ve bağış bilgilerini al
    all_earnings = db.query(models.MerchantDailyEarnings).filter(
        models.MerchantDailyEarnings.merchant_id == merchant_id
    ).all()
    
    total_earnings_all_time = sum(e.total_earnings for e in all_earnings)
    total_donated_all_time = sum(e.total_donated_back for e in all_earnings)
    
    merchant = db.query(models.Merchant).filter(models.Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="İşletme bulunamadı")
    
    merchant_user = db.query(models.User).filter(
        models.User.id == merchant_id,
        models.User.role.in_(["merchant", "seller"])
    ).first()
    
    return {
        "merchant_id": merchant_id,
        "merchant_name": merchant.name,
        "daily_earnings": daily_earning.daily_earnings,
        "daily_limit": daily_earning.daily_limit,
        "remaining_limit": daily_earning.daily_limit - daily_earning.daily_earnings,
        "total_earnings": total_earnings_all_time,
        "total_donated_back": total_donated_all_time,
        "merchant_balance": merchant_user.balance if merchant_user else 0.0,
        "backflow_rate": merchant.backflow_rate * 100  # Yüzde olarak
    }


@app.post("/merchant/backflow")
def backflow_endpoint(req: BackflowRequest, db: Session = Depends(get_db)):
    return logic.merchant_backflow(db, req.coupon_id)


# AUTO DONATION
@app.post("/auto-donations")
def create_auto_donation(req: AutoDonationCreate, db: Session = Depends(get_db)):
    rule = models.AutoDonation(**req.dict(), is_active=True)
    db.add(rule)
    db.commit()
    return rule


@app.post("/auto-donations/run")
def run_auto_donations(db: Session = Depends(get_db)):
    return logic.run_auto_donations(db)


# COUPONS
@app.get("/coupons")
def list_coupons(
    status: Optional[str] = Query(None),
    beneficiary_id: Optional[int] = Query(None),
    merchant_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(models.Coupon)

    if status:
        q = q.filter(models.Coupon.status == status)

    if beneficiary_id:
        q = q.filter(models.Coupon.beneficiary_id == beneficiary_id)

    if merchant_id:
        q = q.join(models.Coupon.coupon_type).join(models.CouponType.merchant).filter(models.Merchant.id == merchant_id)

    if category:
        q = q.join(models.Coupon.coupon_type).filter(models.CouponType.category == category)

    coupons = q.all()
    
    return [
        {
            "id": c.id,
            "coupon_type_id": c.coupon_type_id,
            "coupon_type_name": c.coupon_type.name if c.coupon_type else None,
            "coupon_type_amount": c.coupon_type.amount if c.coupon_type else None,
            "coupon_type_category": c.coupon_type.category if c.coupon_type else None,
            "merchant_name": c.coupon_type.merchant.name if c.coupon_type and c.coupon_type.merchant else None,
            "merchant_id": c.coupon_type.merchant.id if c.coupon_type and c.coupon_type.merchant else None,
            "beneficiary_id": c.beneficiary_id,
            "beneficiary_name": c.beneficiary.name if c.beneficiary else None,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "used_at": c.used_at.isoformat() if c.used_at else None,
            # Pool bilgisi
            "pool": {
                "target_amount": c.coupon_type.pool.target_amount if c.coupon_type and c.coupon_type.pool else None,
                "current_balance": c.coupon_type.pool.current_balance if c.coupon_type and c.coupon_type.pool else None
            } if c.coupon_type and c.coupon_type.pool else None
        }
        for c in coupons
    ]


@app.post("/coupons/use")
def use_coupon(req: UseCouponRequest, db: Session = Depends(get_db)):
    return logic.use_coupon(db, req.coupon_id)


@app.post("/coupons/assign",
          summary="Kupon Ata",
          description="Bir kuponu ihtiyaç sahibine atar")
def assign_coupon(req: AssignCouponRequest, db: Session = Depends(get_db)):
    """Kuponu ihtiyaç sahibine ata - Aynı kupon tipinden sadece 1 tane alınabilir"""
    try:
        coupon = db.query(models.Coupon).filter(models.Coupon.id == req.coupon_id).first()
        if not coupon:
            raise HTTPException(status_code=404, detail="Kupon bulunamadı")
        
        if coupon.status != "created":
            raise HTTPException(status_code=400, detail="Sadece oluşturulmuş kuponlar atanabilir")
        
        beneficiary = db.query(models.User).filter(models.User.id == req.beneficiary_id).first()
        if not beneficiary:
            raise HTTPException(status_code=404, detail="İhtiyaç sahibi bulunamadı")
        
        # Kullanıcının bu kupon tipinden daha önce kupon alıp almadığını kontrol et
        existing_coupon = db.query(models.Coupon).filter(
            models.Coupon.coupon_type_id == coupon.coupon_type_id,
            models.Coupon.beneficiary_id == req.beneficiary_id,
            models.Coupon.status.in_(["assigned", "used"])
        ).first()
        
        if existing_coupon:
            raise HTTPException(
                status_code=400, 
                detail="Bu kupon tipinden zaten bir kuponunuz var. Aynı kupon tipinden sadece 1 tane alabilirsiniz."
            )
        
        coupon.beneficiary_id = req.beneficiary_id
        coupon.status = "assigned"
        db.commit()
        db.refresh(coupon)
        
        return {
            "status": "success",
            "message": "Kupon başarıyla atandı",
            "coupon": {
                "id": coupon.id,
                "beneficiary_id": coupon.beneficiary_id,
                "status": coupon.status,
                "coupon_type_id": coupon.coupon_type_id
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Kupon atanırken hata: {str(e)}")


# BENEFICIARY COUPONS
@app.get("/beneficiaries/{beneficiary_id}/coupons")
def beneficiary_coupons(beneficiary_id: int, db: Session = Depends(get_db)):
    coupons = db.query(models.Coupon).filter(models.Coupon.beneficiary_id == beneficiary_id).all()
    return coupons


# COUPON TYPE CREATE
@app.post("/coupon-types",
          summary="Kupon Tipi Oluştur",
          description="İşletme için yeni bir kupon tipi oluşturur")
def create_coupon_type(req: CouponTypeCreate, db: Session = Depends(get_db)):
    """İşletme için yeni kupon tipi oluştur"""
    try:
        # Merchant kontrolü - önce user.id'ye göre merchant'ı bul
        # Eğer merchant_id user.id ise, user.name'e göre merchant bul
        user = db.query(models.User).filter(models.User.id == req.merchant_id).first()
        merchant = None
        
        if user:
            # User'ın adına göre merchant bul
            merchant = db.query(models.Merchant).filter(models.Merchant.name == user.name).first()
            
            # Eğer merchant yoksa, oluştur
            if not merchant:
                merchant = models.Merchant(
                    name=user.name,
                    backflow_rate=0.10
                )
                db.add(merchant)
                db.flush()
        else:
            # Direkt merchant_id ile dene
            merchant = db.query(models.Merchant).filter(models.Merchant.id == req.merchant_id).first()
        
        if not merchant:
            raise HTTPException(status_code=404, detail="İşletme bulunamadı")
        
        # Kupon tipi oluştur
        coupon_type = models.CouponType(
            name=req.name,
            amount=req.amount,
            category=req.category,
            merchant_id=merchant.id  # Merchant'ın gerçek ID'sini kullan
        )
        db.add(coupon_type)
        db.flush()  # ID'yi almak için
        
        # Pool oluştur
        pool = models.Pool(
            coupon_type_id=coupon_type.id,
            target_amount=req.target_amount,
            current_balance=0.0
        )
        db.add(pool)
        db.commit()
        db.refresh(coupon_type)
        db.refresh(pool)
        
        return {
            "id": coupon_type.id,
            "name": coupon_type.name,
            "amount": coupon_type.amount,
            "category": coupon_type.category,
            "merchant_id": coupon_type.merchant_id,
            "pool": {
                "id": pool.id,
                "target_amount": pool.target_amount,
                "current_balance": pool.current_balance
            },
            "message": "Kupon tipi başarıyla oluşturuldu"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Kupon tipi oluşturulurken hata: {str(e)}")


# POOLS
@app.get("/pools")
def list_pools(
    category: Optional[str] = Query(None),
    merchant_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(models.Pool)
    if category:
        q = q.join(models.Pool.coupon_type).filter(models.CouponType.category == category)
    if merchant_id:
        q = q.join(models.Pool.coupon_type).filter(models.CouponType.merchant_id == merchant_id)
    return q.all()


# DONATION LIST
@app.get("/donations")
def list_donations(user_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    q = db.query(models.Donation)
    if user_id:
        q = q.filter(models.Donation.user_id == user_id)
    return q.all()


# REPORTS
@app.get("/reports/summary",
         summary="Platform Özet Raporu",
         description="Tüm platform istatistikleri ve kullanıcı listesi")
def report_summary(db: Session = Depends(get_db)):
    """
    Platform özet raporu ve veri setleri
    
    İçerir:
    - Toplam kullanıcı sayıları (donor, beneficiary, merchant)
    - Toplam bağış miktarı
    - Kupon ve otomatik bağış sayıları
    - Kullanıcı listesi
    """
    users = db.query(models.User).all()
    return {
        "total_users": len(users),
        "total_donors": db.query(models.User).filter(models.User.role == "donor").count(),
        "total_beneficiaries": db.query(models.User).filter(models.User.role == "beneficiary").count(),
        "total_merchants": db.query(models.User).filter(models.User.role == "merchant").count(),
        "total_donations_amount": db.query(func.coalesce(func.sum(models.Donation.amount), 0)).scalar(),
        "total_coupons": db.query(models.Coupon).count(),
        "total_auto_donation_rules": db.query(models.AutoDonation).count(),
        "users_list": [
            {
                "id": u.id,
                "name": u.name,
                "role": u.role,
                "balance": u.balance,
                "is_verified": u.is_verified,
                "password_note": "Tüm kullanıcılar için varsayılan şifre: 123"
            }
            for u in users
        ]
    }


# NEEDS (İhtiyaç/İlan) ENDPOINT'LERİ
@app.post("/needs",
          summary="İhtiyaç Oluştur",
          description="Yeni bir ihtiyaç/ilan oluşturur")
def create_need(req: NeedCreate, db: Session = Depends(get_db)):
    """Kullanıcı yeni bir ihtiyaç oluşturur"""
    try:
        # Kullanıcı var mı kontrol et
        user = db.query(models.User).filter(models.User.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        # İhtiyaç oluştur
        need = models.Need(
            user_id=req.user_id,
            title=req.title,
            description=req.description,
            category=req.category,
            target_amount=req.target_amount,
            current_amount=0.0,
            status="active"
        )
        db.add(need)
        db.commit()
        db.refresh(need)
        
        return {
            "id": need.id,
            "title": need.title,
            "description": need.description,
            "category": need.category,
            "target_amount": need.target_amount,
            "current_amount": need.current_amount,
            "status": need.status,
            "created_at": need.created_at,
            "message": "İhtiyaç başarıyla oluşturuldu"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"İhtiyaç oluşturulurken hata: {str(e)}")


@app.get("/needs",
         summary="İhtiyaçları Listele",
         description="Tüm aktif ihtiyaçları listeler")
def list_needs(
    user_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """İhtiyaçları filtreleyerek listele"""
    q = db.query(models.Need)
    
    if user_id:
        q = q.filter(models.Need.user_id == user_id)
    if status:
        q = q.filter(models.Need.status == status)
    if category:
        q = q.filter(models.Need.category == category)
    
    needs = q.order_by(models.Need.created_at.desc()).all()
    
    return [
        {
            "id": n.id,
            "user_id": n.user_id,
            "user_name": n.user.name if n.user else None,
            "title": n.title,
            "description": n.description,
            "category": n.category,
            "target_amount": n.target_amount,
            "current_amount": n.current_amount,
            "status": n.status,
            "progress": (n.current_amount / n.target_amount * 100) if n.target_amount > 0 else 0,
            "created_at": n.created_at,
            "completed_at": n.completed_at
        }
        for n in needs
    ]


@app.get("/needs/{need_id}",
         summary="İhtiyaç Detayı",
         description="Belirli bir ihtiyacın detaylarını getirir")
def get_need(need_id: int, db: Session = Depends(get_db)):
    """İhtiyaç detayını getir"""
    need = db.query(models.Need).filter(models.Need.id == need_id).first()
    if not need:
        raise HTTPException(status_code=404, detail="İhtiyaç bulunamadı")
    
    return {
        "id": need.id,
        "user_id": need.user_id,
        "user_name": need.user.name if need.user else None,
        "title": need.title,
        "description": need.description,
        "category": need.category,
        "target_amount": need.target_amount,
        "current_amount": need.current_amount,
        "status": need.status,
        "progress": (need.current_amount / need.target_amount * 100) if need.target_amount > 0 else 0,
        "created_at": need.created_at,
        "completed_at": need.completed_at
    }


@app.delete("/needs/{need_id}",
           summary="İhtiyaç Sil",
           description="Tamamlanan veya iptal edilen ihtiyacı siler")
def delete_need(need_id: int, db: Session = Depends(get_db)):
    """İhtiyacı sil (sadece completed veya cancelled durumundakiler)"""
    need = db.query(models.Need).filter(models.Need.id == need_id).first()
    if not need:
        raise HTTPException(status_code=404, detail="İhtiyaç bulunamadı")
    
    if need.status not in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Sadece tamamlanan veya iptal edilen ihtiyaçlar silinebilir")
    
    db.delete(need)
    db.commit()
    
    return {"message": "İhtiyaç başarıyla silindi"}


@app.post("/needs/{need_id}/donate",
          summary="İhtiyaca Bağış Yap",
          description="Belirli bir ihtiyaca bağış yapar")
def donate_to_need(need_id: int, req: NeedDonateRequest, db: Session = Depends(get_db)):
    """İhtiyaca bağış yap"""
    try:
        # İhtiyaç kontrolü
        need = db.query(models.Need).filter(models.Need.id == need_id).first()
        if not need:
            raise HTTPException(status_code=404, detail="İhtiyaç bulunamadı")
        
        if need.status != "active":
            raise HTTPException(status_code=400, detail="Sadece aktif ihtiyaçlara bağış yapılabilir")
        
        # Bağışçı kontrolü
        donor = db.query(models.User).filter(models.User.id == req.donor_id).first()
        if not donor:
            raise HTTPException(status_code=404, detail="Bağışçı bulunamadı")
        
        if donor.balance < req.amount:
            raise HTTPException(status_code=400, detail="Yetersiz bakiye")
        
        # Bağış işlemi
        donor.balance -= req.amount  # Bağışçıdan para çek
        need.current_amount += req.amount  # İhtiyaca para ekle
        
        # İhtiyaç tamamlandı mı kontrol et
        need_completed = False
        created_coupon = None
        if need.current_amount >= need.target_amount and need.status != "completed":
            need.status = "completed"
            need.completed_at = func.now()
            need_completed = True
            
            # İhtiyaç tamamlandığında kupon oluştur
            # Önce kategoriye göre bir merchant bul veya oluştur
            category_merchant_name = {
                "gıda": "Genel Gıda Marketi",
                "kırtasiye": "Genel Kırtasiye",
                "ulaşım": "Genel Ulaşım",
                "tech": "Genel Teknoloji",
                "giyim": "Genel Giyim",
                "eğitim": "Genel Eğitim"
            }.get(need.category, "Genel Destek")
            
            # Merchant'ı bul veya oluştur
            merchant = db.query(models.Merchant).filter(
                models.Merchant.name == category_merchant_name
            ).first()
            
            if not merchant:
                merchant = models.Merchant(
                    name=category_merchant_name,
                    backflow_rate=0.10
                )
                db.add(merchant)
                db.flush()
            
            # Kupon tipi oluştur (ihtiyacın başlığı ve kategorisi ile)
            coupon_type = models.CouponType(
                name=f"{need.title} - İhtiyaç Desteği",
                amount=need.target_amount,  # İhtiyaç tutarı kadar kupon değeri
                category=need.category,
                merchant_id=merchant.id
            )
            db.add(coupon_type)
            db.flush()
            
            # Pool oluştur (1 kupon için)
            pool = models.Pool(
                coupon_type_id=coupon_type.id,
                target_amount=need.target_amount,
                current_balance=need.target_amount  # Zaten tamamlandı
            )
            db.add(pool)
            db.flush()
            
            # Kupon oluştur ve kullanıcıya ata
            coupon = models.Coupon(
                coupon_type_id=coupon_type.id,
                beneficiary_id=need.user_id,  # İhtiyacı oluşturan kullanıcıya ata
                status="assigned"  # Direkt atandı
            )
            db.add(coupon)
            created_coupon = coupon
        
        # Bağış kaydı oluştur
        donation = models.Donation(
            user_id=req.donor_id,
            amount=req.amount,
            coupon_type_id=None  # İhtiyaç bağışı için coupon_type_id yok
        )
        db.add(donation)
        db.commit()
        db.refresh(need)
        db.refresh(donor)
        
        response = {
            "status": "success",
            "message": "Bağış başarıyla yapıldı",
            "need": {
                "id": need.id,
                "current_amount": need.current_amount,
                "target_amount": need.target_amount,
                "status": need.status
            },
            "donor_balance": donor.balance,
            "need_completed": need_completed
        }
        
        if need_completed and created_coupon:
            response["coupon_created"] = True
            response["coupon"] = {
                "id": created_coupon.id,
                "coupon_type_id": created_coupon.coupon_type_id,
                "beneficiary_id": created_coupon.beneficiary_id
            }
            response["message"] = "Bağış yapıldı ve ihtiyaç tamamlandı! Kupon oluşturuldu."
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Bağış yapılırken hata: {str(e)}")


# ======================================
# GÖNÜLLÜ BAŞVURU SİSTEMİ
# ======================================

@app.post("/donor-applications")
def create_donor_application(req: DonorApplicationCreate, user_id: int = Query(..., description="Başvuru yapan kullanıcı ID"), db: Session = Depends(get_db)):
    """Gönüllü başvurusu oluştur"""
    try:
        # Kullanıcıyı kontrol et
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        # Zaten başvuru yapmış mı kontrol et
        existing_application = db.query(models.DonorApplication).filter(
            models.DonorApplication.user_id == user_id
        ).first()
        
        if existing_application:
            if existing_application.verification_status == "pending":
                raise HTTPException(status_code=400, detail="Zaten bekleyen bir başvurunuz var")
            elif existing_application.verification_status == "approved":
                raise HTTPException(status_code=400, detail="Zaten onaylanmış bir başvurunuz var")
        
        # Yeni başvuru oluştur
        application = models.DonorApplication(
            user_id=user_id,
            qr_data=req.qr_data,
            document_url=req.document_url,
            verification_status="pending"
        )
        
        db.add(application)
        db.commit()
        db.refresh(application)
        
        return {
            "status": "success",
            "message": "Başvurunuz alındı. Admin onayı bekleniyor.",
            "application_id": application.id,
            "verification_status": application.verification_status
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Başvuru oluşturulurken hata: {str(e)}")


@app.get("/donor-applications")
def list_donor_applications(
    status: Optional[str] = Query(None, description="Filtre: pending, approved, rejected"),
    db: Session = Depends(get_db)
):
    """Gönüllü başvurularını listele (Admin için)"""
    try:
        query = db.query(models.DonorApplication)
        
        if status:
            query = query.filter(models.DonorApplication.verification_status == status)
        
        applications = query.order_by(models.DonorApplication.created_at.desc()).all()
        
        result = []
        for app in applications:
            user = db.query(models.User).filter(models.User.id == app.user_id).first()
            admin = None
            if app.verified_by:
                admin = db.query(models.User).filter(models.User.id == app.verified_by).first()
            
            result.append({
                "id": app.id,
                "user_id": app.user_id,
                "user_name": user.name if user else "Bilinmeyen",
                "user_email": user.email if user else None,
                "qr_data": app.qr_data,
                "document_url": app.document_url,
                "verification_status": app.verification_status,
                "verified_at": app.verified_at.isoformat() if app.verified_at else None,
                "verified_by": app.verified_by,
                "verified_by_name": admin.name if admin else None,
                "rejection_reason": app.rejection_reason,
                "created_at": app.created_at.isoformat() if app.created_at else None,
                "updated_at": app.updated_at.isoformat() if app.updated_at else None
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Başvurular listelenirken hata: {str(e)}")


@app.get("/donor-applications/{application_id}")
def get_donor_application(application_id: int, db: Session = Depends(get_db)):
    """Tek bir başvuruyu getir"""
    try:
        application = db.query(models.DonorApplication).filter(
            models.DonorApplication.id == application_id
        ).first()
        
        if not application:
            raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
        
        user = db.query(models.User).filter(models.User.id == application.user_id).first()
        admin = None
        if application.verified_by:
            admin = db.query(models.User).filter(models.User.id == application.verified_by).first()
        
        return {
            "id": application.id,
            "user_id": application.user_id,
            "user_name": user.name if user else "Bilinmeyen",
            "user_email": user.email if user else None,
            "qr_data": application.qr_data,
            "document_url": application.document_url,
            "verification_status": application.verification_status,
            "verified_at": application.verified_at.isoformat() if application.verified_at else None,
            "verified_by": application.verified_by,
            "verified_by_name": admin.name if admin else None,
            "rejection_reason": application.rejection_reason,
            "created_at": application.created_at.isoformat() if application.created_at else None,
            "updated_at": application.updated_at.isoformat() if application.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Başvuru getirilirken hata: {str(e)}")


@app.post("/donor-applications/{application_id}/approve")
def approve_donor_application(
    application_id: int,
    admin_id: int = Query(..., description="Onaylayan admin kullanıcı ID"),
    db: Session = Depends(get_db)
):
    """Gönüllü başvurusunu onayla (Admin)"""
    try:
        # Admin kontrolü
        admin = db.query(models.User).filter(
            models.User.id == admin_id,
            models.User.role == "admin"
        ).first()
        
        if not admin:
            raise HTTPException(status_code=403, detail="Sadece admin kullanıcılar onaylayabilir")
        
        # Başvuruyu bul
        application = db.query(models.DonorApplication).filter(
            models.DonorApplication.id == application_id
        ).first()
        
        if not application:
            raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
        
        if application.verification_status == "approved":
            raise HTTPException(status_code=400, detail="Bu başvuru zaten onaylanmış")
        
        if application.verification_status == "rejected":
            raise HTTPException(status_code=400, detail="Bu başvuru reddedilmiş, tekrar onaylanamaz")
        
        # Başvuruyu onayla
        application.verification_status = "approved"
        application.verified_at = func.now()
        application.verified_by = admin_id
        
        # Kullanıcının rolünü "donor" yap (veya "both" yapabiliriz)
        user = db.query(models.User).filter(models.User.id == application.user_id).first()
        if user:
            if user.role == "beneficiary" or user.role == "user":
                user.role = "both"  # Hem beneficiary hem donor
            elif user.role != "both":
                user.role = "donor"
        
        db.commit()
        db.refresh(application)
        
        return {
            "status": "success",
            "message": "Başvuru onaylandı. Kullanıcı artık gönüllü olarak bağış yapabilir.",
            "application_id": application.id,
            "user_id": application.user_id,
            "user_role": user.role if user else None
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Başvuru onaylanırken hata: {str(e)}")


@app.post("/donor-applications/{application_id}/reject")
def reject_donor_application(
    application_id: int,
    admin_id: int = Query(..., description="Reddeden admin kullanıcı ID"),
    rejection_reason: Optional[str] = Query(None, description="Red nedeni"),
    db: Session = Depends(get_db)
):
    """Gönüllü başvurusunu reddet (Admin)"""
    try:
        # Admin kontrolü
        admin = db.query(models.User).filter(
            models.User.id == admin_id,
            models.User.role == "admin"
        ).first()
        
        if not admin:
            raise HTTPException(status_code=403, detail="Sadece admin kullanıcılar reddedebilir")
        
        # Başvuruyu bul
        application = db.query(models.DonorApplication).filter(
            models.DonorApplication.id == application_id
        ).first()
        
        if not application:
            raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
        
        if application.verification_status == "rejected":
            raise HTTPException(status_code=400, detail="Bu başvuru zaten reddedilmiş")
        
        if application.verification_status == "approved":
            raise HTTPException(status_code=400, detail="Onaylanmış başvuru reddedilemez")
        
        # Başvuruyu reddet
        application.verification_status = "rejected"
        application.verified_at = func.now()
        application.verified_by = admin_id
        application.rejection_reason = rejection_reason or "Belirtilmemiş"
        
        db.commit()
        db.refresh(application)
        
        return {
            "status": "success",
            "message": "Başvuru reddedildi",
            "application_id": application.id,
            "rejection_reason": application.rejection_reason
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Başvuru reddedilirken hata: {str(e)}")


@app.get("/donor-applications/user/{user_id}")
def get_user_donor_application(user_id: int, db: Session = Depends(get_db)):
    """Kullanıcının başvurusunu getir"""
    try:
        application = db.query(models.DonorApplication).filter(
            models.DonorApplication.user_id == user_id
        ).first()
        
        if not application:
            return {
                "status": "not_found",
                "message": "Henüz başvuru yapılmamış"
            }
        
        user = db.query(models.User).filter(models.User.id == user_id).first()
        admin = None
        if application.verified_by:
            admin = db.query(models.User).filter(models.User.id == application.verified_by).first()
        
        return {
            "id": application.id,
            "user_id": application.user_id,
            "user_name": user.name if user else "Bilinmeyen",
            "qr_data": application.qr_data,
            "document_url": application.document_url,
            "verification_status": application.verification_status,
            "verified_at": application.verified_at.isoformat() if application.verified_at else None,
            "verified_by": application.verified_by,
            "verified_by_name": admin.name if admin else None,
            "rejection_reason": application.rejection_reason,
            "created_at": application.created_at.isoformat() if application.created_at else None,
            "updated_at": application.updated_at.isoformat() if application.updated_at else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Başvuru getirilirken hata: {str(e)}")


# ======================================
# GÖNÜLLÜ BAŞVURU SİSTEMİ (E-DEVLET BELGESİ İLE)
# Bağışçı (donor) sisteminden ayrı, yeni bir sistem
# ======================================

@app.post("/volunteer-applications")
def create_volunteer_application(req: VolunteerApplicationCreate, db: Session = Depends(get_db)):
    """Gönüllü başvurusu oluştur (E-devlet belgesi ile)"""
    try:
        # Aynı e-posta ile başvuru var mı kontrol et
        if req.email:
            existing_application = db.query(models.VolunteerApplication).filter(
                func.lower(models.VolunteerApplication.email) == func.lower(req.email)
            ).first()
            
            if existing_application:
                if existing_application.verification_status == "pending":
                    raise HTTPException(status_code=400, detail="Bu e-posta ile zaten bekleyen bir başvurunuz var")
                elif existing_application.verification_status == "approved":
                    raise HTTPException(status_code=400, detail="Bu e-posta ile zaten onaylanmış bir başvurunuz var")
        
        # Yeni başvuru oluştur
        application = models.VolunteerApplication(
            name=req.name,
            email=req.email,
            phone=req.phone,
            edevlet_document_url=req.edevlet_document_url,
            edevlet_qr_data=req.edevlet_qr_data,
            document_file=req.document_file,
            verification_status="pending"
        )
        
        db.add(application)
        db.commit()
        db.refresh(application)
        
        return {
            "status": "success",
            "message": "Başvurunuz alındı. E-devlet belgeniz admin tarafından incelenecek.",
            "application_id": application.id,
            "verification_status": application.verification_status
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Başvuru oluşturulurken hata: {str(e)}")


@app.get("/volunteer-applications")
def list_volunteer_applications(
    status: Optional[str] = Query(None, description="Filtre: pending, approved, rejected"),
    db: Session = Depends(get_db)
):
    """Gönüllü başvurularını listele (Admin için)"""
    try:
        query = db.query(models.VolunteerApplication)
        
        if status:
            query = query.filter(models.VolunteerApplication.verification_status == status)
        
        applications = query.order_by(models.VolunteerApplication.created_at.desc()).all()
        
        result = []
        for app in applications:
            admin = None
            user = None
            if app.verified_by:
                admin = db.query(models.User).filter(models.User.id == app.verified_by).first()
            if app.user_id:
                user = db.query(models.User).filter(models.User.id == app.user_id).first()
            
            result.append({
                "id": app.id,
                "name": app.name,
                "email": app.email,
                "phone": app.phone,
                "edevlet_document_url": app.edevlet_document_url,
                "edevlet_qr_data": app.edevlet_qr_data,
                "document_file": app.document_file,
                "verification_status": app.verification_status,
                "verified_at": app.verified_at.isoformat() if app.verified_at else None,
                "verified_by": app.verified_by,
                "verified_by_name": admin.name if admin else None,
                "rejection_reason": app.rejection_reason,
                "user_id": app.user_id,
                "user_name": user.name if user else None,
                "created_at": app.created_at.isoformat() if app.created_at else None,
                "updated_at": app.updated_at.isoformat() if app.updated_at else None
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Başvurular listelenirken hata: {str(e)}")


@app.post("/volunteer-applications/{application_id}/approve")
def approve_volunteer_application(
    application_id: int,
    admin_id: int = Query(..., description="Onaylayan admin kullanıcı ID"),
    db: Session = Depends(get_db)
):
    """Gönüllü başvurusunu onayla (Admin) - E-devlet belgesi kontrol edildikten sonra"""
    try:
        # Admin kontrolü
        admin = db.query(models.User).filter(
            models.User.id == admin_id,
            models.User.role == "admin"
        ).first()
        
        if not admin:
            raise HTTPException(status_code=403, detail="Sadece admin kullanıcılar onaylayabilir")
        
        # Başvuruyu bul
        application = db.query(models.VolunteerApplication).filter(
            models.VolunteerApplication.id == application_id
        ).first()
        
        if not application:
            raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
        
        if application.verification_status == "approved":
            raise HTTPException(status_code=400, detail="Bu başvuru zaten onaylanmış")
        
        if application.verification_status == "rejected":
            raise HTTPException(status_code=400, detail="Bu başvuru reddedilmiş, tekrar onaylanamaz")
        
        # Başvuruyu onayla
        application.verification_status = "approved"
        application.verified_at = func.now()
        application.verified_by = admin_id
        
        # Kullanıcı hesabı oluştur (eğer yoksa)
        existing_user = None
        if application.email:
            existing_user = db.query(models.User).filter(
                func.lower(models.User.email) == func.lower(application.email)
            ).first()
        
        if not existing_user:
            # Yeni kullanıcı oluştur
            new_user = models.User(
                name=application.name,
                email=application.email,
                role="volunteer",
                balance=0.0,
                is_verified=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            application.user_id = new_user.id
        else:
            # Mevcut kullanıcının rolünü güncelle
            if existing_user.role != "volunteer":
                existing_user.role = "volunteer"
            existing_user.is_verified = True
            application.user_id = existing_user.id
        
        db.commit()
        db.refresh(application)
        
        return {
            "status": "success",
            "message": "Başvuru onaylandı. Kullanıcı gönüllü olarak sisteme eklendi.",
            "application_id": application.id,
            "user_id": application.user_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Başvuru onaylanırken hata: {str(e)}")


@app.post("/volunteer-applications/{application_id}/reject")
def reject_volunteer_application(
    application_id: int,
    admin_id: int = Query(..., description="Reddeden admin kullanıcı ID"),
    rejection_reason: Optional[str] = Query(None, description="Red nedeni"),
    db: Session = Depends(get_db)
):
    """Gönüllü başvurusunu reddet (Admin)"""
    try:
        # Admin kontrolü
        admin = db.query(models.User).filter(
            models.User.id == admin_id,
            models.User.role == "admin"
        ).first()
        
        if not admin:
            raise HTTPException(status_code=403, detail="Sadece admin kullanıcılar reddedebilir")
        
        # Başvuruyu bul
        application = db.query(models.VolunteerApplication).filter(
            models.VolunteerApplication.id == application_id
        ).first()
        
        if not application:
            raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
        
        if application.verification_status == "rejected":
            raise HTTPException(status_code=400, detail="Bu başvuru zaten reddedilmiş")
        
        if application.verification_status == "approved":
            raise HTTPException(status_code=400, detail="Onaylanmış başvuru reddedilemez")
        
        # Başvuruyu reddet
        application.verification_status = "rejected"
        application.verified_at = func.now()
        application.verified_by = admin_id
        application.rejection_reason = rejection_reason or "Belirtilmemiş"
        
        db.commit()
        db.refresh(application)
        
        return {
            "status": "success",
            "message": "Başvuru reddedildi",
            "application_id": application.id,
            "rejection_reason": application.rejection_reason
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Başvuru reddedilirken hata: {str(e)}")


@app.get("/volunteer-applications/email/{email}")
def get_volunteer_application_by_email(email: str, db: Session = Depends(get_db)):
    """E-posta ile gönüllü başvurusunu getir"""
    try:
        application = db.query(models.VolunteerApplication).filter(
            func.lower(models.VolunteerApplication.email) == func.lower(email)
        ).first()
        
        if not application:
            return {
                "status": "not_found",
                "message": "Henüz başvuru yapılmamış"
            }
        
        admin = None
        user = None
        if application.verified_by:
            admin = db.query(models.User).filter(models.User.id == application.verified_by).first()
        if application.user_id:
            user = db.query(models.User).filter(models.User.id == application.user_id).first()
        
        return {
            "id": application.id,
            "name": application.name,
            "email": application.email,
            "phone": application.phone,
            "edevlet_document_url": application.edevlet_document_url,
            "edevlet_qr_data": application.edevlet_qr_data,
            "verification_status": application.verification_status,
            "verified_at": application.verified_at.isoformat() if application.verified_at else None,
            "verified_by": application.verified_by,
            "verified_by_name": admin.name if admin else None,
            "rejection_reason": application.rejection_reason,
            "user_id": application.user_id,
            "user_name": user.name if user else None,
            "created_at": application.created_at.isoformat() if application.created_at else None,
            "updated_at": application.updated_at.isoformat() if application.updated_at else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Başvuru getirilirken hata: {str(e)}")

