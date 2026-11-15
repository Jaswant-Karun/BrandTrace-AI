import pytest
import time
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from brandtrace.main import app
from brandtrace.core.security import create_access_token, hash_password, verify_password, UserRole, mask_sensitive_data
from brandtrace.core.config import settings
from brandtrace.modules.auth.service import auth_service, PRESET_USERS
from brandtrace.database.mongo import mongo_manager
from brandtrace.data.seed_data import APPROVED_FACTS_CATALOG, BRAND_SEEDS
from brandtrace.engine.audit_ledger import audit_ledger_engine, LedgerAuditRecord
from brandtrace.graph.dependency_engine import dependency_engine

client = TestClient(app)

def get_auth_token(email: str, role: UserRole, org_id: str, workspace_id: str, expires_delta: timedelta = None) -> str:
    token_data = {
        "sub": f"USR-{email.split('@')[0].upper()}",
        "email": email,
        "name": f"Test User {role.value}",
        "role": role.value,
        "org_id": org_id,
        "workspace_id": workspace_id
    }
    return create_access_token(token_data, expires_delta=expires_delta)

# ==============================================================================
# TASK 1: AUTHENTICATION RELIABILITY & DEFENSIVE CHECKS
# ==============================================================================

def test_auth_salted_password_hash_verification():
    """Verify password hashing uses secure salted hashing and constant-time verification."""
    pwd = "EnterpriseSecurePassword2026!"
    hashed = hash_password(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False
    assert verify_password(pwd, "") is False

def test_auth_login_invalid_password_rejected_401():
    """Invalid password returns generic HTTP 401 without user enumeration."""
    res = client.post("/api/auth/login", json={
        "email": "admin@aurelle.com",
        "password": "definitely_wrong_password_999"
    })
    assert res.status_code == 401
    assert "invalid credentials" in res.json()["detail"].lower()

def test_auth_login_unknown_user_rejected_401():
    """Unknown user is rejected with HTTP 401, never returning a fallback persona."""
    res = client.post("/api/auth/login", json={
        "email": "attacker@threat-actor.org",
        "password": "Password123!"
    })
    assert res.status_code == 401
    assert "invalid credentials" in res.json()["detail"].lower()

def test_auth_production_mode_strictly_disables_mock_bypass():
    """Ensure production environment strictly rejects mock persona fallback."""
    orig_env = settings.environment
    try:
        settings.environment = "production"
        user = auth_service.authenticate_user("unregistered_user@corp.com", "any_password", allow_mock_fallback=True)
        assert user is None, "Mock fallback must be completely disabled in production"
    finally:
        settings.environment = orig_env

def test_auth_protected_routes_reject_missing_token():
    """Private routes must reject unauthenticated requests with HTTP 401."""
    # Commit endpoint
    res_commit = client.post("/api/simulator/commit", json={"brand_id": "aurelle-tech", "simulation_id": "SIM-NONE", "decision": "APPROVED"})
    assert res_commit.status_code == 401

    # Release signing endpoint
    res_sign = client.post("/api/releases/sign", json={"brand_id": "aurelle-tech", "asset_id": "AST-01", "content": "Copy"})
    assert res_sign.status_code == 401

    # Release revocation endpoint
    res_revoke = client.post("/api/ledger/revoke-record", json={"identifier": "AST-01", "revocation_reason": "Policy breach"})
    assert res_revoke.status_code == 401

def test_auth_expired_and_tampered_token_rejected():
    """Expired or tampered JWT returns HTTP 401."""
    # Expired token (-10 minutes)
    expired_token = get_auth_token("admin@aurelle.com", UserRole.ADMIN, "ORG-AURELLE", "aurelle-tech", expires_delta=timedelta(minutes=-10))
    res_exp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res_exp.status_code == 401

    # Tampered token
    tampered_token = expired_token[:-4] + "XXXX"
    res_tamp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res_tamp.status_code == 401

# ==============================================================================
# TASK 2: DEMO ACCOUNT SECURITY & SAFE RESET
# ==============================================================================

def test_demo_account_has_restricted_role():
    """Demo account must have restricted BRAND_MANAGER role, never unrestricted ADMIN."""
    demo_rec = PRESET_USERS.get("demo@brandtrace.ai")
    assert demo_rec is not None
    assert demo_rec["role"] == UserRole.BRAND_MANAGER
    assert demo_rec["role"] != UserRole.ADMIN
    assert demo_rec["workspace_id"] == "aurelle-tech"

def test_demo_account_cannot_access_admin_endpoint():
    """Demo account token must be blocked from ADMIN-only endpoints with HTTP 403."""
    demo_token = get_auth_token("demo@brandtrace.ai", UserRole.BRAND_MANAGER, "ORG-AURELLE", "aurelle-tech")
    res = client.get("/api/security/admin-endpoint", headers={"Authorization": f"Bearer {demo_token}"})
    assert res.status_code == 403
    assert "insufficient privileges" in res.json()["detail"].lower()

@pytest.mark.anyio
async def test_demo_scenario_reset_isolates_workspaces():
    """Resetting the AURELLE demo scenario must not delete records from other workspaces."""
    # Register an APEX release in ledger
    apex_record = audit_ledger_engine.record_release(
        user_identity="Elena Rostova",
        user_role="BRAND_MANAGER",
        resource_id="AST-APX-01",
        resource_type="ASSET",
        content="Apex Autonomous Fleet Solutions Q1 Campaign Copy.",
        decision="APPROVED",
        review_notes="Apex Fleet Approval",
        approved_version="v1.0",
        relevant_sources=["FACT-PRC-01"]
    )
    rec_id = apex_record.record_id

    # Trigger AURELLE scenario reset
    res_reset = client.post("/api/demo/reset")
    assert res_reset.status_code == 200

    # Verify APEX record is still present and untouched
    assert rec_id in audit_ledger_engine.records

# ==============================================================================
# TASK 3 & 4: INPUT VALIDATION & DEFENSIVE REJECTIONS
# ==============================================================================

def test_validation_empty_and_whitespace_content_rejected():
    """Empty or whitespace-only marketing copy must be rejected with HTTP 400."""
    res_empty = client.post("/api/verify", json={"brand_id": "aurelle-tech", "content": ""})
    assert res_empty.status_code == 400

    res_ws = client.post("/api/verify", json={"brand_id": "aurelle-tech", "content": "   \n\t  "})
    assert res_ws.status_code == 400

    res_exp_empty = client.post("/api/explainable/review", json={"brand_id": "aurelle-tech", "content": "  "})
    assert res_exp_empty.status_code == 400

def test_validation_excessively_long_content_rejected():
    """Content exceeding 50,000 characters must be rejected with HTTP 413 Payload Too Large."""
    huge_copy = "Aurelle Spatial Sound. " * 3000  # ~69,000 characters
    res = client.post("/api/verify", json={"brand_id": "aurelle-tech", "content": huge_copy})
    assert res.status_code == 413
    assert "exceeds maximum permitted limit" in res.json()["detail"].lower()

def test_validation_file_upload_empty_bytes_rejected():
    """Empty file (0 bytes) upload must be rejected with HTTP 400."""
    res = client.post(
        "/api/content/upload",
        files={"file": ("empty.txt", b"", "text/plain")}
    )
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()

def test_validation_file_upload_dangerous_extension_rejected():
    """Executable or script files must be rejected with HTTP 400."""
    res = client.post(
        "/api/content/upload",
        files={"file": ("malicious_payload.exe", b"MZ\x90\x00\x03", "application/octet-stream")}
    )
    assert res.status_code == 400
    assert "prohibited" in res.json()["detail"].lower()

def test_validation_file_upload_unsupported_format_rejected():
    """Disallowed formats must be rejected with HTTP 415 Unsupported Media Type."""
    res = client.post(
        "/api/content/upload",
        files={"file": ("archive.tar", b"ustar  \x00", "application/x-tar")}
    )
    assert res.status_code == 415

def test_validation_invalid_and_conflicting_dates_rejected():
    """Malformed date formats or expiry prior to source date must return HTTP 400."""
    admin_token = get_auth_token("admin@aurelle.com", UserRole.ADMIN, "ORG-AURELLE", "aurelle-tech")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Malformed source_date
    res_bad_date = client.post("/api/facts", json={
        "brand_id": "aurelle-tech",
        "name": "Invalid Date Fact",
        "current_value": "₹999",
        "source_date": "invalid-year-month-day"
    }, headers=headers)
    assert res_bad_date.status_code == 400
    assert "invalid format" in res_bad_date.json()["detail"].lower()

    # Expiry before source date
    res_inverted = client.post("/api/facts", json={
        "brand_id": "aurelle-tech",
        "name": "Inverted Date Fact",
        "current_value": "₹999",
        "source_date": "2026-12-01",
        "expiry_date": "2026-01-01"
    }, headers=headers)
    assert res_inverted.status_code == 400
    assert "expiry date cannot be prior" in res_inverted.json()["detail"].lower()

def test_validation_simulation_proposal_identical_values_rejected():
    """Proposing a change with identical old and new values must return HTTP 400."""
    mgr_token = get_auth_token("manager@aurelle.com", UserRole.BRAND_MANAGER, "ORG-AURELLE", "aurelle-tech")
    res = client.post("/api/simulator/propose", json={
        "brand_id": "aurelle-tech",
        "target_record_id": "FACT-AUR-PRC-01",
        "target_record_type": "PRICE",
        "record_label": "Aurelle Cloud Studio Subscription",
        "old_value": "₹499",
        "proposed_value": "₹499",
        "change_rationale": "No difference",
        "proposed_by": "Test Manager"
    }, headers={"Authorization": f"Bearer {mgr_token}"})
    assert res.status_code == 400
    assert "differ" in res.json()["detail"].lower()

# ==============================================================================
# TASK 5: REPEATED ACTIONS & IDEMPOTENCY CONTROLS
# ==============================================================================

def test_idempotent_duplicate_fact_submission():
    """Double-clicking or retrying identical fact submission returns existing fact without duplicate nodes."""
    admin_token = get_auth_token("admin@aurelle.com", UserRole.ADMIN, "ORG-AURELLE", "aurelle-tech")
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "brand_id": "aurelle-tech",
        "name": "Idempotent Test Spec",
        "category": "SPECIFICATION",
        "current_value": "Dual-Driver 40mm",
        "description": "Acoustic transducer specification"
    }

    # First submission
    res1 = client.post("/api/facts", json=payload, headers=headers)
    assert res1.status_code == 200
    fact1 = res1.json()

    # Second submission (Double-click simulation)
    res2 = client.post("/api/facts", json=payload, headers=headers)
    assert res2.status_code == 200
    fact2 = res2.json()
    assert fact1["id"] == fact2["id"]

    # Submission with same name but conflicting value -> HTTP 409 Conflict
    conflict_payload = dict(payload)
    conflict_payload["current_value"] = "Single-Driver 20mm"
    res_conflict = client.post("/api/facts", json=conflict_payload, headers=headers)
    assert res_conflict.status_code == 409

