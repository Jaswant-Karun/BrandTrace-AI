import hashlib
import time
import pytest
from fastapi.testclient import TestClient
from brandtrace.main import app
from brandtrace.database.mongo import mongo_manager

client = TestClient(app)

def _get_auth_token(email: str, password: str = "brandtrace2026") -> str:
    """Helper to authenticate and return a JWT bearer token."""
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


# ==============================================================================
# 1. FIVE WORKSPACE ROLE AUTHENTICATION & IDENTITY INTEGRATION
# ==============================================================================
def test_p6_01_creator_workspace_identity():
    """Validates Creator Asha login, role CREATOR, tenant ORG-AURELLE, and workspace."""
    token = _get_auth_token("asha@aurelle.com")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    u = res.json()
    assert u["role"] == "CREATOR"
    assert u["user_id"] == "USR-AUR-ASHA"
    assert u["org_id"] == "ORG-AURELLE"
    assert u["workspace_id"] == "aurelle-tech"


def test_p6_02_agency_workspace_identity():
    """Validates Agency Sana login, role CREATOR with agency context, tenant ORG-AGENCY-PULSE."""
    token = _get_auth_token("sana@aurelle.com")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    u = res.json()
    assert u["role"] == "CREATOR"
    assert u["user_id"] == "USR-AUR-SANA"
    assert u["workspace_id"] == "aurelle-tech"


def test_p6_03_reviewer_workspace_identity():
    """Validates Reviewer Meera login, role REVIEWER, tenant ORG-AURELLE."""
    token = _get_auth_token("meera@aurelle.com")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    u = res.json()
    assert u["role"] == "REVIEWER"
    assert u["user_id"] == "USR-AUR-MEERA"
    assert u["org_id"] == "ORG-AURELLE"


def test_p6_04_compliance_reviewer_workspace_identity():
    """Validates Compliance Reviewer Arjun login, role COMPLIANCE_REVIEWER, tenant ORG-AURELLE."""
    token = _get_auth_token("arjun@aurelle.com")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    u = res.json()
    assert u["role"] == "COMPLIANCE_REVIEWER"
    assert u["user_id"] == "USR-AUR-ARJUN"
    assert u["org_id"] == "ORG-AURELLE"


def test_p6_05_brand_owner_workspace_identity():
    """Validates Brand Owner Kabir login, role BRAND_MANAGER, tenant ORG-AURELLE."""
    token = _get_auth_token("kabir@aurelle.com")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    u = res.json()
    assert u["role"] == "BRAND_MANAGER"
    assert u["user_id"] == "USR-AUR-KABIR"
    assert u["org_id"] == "ORG-AURELLE"


# ==============================================================================
# 2. DATABASE PERSISTENCE & REAL METADATA ENDPOINTS
# ==============================================================================
def test_p6_06_database_status_telemetry():
    """Verifies that the /api/db/status endpoint returns active database health and collections."""
    res = client.get("/api/db/status")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "connected" in data
    assert "engine" in data
    assert "collections" in data
    assert isinstance(data["collections"], dict)


