@echo off
chcp 65001 >nul
echo ============================================================
echo PAYDA DURUM KONTROLU
echo ============================================================
echo.

echo [1] Backend Kontrolu (Port 8080):
netstat -ano | findstr :8080 >nul
if %errorlevel% == 0 (
    echo    ✅ Backend CALISIYOR
) else (
    echo    ❌ Backend CALISMIYOR
    echo    Backend'i baslatmak icin: cd "donation_platform - Kopya" ve BASLAT.bat calistirin
)
echo.

echo [2] Frontend Kontrolu (Port 5173):
netstat -ano | findstr :5173 >nul
if %errorlevel% == 0 (
    echo    ✅ Frontend CALISIYOR
) else (
    echo    ❌ Frontend CALISMIYOR
    echo    Frontend'i baslatmak icin: cd "payv2" ve npm run dev calistirin
)
echo.

echo ============================================================
echo TEST KULLANICILARI:
echo ============================================================
echo test1 / 123 (Ihtiyac Sahibi)
echo test3 / 123 (Bagisci)
echo test5 / 123 (Isletme)
echo test7 / 123 (Gonullu)
echo.
pause

