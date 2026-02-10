# 1. Register new user
Write-Host "=== TESTING REGISTER ==="
$registerBody = @{
    email = "newuser_$(Get-Random)@example.com"
    password = "SecurePass123"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/auth/register' `
    -Method POST `
    -ContentType 'application/json' `
    -Body $registerBody `
    -UseBasicParsing

Write-Host "Register Status: $($registerResponse.StatusCode)"
Write-Host "Register Response:"
$registerContent = $registerResponse.Content | ConvertFrom-Json
$registerContent | ConvertTo-Json -Depth 10
$email = $registerContent.data.email

# 2. Login with registered email
Write-Host "`n=== TESTING LOGIN ==="
$loginBody = @{
    email = $email
    password = "SecurePass123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/auth/login' `
    -Method POST `
    -ContentType 'application/json' `
    -Body $loginBody `
    -UseBasicParsing

Write-Host "Login Status: $($loginResponse.StatusCode)"
Write-Host "Login Response:"
$loginContent = $loginResponse.Content | ConvertFrom-Json
$loginContent | ConvertTo-Json -Depth 10

# 3. Extract tokens
Write-Host "`n=== EXTRACTED TOKENS ==="
Write-Host "Access Token: $($loginContent.data.accessToken)"
Write-Host "Refresh Token: $($loginContent.data.refreshToken)"