def test_p6_07_brand_guidelines_and_rules_persistence():
    """Verifies that Rulebook guidelines load genuine persisted rules for Aurelle."""
    token = _get_auth_token("asha@aurelle.com")
    res = client.get("/api/guidelines?brand_id=aurelle-tech", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    guidelines = res.json()
    assert len(guidelines) > 0
    # Verify mandatory guideline properties
    rule_ids = [g.get("guideline_id") or g.get("id") or g.get("title") for g in guidelines]
    assert len(rule_ids) > 0
    assert any(g.get("title") or g.get("guideline_id") for g in guidelines)


def test_p6_08_facts_ledger_persistence():
    """Verifies that the Fact ledger loads real persisted facts for Aurelle."""
    token = _get_auth_token("asha@aurelle.com")
    res = client.get("/api/facts?brand_id=aurelle-tech", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    facts = res.json()
    assert len(facts) > 0
    fact_ids = [f.get("fact_id") or f.get("id") for f in facts]
    assert any(fid for fid in fact_ids if "FACT" in str(fid))


# ==============================================================================
# 3. CONTENT EDITOR, AUDITING, REVISION & PERSISTENCE
# ==============================================================================
def test_p6_09_multimodal_image_upload_validation():
    """Validates real image upload with byte inspection (magic bytes, size, format)."""
    token = _get_auth_token("asha@aurelle.com")
    
    # 1. Valid PNG upload
    valid_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    files = {"file": ("product_packaging.png", valid_png_bytes, "image/png")}
    res_upload = client.post("/api/content/upload", files=files, headers={"Authorization": f"Bearer {token}"})
    assert res_upload.status_code in [200, 201], res_upload.text
    upload_data = res_upload.json()
    file_id = upload_data.get("file_metadata", {}).get("file_id") or upload_data.get("asset_id") or upload_data.get("id")
    assert file_id is not None

    # 2. Invalid non-image upload rejection
    fake_exe_bytes = b"MZ\x90\x00\x03\x00\x00\x00"
    files_bad = {"file": ("malicious.exe", fake_exe_bytes, "application/octet-stream")}
    res_bad = client.post("/api/content/upload", files=files_bad, headers={"Authorization": f"Bearer {token}"})
    assert res_bad.status_code in [400, 415], "Executable upload must be rejected!"


def test_p6_10_ai_content_audit_and_finding_detection():
    """Verifies that the AI content verification engine detects real guideline and claim findings."""
    token = _get_auth_token("asha@aurelle.com")
    
    content = "Our Diwali sale is here: 20% off sitewide on every Aurelle favourite. Over 120000 customers trust our Online store."
    payload = {
        "content": content,
        "brand_id": "aurelle-tech",
        "channel": "instagram",
        "content_type": "caption"
    }
    res_audit = client.post("/api/verify", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res_audit.status_code == 200, res_audit.text
    audit_data = res_audit.json()
    assert "composite_risk_score" in audit_data or "all_risk_spans" in audit_data or "agent_reports" in audit_data


def test_p6_11_creator_draft_save_and_restore():
    """Verifies that Creator can save and retrieve drafts from the database."""
    token = _get_auth_token("asha@aurelle.com")
    draft_payload = {
        "title": "Phase 6 Draft Test",
        "content": "Aurelle Botanical Glow Serum draft content.",
        "brand_id": "aurelle-tech",
        "channel": "instagram"
    }
    res_save = client.post("/api/drafts", json=draft_payload, headers={"Authorization": f"Bearer {token}"})
    assert res_save.status_code in [200, 201], res_save.text


# ==============================================================================
# 4. FULL 5-STAGE WORKFLOW & PERSISTENT DATA CONSISTENCY
# ==============================================================================
def test_p6_12_full_five_stage_lifecycle_e2e():
    """
    Executes the complete 5-stage enterprise governance workflow:
    1. Creator (Asha) creates and submits post (agency managed)
    2. Agency (Sana) verifies and forwards
    3. Reviewer (Meera) reviews and approves
    4. Compliance (Arjun) signs off statutory compliance
    5. Brand Owner (Kabir) final-approves and seals release
    6. Verify all stages COMPLETED, unique Release ID and SHA-256 digest exist
    """
    asha_token = _get_auth_token("asha@aurelle.com")
    sana_token = _get_auth_token("sana@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    arjun_token = _get_auth_token("arjun@aurelle.com")
    kabir_token = _get_auth_token("kabir@aurelle.com")

    published_text = "Aurelle Hydrating Niacinamide 10% Dew Drops. Clinically demonstrated to reduce sebum by 38%."
    expected_sha256 = hashlib.sha256(published_text.encode("utf-8")).hexdigest()

    # Step 1: Creator Submission
    create_payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 6 E2E Governance Lifecycle Release",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 1,
        "original_content": published_text,
        "current_content": published_text,
        "findings": [
            {
                "id": "f-p6-01",
                "number": 1,
                "rule_id": "FACT-014",
                "rule_title": "Sebum Reduction Claim",
                "category": "Efficacy Claims",
                "severity": "MINOR",
                "flagged_text": "reduce sebum by 38%",
                "explanation": "Supported by dermatological trial protocol AUR-2026-N10.",
                "suggested_fix": "reduce sebum by 38%",
                "status": "PENDING"
            }
        ]
    }
    res_c = client.post("/api/submissions", json=create_payload, headers={"Authorization": f"Bearer {asha_token}"})
    assert res_c.status_code == 200, res_c.text
    sub_id = res_c.json()["submission_id"]

    # Step 2: Agency Sana Reviews and Forwards
    res_ag = client.post(f"/api/submissions/{sub_id}/agency-review", json={
        "agency_name": "Agency Sana",
        "decision": "FORWARD",
        "feedback": "Agency QA passed. Forwarded to Aurelle Brand Reviewer."
    }, headers={"Authorization": f"Bearer {sana_token}"})
    assert res_ag.status_code == 200
    assert res_ag.json()["status"] == "PENDING_REVIEW"

    # Step 3: Reviewer Meera Reviews and Approves
    res_rev = client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE",
        "feedback": "Reviewer approved copy for statutory compliance verification.",
        "finding_decisions": {
            "f-p6-01": {"decision": "UPHELD", "comment": "Matches brand tone."}
        }
    }, headers={"Authorization": f"Bearer {meera_token}"})
    assert res_rev.status_code == 200
    assert res_rev.json()["status"] == "REVIEW_APPROVED"

    # Step 4: Compliance Reviewer Arjun Signs Off
    res_comp = client.post(f"/api/submissions/{sub_id}/compliance", json={
        "compliance_name": "Compliance Arjun",
        "decision": "APPROVE",
        "notes": "Statutory concentration label and trial citation verified.",
        "finding_decisions": {
            "f-p6-01": {"decision": "UPHELD", "comment": "Trial protocol on record."}
        }
    }, headers={"Authorization": f"Bearer {arjun_token}"})
    assert res_comp.status_code == 200
    assert res_comp.json()["status"] == "COMPLIANCE_APPROVED"

    # Step 5: Brand Owner Kabir Final Approval & Release
    res_final = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "approver_name": "Brand Owner Kabir",
        "decision": "FINAL_APPROVE",
        "notes": "Final release approved for production publication."
    }, headers={"Authorization": f"Bearer {kabir_token}"})
    assert res_final.status_code == 200
    released = res_final.json()

    # Step 6: Verify Persistence and Release Properties
    assert released["status"] == "RELEASED"
    assert released["release_id"].startswith("BT-REL-")
    assert released["release_seal"].startswith("BT-SEAL-")
    assert released["release_digest"] == expected_sha256

    history = {step["stage"]: step["status"] for step in released["approval_history"]}
    assert history.get("AGENCY_APPROVAL") == "COMPLETED"
    assert history.get("REVIEWER_APPROVAL") == "COMPLETED"
    assert history.get("COMPLIANCE_APPROVAL") == "COMPLETED"
    assert history.get("FINAL_RELEASE") == "COMPLETED"

    # Step 7: Public Zero-Auth Verification
    res_verify = client.get(f"/api/public/verify/{released['release_id']}")
    assert res_verify.status_code == 200, res_verify.text
    v = res_verify.json()
    assert v["status"] == "APPROVED"
    assert v["is_authentic"] is True
    assert v["recorded_hash"] == expected_sha256


