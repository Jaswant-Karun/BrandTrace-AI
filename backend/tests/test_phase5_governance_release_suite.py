import hashlib
import pytest
from fastapi.testclient import TestClient
from brandtrace.main import app

client = TestClient(app)

def _get_auth_token(email: str, password: str = "brandtrace2026") -> str:
    """Helper to authenticate and return a JWT bearer token."""
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


# ==============================================================================
# SCENARIO 1: COMPLIANCE REVIEWER IDENTITY & AUTHENTICATION
# ==============================================================================
def test_scenario_01_compliance_reviewer_identity():
    """Verifies Compliance Reviewer Arjun login, JWT claims, role metadata, and tenant context."""
    res = client.post("/api/auth/login", json={"email": "arjun@aurelle.com", "password": "brandtrace2026"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["user_id"] == "USR-AUR-ARJUN"
    assert "Compliance Arjun" in data["user"]["name"]
    assert data["user"]["role"] == "COMPLIANCE_REVIEWER"
    assert data["user"]["workspace_id"] == "aurelle-tech"
    assert data["user"]["org_id"] == "ORG-AURELLE"


# ==============================================================================
# SCENARIO 2: BRAND OWNER IDENTITY & AUTHENTICATION
# ==============================================================================
def test_scenario_02_brand_owner_identity():
    """Verifies Brand Owner Kabir login, JWT claims, role metadata, and tenant context."""
    res = client.post("/api/auth/login", json={"email": "kabir@aurelle.com", "password": "brandtrace2026"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["user_id"] == "USR-AUR-KABIR"
    assert "Brand Owner Kabir" in data["user"]["name"]
    assert data["user"]["role"] == "BRAND_MANAGER"
    assert data["user"]["workspace_id"] == "aurelle-tech"
    assert data["user"]["org_id"] == "ORG-AURELLE"


# ==============================================================================
# SCENARIO 3: COMPLIANCE QUEUE ROUTING AND ISOLATION
# ==============================================================================
def test_scenario_03_compliance_queue_routing():
    """Verifies that submissions only appear in the compliance queue when they reach the compliance stage."""
    arjun_token = _get_auth_token("arjun@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    # 1. Creator creates a fresh submission (status: SUBMITTED or PENDING_REVIEW)
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 Queue Routing Test Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Hydrate deeply with Aurelle Botanical Glow Serum.",
        "current_content": "Hydrate deeply with Aurelle Botanical Glow Serum.",
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    assert res_c.status_code == 200
    sub_id = res_c.json()["submission_id"]

    # 2. Check compliance queue: unapproved submission should NOT be in compliance queue
    res_comp_q1 = client.get("/api/submissions/queue?role=compliance", headers={"Authorization": f"Bearer {arjun_token}"})
    assert res_comp_q1.status_code == 200
    comp_sub_ids_before = [item["submission_id"] for item in res_comp_q1.json()]
    assert sub_id not in comp_sub_ids_before

    # 3. Reviewer Meera approves the submission
    res_rev = client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE",
        "feedback": "Approved by reviewer for compliance inspection."
    }, headers={"Authorization": f"Bearer {meera_token}"})
    assert res_rev.status_code == 200
    assert res_rev.json()["status"] == "REVIEW_APPROVED"

    # 4. Check compliance queue again: now it MUST appear
    res_comp_q2 = client.get("/api/submissions/queue?role=compliance", headers={"Authorization": f"Bearer {arjun_token}"})
    assert res_comp_q2.status_code == 200
    comp_sub_ids_after = [item["submission_id"] for item in res_comp_q2.json()]
    assert sub_id in comp_sub_ids_after


# ==============================================================================
# SCENARIO 4: COMPLIANCE DECISION - APPROVE ADVANCES TO BRAND OWNER
# ==============================================================================
def test_scenario_04_compliance_approve_advances_stage():
    """Verifies that Compliance APPROVE signs off findings and advances to Final Release stage."""
    arjun_token = _get_auth_token("arjun@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    # Create submission
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 Compliance Approval Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Aurelle Retinol Night Elixir visibly renews skin texture. Backed by clinical study AUR-2025.",
        "current_content": "Aurelle Retinol Night Elixir visibly renews skin texture. Backed by clinical study AUR-2025.",
        "findings": [
            {
                "id": "f-comp-1",
                "number": 1,
                "rule_id": "FACT-014",
                "rule_title": "Retinol Concentration Disclosure",
                "category": "Statutory",
                "severity": "MAJOR",
                "flagged_text": "Retinol Night Elixir",
                "explanation": "Requires 0.3% concentration label verification.",
                "suggested_fix": "Retinol 0.3% Night Elixir",
                "status": "PENDING"
            }
        ]
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    assert res_c.status_code == 200
    sub_id = res_c.json()["submission_id"]

    # Reviewer approves
    client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE",
        "feedback": "Reviewer signoff."
    }, headers={"Authorization": f"Bearer {meera_token}"})

    # Compliance Arjun approves with finding decision
    res_comp = client.post(f"/api/submissions/{sub_id}/compliance", json={
        "compliance_name": "Compliance Arjun",
        "decision": "APPROVE",
        "notes": "All statutory disclosures verified per regulatory standards.",
        "finding_decisions": {
            "f-comp-1": {"decision": "UPHELD", "comment": "Clinical evidence verified."}
        }
    }, headers={"Authorization": f"Bearer {arjun_token}"})
    assert res_comp.status_code == 200, res_comp.text
    comp_data = res_comp.json()

    assert comp_data["status"] == "COMPLIANCE_APPROVED"
    assert comp_data["release_seal"] is not None
    assert comp_data["release_seal"].startswith("BT-SEAL-")

    # Verify approval history stages
    history = {step["stage"]: step["status"] for step in comp_data["approval_history"]}
    assert history.get("COMPLIANCE_APPROVAL") == "COMPLETED"
    assert history.get("FINAL_RELEASE") == "ACTIVE"

    # Verify finding decision updated
    findings = {f["id"]: f.get("decision") for f in comp_data["findings"]}
    assert findings.get("f-comp-1") == "UPHELD"


# ==============================================================================
# SCENARIO 5: COMPLIANCE DECISION - REQUEST EVIDENCE
# ==============================================================================
def test_scenario_05_compliance_request_evidence():
    """Verifies that Compliance REQUEST_EVIDENCE updates status and persists requested evidence."""
    arjun_token = _get_auth_token("arjun@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 Evidence Request Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Aurelle SPF50 provides 24-hour non-stop UV protection.",
        "current_content": "Aurelle SPF50 provides 24-hour non-stop UV protection.",
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE"
    }, headers={"Authorization": f"Bearer {meera_token}"})

    res_comp = client.post(f"/api/submissions/{sub_id}/compliance", json={
        "compliance_name": "Compliance Arjun",
        "decision": "REQUEST_EVIDENCE",
        "notes": "24-hour duration claim requires ISO 24444 in-vivo SPF test protocol report.",
        "requested_evidence": "ISO 24444 protocol test report certifying 24h photo-stability."
    }, headers={"Authorization": f"Bearer {arjun_token}"})
    assert res_comp.status_code == 200
    comp_data = res_comp.json()

    assert comp_data["status"] == "EVIDENCE_REQUESTED"
    assert "ISO 24444" in comp_data.get("requested_evidence", "")
    assert comp_data.get("compliance_notes") is not None


# ==============================================================================
# SCENARIO 6: COMPLIANCE DECISION - REQUEST CHANGES
# ==============================================================================
def test_scenario_06_compliance_request_changes():
    """Verifies that Compliance REQUEST_CHANGES returns submission to creator."""
    arjun_token = _get_auth_token("arjun@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 Compliance Changes Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Our serum completely prevents all cellular ageing.",
        "current_content": "Our serum completely prevents all cellular ageing.",
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE"
    }, headers={"Authorization": f"Bearer {meera_token}"})

    res_comp = client.post(f"/api/submissions/{sub_id}/compliance", json={
        "compliance_name": "Compliance Arjun",
        "decision": "REQUEST_CHANGES",
        "notes": "Medical cure claim 'completely prevents all cellular ageing' violates regulatory cosmetic rules. Reword to 'reduces appearance of fine lines'."
    }, headers={"Authorization": f"Bearer {arjun_token}"})
    assert res_comp.status_code == 200
    comp_data = res_comp.json()

    assert comp_data["status"] in ["RETURNED_TO_CREATOR", "CHANGES_REQUESTED"]
    assert "Medical cure claim" in comp_data.get("compliance_notes", "")


