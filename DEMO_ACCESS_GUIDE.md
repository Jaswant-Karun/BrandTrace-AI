# BRANDTRACE AI — DEVELOPMENT & DEMONSTRATION ACCESS GUIDE

> [!IMPORTANT]
> **DEVELOPMENT & HACKATHON EVALUATION CREDENTIALS ONLY**  
> This guide documents the dedicated demo user configured for testing, judges' review, and end-to-end evaluation of the **AURELLE Technologies** enterprise governance lifecycle.

---

## 1. DEDICATED DEMO ACCOUNT

| Property | Configuration Value |
| :--- | :--- |
| **Email Address** | `demo@brandtrace.ai` |
| **Demo Password** | `DemoAurelle2026!` |
| **User Full Name** | Alex Mercer |
| **Assigned Persona** | VP Global Brand Governance |
| **Role (RBAC)** | `BRAND_MANAGER` |
| **Organization Tenant** | `ORG-AURELLE` (Aurelle Maison & Technologies Global) |
| **Active Workspace** | `aurelle-tech` (Aurelle Technologies Inc.) |
| **Authentication Endpoint** | `POST /api/auth/login` |
| **Token Type** | Signed JWT (`HS256`, 24-hour validity) |
| **Hashing Algorithm** | SHA-256 with constant-time HMAC comparison |

---

## 2. SECURITY & AUTHENTICATION ENFORCEMENT

1. **Real Authentication Gateway**:
   - Authentication is processed strictly via `POST /api/auth/login`.
   - The password `DemoAurelle2026!` is salted and hashed using `brandtrace.core.security.hash_password`.
2. **Strict Verification**:
   - Passing an incorrect password (e.g. `wrong-password`) yields `HTTP 401 Unauthorized` with detail `"Invalid credentials"`.
   - No hardcoded bypass or unauthorized mock persona fallback is used.
3. **Tenant & Role-Based Access Control**:
   - This account is scoped to `ORG-AURELLE` / `aurelle-tech`.
   - Holds `BRAND_MANAGER` privileges, enabling fact mutation, simulation triggering, and content verification.
   - For statutory sign-offs requiring compliance review, the user can easily switch to `David Sterling (COMPLIANCE_REVIEWER)` via the one-click persona switcher in the header.

---

## 3. HOW TO LOG IN & RUN THE AURELLE DEMONSTRATION

### Option A: Interactive Web UI Login
1. Open the BrandTrace AI application in your browser (`http://localhost:5173`).
2. If presented with the Login View:
   - Enter `demo@brandtrace.ai` in the email field.
   - Enter `DemoAurelle2026!` in the password field.
   - Click **Sign In with Demo Credentials** (or click the **1-Click Quick Demo Login** card).
3. The application will authenticate against `/api/auth/login`, store the JWT in `localStorage`, and redirect into the **Aurelle Technologies (`aurelle-tech`)** workspace.

### Option B: Direct API Authentication (cURL / PowerShell)
```powershell
curl -X POST "http://localhost:8000/api/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email": "demo@brandtrace.ai", "password": "DemoAurelle2026!"}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in_hours": 24,
  "user": {
    "user_id": "USR-DEMO-AURELLE",
    "email": "demo@brandtrace.ai",
    "name": "Alex Mercer, VP Global Brand Governance",
    "role": "BRAND_MANAGER",
    "org_id": "ORG-AURELLE",
    "workspace_id": "aurelle-tech"
  }
}
```

---

## 4. OTHER PRE-SEEDED PERSONAS FOR RBAC TESTING

| Email | Name | Role | Workspace |
| :--- | :--- | :--- | :--- |
| `admin@aurelle.com` | Sarah Chen | `ADMIN` | `aurelle-tech` |
| `compliance@aurelle.com` | David Sterling | `COMPLIANCE_REVIEWER` | `aurelle-tech` |
| `creator@aurelle.com` | Maya Lin | `CREATOR` | `aurelle-tech` |
| `reviewer@aurelle.com` | Marcus Aurelius | `REVIEWER` | `aurelle-tech` |

*Password for secondary pre-seeded personas: `brandtrace2026`*

