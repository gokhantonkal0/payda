from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True, unique=False)
    password = Column(String, nullable=True)  # Şifre (test için plain text)
    role = Column(String, nullable=False, default="donor")  # donor / beneficiary / both / merchant / admin / volunteer
    balance = Column(Float, nullable=False, default=0.0)
    priority = Column(Integer, nullable=False, default=0)  # ihtiyaç sahipleri için
    is_verified = Column(Boolean, nullable=False, default=False)
    
    # Profil özelleştirme alanları
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    bio = Column(String, nullable=True)

    # fraud / limit
    max_daily_donation = Column(Float, nullable=False, default=1000.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    donations = relationship("Donation", back_populates="user")
    coupons_received = relationship("Coupon", back_populates="beneficiary", foreign_keys="Coupon.beneficiary_id")


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    backflow_rate = Column(Float, nullable=False, default=0.10)  # ör: %10
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    coupon_types = relationship("CouponType", back_populates="merchant")


class CouponType(Base):
    __tablename__ = "coupon_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)          # tek kupon tutarı
    category = Column(String, nullable=False)       # gıda, kırtasiye, ulaşım...
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)

    merchant = relationship("Merchant", back_populates="coupon_types")
    pool = relationship("Pool", back_populates="coupon_type", uselist=False)
    coupons = relationship("Coupon", back_populates="coupon_type")


class Pool(Base):
    __tablename__ = "pools"

    id = Column(Integer, primary_key=True, index=True)
    coupon_type_id = Column(Integer, ForeignKey("coupon_types.id"), nullable=False, unique=True)
    target_amount = Column(Float, nullable=False)         # 1 kupon için gereken toplam bağış
    current_balance = Column(Float, nullable=False, default=0.0)

    coupon_type = relationship("CouponType", back_populates="pool")


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    coupon_type_id = Column(Integer, ForeignKey("coupon_types.id"), nullable=False)
    beneficiary_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, nullable=False, default="created")  # created / assigned / used
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)

    coupon_type = relationship("CouponType", back_populates="coupons")
    beneficiary = relationship("User", back_populates="coupons_received")


class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    coupon_type_id = Column(Integer, ForeignKey("coupon_types.id"), nullable=True)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="donations")
    coupon_type = relationship("CouponType")


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AutoDonation(Base):
    __tablename__ = "auto_donations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    coupon_type_id = Column(Integer, ForeignKey("coupon_types.id"), nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(String, nullable=False, default="daily")  # daily / weekly / monthly (simülasyon)
    is_active = Column(Boolean, nullable=False, default=True)
    last_run = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")
    coupon_type = relationship("CouponType")


class Need(Base):
    __tablename__ = "needs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=False)  # gıda, kırtasiye, ulaşım, tech, etc.
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False, default="active")  # active / completed / cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")


class PovertyVerification(Base):
    """E-devlet fakirlik durumu tescili"""
    __tablename__ = "poverty_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    document_url = Column(String, nullable=True)  # E-devlet belgesi URL'i
    verification_status = Column(String, nullable=False, default="pending")  # pending / approved / rejected
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin kullanıcı ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])


class BeneficiaryRegistration(Base):
    """İhtiyaç sahibi kayıt sistemi - SGK döküm evrağı ile Admin onayı"""
    __tablename__ = "beneficiary_registrations"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Ad Soyad
    email = Column(String, nullable=True)  # E-posta
    password = Column(String, nullable=True)  # Şifre (hash'lenmiş)
    sgk_document_file = Column(String, nullable=True)  # Base64 encoded SGK döküm evrağı
    sgk_document_url = Column(String, nullable=True)  # SGK belgesi URL'i
    verification_status = Column(String, nullable=False, default="pending")  # pending / approved / rejected
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin gönüllü kullanıcı ID
    rejection_reason = Column(String, nullable=True)  # Red nedeni
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Onaylandıktan sonra oluşturulan kullanıcı ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[verified_by])


class ApprovalBand(Base):
    """İşletmelere günlük destek onay bandı - Devlet teminatı"""
    __tablename__ = "approval_bands"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    daily_limit = Column(Float, nullable=False, default=10000.0)  # Günlük destek limiti
    used_today = Column(Float, nullable=False, default=0.0)  # Bugün kullanılan miktar
    last_reset_date = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, nullable=False, default=True)
    government_guarantee = Column(Boolean, nullable=False, default=True)  # Devlet teminatı
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant")


class MoneyFlow(Base):
    """Para akışı takibi - Tüm para giriş/çıkışları"""
    __tablename__ = "money_flows"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # İşlem yapan kullanıcı
    transaction_type = Column(String, nullable=False)  # donation, withdrawal, topup, transfer, etc.
    amount = Column(Float, nullable=False)
    balance_before = Column(Float, nullable=False)  # İşlem öncesi bakiye
    balance_after = Column(Float, nullable=False)  # İşlem sonrası bakiye
    related_id = Column(Integer, nullable=True)  # İlgili işlem ID (donation_id, need_id, etc.)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")



class MerchantDailyEarnings(Base):
    """İşletme günlük kazanç takibi"""
    __tablename__ = "merchant_daily_earnings"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    daily_earnings = Column(Float, nullable=False, default=0.0)  # Bugünkü kazanç
    daily_limit = Column(Float, nullable=False, default=2000.0)  # Günlük limit (2000 TL)
    total_earnings = Column(Float, nullable=False, default=0.0)  # Toplam kazanç
    total_donated_back = Column(Float, nullable=False, default=0.0)  # Toplam geri bağış (kazancın %10'u)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    merchant = relationship("Merchant")


class VolunteerApplication(Base):
    """Gönüllü başvuru sistemi - E-devlet belgesi ile Admin onayı (Bağışçı değil, ayrı sistem)"""
    __tablename__ = "volunteer_applications"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Ad Soyad
    email = Column(String, nullable=True)  # E-posta
    phone = Column(String, nullable=True)  # Telefon
    edevlet_document_url = Column(String, nullable=True)  # E-devlet belgesi URL'i
    edevlet_qr_data = Column(String, nullable=True)  # E-devlet QR kod verisi
    document_file = Column(String, nullable=True)  # Base64 encoded belge dosyası
    verification_status = Column(String, nullable=False, default="pending")  # pending / approved / rejected
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin kullanıcı ID
    rejection_reason = Column(String, nullable=True)  # Red nedeni
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Onaylandıktan sonra oluşturulan kullanıcı ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[verified_by])