# ==============================================================================
# SCENARIO 7: COMPLIANCE DECISION - REJECT
# ==============================================================================
def test_scenario_07_compliance_reject():
    """Verifies that Compliance REJECT marks submission as rejected and halts workflow."""
    arjun_token = _get_auth_token("arjun@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 Compliance Rejection Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Aurelle prescription medicine available without prescription.",
        "current_content": "Aurelle prescription medicine available without prescription.",
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE"
    }, headers={"Authorization": f"Bearer {meera_token}"})

    res_comp = client.post(f"/api/submissions/{sub_id}/compliance", json={
        "compliance_name": "Compliance Arjun",
        "decision": "REJECT",
        "notes": "Direct violation of Pharmacy Act and statutory distribution compliance."
    }, headers={"Authorization": f"Bearer {arjun_token}"})
    assert res_comp.status_code == 200
    comp_data = res_comp.json()

    assert comp_data["status"] == "REJECTED"
    assert "Direct violation" in comp_data.get("rejection_reason", "")


# ==============================================================================
# SCENARIO 8: PREMATURE FINAL APPROVAL IS BLOCKED
# ==============================================================================
def test_scenario_08_premature_final_approval_blocked():
    """Brand Owner cannot grant final release before Reviewer and Compliance approvals are completed."""
    kabir_token = _get_auth_token("kabir@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    # 1. Fresh unreviewed submission
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 Premature Approval Gate Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Premature unreviewed copy.",
        "current_content": "Premature unreviewed copy.",
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    # 2. Brand Owner attempts final approval immediately
    res_premature = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "approver_name": "Brand Owner Kabir",
        "decision": "FINAL_APPROVE",
        "notes": "Attempting premature approval without prerequisite stages."
    }, headers={"Authorization": f"Bearer {kabir_token}"})

    assert res_premature.status_code == 400, "Final approval must be blocked when prerequisites are missing!"
    detail = res_premature.json().get("detail", "")
    assert "must first successfully complete Reviewer approval and Compliance approval" in detail


