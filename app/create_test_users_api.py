"""
Test kullanıcıları oluştur - Backend API kullanarak
Backend çalışıyorsa bu script'i kullanın
"""
import requests
import json

BASE_URL = "http://localhost:8080"

test_users = [
    # İhtiyaç Sahibi
    {"name": "test1", "email": "test1@test.com", "password": "123", "role": "beneficiary"},
    {"name": "test2", "email": "test2@test.com", "password": "123", "role": "beneficiary"},
    
    # Bağışçı
    {"name": "test3", "email": "test3@test.com", "password": "123", "role": "donor"},
    {"name": "test4", "email": "test4@test.com", "password": "123", "role": "donor"},
    
    # İşletme
    {"name": "test5", "email": "test5@test.com", "password": "123", "role": "merchant", "company_name": "Test Market 1"},
    {"name": "test6", "email": "test6@test.com", "password": "123", "role": "merchant", "company_name": "Test Market 2"},
    
    # Gönüllü
    {"name": "test7", "email": "test7@test.com", "password": "123", "role": "volunteer"},
    {"name": "test8", "email": "test8@test.com", "password": "123", "role": "volunteer"},
]

def create_users():
    print("="*60)
    print("TEST KULLANICILARI OLUŞTURULUYOR...")
    print("="*60)
    
    created = 0
    errors = 0
    
    for user_data in test_users:
        try:
            response = requests.post(
                f"{BASE_URL}/users",
                json=user_data,
                timeout=5
            )
            
            if response.status_code == 200 or response.status_code == 201:
                print(f"✅ {user_data['name']} ({user_data['role']}) - Oluşturuldu")
                created += 1
            elif response.status_code == 400:
                # Kullanıcı zaten var, güncelle
                print(f"⚠️  {user_data['name']} zaten var, güncelleniyor...")
                # PUT ile güncelle
                user_id = response.json().get('id') or 1
                update_response = requests.put(
                    f"{BASE_URL}/users/{user_id}",
                    json=user_data,
                    timeout=5
                )
                if update_response.status_code == 200:
                    print(f"✅ {user_data['name']} güncellendi")
                    created += 1
                else:
                    print(f"❌ {user_data['name']} güncellenemedi: {update_response.text}")
                    errors += 1
            else:
                print(f"❌ {user_data['name']} oluşturulamadı: {response.status_code} - {response.text}")
                errors += 1
        except requests.exceptions.ConnectionError:
            print(f"❌ Backend'e bağlanılamadı! Backend'in {BASE_URL} adresinde çalıştığından emin olun.")
            print("\nBackend'i başlatmak için:")
            print("  cd \"C:\\Users\\pc\\Desktop\\donation_platform - Kopya\\app\"")
            print("  python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8080")
            return
        except Exception as e:
            print(f"❌ {user_data['name']} için hata: {str(e)}")
            errors += 1
    
    print("\n" + "="*60)
    print(f"✅ Toplam {created} kullanıcı işlendi")
    if errors > 0:
        print(f"❌ {errors} hata oluştu")
    print("="*60)
    print("\n📋 Test Kullanıcıları:")
    print("\n🔵 İhtiyaç Sahibi (User Dashboard):")
    print("   Kullanıcı Adı: test1, Şifre: 123")
    print("   Kullanıcı Adı: test2, Şifre: 123")
    print("\n🟢 Bağışçı (Donor Dashboard):")
    print("   Kullanıcı Adı: test3, Şifre: 123")
    print("   Kullanıcı Adı: test4, Şifre: 123")
    print("\n🟡 İşletme (Seller Dashboard):")
    print("   Kullanıcı Adı: test5, Şifre: 123")
    print("   Kullanıcı Adı: test6, Şifre: 123")
    print("\n🔴 Gönüllü (Volunteer - Admin Panel):")
    print("   Kullanıcı Adı: test7, Şifre: 123")
    print("   Kullanıcı Adı: test8, Şifre: 123")
    print("\n" + "="*60)

if __name__ == "__main__":
    create_users()


