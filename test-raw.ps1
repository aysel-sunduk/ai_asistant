# Test register endpoint with error handling
Write-Host "=== TESTING REGISTER ==="

$registerBody = @{
    email = "testuser_$(Get-Random)@example.com"
    password = "SecurePass123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/auth/register' `
        -Method POST `
        -ContentType 'application/json' `
        -Body $registerBody `
        -UseBasicParsing

    Write-Host "Status Code: $($registerResponse.StatusCode)"
    Write-Host "Raw Response Body:"
    Write-Host $registerResponse.Content
    Write-Host ""
    Write-Host "Response Length: $($registerResponse.Content.Length)"
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