# ==============================================================================
# SCENARIO 9: CANNOT FINAL-APPROVE OR SEAL A REJECTED SUBMISSION
# ==============================================================================
def test_scenario_09_cannot_final_approve_rejected_submission():
    """Brand Owner cannot seal or approve a rejected submission."""
    kabir_token = _get_auth_token("kabir@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 Rejected Submissions Gate Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Unacceptable rejected copy.",
        "current_content": "Unacceptable rejected copy.",
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    # Reviewer rejects
    client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "REJECT",
        "feedback": "Violates core brand ethos."
    }, headers={"Authorization": f"Bearer {meera_token}"})

    # Brand Owner attempts final approval
    res_reject_approve = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "approver_name": "Brand Owner Kabir",
        "decision": "FINAL_APPROVE"
    }, headers={"Authorization": f"Bearer {kabir_token}"})

    assert res_reject_approve.status_code == 400
    assert "rejected submission" in res_reject_approve.json().get("detail", "").lower()


# ==============================================================================
# SCENARIO 10: COMPLETE 5-STAGE WORKFLOW TO RELEASE
# ==============================================================================
def test_scenario_10_complete_five_stage_workflow_to_release():
    """
    Executes the complete 5-stage enterprise governance workflow:
    1. Creator (Asha) submits agency-managed content
    2. Agency (Sana) verifies and forwards
    3. Reviewer (Meera) reviews and approves
    4. Compliance (Arjun) signs off statutory compliance
    5. Brand Owner (Kabir) executes final approval and cryptographic sealing
    """
    asha_token = _get_auth_token("asha@aurelle.com")
    sana_token = _get_auth_token("sana@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    arjun_token = _get_auth_token("arjun@aurelle.com")
    kabir_token = _get_auth_token("kabir@aurelle.com")

    # Content to be published
    final_content = "Experience botanical luxury with Aurelle Peptide Renewal Crème. Clinically proven to enhance skin firmness by 47% in 28 days."

    # Stage 1: Creator Submits
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 Complete 5-Stage Release Campaign",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 1,
        "original_content": final_content,
        "current_content": final_content,
        "findings": [
            {
                "id": "f-rel-01",
                "number": 1,
                "rule_id": "FACT-014",
                "rule_title": "Clinical Efficacy Disclosure",
                "category": "Efficacy Claims",
                "severity": "MINOR",
                "flagged_text": "47% in 28 days",
                "explanation": "Verified in clinical study NCT04829182.",
                "suggested_fix": "47% in 28 days",
                "status": "PENDING"
            }
        ]
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    assert res_c.status_code == 200
    sub_id = res_c.json()["submission_id"]

    # Stage 2: Agency Quality Review
    res_agency = client.post(f"/api/submissions/{sub_id}/agency-review", json={
        "agency_name": "Agency Sana",
        "decision": "FORWARD",
        "feedback": "Agency quality check passed. Forwarded to Aurelle Brand Reviewer."
    }, headers={"Authorization": f"Bearer {sana_token}"})
    assert res_agency.status_code == 200
    assert res_agency.json()["status"] == "PENDING_REVIEW"

    # Stage 3: Reviewer Meera Review
    res_rev = client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE",
        "feedback": "Approved copy. Advanced to Compliance for statutory certification.",
        "finding_decisions": {
            "f-rel-01": {"decision": "UPHELD", "comment": "Matches brand marketing guidelines."}
        }
    }, headers={"Authorization": f"Bearer {meera_token}"})
    assert res_rev.status_code == 200
    assert res_rev.json()["status"] == "REVIEW_APPROVED"

    # Stage 4: Compliance Reviewer Arjun Sign-off
    res_comp = client.post(f"/api/submissions/{sub_id}/compliance", json={
        "compliance_name": "Compliance Arjun",
        "decision": "APPROVE",
        "notes": "Statutory claims and clinical trial citations verified compliant.",
        "finding_decisions": {
            "f-rel-01": {"decision": "UPHELD", "comment": "Clinical study protocol verified on file."}
        }
    }, headers={"Authorization": f"Bearer {arjun_token}"})
    assert res_comp.status_code == 200
    assert res_comp.json()["status"] == "COMPLIANCE_APPROVED"

    # Stage 5: Brand Owner Kabir Final Approval & Cryptographic Sealing
    res_final = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "approver_name": "Brand Owner Kabir",
        "decision": "FINAL_APPROVE",
        "notes": "Final brand release authorized for global publishing."
    }, headers={"Authorization": f"Bearer {kabir_token}"})
    assert res_final.status_code == 200, res_final.text
    final_sub = res_final.json()

    assert final_sub["status"] == "RELEASED"
    assert final_sub.get("release_id") is not None
    assert final_sub["release_id"].startswith("BT-REL-")
    assert final_sub.get("release_seal") is not None
    assert final_sub.get("release_digest") is not None
    assert final_sub.get("released_at") is not None

    # Verify all approval history stages are marked COMPLETED
    history = {step["stage"]: step["status"] for step in final_sub["approval_history"]}
    assert history.get("AGENCY_APPROVAL") == "COMPLETED"
    assert history.get("REVIEWER_APPROVAL") == "COMPLETED"
    assert history.get("COMPLIANCE_APPROVAL") == "COMPLETED"
    assert history.get("FINAL_RELEASE") == "COMPLETED"


