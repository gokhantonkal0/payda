@echo off
chcp 65001 >nul
title PAYDA Frontend Server
echo ============================================================
echo PAYDA FRONTEND SERVER
echo ============================================================
echo.
echo Frontend http://localhost:5173 adresinde baslatiliyor...
echo.
echo Durdurmak icin CTRL+C basin
echo.
cd /d "%~dp0"
npm run dev

