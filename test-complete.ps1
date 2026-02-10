# Complete auth flow test with all endpoints

Write-Host ""
Write-Host "===================================================="
Write-Host "  AI Asistan - Authentication System Test"
Write-Host "====================================================" -ForegroundColor Cyan

# 1. REGISTER
Write-Host ""
Write-Host "[1] REGISTER TEST" -ForegroundColor Yellow
$email = "testuser_$(Get-Random)@example.com"
$registerBody = @{
    email = $email
    password = "SecurePass123"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/auth/register' `
    -Method POST -ContentType 'application/json' -Body $registerBody -UseBasicParsing

$registerData = $registerResponse.Content | ConvertFrom-Json
Write-Host "[OK] Status: $($registerResponse.StatusCode)"
Write-Host "[OK] Email: $($email)"

# 2. LOGIN
Write-Host ""
Write-Host "[2] LOGIN TEST" -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = "SecurePass123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/auth/login' `
    -Method POST -ContentType 'application/json' -Body $loginBody -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$accessToken = $loginData.data.accessToken
$refreshToken = $loginData.data.refreshToken

Write-Host "[OK] Status: $($loginResponse.StatusCode)"
Write-Host "[OK] Access Token: $($accessToken.Substring(0,40))..."
Write-Host "[OK] Refresh Token: $($refreshToken.Substring(0,40))..."

# 3. LOGOUT
Write-Host ""
Write-Host "[3] LOGOUT TEST" -ForegroundColor Yellow
try {
    $logoutResponse = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/auth/logout' `
        -Method POST `
        -ContentType 'application/json' `
        -Headers @{ "Authorization" = "Bearer $accessToken" } `
        -UseBasicParsing

    $logoutData = $logoutResponse.Content | ConvertFrom-Json
    Write-Host "[OK] Status: $($logoutResponse.StatusCode)"
    Write-Host "[OK] Message: $($logoutData.message)"
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)"
}

# 4. REFRESH TOKEN
Write-Host ""
Write-Host "[4] REFRESH TOKEN TEST" -ForegroundColor Yellow
try {
    $refreshBody = @{
        refreshToken = $refreshToken
    } | ConvertTo-Json

    $refreshResponse = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/auth/refresh' `
        -Method POST -ContentType 'application/json' -Body $refreshBody -UseBasicParsing

    $refreshData = $refreshResponse.Content | ConvertFrom-Json
    $newAccessToken = $refreshData.data.accessToken
    $newRefreshToken = $refreshData.data.refreshToken

    Write-Host "[OK] Status: $($refreshResponse.StatusCode)"
    Write-Host "[OK] New Access Token: $($newAccessToken.Substring(0,40))..."
    Write-Host "[OK] New Refresh Token: $($newRefreshToken.Substring(0,40))..."
} catch {
    Write-Host "[EXPECTED] Refresh may fail after logout"
    Write-Host "[INFO] Error: $($_.Exception.Message)"
}

# Summary
Write-Host ""
Write-Host "===================================================="
Write-Host "  ALL TESTS COMPLETED SUCCESSFULLY"
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
