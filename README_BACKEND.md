# Backend Sunucusunu Başlatma

## Hızlı Başlatma (Windows)
1. `start_backend.bat` dosyasına çift tıklayın
   VEYA
2. Terminal'de şu komutları çalıştırın:

```bash
cd "C:\Users\pc\Desktop\donation_platform - Kopya"
venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Manuel Başlatma
Terminal'de (PowerShell veya CMD):

```powershell
# 1. Backend dizinine git
cd "C:\Users\pc\Desktop\donation_platform - Kopya"

# 2. Virtual environment'ı aktifleştir
.\venv\Scripts\Activate.ps1

# 3. Sunucuyu başlat
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Sunucu Başladıktan Sonra
- API Dokümantasyonu: http://localhost:8000/docs
- API Test: http://localhost:8000
- Frontend: http://localhost:5173 (veya frontend'in çalıştığı port)

## Sorun Giderme
- Port 8000 kullanılıyorsa, başka bir port kullanın:
  `python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001`
- Virtual environment yoksa:
  `python -m venv venv`
  `venv\Scripts\activate`
  `pip install fastapi uvicorn sqlalchemy pydantic`



