# 🧪 Quick Testing Guide - Production Audit Fixes

## Table of Contents
1. [Build & Run](#build--run)
2. [Test Input Validation](#test-input-validation)
3. [Test CORS Configuration](#test-cors-configuration)
4. [Check Logging](#check-logging)
5. [Frontend Integration](#frontend-integration)

---

## Build & Run

### Step 1: Clean Build
```bash
cd d:\Downloads\Ai_asistan\backend
mvnw clean package
```

### Step 2: Start the Backend
```bash
mvnw spring-boot:run
```

Should see output:
```
Tomcat started on port(s): 8080
AI Asistan Backend is running...
```

---

## Test Input Validation

### Test 1: Invalid Email (Should Fail ❌ → 400)
```bash
curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "notanemail", "password": "ValidPass123!"}'
```

**Expected Response:**
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Geçerli bir email adresi girin"
  }
}
```

---

### Test 2: Weak Password (Should Fail ❌ → 400)
```bash
curl -X POST http://localhost:8080/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "weak"}'
```

**Expected Response:**
```json
{
  "error": "Validation failed",
  "details": {
    "password": "Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermeli"
  }
}
```

---

### Test 3: Valid Registration (Should Pass ✅ → 200)
```bash
curl -X POST http://localhost:8080/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "ValidPass123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "email": "test@example.com",
    "message": "Kullanıcı başarıyla kaydedildi!"
  }
}
```

---

### Test 4: Valid Login (Should Pass ✅ → 200)
```bash
curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "ValidPass123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5...",
    "email": "test@example.com"
  }
}
```

---

## Test CORS Configuration

### From React Application (localhost:3000)

Create a test file `test-cors.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>CORS Test</title>
</head>
<body>
    <h1>Testing CORS</h1>
    <button onclick="testLogin()">Test Login</button>
    <pre id="response"></pre>

    <script>
    function testLogin() {
        fetch('http://localhost:8080/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'ValidPass123!'
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('response').textContent = JSON.stringify(data, null, 2);
            console.log('✅ CORS works! Token:', data.data.accessToken.substring(0, 50) + '...');
        })
        .catch(error => {
            document.getElementById('response').textContent = '❌ Error: ' + error.message;
            console.error('Error:', error);
        });
    }
    </script>
</body>
</html>
```

Open in browser at `http://localhost:3000/test-cors.html` and click "Test Login"

**Expected Result:** Should see token in response (✅ CORS fixed!)

---

## Check Logging

### View Application Logs

#### In IDE Console (while running)
You should see logs like:
```
2025-02-10 15:45:23.567 INFO  AuthService - Login attempt for email: test@example.com
2025-02-10 15:45:23.892 INFO  AuthService - Login successful for email: test@example.com
2025-02-10 15:45:24.123 DEBUG JwtService - Access token generated
```

#### Check Log Levels
Three types of logs used:
- ✅ **INFO** - Successful operations (login, register, refresh, logout)
- ⚠️ **WARN** - Failed operations (wrong password, user not found, invalid token)
- 🔴 **ERROR** - Critical issues (database errors, hashing errors)
- 🔍 **DEBUG** - Detailed operations (token validation steps)

### Configure Logging Output

Edit `application.yml`:
```yaml
logging:
  level:
    # Only see our app's logs
    com.aiasistan: INFO
    # Hide Spring framework noise
    org.springframework: WARN
    org.springframework.security: WARN
  # Optional: Save to file
  file:
    name: logs/app.log
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

---

## Frontend Integration

### React Example (TypeScript)

```typescript
// authService.ts
export class AuthService {
  private apiUrl = 'http://localhost:8080/v1/auth';

  async login(email: string, password: string) {
    const response = await fetch(`${this.apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const { data } = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  }

  async register(email: string, password: string) {
    const response = await fetch(`${this.apiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      // Validation error details
      if (error.details) {
        Object.entries(error.details).forEach(([field, message]) => {
          console.error(`${field}: ${message}`);
        });
      }
      throw new Error(error.message);
    }

    return await response.json();
  }

  async logout(accessToken: string) {
    const response = await fetch(`${this.apiUrl}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    return await response.json();
  }
}
```

### Usage in React Component

```typescript
// LoginComponent.tsx
import { useState } from 'react';
import { AuthService } from './authService';

export function LoginComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const authService = new AuthService();

  const handleLogin = async () => {
    try {
      setError('');
      const data = await authService.login(email, password);
      console.log('✅ Login successful:', data.email);
      // Redirect to dashboard
    } catch (err) {
      setError(err.message);  // Shows validation errors
    }
  };

  return (
    <form onSubmit={e => { e.preventDefault(); handleLogin(); }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password (min 8 chars: uppercase, lowercase, digit, special char)"
      />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## Validation Error Examples

### Email Validation Errors

| Input | Error Message |
|-------|---------------|
| `notanemail` | "Geçerli bir email adresi girin" |
| `` (empty) | "Email boş olamaz" |
| `user@` | "Geçerli bir email adresi girin" |

### Password Validation Errors (Register Only)

| Input | Error |
|-------|-------|
| `weak` | "Şifre en az 8 karakter olmalı" AND "Şifre en az bir büyük harf..." |
| `NoDigits!` | "Şifre en az bir rakam içermeli" |
| `noupppercase123!` | "Şifre en az bir büyük harf içermeli" |
| `ONLYUPPERCASE1!` | "Şifre en az bir küçük harf içermeli" |
| `ValidPass123` | "Şifre özel karakter içermeli" |
| `ValidPass123!` | ✅ ACCEPTED |

---

## Summary Checklist

- [ ] Backend compiles without errors (`mvnw clean package`)
- [ ] Backend starts without errors (`mvnw spring-boot:run`)
- [ ] Invalid email rejected with 400 error ✅
- [ ] Weak password rejected with 400 error ✅
- [ ] Valid credentials accepted with tokens ✅
- [ ] CORS allows requests from localhost:3000 ✅
- [ ] Logging shows detailed auth events ✅
- [ ] Frontend can call backend API ✅

---

## Troubleshooting

### CORS Still Showing Errors?
```bash
# Clear browser cache and check SecurityConfig for correct origins
# Make sure backend runs on http://localhost:8080 (not https)
```

### Validation Not Working?
```bash
# Ensure AuthController has @Valid annotation on @RequestBody
# Check GlobalExceptionHandler handles MethodArgumentNotValidException
```

### Logs Not Showing?
```yaml
# Check application.yml logging level
logging:
  level:
    com.aiasistan: DEBUG  # Show all levels
```

### Build Fails?
```bash
# Clear Maven cache
mvnw clean
# Ensure Java 21+ is installed
java -version
```

---

**Status:** ✅ All fixes ready for testing  
**Next Steps:** Test with frontend, then deploy to staging