# ==============================================================================
# SCENARIO 11: SHA-256 CONTENT DIGEST INTEGRITY
# ==============================================================================
def test_scenario_11_sha256_content_digest_integrity():
    """Verifies that the release digest matches the exact SHA-256 computation of the released content."""
    kabir_token = _get_auth_token("kabir@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    arjun_token = _get_auth_token("arjun@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    exact_content = "100% Organic Cold-Pressed Rosehip Seed Oil. Naturally rich in Vitamin A and essential fatty acids."
    expected_digest = hashlib.sha256(exact_content.encode("utf-8")).hexdigest()

    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 SHA-256 Digest Test",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": exact_content,
        "current_content": exact_content,
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    # Advance through reviewer and compliance
    client.post(f"/api/submissions/{sub_id}/review", json={"decision": "APPROVE"}, headers={"Authorization": f"Bearer {meera_token}"})
    client.post(f"/api/submissions/{sub_id}/compliance", json={"decision": "APPROVE"}, headers={"Authorization": f"Bearer {arjun_token}"})

    # Final approve
    res_final = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "decision": "FINAL_APPROVE",
        "approver_name": "Brand Owner Kabir"
    }, headers={"Authorization": f"Bearer {kabir_token}"})
    assert res_final.status_code == 200
    sub_data = res_final.json()

    assert sub_data["release_digest"] == expected_digest