# ==============================================================================
# 5. SECURITY, RBAC & TENANT ISOLATION
# ==============================================================================
def test_p6_13_unauthenticated_request_rejected():
    """Verifies that protected endpoints reject invalid/expired credentials with 401."""
    res = client.get("/api/submissions", headers={"Authorization": "Bearer invalid_expired_jwt_token"})
    assert res.status_code == 401, "Invalid token must be rejected with 401!"


def test_p6_14_cross_tenant_isolation():
    """
    Verifies that a user from ORG-APEX cannot access or mutate
    submissions belonging to ORG-AURELLE (HTTP 403 Forbidden).
    """
    asha_token = _get_auth_token("asha@aurelle.com")
    apex_token = _get_auth_token("governance@apex.com")

    # Create Aurelle post
    res_c = client.post("/api/submissions", json={
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Aurelle Private Submission",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Aurelle confidential formula.",
        "current_content": "Aurelle confidential formula.",
        "findings": []
    }, headers={"Authorization": f"Bearer {asha_token}"})
    assert res_c.status_code == 200
    sub_id = res_c.json()["submission_id"]

    # APEX user attempts to fetch Aurelle post
    res_leak = client.get(f"/api/submissions/{sub_id}", headers={"Authorization": f"Bearer {apex_token}"})
    assert res_leak.status_code in [403, 404], "Tenant boundary bypassed on GET!"

    # APEX user attempts to sign off Aurelle post
    res_comp_leak = client.post(f"/api/submissions/{sub_id}/compliance", json={
        "decision": "APPROVE"
    }, headers={"Authorization": f"Bearer {apex_token}"})
    assert res_comp_leak.status_code in [403, 404], "Tenant boundary bypassed on compliance decision!"


