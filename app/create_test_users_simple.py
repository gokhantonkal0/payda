"""
Test kullanıcıları oluştur - Basit versiyon
"""
import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from app.database import Base, engine, SessionLocal
from app import models

# Tabloları oluştur
Base.metadata.create_all(bind=engine)

def create_test_users():
    db = SessionLocal()
    
    try:
        # Test kullanıcıları
        users = [
            ("test1", "test1@test.com", "123", "beneficiary", 0.0, 1),
            ("test2", "test2@test.com", "123", "beneficiary", 0.0, 1),
            ("test3", "test3@test.com", "123", "donor", 1000.0, 1),
            ("test4", "test4@test.com", "123", "donor", 2000.0, 1),
            ("test5", "test5@test.com", "123", "merchant", 0.0, 1),
            ("test6", "test6@test.com", "123", "merchant", 0.0, 1),
            ("test7", "test7@test.com", "123", "volunteer", 0.0, 1),
            ("test8", "test8@test.com", "123", "volunteer", 0.0, 1),
        ]
        
        created = 0
        updated = 0
        
        for name, email, password, role, balance, is_verified in users:
            # Kullanıcı var mı kontrol et
            result = db.execute(
                text("SELECT id FROM users WHERE name = :name"),
                {"name": name}
            ).fetchone()
            
            if result:
                # Güncelle
                db.execute(
                    text("""
                        UPDATE users 
                        SET email = :email, password = :password, role = :role, 
                            balance = :balance, is_verified = :is_verified
                        WHERE name = :name
                    """),
                    {"name": name, "email": email, "password": password, "role": role, 
                     "balance": balance, "is_verified": is_verified}
                )
                updated += 1
                print(f"✅ Güncellendi: {name} ({role})")
            else:
                # Yeni oluştur
                db.execute(
                    text("""
                        INSERT INTO users (name, email, password, role, balance, is_verified)
                        VALUES (:name, :email, :password, :role, :balance, :is_verified)
                    """),
                    {"name": name, "email": email, "password": password, "role": role, 
                     "balance": balance, "is_verified": is_verified}
                )
                created += 1
                print(f"✅ Oluşturuldu: {name} ({role})")
        
        db.commit()
        
        print("\n" + "="*60)
        print(f"✅ Toplam {created} kullanıcı oluşturuldu")
        print(f"✅ Toplam {updated} kullanıcı güncellendi")
        print("="*60)
        print("\n📋 Test Kullanıcıları:")
        print("\n🔵 İhtiyaç Sahibi (User Dashboard):")
        print("   Kullanıcı Adı: test1, Şifre: 123")
        print("   Kullanıcı Adı: test2, Şifre: 123")
        print("\n🟢 Bağışçı (Donor Dashboard):")
        print("   Kullanıcı Adı: test3, Şifre: 123 (Bakiye: 1000 TL)")
        print("   Kullanıcı Adı: test4, Şifre: 123 (Bakiye: 2000 TL)")
        print("\n🟡 İşletme (Seller Dashboard):")
        print("   Kullanıcı Adı: test5, Şifre: 123")
        print("   Kullanıcı Adı: test6, Şifre: 123")
        print("\n🔴 Gönüllü (Volunteer - Admin Panel):")
        print("   Kullanıcı Adı: test7, Şifre: 123")
        print("   Kullanıcı Adı: test8, Şifre: 123")
        print("\n" + "="*60)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Hata: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()

