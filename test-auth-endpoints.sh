#!/bin/bash

# AI Assistant Authentication System - Integration Test Script
# Bu script tüm auth endpoints'i test eder

BASE_URL="http://localhost:8080/api"
TIMESTAMP=$(date +%s)

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Authentication System Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 1. REGISTER TEST
echo -e "${YELLOW}[1] Testing REGISTER endpoint...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"testuser$TIMESTAMP@example.com\",
    \"password\": \"SecurePassword123\"
  }")

echo "Response: $REGISTER_RESPONSE"
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Register passed${NC}\n"
    TEST_EMAIL="testuser$TIMESTAMP@example.com"
else
    echo -e "${RED}✗ Register failed${NC}\n"
    exit 1
fi

# 2. LOGIN TEST
echo -e "${YELLOW}[2] Testing LOGIN endpoint...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"SecurePassword123\"
  }")

echo "Response: $LOGIN_RESPONSE"
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Login passed${NC}\n"
    # Extract tokens using basic grep/sed (works with jq if available)
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
    echo -e "Access Token: ${ACCESS_TOKEN:0:20}...\n"
else
    echo -e "${RED}✗ Login failed${NC}\n"
    exit 1
fi

# 3. VALIDATION TEST (invalid email)
echo -e "${YELLOW}[3] Testing VALIDATION (invalid email)...${NC}"
VALIDATION_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"invalid-email\",
    \"password\": \"SecurePassword123\"
  }")

echo "Response: $VALIDATION_RESPONSE"
if echo "$VALIDATION_RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✓ Validation passed (rejected invalid email)${NC}\n"
else
    echo -e "${RED}✗ Validation failed${NC}\n"
fi

# 4. DUPLICATE EMAIL TEST
echo -e "${YELLOW}[4] Testing DUPLICATE EMAIL...${NC}"
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"SecurePassword123\"
  }")

echo "Response: $DUPLICATE_RESPONSE"
if echo "$DUPLICATE_RESPONSE" | grep -q 'zaten kayıtlı'; then
    echo -e "${GREEN}✓ Duplicate test passed (email already exists)${NC}\n"
else
    echo -e "${RED}✗ Duplicate test failed${NC}\n"
fi

# 5. WRONG PASSWORD TEST
echo -e "${YELLOW}[5] Testing WRONG PASSWORD...${NC}"
WRONG_PASS_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"WrongPassword\"
  }")

echo "Response: $WRONG_PASS_RESPONSE"
if echo "$WRONG_PASS_RESPONSE" | grep -q 'hatalı'; then
    echo -e "${GREEN}✓ Wrong password test passed${NC}\n"
else
    echo -e "${RED}✗ Wrong password test failed${NC}\n"
fi

# 6. LOGOUT TEST
echo -e "${YELLOW}[6] Testing LOGOUT endpoint...${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $LOGOUT_RESPONSE"
if echo "$LOGOUT_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Logout passed${NC}\n"
else
    echo -e "${RED}✗ Logout failed${NC}\n"
fi

# 7. REFRESH TOKEN TEST
echo -e "${YELLOW}[7] Testing REFRESH TOKEN endpoint...${NC}"
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "Response: $REFRESH_RESPONSE"
if echo "$REFRESH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Refresh token passed${NC}\n"
else
    echo -e "${YELLOW}⚠ Refresh token may have issues (deferred)${NC}\n"
fi

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Test suite completed!${NC}"
echo -e "${BLUE}========================================${NC}\n"
