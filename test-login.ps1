$response = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"test@example.com","password":"123456"}' -UseBasicParsing
Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Response Body:"
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