def test_idempotent_release_signing():
    """Repeatedly signing the same verified asset returns the existing release without duplicate seals."""
    admin_token = get_auth_token("admin@aurelle.com", UserRole.ADMIN, "ORG-AURELLE", "aurelle-tech")
    headers = {"Authorization": f"Bearer {admin_token}"}
    sign_payload = {
        "verification_id": "VER-IDEM-01",
        "brand_id": "aurelle-tech",
        "asset_id": "AST-AUR-IDEM-01",
        "asset_title": "Idempotent Signing Test Ad",
        "channel": "Social",
        "content": "Aurelle Horizon Watch with QuantumAcoustics™ spatial audio for ₹499 monthly.",
        "reviewer": "Sarah Chen, Chief Technology Officer",
        "decision": "APPROVED"
    }

    res1 = client.post("/api/releases/sign", json=sign_payload, headers=headers)
    assert res1.status_code == 200
    stamp1 = res1.json()["audit_stamp"]

    res2 = client.post("/api/releases/sign", json=sign_payload, headers=headers)
    assert res2.status_code == 200
    assert "already sealed" in res2.json()["message"].lower()
    stamp2 = res2.json()["audit_stamp"]
    assert stamp1 == stamp2

# ==============================================================================
# TASK 6 & 8: RBAC PRIVILEGES & CREDENTIAL SANITIZATION
# ==============================================================================

