"""
BrandTrace AI — Public Verification Portal Test Suite
Tests zero-auth public verification for seals, text, and images:
- Valid issued seal
- Unknown seal
- Modified content
- Unchanged approved content
- Superseded release
- Revoked release
- Exact image hash match
- Modified image
- Invalid image upload
- Oversized requests
- Cross-tenant access attempts
- Rate limiting
- No sensitive metadata leakage
"""
import io
import time
import hashlib
import pytest
from PIL import Image
from starlette.testclient import TestClient

from brandtrace.main import app
from brandtrace.engine.audit_ledger import audit_ledger_engine
from brandtrace.modules.public_verification.router import ensure_baseline_ledger

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_ledger():
    ensure_baseline_ledger()

# -----------------------------------------------------------------------------
# 1. VALID ISSUED SEAL
# -----------------------------------------------------------------------------
def test_valid_issued_seal():
    # Retrieve an approved record from the ledger
    rec = next(r for r in audit_ledger_engine.records.values() if r.resource_id == "AST-01" and not r.is_revoked and not r.is_superseded)
    seal_code = rec.tamper_evident_seal

    resp = client.post("/api/public/verify-seal", json={"seal_code": seal_code})
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "APPROVED"
    assert data["is_authentic"] is True
    assert data["ledger_state"] == "VALID_UNCHANGED"
    assert data["seal_code"] == seal_code
    assert data["approved_version"] == "v1.0"
    assert data["recorded_hash"] is not None
    assert "Cryptographic seal verified" in data["explanation"]

# -----------------------------------------------------------------------------
# 2. UNKNOWN SEAL
# -----------------------------------------------------------------------------
def test_unknown_seal():
    resp = client.post("/api/public/verify-seal", json={"seal_code": "BT-SEAL-FAKE-9999-XXXX"})
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "UNKNOWN"
    assert data["is_authentic"] is False
    assert data["ledger_state"] == "UNKNOWN_RECORD"
    assert data["recorded_hash"] is None
    assert "Unknown Record" in data["explanation"]

# -----------------------------------------------------------------------------
# 3. MODIFIED CONTENT (SEAL + ALTERED TEXT)
# -----------------------------------------------------------------------------
def test_modified_content_with_seal():
    rec = next(r for r in audit_ledger_engine.records.values() if r.resource_id == "AST-01")
    seal_code = rec.tamper_evident_seal
    # Alter the approved text
    altered_text = "519 Miles of Compromise. Altered headline."

    resp = client.post("/api/public/verify-seal", json={
        "seal_code": seal_code,
        "content_text": altered_text
    })
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "MODIFIED"
    assert data["is_authentic"] is False
    assert data["ledger_state"] == "MODIFIED_AFTER_APPROVAL"
    assert data["computed_hash"] != data["recorded_hash"]
    assert "Modified After Approval" in data["explanation"]

# -----------------------------------------------------------------------------
# 4. UNCHANGED APPROVED CONTENT (TEXT VERIFICATION)
# -----------------------------------------------------------------------------
def test_unchanged_approved_content_text():
    rec = next(r for r in audit_ledger_engine.records.values() if r.resource_id == "AST-01")
    approved_text = rec.content_payload

    # Exact text
    resp = client.post("/api/public/verify-text", json={"content_text": approved_text})
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "APPROVED"
    assert data["is_authentic"] is True
    assert data["ledger_state"] == "VALID_UNCHANGED"
    assert data["seal_code"] == rec.tamper_evident_seal

    # Canonical text: same words, but extra spaces and curly quotes
    canonical_variant = approved_text.replace("Zero", "“Zero”").replace("  ", "   ")
    resp_canon = client.post("/api/public/verify-text", json={"content_text": canonical_variant})
    assert resp_canon.status_code == 200
    assert resp_canon.json()["status"] == "APPROVED"

# -----------------------------------------------------------------------------
# 5. SUPERSEDED RELEASE
# -----------------------------------------------------------------------------
def test_superseded_release():
    rec = next(r for r in audit_ledger_engine.records.values() if r.resource_id == "AST-AUR-HIST-01")
    seal_code = rec.tamper_evident_seal

    resp = client.post("/api/public/verify-seal", json={"seal_code": seal_code})
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "OUTDATED"
    assert data["is_authentic"] is False
    assert data["ledger_state"] == "SUPERSEDED"
    assert "superseded" in data["explanation"].lower()

# -----------------------------------------------------------------------------
# 6. REVOKED RELEASE
# -----------------------------------------------------------------------------
def test_revoked_release():
    rec = next(r for r in audit_ledger_engine.records.values() if r.resource_id == "AST-AUR-RECALLED")
    seal_code = rec.tamper_evident_seal

    resp = client.post("/api/public/verify-seal", json={"seal_code": seal_code})
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "OUTDATED"
    assert data["is_authentic"] is False
    assert data["ledger_state"] == "REVOKED"
    assert "revoked" in data["explanation"].lower()

# -----------------------------------------------------------------------------
# 7. EXACT IMAGE HASH MATCH
# -----------------------------------------------------------------------------
def test_exact_image_hash_match():
    # Create a small valid test PNG image
    img = Image.new("RGB", (20, 20), color=(10, 50, 150))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()
    img_hash = hashlib.sha256(img_bytes).hexdigest()

    # Seal this image in the ledger
    rec = audit_ledger_engine.record_release(
        user_identity="David Sterling, CGO",
        user_role="COMPLIANCE_REVIEWER",
        resource_id="IMG-APEX-LOGO-01",
        resource_type="IMAGE",
        content=img_hash,
        approved_version="v1.0"
    )

    resp = client.post(
        "/api/public/verify-image",
        files={"file": ("apex_badge.png", img_bytes, "image/png")}
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "APPROVED"
    assert data["is_authentic"] is True
    assert data["ledger_state"] == "VALID_UNCHANGED"
    assert data["computed_hash"] == img_hash
    assert data["verification_method"] == "EXACT_SHA256_FILE_HASH"
    assert data["seal_code"] == rec.tamper_evident_seal

# -----------------------------------------------------------------------------
# 8. MODIFIED IMAGE (SEAL HASH MISMATCH)
# -----------------------------------------------------------------------------
def test_modified_image_with_seal():
    # Registered image
    img1 = Image.new("RGB", (20, 20), color=(10, 50, 150))
    buf1 = io.BytesIO()
    img1.save(buf1, format="PNG")
    img1_bytes = buf1.getvalue()
    img1_hash = hashlib.sha256(img1_bytes).hexdigest()

    rec = audit_ledger_engine.record_release(
        user_identity="Marcus Aurelius",
        user_role="REVIEWER",
        resource_id="IMG-AUR-SEALED",
        resource_type="IMAGE",
        content=img1_hash,
        approved_version="v1.0"
    )

    # Modified image (different pixel color)
    img2 = Image.new("RGB", (20, 20), color=(250, 20, 20))
    buf2 = io.BytesIO()
    img2.save(buf2, format="PNG")
    img2_bytes = buf2.getvalue()

    resp = client.post(
        "/api/public/verify-image",
        files={"file": ("tampered_asset.png", img2_bytes, "image/png")},
        data={"seal_code": rec.tamper_evident_seal}
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "MODIFIED"
    assert data["is_authentic"] is False
    assert data["ledger_state"] == "MODIFIED_AFTER_APPROVAL"
    assert data["verification_method"] == "SEAL_HASH_MISMATCH"
    assert "Modified After Approval" in data["explanation"]
    assert "exact byte-level SHA-256 ledger match" in data["disclaimer"]

# -----------------------------------------------------------------------------
# 9. INVALID IMAGE UPLOADS (CORRUPTED SIGNATURE & FORBIDDEN EXTENSIONS)
# -----------------------------------------------------------------------------
def test_invalid_image_upload_magic_bytes_and_extensions():
    # 9a. Text disguised as PNG
    fake_png = b"This is not a real PNG image content."
    resp1 = client.post(
        "/api/public/verify-image",
        files={"file": ("fake.png", fake_png, "image/png")}
    )
    assert resp1.status_code == 400
    assert "Invalid image signature" in resp1.json()["detail"]

    # 9b. Disallowed extension
    resp2 = client.post(
        "/api/public/verify-image",
        files={"file": ("script.sh", b"echo evil", "text/plain")}
    )
    assert resp2.status_code in [400, 415]

# -----------------------------------------------------------------------------
# 10. OVERSIZED REQUESTS
# -----------------------------------------------------------------------------
def test_oversized_requests():
    # Text > 100KB
    giant_text = "A" * 100005
    resp = client.post("/api/public/verify-text", json={"content_text": giant_text})
    assert resp.status_code == 413
    assert "exceeds" in resp.json()["detail"]

    # Image > 25MB (test headers/size validation without allocating 25MB in memory)
    # Using 0-byte file check
    resp_empty = client.post(
        "/api/public/verify-image",
        files={"file": ("empty.png", b"", "image/png")}
    )
    assert resp_empty.status_code == 400

# -----------------------------------------------------------------------------
# 11. CROSS-TENANT / INFORMATION LEAKAGE PREVENTION
# -----------------------------------------------------------------------------
def test_cross_tenant_enumeration_and_safe_output():
    # Query non-existent tenant with random seal
    resp = client.post("/api/public/verify-seal", json={
        "seal_code": "BT-SEAL-UNKNOWN-555",
        "brand_id": "non-existent-co"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "UNKNOWN"
    # Does not throw 500 or leak tenant internal existence

# -----------------------------------------------------------------------------
# 12. RATE LIMITING ON PUBLIC VERIFICATION
# -----------------------------------------------------------------------------
def test_rate_limiting_public_verification():
    # Uses standard X-Test-Rate-Limit header tested across BrandTrace
    for i in range(3):
        resp = client.post(
            "/api/public/verify-seal",
            json={"seal_code": "BT-SEAL-TEST"},
            headers={"X-Test-Rate-Limit": "2", "X-Client-ID": "test-ratelimit-public-seal"}
        )
        if i >= 2:
            assert resp.status_code == 429
            assert resp.json()["status"] == "RATE_LIMITED"

# -----------------------------------------------------------------------------
# 13. NO SENSITIVE METADATA LEAKAGE
# -----------------------------------------------------------------------------
def test_no_sensitive_metadata_leakage():
    rec = next(r for r in audit_ledger_engine.records.values() if r.resource_id == "AST-01")
    resp = client.post("/api/public/verify-seal", json={"seal_code": rec.tamper_evident_seal})
    assert resp.status_code == 200
    data = resp.json()

    # Verify that NO confidential internal fields are exposed
    forbidden_keys = [
        "reviewer", "reviewer_role", "user_identity", "user_role", "org_id",
        "organisation_id", "workspace_id", "review_notes", "relevant_sources",
        "_id", "internal_audit_id", "mongo_id", "secret", "token"
    ]
    for key in forbidden_keys:
        assert key not in data, f"Confidential field '{key}' leaked in public response!"

