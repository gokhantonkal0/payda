@echo off
chcp 65001 >nul
title PAYDA - Backend ve Frontend
echo ============================================================
echo PAYDA - BACKEND ve FRONTEND BASLATILIYOR
echo ============================================================
echo.
echo Backend: http://localhost:8080
echo Frontend: http://localhost:5173
echo.
echo Durdurmak icin CTRL+C basin
echo.
start "PAYDA Backend" cmd /k "cd /d \"%~dp0\..\donation_platform - Kopya\" && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8080"
timeout /t 3 /nobreak >nul
cd /d "%~dp0"
npm run dev