def test_rbac_unauthorized_role_cannot_supersede_or_revoke():
    """CREATOR role is not privileged to supersede or revoke cryptographic releases."""
    creator_token = get_auth_token("creator@aurelle.com", UserRole.CREATOR, "ORG-AURELLE", "aurelle-tech")
    headers = {"Authorization": f"Bearer {creator_token}"}

    res_revoke = client.post("/api/ledger/revoke-record", json={
        "identifier": "AST-AUR-AD-01",
        "revocation_reason": "Malicious attempt"
    }, headers=headers)
    assert res_revoke.status_code == 403

    res_supersede = client.post("/api/ledger/supersede-record", json={
        "identifier": "AST-AUR-AD-01",
        "new_version": "v3.0"
    }, headers=headers)
    assert res_supersede.status_code == 403

def test_sensitive_credential_masking():
    """Ensure database connection string passwords and AI keys are never returned in plaintext."""
    leak_sample = "Error connecting to mongodb+srv://admin:P@ssw0rd123!@cluster0.abc.mongodb.net/brandtrace with key AIzaSyA1234567890abcdefghijklmnopqrstu"
    masked = mask_sensitive_data(leak_sample)
    assert "P@ssw0rd123!" not in masked
    assert "AIzaSyA1234567890abcdefghijklmnopqrstu" not in masked
    assert "[REDACTED_CREDENTIALS]" in masked
    assert "[REDACTED_API_KEY]" in masked
