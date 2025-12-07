"""
Test kullanıcıları oluştur
Her role için test1, test2 kullanıcıları ekler
"""
import sys
import os

# app klasörünü path'e ekle
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from app.database import SessionLocal
from app import models

def create_test_users():
    db = SessionLocal()
    
    try:
        # Test kullanıcıları listesi
        test_users = [
            # İhtiyaç Sahibi (Beneficiary/User)
            {"name": "test1", "email": "test1@test.com", "password": "123", "role": "beneficiary", "balance": 0.0, "is_verified": True},
            {"name": "test2", "email": "test2@test.com", "password": "123", "role": "beneficiary", "balance": 0.0, "is_verified": True},
            
            # Bağışçı (Donor)
            {"name": "test3", "email": "test3@test.com", "password": "123", "role": "donor", "balance": 1000.0, "is_verified": True},
            {"name": "test4", "email": "test4@test.com", "password": "123", "role": "donor", "balance": 2000.0, "is_verified": True},
            
            # İşletme (Merchant/Seller)
            {"name": "test5", "email": "test5@test.com", "password": "123", "role": "merchant", "balance": 0.0, "is_verified": True},
            {"name": "test6", "email": "test6@test.com", "password": "123", "role": "merchant", "balance": 0.0, "is_verified": True},
            
            # Gönüllü (Volunteer) - Admin yetkisi ile
            {"name": "test7", "email": "test7@test.com", "password": "123", "role": "volunteer", "balance": 0.0, "is_verified": True},
            {"name": "test8", "email": "test8@test.com", "password": "123", "role": "volunteer", "balance": 0.0, "is_verified": True},
        ]
        
        created_count = 0
        updated_count = 0
        
        for user_data in test_users:
            # Kullanıcı var mı kontrol et
            existing_user = db.query(models.User).filter(
                models.User.name == user_data["name"]
            ).first()
            
            # company_name'i ayır (User modelinde yok, Merchant modelinde var)
            company_name = user_data.pop('company_name', None) if 'company_name' in user_data else None
            
            if existing_user:
                # Mevcut kullanıcıyı güncelle
                for key, value in user_data.items():
                    if hasattr(existing_user, key):
                        setattr(existing_user, key, value)
                updated_count += 1
                print(f"✅ Güncellendi: {user_data['name']} ({user_data['role']})")
            else:
                # Yeni kullanıcı oluştur
                new_user = models.User(**user_data)
                db.add(new_user)
                db.flush()  # ID'yi almak için
                
                # Merchant ise Merchant tablosuna da ekle
                if user_data['role'] == 'merchant' and company_name:
                    existing_merchant = db.query(models.Merchant).filter(
                        models.Merchant.name == company_name
                    ).first()
                    if not existing_merchant:
                        new_merchant = models.Merchant(name=company_name)
                        db.add(new_merchant)
                        db.flush()
                
                created_count += 1
                print(f"✅ Oluşturuldu: {user_data['name']} ({user_data['role']})")
        
        db.commit()
        
        print("\n" + "="*60)
        print(f"✅ Toplam {created_count} kullanıcı oluşturuldu")
        print(f"✅ Toplam {updated_count} kullanıcı güncellendi")
        print("="*60)
        print("\n📋 Test Kullanıcıları:")
        print("\nİhtiyaç Sahibi (User Dashboard):")
        print("  - Kullanıcı Adı: test1, Şifre: 123")
        print("  - Kullanıcı Adı: test2, Şifre: 123")
        print("\nBağışçı (Donor Dashboard):")
        print("  - Kullanıcı Adı: test3, Şifre: 123")
        print("  - Kullanıcı Adı: test4, Şifre: 123")
        print("\nİşletme (Seller Dashboard):")
        print("  - Kullanıcı Adı: test5, Şifre: 123")
        print("  - Kullanıcı Adı: test6, Şifre: 123")
        print("\nGönüllü (Volunteer - Admin Panel):")
        print("  - Kullanıcı Adı: test7, Şifre: 123")
        print("  - Kullanıcı Adı: test8, Şifre: 123")
        print("\n" + "="*60)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Hata: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()