# ==============================================================================
# SCENARIO 12: PUBLIC ZERO-AUTH VERIFICATION (ID & SEAL)
# ==============================================================================
def test_scenario_12_public_verification_by_id_and_seal():
    """
    Verifies that the public zero-auth verification endpoint can verify
    released assets by Release ID and Release Seal without requiring credentials.
    """
    kabir_token = _get_auth_token("kabir@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    arjun_token = _get_auth_token("arjun@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    content = "Aurelle Daily Hydrating Sunscreen SPF50+ Broad Spectrum with Hyaluronic Acid."
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 Public Verification Test",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": content,
        "current_content": content,
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    client.post(f"/api/submissions/{sub_id}/review", json={"decision": "APPROVE"}, headers={"Authorization": f"Bearer {meera_token}"})
    client.post(f"/api/submissions/{sub_id}/compliance", json={"decision": "APPROVE"}, headers={"Authorization": f"Bearer {arjun_token}"})
    res_final = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "decision": "FINAL_APPROVE",
        "approver_name": "Brand Owner Kabir"
    }, headers={"Authorization": f"Bearer {kabir_token}"})
    assert res_final.status_code == 200

    sub_data = res_final.json()
    release_id = sub_data["release_id"]
    release_seal = sub_data["release_seal"]

    # 1. Zero-auth lookup by release_id (GET /api/public/verify/{release_id})
    res_pub_id = client.get(f"/api/public/verify/{release_id}")
    assert res_pub_id.status_code == 200, res_pub_id.text
    pub_id_data = res_pub_id.json()
    assert pub_id_data["status"] == "APPROVED"
    assert pub_id_data["is_authentic"] is True
    assert pub_id_data["ledger_state"] in ["VALID_UNCHANGED", "APPROVED_CURRENT"]
    assert pub_id_data["recorded_hash"] == sub_data["release_digest"]

    # 2. Zero-auth lookup by seal_code (POST /api/public/verify-seal)
    res_pub_seal = client.post("/api/public/verify-seal", json={"seal_code": release_seal})
    assert res_pub_seal.status_code == 200, res_pub_seal.text
    pub_seal_data = res_pub_seal.json()
    assert pub_seal_data["status"] == "APPROVED"
    assert pub_seal_data["is_authentic"] is True


