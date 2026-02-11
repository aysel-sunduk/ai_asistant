param(
    [string]$BaseUrl = "http://localhost:8080/api",
    [string]$Email = "",
    [string]$Password = "Test123456!",
    [switch]$MakeAdmin
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Text)
    Write-Host ""
    Write-Host "==> $Text" -ForegroundColor Cyan
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )

    try {
        $jsonBody = $null
        if ($null -ne $Body) {
            $jsonBody = ($Body | ConvertTo-Json -Depth 6)
        }

        $resp = Invoke-WebRequest `
            -Method $Method `
            -Uri $Url `
            -Headers $Headers `
            -Body $jsonBody `
            -ContentType "application/json"

        $parsed = $null
        if ($resp.Content) {
            $parsed = $resp.Content | ConvertFrom-Json
        }

        return [pscustomobject]@{
            StatusCode = [int]$resp.StatusCode
            Json = $parsed
            Raw = $resp.Content
        }
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $body = $reader.ReadToEnd()
            $status = [int]$_.Exception.Response.StatusCode
            throw "HTTP $status $Method $Url`n$body"
        }
        throw
    }
}

if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = "finance.$([Guid]::NewGuid().ToString('N').Substring(0,8))@test.local"
}

Write-Host "Base URL : $BaseUrl"
Write-Host "Email    : $Email"

Write-Step "Register"
$register = Invoke-Api -Method "POST" -Url "$BaseUrl/v1/auth/register" -Body @{
    email = $Email
    password = $Password
}
Write-Host "Register status: $($register.StatusCode)"

Write-Step "Login"
$login = Invoke-Api -Method "POST" -Url "$BaseUrl/v1/auth/login" -Body @{
    email = $Email
    password = $Password
}
$accessToken = $login.Json.data.accessToken
if ([string]::IsNullOrWhiteSpace($accessToken)) {
    throw "Login succeeded but accessToken is empty."
}
Write-Host "Login status: $($login.StatusCode)"

$authHeaders = @{
    Authorization = "Bearer $accessToken"
}

if ($MakeAdmin) {
    Write-Step "Promote user to admin in DB (docker)"
    $updateRole = "UPDATE users SET role='admin' WHERE email='$Email';"
    $roleCmd = "docker exec -i aiasistan-db psql -U aiasistan -d aiasistan -c `"$updateRole`""
    Invoke-Expression $roleCmd | Out-Null
    Write-Host "Role updated to admin."
}

if ($MakeAdmin) {
    Write-Step "POST /v1/finance/currencies/live?base=USD (admin)"
    $liveRates = Invoke-Api -Method "POST" -Url "$BaseUrl/v1/finance/currencies/live?base=USD" -Headers $authHeaders
    Write-Host "Live sync status: $($liveRates.StatusCode)"

    Write-Step "POST /v1/finance/currencies (admin)"
    $saveRate = Invoke-Api -Method "POST" -Url "$BaseUrl/v1/finance/currencies" -Headers $authHeaders -Body @{
        currencyCode = "USD"
        rate = 38.75
        changeRate = 0.15
        source = "manual-test"
    }
    Write-Host "Save currency status: $($saveRate.StatusCode)"
}

Write-Step "GET /v1/finance/currencies/latest/USD"
$latest = Invoke-Api -Method "GET" -Url "$BaseUrl/v1/finance/currencies/latest/USD" -Headers $authHeaders
Write-Host "Latest status: $($latest.StatusCode)"

$startDate = [DateTime]::UtcNow.AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")
$endDate = [DateTime]::UtcNow.AddDays(1).ToString("yyyy-MM-ddTHH:mm:ss")
Write-Step "GET /v1/finance/currencies/historical/USD"
$historicalUrl = "$BaseUrl/v1/finance/currencies/historical/USD?startDate=$([uri]::EscapeDataString($startDate))&endDate=$([uri]::EscapeDataString($endDate))"
$historical = Invoke-Api -Method "GET" -Url $historicalUrl -Headers $authHeaders
Write-Host "Historical status: $($historical.StatusCode)"

Write-Step "GET /v1/finance/currencies?page=0&size=20"
$allRates = Invoke-Api -Method "GET" -Url "$BaseUrl/v1/finance/currencies?page=0&size=20" -Headers $authHeaders
Write-Host "All rates status: $($allRates.StatusCode)"

Write-Step "POST /v1/finance/investments"
$addInv = Invoke-Api -Method "POST" -Url "$BaseUrl/v1/finance/investments" -Headers $authHeaders -Body @{
    assetType = "stock"
    symbol = "AAPL"
    quantity = 2.5
    avgCostMinor = 19000
    currency = "USD"
}
Write-Host "Add investment status: $($addInv.StatusCode)"
$investmentId = $addInv.Json.data.id
if ([string]::IsNullOrWhiteSpace($investmentId)) {
    throw "Investment ID is empty."
}
Write-Host "InvestmentId: $investmentId"

Write-Step "GET /v1/finance/investments"
$listInv = Invoke-Api -Method "GET" -Url "$BaseUrl/v1/finance/investments?page=0&size=20" -Headers $authHeaders
Write-Host "List investments status: $($listInv.StatusCode)"

Write-Step "GET /v1/finance/investments/{id}"
$oneInv = Invoke-Api -Method "GET" -Url "$BaseUrl/v1/finance/investments/$investmentId" -Headers $authHeaders
Write-Host "Get investment status: $($oneInv.StatusCode)"

Write-Step "PUT /v1/finance/investments/{id}/price?avgCostMinor=20500"
$updInv = Invoke-Api -Method "PUT" -Url "$BaseUrl/v1/finance/investments/$investmentId/price?avgCostMinor=20500" -Headers $authHeaders
Write-Host "Update investment status: $($updInv.StatusCode)"

Write-Step "GET /v1/finance/investments/total"
$total = Invoke-Api -Method "GET" -Url "$BaseUrl/v1/finance/investments/total" -Headers $authHeaders
Write-Host "Total status: $($total.StatusCode)"
Write-Host "Total value: $($total.Json.data)"

Write-Step "GET /v1/finance/investments/performance"
$perf = Invoke-Api -Method "GET" -Url "$BaseUrl/v1/finance/investments/performance" -Headers $authHeaders
Write-Host "Performance status: $($perf.StatusCode)"

Write-Step "DELETE /v1/finance/investments/{id}"
$delInv = Invoke-Api -Method "DELETE" -Url "$BaseUrl/v1/finance/investments/$investmentId" -Headers $authHeaders
Write-Host "Delete investment status: $($delInv.StatusCode)"

Write-Host ""
Write-Host "Finance endpoint tests completed." -ForegroundColor Green