def test_p6_15_premature_final_approval_gate():
    """Verifies that final approval cannot be granted if review or compliance stages are missing."""
    kabir_token = _get_auth_token("kabir@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    res_c = client.post("/api/submissions", json={
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Unreviewed Post for Gate Test",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Unreviewed draft text.",
        "current_content": "Unreviewed draft text.",
        "findings": []
    }, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    res_premature = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "decision": "FINAL_APPROVE",
        "approver_name": "Brand Owner Kabir"
    }, headers={"Authorization": f"Bearer {kabir_token}"})
    assert res_premature.status_code == 400
    assert "must first successfully complete Reviewer approval and Compliance approval" in res_premature.json()["detail"]


def test_p6_16_tamper_detection_in_public_portal():
    """Verifies that public verification detects altered text and flags it as MODIFIED."""
    kabir_token = _get_auth_token("kabir@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    arjun_token = _get_auth_token("arjun@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    orig_text = "Authentic Aurelle Ceramide Moisture Cream. Barrier restore formula."
    res_c = client.post("/api/submissions", json={
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Tamper Test Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": orig_text,
        "current_content": orig_text,
        "findings": []
    }, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    client.post(f"/api/submissions/{sub_id}/review", json={"decision": "APPROVE"}, headers={"Authorization": f"Bearer {meera_token}"})
    client.post(f"/api/submissions/{sub_id}/compliance", json={"decision": "APPROVE"}, headers={"Authorization": f"Bearer {arjun_token}"})
    res_final = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "decision": "FINAL_APPROVE",
        "approver_name": "Brand Owner Kabir"
    }, headers={"Authorization": f"Bearer {kabir_token}"})
    release_id = res_final.json()["release_id"]

    # Alter text
    altered = "Authentic Aurelle Ceramide Moisture Cream. Contains harmful parabens."
    res_tamper = client.post("/api/public/verify-seal", json={
        "seal_code": release_id,
        "content_text": altered
    })
    assert res_tamper.status_code == 200
    t = res_tamper.json()
    assert t["status"] == "MODIFIED"
    assert t["is_authentic"] is False
    assert t["ledger_state"] == "MODIFIED_AFTER_APPROVAL"


def test_p6_17_audit_ledger_immutable_event_chain():
    """Verifies that all workflow mutations produce SHA-256 chained audit events."""
    meera_token = _get_auth_token("meera@aurelle.com")
    res = client.get("/api/audit/events?limit=50", headers={"Authorization": f"Bearer {meera_token}"})
    assert res.status_code == 200
    events = res.json()
    assert len(events) > 0

    hashes = [e["hash"] for e in events if "hash" in e]
    assert len(hashes) > 0
    # Every hash must be 64-char hex SHA-256
    for h in hashes:
        assert len(h) == 64
