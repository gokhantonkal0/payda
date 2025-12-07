# Test Kullanıcıları

## 📋 Test Kullanıcı Listesi

### 🔵 İhtiyaç Sahibi (User Dashboard)
- **Kullanıcı Adı:** `test1` | **Şifre:** `123`
- **Kullanıcı Adı:** `test2` | **Şifre:** `123`

### 🟢 Bağışçı (Donor Dashboard)
- **Kullanıcı Adı:** `test3` | **Şifre:** `123`
- **Kullanıcı Adı:** `test4` | **Şifre:** `123`

### 🟡 İşletme (Seller Dashboard)
- **Kullanıcı Adı:** `test5` | **Şifre:** `123`
- **Kullanıcı Adı:** `test6` | **Şifre:** `123`

### 🔴 Gönüllü (Volunteer - Admin Panel)
- **Kullanıcı Adı:** `test7` | **Şifre:** `123`
- **Kullanıcı Adı:** `test8` | **Şifre:** `123`

## 🚀 Test Kullanıcılarını Oluşturma

### Yöntem 1: PowerShell Script (Önerilen)

1. **Backend'i başlatın:**
   ```powershell
   cd "C:\Users\pc\Desktop\donation_platform - Kopya\app"
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
   ```

2. **Yeni bir terminal açın ve script'i çalıştırın:**
   ```powershell
   cd "C:\Users\pc\Desktop\donation_platform - Kopya\app"
   powershell -ExecutionPolicy Bypass -File create_test_users.ps1
   ```

### Yöntem 2: Manuel Olarak Frontend'den

Her rol için kayıt sayfasından manuel olarak kayıt olabilirsiniz:
- İhtiyaç Sahibi: Role Selection → İhtiyaç Sahibi → Kayıt Ol
- Bağışçı: Role Selection → Bağışçı → Kayıt Ol
- İşletme: Role Selection → İşletme → Kayıt Ol
- Gönüllü: Role Selection → Gönüllü → Kayıt Ol (E-devlet belgesi gerekli)

## ✅ Kullanım

1. Backend'in `http://localhost:8080` adresinde çalıştığından emin olun
2. Frontend'de ilgili login sayfasına gidin
3. Yukarıdaki test kullanıcı adı ve şifrelerini kullanarak giriş yapın

## 📝 Notlar

- Tüm test kullanıcıları `is_verified=True` olarak oluşturulur
- Bağışçı kullanıcıların başlangıç bakiyesi vardır
- Gönüllü kullanıcılar admin paneli erişimine sahiptir