# ==============================================================================
# SCENARIO 13: TAMPER DETECTION ON RELEASED CONTENT
# ==============================================================================
def test_scenario_13_tampered_content_detection():
    """Verifies that verifying with altered content returns MODIFIED status and is_authentic=False."""
    kabir_token = _get_auth_token("kabir@aurelle.com")
    meera_token = _get_auth_token("meera@aurelle.com")
    arjun_token = _get_auth_token("arjun@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")

    orig_content = "Aurelle Pure Squalane Oil - 100% plant-derived sugarcane squalane for intense barrier repair."
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 5 Tamper Detection Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": orig_content,
        "current_content": orig_content,
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    client.post(f"/api/submissions/{sub_id}/review", json={"decision": "APPROVE"}, headers={"Authorization": f"Bearer {meera_token}"})
    client.post(f"/api/submissions/{sub_id}/compliance", json={"decision": "APPROVE"}, headers={"Authorization": f"Bearer {arjun_token}"})
    res_final = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "decision": "FINAL_APPROVE",
        "approver_name": "Brand Owner Kabir"
    }, headers={"Authorization": f"Bearer {kabir_token}"})
    sub_data = res_final.json()
    release_id = sub_data["release_id"]

    # Verify with modified text
    altered_text = "Aurelle Pure Squalane Oil - contains artificial synthetic fillers and mineral petroleum."
    res_tamper = client.post("/api/public/verify-seal", json={
        "seal_code": release_id,
        "content_text": altered_text
    })
    assert res_tamper.status_code == 200
    tamper_data = res_tamper.json()
    assert tamper_data["status"] == "MODIFIED"
    assert tamper_data["is_authentic"] is False
    assert tamper_data["ledger_state"] == "MODIFIED_AFTER_APPROVAL"


# ==============================================================================
# SCENARIO 14: CROSS-TENANT ISOLATION (APEX vs AURELLE)
# ==============================================================================
def test_scenario_14_cross_tenant_isolation():
    """
    Verifies that Compliance Reviewer and Brand Manager from ORG-APEX
    cannot record compliance or final approval decisions on ORG-AURELLE submissions.
    """
    meera_token = _get_auth_token("meera@aurelle.com")
    asha_token = _get_auth_token("asha@aurelle.com")
    apex_comp_token = _get_auth_token("governance@apex.com")
    apex_bm_token = _get_auth_token("brandmanager@apex.com")

    # Aurelle submission
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Aurelle Confidential Tenant Test Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Aurelle private tenant data.",
        "current_content": "Aurelle private tenant data.",
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_c.json()["submission_id"]

    # Advance to review
    client.post(f"/api/submissions/{sub_id}/review", json={"decision": "APPROVE"}, headers={"Authorization": f"Bearer {meera_token}"})

    # 1. APEX Compliance Reviewer tries to record compliance decision on Aurelle post
    res_comp_unauth = client.post(f"/api/submissions/{sub_id}/compliance", json={
        "decision": "APPROVE",
        "compliance_name": "David Sterling (APEX)"
    }, headers={"Authorization": f"Bearer {apex_comp_token}"})
    assert res_comp_unauth.status_code in [403, 404], "Tenant boundary bypassed on compliance decision!"

    # 2. APEX Brand Manager tries to grant final approval on Aurelle post
    res_bm_unauth = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "decision": "FINAL_APPROVE",
        "approver_name": "Elena Rostova (APEX)"
    }, headers={"Authorization": f"Bearer {apex_bm_token}"})
    assert res_bm_unauth.status_code in [403, 404], "Tenant boundary bypassed on final approval decision!"


# ==============================================================================
# SCENARIO 15: AUDIT LEDGER CRYPTOGRAPHIC EVENT PROVENANCE
# ==============================================================================
def test_scenario_15_audit_ledger_event_provenance():
    """Verifies that compliance and final approval generate tamper-evident chained audit ledger events."""
    meera_token = _get_auth_token("meera@aurelle.com")
    res_audit = client.get("/api/audit/events?limit=50", headers={"Authorization": f"Bearer {meera_token}"})
    assert res_audit.status_code == 200
    events = res_audit.json()
    assert len(events) > 0

    actions = [e.get("what", "") for e in events]
    assert any("COMPLIANCE" in act.upper() for act in actions), "Missing COMPLIANCE audit events"
    assert any("FINAL" in act.upper() or "RELEASE" in act.upper() for act in actions), "Missing FINAL RELEASE audit events"

    for e in events:
        assert "hash" in e
        assert len(e["hash"]) == 64
        assert "who" in e
        assert "what" in e
        assert "when" in e
