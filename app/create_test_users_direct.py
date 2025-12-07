"""
Test kullanıcıları oluştur - Direkt database'e yaz
Backend çalışmasa bile çalışır
"""
import sqlite3
import os

# Database dosyası yolu
db_path = os.path.join(os.path.dirname(__file__), "donation.db")

# Database bağlantısı
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Tabloyu oluştur (yoksa)
cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        password TEXT,
        role TEXT NOT NULL DEFAULT 'donor',
        balance REAL NOT NULL DEFAULT 0.0,
        priority INTEGER NOT NULL DEFAULT 0,
        is_verified INTEGER NOT NULL DEFAULT 0,
        phone TEXT,
        address TEXT,
        bio TEXT,
        max_daily_donation REAL NOT NULL DEFAULT 1000.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")

# Test kullanıcıları
test_users = [
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

print("="*60)
print("TEST KULLANICILARI OLUSTURULUYOR...")
print("="*60)
print()

for name, email, password, role, balance, is_verified in test_users:
    # Kullanıcı var mı kontrol et
    cursor.execute("SELECT id FROM users WHERE name = ?", (name,))
    existing = cursor.fetchone()
    
    if existing:
        # Güncelle
        cursor.execute("""
            UPDATE users 
            SET email = ?, password = ?, role = ?, balance = ?, is_verified = ?
            WHERE name = ?
        """, (email, password, role, balance, is_verified, name))
        updated += 1
        print(f"✅ Güncellendi: {name} ({role})")
    else:
        # Yeni oluştur
        cursor.execute("""
            INSERT INTO users (name, email, password, role, balance, is_verified)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (name, email, password, role, balance, is_verified))
        created += 1
        print(f"✅ Oluşturuldu: {name} ({role})")

conn.commit()
conn.close()

print()
print("="*60)
print(f"✅ Toplam {created} kullanıcı oluşturuldu")
print(f"✅ Toplam {updated} kullanıcı güncellendi")
print("="*60)
print()
print("📋 Test Kullanıcıları:")
print()
print("🔵 İhtiyaç Sahibi (User Dashboard):")
print("   Kullanıcı Adı: test1, Şifre: 123")
print("   Kullanıcı Adı: test2, Şifre: 123")
print()
print("🟢 Bağışçı (Donor Dashboard):")
print("   Kullanıcı Adı: test3, Şifre: 123")
print("   Kullanıcı Adı: test4, Şifre: 123")
print()
print("🟡 İşletme (Seller Dashboard):")
print("   Kullanıcı Adı: test5, Şifre: 123")
print("   Kullanıcı Adı: test6, Şifre: 123")
print()
print("🔴 Gönüllü (Volunteer - Admin Panel):")
print("   Kullanıcı Adı: test7, Şifre: 123")
print("   Kullanıcı Adı: test8, Şifre: 123")
print()
print("="*60)
print()
print("✅ Test kullanıcıları hazır! Şimdi backend'i başlatabilirsiniz.")
print()


