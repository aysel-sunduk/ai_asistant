@echo off
REM AI Assistant Authentication System - Integration Test Script (Windows)
REM Bu script tüm auth endpoints'i test eder

setlocal enabledelayedexpansion

set "BASE_URL=http://localhost:8080/api"
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set "TIMESTAMP=!mydate!!mytime!"

echo.
echo ========================================
echo   Authentication System Test Suite
echo ========================================
echo.

REM 1. REGISTER TEST
echo [1] Testing REGISTER endpoint...
set "TEST_EMAIL=testuser%TIMESTAMP%@example.com"

curl -s -X POST "%BASE_URL%/v1/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"%TEST_EMAIL%\", \"password\": \"SecurePassword123\"}" > register_response.json

echo Response:
type register_response.json
echo.

REM Check if register succeeded
findstr /I "success.*true" register_response.json >nul
if !errorlevel! equ 0 (
    echo [OK] Register passed
    echo.
) else (
    echo [FAIL] Register failed
    exit /b 1
)

REM 2. LOGIN TEST
echo [2] Testing LOGIN endpoint...

curl -s -X POST "%BASE_URL%/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"%TEST_EMAIL%\", \"password\": \"SecurePassword123\"}" > login_response.json

echo Response:
type login_response.json
echo.

findstr /I "success.*true" login_response.json >nul
if !errorlevel! equ 0 (
    echo [OK] Login passed
    echo.
) else (
    echo [FAIL] Login failed
    exit /b 1
)

REM Extract tokens (simple parsing - requires PowerShell for better extraction)
REM For now, show the response for manual token extraction
echo Note: Extract accessToken and refreshToken from response above for testing

REM 3. VALIDATION TEST (invalid email)
echo [3] Testing VALIDATION with invalid email...

curl -s -X POST "%BASE_URL%/v1/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"invalid-email\", \"password\": \"SecurePassword123\"}" > validation_response.json

echo Response:
type validation_response.json
echo.

findstr /I "success.*false" validation_response.json >nul
if !errorlevel! equ 0 (
    echo [OK] Validation passed (rejected invalid email)
    echo.
) else (
    echo [FAIL] Validation failed
)

REM 4. DUPLICATE EMAIL TEST
echo [4] Testing DUPLICATE EMAIL...

curl -s -X POST "%BASE_URL%/v1/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"%TEST_EMAIL%\", \"password\": \"SecurePassword123\"}" > duplicate_response.json

echo Response:
type duplicate_response.json
echo.

findstr /I "zaten" duplicate_response.json >nul
if !errorlevel! equ 0 (
    echo [OK] Duplicate test passed (email already exists)
    echo.
) else (
    echo [FAIL] Duplicate test failed
)

REM 5. WRONG PASSWORD TEST
echo [5] Testing WRONG PASSWORD...

curl -s -X POST "%BASE_URL%/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"%TEST_EMAIL%\", \"password\": \"WrongPassword\"}" > wrong_pass_response.json

echo Response:
type wrong_pass_response.json
echo.

findstr /I "hatali" wrong_pass_response.json >nul
if !errorlevel! equ 0 (
    echo [OK] Wrong password test passed
    echo.
) else (
    echo [FAIL] Wrong password test failed
)

echo.
echo ========================================
echo Test suite completed!
echo ========================================
echo.

REM Cleanup
del /Q register_response.json login_response.json validation_response.json duplicate_response.json wrong_pass_response.json >nul 2>&1

endlocal
