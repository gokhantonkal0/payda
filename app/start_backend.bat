@echo off
chcp 65001 >nul
echo ============================================================
echo BACKEND BASLATILIYOR...
echo ============================================================
echo.
cd /d "%~dp0\.."
echo Mevcut dizin: %CD%
echo.
echo Backend http://localhost:8080 adresinde baslatiliyor...
echo.
echo Durdurmak icin CTRL+C basin
echo.
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
pause

