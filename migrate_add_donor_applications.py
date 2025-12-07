import sqlite3

DATABASE_URL = "./donation.db"

def migrate_database():
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_URL)
        cursor = conn.cursor()

        # donor_applications tablosunu oluştur
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS donor_applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                qr_data TEXT NULL,
                document_url TEXT NULL,
                verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
                verified_at DATETIME NULL,
                verified_by INTEGER NULL,
                rejection_reason TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (verified_by) REFERENCES users(id)
            )
        """)

        conn.commit()
        print("✅ donor_applications tablosu başarıyla oluşturuldu!")

    except sqlite3.Error as e:
        print(f"❌ Veritabanı hatası: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Veritabanı migration başlatılıyor...")
    migrate_database()



