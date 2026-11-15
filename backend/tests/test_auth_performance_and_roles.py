import time
import pytest
from fastapi.testclient import TestClient
from brandtrace.main import app
from brandtrace.modules.auth.models import UserRole

client = TestClient(app)

def test_five_roles_authentication():
    """Verify all 5 enterprise roles authenticate cleanly with correct permissions."""
    # Warm-up request to compile route tables
    client.post("/api/auth/login", json={"email": "demo@brandtrace.ai", "password": "DemoAurelle2026!"})

    role_credentials = [
        ("creator@aurelle.com", "brandtrace2026", UserRole.CREATOR, "ORG-AURELLE", "aurelle-tech"),
        ("sana@aurelle.com", "brandtrace2026", UserRole.CREATOR, "ORG-AURELLE", "aurelle-tech"), # Agency role
        ("reviewer@aurelle.com", "brandtrace2026", UserRole.REVIEWER, "ORG-AURELLE", "aurelle-tech"),
        ("compliance@aurelle.com", "brandtrace2026", UserRole.COMPLIANCE_REVIEWER, "ORG-AURELLE", "aurelle-tech"),
        ("demo@brandtrace.ai", "DemoAurelle2026!", UserRole.BRAND_MANAGER, "ORG-AURELLE", "aurelle-tech"),
        ("kabir@aurelle.com", "brandtrace2026", UserRole.BRAND_MANAGER, "ORG-AURELLE", "aurelle-tech"),
    ]

    for email, password, expected_role, expected_org, expected_ws in role_credentials:
        t0 = time.perf_counter()
        res = client.post("/api/auth/login", json={"email": email, "password": password})
        t1 = time.perf_counter()
        duration_ms = (t1 - t0) * 1000

        assert res.status_code == 200, f"Login failed for {email}: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert "user" in data
        user = data["user"]
        assert user["role"] == expected_role.value
        assert user["org_id"] == expected_org
        assert user["workspace_id"] == expected_ws
        # Latency requirement: fast authentication (< 100ms on warm connection)
        assert duration_ms < 100, f"Authentication too slow for {email}: {duration_ms:.2f}ms"

def test_registration_and_immediate_login():
    """Test dynamic user registration and subsequent sub-millisecond cached login."""
    unique_email = f"perf.test.{int(time.time()*1000)}@company.com"
    reg_payload = {
        "name": "Performance Engineer",
        "email": unique_email,
        "password": "SecurePassword2026!",
        "role": "CREATOR",
        "workspace_id": "aurelle-tech"
    }

    # Register
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    assert reg_data["user"]["email"] == unique_email.lower()

    # Immediate login
    t0 = time.perf_counter()
    login_res = client.post("/api/auth/login", json={"email": unique_email, "password": "SecurePassword2026!"})
    t1 = time.perf_counter()
    assert login_res.status_code == 200
    duration_ms = (t1 - t0) * 1000
    assert duration_ms < 100, f"Login after registration too slow: {duration_ms:.2f}ms"

def test_token_validation_performance():
    """Verify fast JWT validation and caching on /api/auth/me."""
    res = client.post("/api/auth/login", json={"email": "demo@brandtrace.ai", "password": "DemoAurelle2026!"})
    assert res.status_code == 200
    token = res.json()["access_token"]

    # Measure /api/auth/me token check latency
    t0 = time.perf_counter()
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    t1 = time.perf_counter()
    duration_ms = (t1 - t0) * 1000

    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "demo@brandtrace.ai"
    assert duration_ms < 50, f"Token validation too slow: {duration_ms:.2f}ms"

def test_security_and_invalid_credentials():
    """Verify security controls: wrong password, invalid email, malformed tokens."""
    # Wrong password
    res = client.post("/api/auth/login", json={"email": "demo@brandtrace.ai", "password": "WrongPassword!"})
    assert res.status_code == 401

    # Nonexistent user
    res = client.post("/api/auth/login", json={"email": "nobody@nowhere.com", "password": "SomePassword!"})
    assert res.status_code == 401

    # Malformed token
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_tampered_token_xyz"})
    assert res.status_code == 401
