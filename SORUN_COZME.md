# 🔧 Sorun Çözme Rehberi

## ❌ "localhost:5173 bağlanmayı reddetti" Hatası

### ✅ Çözüm 1: Frontend'i Yeniden Başlat

1. **Tüm Node process'lerini kapat:**
   ```powershell
   taskkill /F /IM node.exe
   ```

2. **Frontend'i yeniden başlat:**
   ```powershell
   cd "C:\Users\pc\Desktop\payv2"
   npm run dev
   ```

### ✅ Çözüm 2: Port'u Temizle

```powershell
# Port 5173'ü kullanan process'i bul
netstat -ano | findstr :5173

# Process ID'yi not al ve kapat
taskkill /F /PID [PROCESS_ID]
```

### ✅ Çözüm 3: Backend'i Kontrol Et

Backend çalışmıyorsa frontend çalışsa bile veri çekemez:

```powershell
# Backend'i başlat
cd "C:\Users\pc\Desktop\donation_platform - Kopya"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
```

## 🚀 Hızlı Başlatma

### Tek Komutla Her Şeyi Başlat:

**payv2** klasöründe `BASLAT_HERSEY.bat` dosyasına çift tıklayın!

Bu dosya:
- ✅ Backend'i başlatır (port 8080)
- ✅ Frontend'i başlatır (port 5173)

## 📋 Test Kullanıcıları

- **test1** / **123** (İhtiyaç Sahibi)
- **test3** / **123** (Bağışçı)
- **test5** / **123** (İşletme)
- **test7** / **123** (Gönüllü)

## 🔍 Kontrol Listesi

- [ ] Backend çalışıyor mu? → http://localhost:8080/docs
- [ ] Frontend çalışıyor mu? → http://localhost:5173
- [ ] Port 8080 boş mu?
- [ ] Port 5173 boş mu?
- [ ] Node.js yüklü mü? → `node --version`
- [ ] Python yüklü mü? → `python --version`

