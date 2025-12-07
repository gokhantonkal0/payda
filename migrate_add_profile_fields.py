"""
Veritabanı migration scripti - Profil alanları ekleme
Bu script users tablosuna phone, address, bio sütunlarını ekler.
"""

import sqlite3
import os

# Veritabanı dosya yolu
db_path = os.path.join(os.path.dirname(__file__), 'donation.db')

def migrate():
    """Veritabanı şemasını güncelle"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Mevcut sütunları kontrol et
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Eksik sütunları ekle
        if 'phone' not in columns:
            print("phone sütunu ekleniyor...")
            cursor.execute("ALTER TABLE users ADD COLUMN phone VARCHAR")
        
        if 'address' not in columns:
            print("address sütunu ekleniyor...")
            cursor.execute("ALTER TABLE users ADD COLUMN address VARCHAR")
        
        if 'bio' not in columns:
            print("bio sütunu ekleniyor...")
            cursor.execute("ALTER TABLE users ADD COLUMN bio VARCHAR")
        
        conn.commit()
        print("✅ Migration başarıyla tamamlandı!")
        
    except sqlite3.Error as e:
        print(f"❌ Hata: {e}")
        conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Veritabanı migration başlatılıyor...")
    migrate()



