@echo off
echo ====================================
echo PAYDA Backend Sunucusu Baslatiliyor...
echo ====================================
cd /d "%~dp0"
call venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause



