"""
BRANDTRACE AI — Round 3 Commitment 3 Test Suite
5-State Cryptographic Release Ledger & Tamper Verifier

Verifies:
1. Deterministic SHA-256 release seal generation upon authorized human sign-off (BT-SEAL-...).
2. Complete 5-State verification engine:
   - VALID_UNCHANGED: Authentic untouched content matching immutable SHA-256 ledger record.
   - MODIFIED_AFTER_APPROVAL: Tampered content flagged with cryptographic mismatch proof.
   - SUPERSEDED: Historical version formally replaced by newer approved version (e.g. v1.0 -> v2.0).
   - REVOKED: Compliance cancellation due to regulatory recall or statutory violation.
   - UNKNOWN_RECORD: Unregistered identifier or fabricated seal.
3. Server-side RBAC enforcement on signing, superseding, and revoking.
4. Duplicate sign-off prevention returning existing seal without duplicate ledger clutter.
5. Input validation rejecting empty content.
"""

import pytest
from starlette.testclient import TestClient
from brandtrace.main import app
from brandtrace.core.security import create_access_token
from brandtrace.engine.audit_ledger import ReleaseVerificationState

client = TestClient(app)

def get_auth_token(email: str, role: str, org_id: str = "ORG-AURELLE", workspace_id: str = "aurelle-tech") -> str:
    return create_access_token({
        "sub": f"USR-TEST-{role}",
        "email": email,
        "role": role,
        "org_id": org_id,
        "workspace_id": workspace_id,
        "name": f"Test User {role}"
    })


def test_commitment3_deterministic_sha256_release_sealing():
    """
    Commitment 3.1: Verify human sign-off generates a deterministic SHA-256 release seal (BT-SEAL-...)
    bound to reviewer, timestamp, and content hash.
    """
    token_reviewer = get_auth_token("marcus.aurelius@aurelle.com", "REVIEWER")
    headers = {"Authorization": f"Bearer {token_reviewer}"}

    payload = {
        "verification_id": "VRF-SEAL-TEST-01",
        "brand_id": "aurelle-tech",
        "asset_id": "AST-AUR-COMM3-01",
        "asset_title": "Aurelle Spatial Audio Master Launch",
        "channel": "Digital Launch Banner",
        "content": "Experience next-generation spatial computing with Aurelle Cloud Studio for ₹599 per month.",
        "reviewer": "Marcus Aurelius, Content Review Lead",
        "decision": "APPROVED"
    }

    res = client.post("/api/releases/sign", json=payload, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()

    assert data["status"] == "SEALED"
    release = data["release"]
    assert release["asset_id"] == "AST-AUR-COMM3-01"
    assert release["audit_stamp"].startswith("BT-SEAL-")
    assert len(release["content_hash"]) == 64, "content_hash must be valid 64-character SHA-256"
    assert release["reviewer"] == "Marcus Aurelius, Content Review Lead"


def test_commitment3_state_1_valid_unchanged():
    """
    Commitment 3.2: Verify State 1 (VALID_UNCHANGED): Content matches active ledger record.
    """
    valid_content = "Experience next-generation spatial computing with Aurelle Cloud Studio for ₹599 per month."
    res = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-COMM3-01",
        "content_to_test": valid_content
    })
    assert res.status_code == 200
    data = res.json()
    assert data["state"] == ReleaseVerificationState.VALID_UNCHANGED.value
    assert data["is_authentic"] is True
    assert "Valid & Unchanged" in data["explanation"]


def test_commitment3_state_2_modified_after_approval():
    """
    Commitment 3.3: Verify State 2 (MODIFIED_AFTER_APPROVAL): Tampered copy is flagged with hash mismatch.
    """
    tampered_content = "Experience next-generation spatial computing with Aurelle Cloud Studio for ₹399 per month (UNAUTHORIZED TAMPER)."
    res = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-COMM3-01",
        "content_to_test": tampered_content
    })
    assert res.status_code == 200
    data = res.json()
    assert data["state"] == ReleaseVerificationState.MODIFIED_AFTER_APPROVAL.value
    assert data["is_authentic"] is False
    assert data["computed_content_hash"] != data["recorded_content_hash"]
    assert "Modified After Approval" in data["explanation"] or "mismatch" in data["explanation"].lower()


def test_commitment3_state_3_superseded():
    """
    Commitment 3.4: Verify State 3 (SUPERSEDED): Historical release superseded by newer approved version.
    """
    token_manager = get_auth_token("julian.vance@aurelle.com", "BRAND_MANAGER")
    headers = {"Authorization": f"Bearer {token_manager}"}

    # First sign historical v1
    hist_payload = {
        "verification_id": "VRF-HIST-V1",
        "brand_id": "aurelle-tech",
        "asset_id": "AST-AUR-HIST-COMM3",
        "asset_title": "Aurelle Legacy Pricing Banner",
        "channel": "Web Banner",
        "content": "Aurelle Cloud Studio legacy tier for ₹499 per month.",
        "reviewer": "Julian Vance",
        "decision": "APPROVED"
    }
    sign_res = client.post("/api/releases/sign", json=hist_payload, headers=headers)
    assert sign_res.status_code == 200

    # Supersede it with v2.0
    sup_res = client.post("/api/ledger/supersede-record", json={
        "identifier": "AST-AUR-HIST-COMM3",
        "new_version": "v2.0",
        "superseded_by": "Julian Vance, VP Brand Governance"
    }, headers=headers)
    assert sup_res.status_code == 200
    assert sup_res.json()["status"] == "SUPERSEDED"

    # Verify state is SUPERSEDED
    v_res = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-HIST-COMM3"
    })
    assert v_res.status_code == 200
    data = v_res.json()
    assert data["state"] == ReleaseVerificationState.SUPERSEDED.value
    assert data["is_authentic"] is False
    assert "superseded" in data["explanation"].lower()
    assert "v2.0" in data["explanation"]


def test_commitment3_state_4_revoked():
    """
    Commitment 3.5: Verify State 4 (REVOKED): Release cancelled due to regulatory recall or policy breach.
    """
    token_compliance = get_auth_token("david.sterling@apex.com", "COMPLIANCE_REVIEWER")
    headers = {"Authorization": f"Bearer {token_compliance}"}

    # Sign asset with medical cure claim
    cure_payload = {
        "verification_id": "VRF-CURE-RECALL",
        "brand_id": "aurelle-tech",
        "asset_id": "AST-AUR-RECALL-COMM3",
        "asset_title": "Pulse Ring Medical Cure Ad",
        "channel": "Social Display",
        "content": "Aurelle Pulse Ring cures chronic cardiovascular heart conditions in 30 days.",
        "reviewer": "Compliance Lead",
        "decision": "APPROVED"
    }
    client.post("/api/releases/sign", json=cure_payload, headers=headers)

    # Officially revoke release
    rev_res = client.post("/api/ledger/revoke-record", json={
        "identifier": "AST-AUR-RECALL-COMM3",
        "revocation_reason": "Statutory recall: Violates FDA 21 CFR §870 Wellness Device Classification",
        "revoked_by": "David Sterling, Statutory Compliance Officer"
    }, headers=headers)
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "REVOKED"

    # Verify state is REVOKED
    v_res = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-RECALL-COMM3"
    })
    assert v_res.status_code == 200
    data = v_res.json()
    assert data["state"] == ReleaseVerificationState.REVOKED.value
    assert data["is_authentic"] is False
    assert "revoked" in data["explanation"].lower()
    assert "FDA 21 CFR" in data["explanation"] or "recall" in data["explanation"].lower()


def test_commitment3_state_5_unknown_record():
    """
    Commitment 3.6: Verify State 5 (UNKNOWN_RECORD): Unregistered identifier returns UNKNOWN_RECORD.
    """
    res = client.post("/api/ledger/verify-record", json={
        "identifier": "NON-EXISTENT-RECORD-XYZ-999"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["state"] == ReleaseVerificationState.UNKNOWN_RECORD.value
    assert data["is_authentic"] is False
    assert "unregistered" in data["explanation"].lower() or "not exist" in data["explanation"].lower() or "unknown" in data["explanation"].lower()


def test_commitment3_duplicate_sign_prevention():
    """
    Commitment 3.7: Verify re-signing identical asset content returns existing seal rather than duplicating.
    """
    token_reviewer = get_auth_token("marcus.aurelius@aurelle.com", "REVIEWER")
    headers = {"Authorization": f"Bearer {token_reviewer}"}

    payload = {
        "verification_id": "VRF-DUP-01",
        "brand_id": "aurelle-tech",
        "asset_id": "AST-AUR-DUP-CHECK",
        "asset_title": "Aurelle Spatial Sound Intro",
        "channel": "Web Banner",
        "content": "Aurelle Spatial Audio delivers studio-grade acoustics across all devices.",
        "reviewer": "Marcus Aurelius",
        "decision": "APPROVED"
    }

    # First sign
    res1 = client.post("/api/releases/sign", json=payload, headers=headers)
    assert res1.status_code == 200
    seal1 = res1.json()["release"]["audit_stamp"]

    # Second sign on identical content
    res2 = client.post("/api/releases/sign", json=payload, headers=headers)
    assert res2.status_code == 200
    assert "already sealed" in res2.json()["message"].lower()
    seal2 = res2.json()["audit_stamp"]
    assert seal1 == seal2, "Duplicate sign request must return existing cryptographic seal"


def test_commitment3_server_side_rbac_permissions():
    """
    Commitment 3.8: Verify RBAC role boundaries:
    - CREATOR cannot sign release (403)
    - REVIEWER cannot revoke release (requires COMPLIANCE_REVIEWER or ADMIN) (403)
    """
    token_creator = get_auth_token("creator@aurelle.com", "CREATOR")
    token_reviewer = get_auth_token("reviewer@aurelle.com", "REVIEWER")

    # CREATOR cannot sign
    res_sign_creator = client.post("/api/releases/sign", json={
        "verification_id": "VRF-RBAC-01",
        "brand_id": "aurelle-tech",
        "asset_id": "AST-RBAC-01",
        "asset_title": "RBAC Test Asset",
        "content": "Valid copy for RBAC test",
        "channel": "Web",
        "decision": "APPROVED"
    }, headers={"Authorization": f"Bearer {token_creator}"})
    assert res_sign_creator.status_code == 403
    assert "not authorized" in res_sign_creator.json()["detail"].lower()

    # REVIEWER cannot revoke (requires COMPLIANCE_REVIEWER or ADMIN)
    res_rev_reviewer = client.post("/api/ledger/revoke-record", json={
        "identifier": "AST-AUR-COMM3-01",
        "revocation_reason": "Unauthorized revocation attempt"
    }, headers={"Authorization": f"Bearer {token_reviewer}"})
    assert res_rev_reviewer.status_code == 403
    assert "not authorized" in res_rev_reviewer.json()["detail"].lower()


def test_commitment3_empty_content_rejected():
    """
    Commitment 3.9: Verify signing empty or whitespace copy returns HTTP 400.
    """
    token_reviewer = get_auth_token("marcus.aurelius@aurelle.com", "REVIEWER")
    headers = {"Authorization": f"Bearer {token_reviewer}"}

    res = client.post("/api/releases/sign", json={
        "verification_id": "VRF-EMPTY",
        "brand_id": "aurelle-tech",
        "asset_id": "AST-EMPTY",
        "asset_title": "Empty Test Asset",
        "channel": "Web",
        "content": "   ",
        "decision": "APPROVED"
    }, headers=headers)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()
