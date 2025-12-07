# Volunteer Application Endpoints
# Bu dosya main.py'ye eklenecek

from sqlalchemy import func
from fastapi import HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app import models

@app.post("/volunteer-applications")
def create_volunteer_application(req: VolunteerApplicationCreate, db: Session = Depends(get_db)):
    """Gönüllü başvurusu oluştur (E-devlet belgesi ile)"""
    try:
        # Aynı e-posta ile başvuru var mı kontrol et
        existing_application = db.query(models.VolunteerApplication).filter(
            models.VolunteerApplication.email == req.email
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



