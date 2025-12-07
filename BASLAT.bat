@echo off
chcp 65001 >nul
title PAYDA Backend Server
echo ============================================================
echo PAYDA BACKEND SERVER
echo ============================================================
echo.
echo Backend http://0.0.0.0:8080 adresinde baslatiliyor...
echo Backend http://localhost:8080 adresinde erisilebilir
echo.
echo Durdurmak icin CTRL+C basin
echo.
cd /d "%~dp0"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080


