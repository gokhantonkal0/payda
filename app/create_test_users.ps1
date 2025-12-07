# Test kullanıcıları oluştur - PowerShell script
$baseUrl = "http://localhost:8080"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TEST KULLANICILARI OLUSTURULUYOR..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$users = @(
    @{name="test1"; email="test1@test.com"; password="123"; role="beneficiary"},
    @{name="test2"; email="test2@test.com"; password="123"; role="beneficiary"},
    @{name="test3"; email="test3@test.com"; password="123"; role="donor"},
    @{name="test4"; email="test4@test.com"; password="123"; role="donor"},
    @{name="test5"; email="test5@test.com"; password="123"; role="merchant"; company_name="Test Market 1"},
    @{name="test6"; email="test6@test.com"; password="123"; role="merchant"; company_name="Test Market 2"},
    @{name="test7"; email="test7@test.com"; password="123"; role="volunteer"},
    @{name="test8"; email="test8@test.com"; password="123"; role="volunteer"}
)

$created = 0
$errors = 0

foreach ($user in $users) {
    try {
        $body = $user | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        
        Write-Host "OK $($user.name) ($($user.role)) - Olusturuldu" -ForegroundColor Green
        $created++
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 400) {
            Write-Host "VAR $($user.name) zaten var" -ForegroundColor Yellow
            $created++
        }
        else {
            Write-Host "HATA $($user.name) olusturulamadi: $($_.Exception.Message)" -ForegroundColor Red
            $errors++
        }
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Toplam $created kullanıcı işlendi" -ForegroundColor Green
if ($errors -gt 0) {
    Write-Host "$errors hata oluştu" -ForegroundColor Red
}
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Kullanıcıları:" -ForegroundColor Cyan
Write-Host ""
Write-Host "İhtiyaç Sahibi (User Dashboard):" -ForegroundColor Blue
Write-Host "   Kullanıcı Adı: test1, Şifre: 123"
Write-Host "   Kullanıcı Adı: test2, Şifre: 123"
Write-Host ""
Write-Host "Bağışçı (Donor Dashboard):" -ForegroundColor Green
Write-Host "   Kullanıcı Adı: test3, Şifre: 123"
Write-Host "   Kullanıcı Adı: test4, Şifre: 123"
Write-Host ""
Write-Host "İşletme (Seller Dashboard):" -ForegroundColor Yellow
Write-Host "   Kullanıcı Adı: test5, Şifre: 123"
Write-Host "   Kullanıcı Adı: test6, Şifre: 123"
Write-Host ""
Write-Host "Gönüllü (Volunteer - Admin Panel):" -ForegroundColor Red
Write-Host "   Kullanıcı Adı: test7, Şifre: 123"
Write-Host "   Kullanıcı Adı: test8, Şifre: 123"
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
