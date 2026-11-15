import pytest
from fastapi.testclient import TestClient
from brandtrace.main import app
from brandtrace.modules.auth.service import auth_service
from brandtrace.modules.auth.models import UserProfile, UserRole

client = TestClient(app)

def _get_headers_for_role(role: UserRole, user_id: str, name: str) -> dict:
    profile = UserProfile(
        user_id=user_id,
        email=f"{user_id.lower()}@brandtrace.ai",
        name=name,
        role=role,
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech"
    )
    token = auth_service.create_user_token(profile)
    return {"Authorization": f"Bearer {token}"}

def test_phase7_final_approval_queue_contains_only_compliance_approved():
    """1. Final Approval Queue: Only submissions that have passed Compliance approval appear in Brand Owner queue."""
    # Step A: Creator submits
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Aurelle Peptide Global Launch Reel",
        "channel": "instagram",
        "creator_id": "USR-CREATOR-001",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Aurelle Peptide Serum restores youthful elasticity by 32% in 8 weeks (protocol AUR-LAB-014).",
        "current_content": "Aurelle Peptide Serum restores youthful elasticity by 32% in 8 weeks (protocol AUR-LAB-014).",
        "findings": [],
        "submission_notes": "Clinical claims certified"
    }
    res_sub = client.post("/api/submissions", json=payload)
    assert res_sub.status_code == 200
    sub_id = res_sub.json()["submission_id"]

    # Step B: Fresh submission must NOT be in Brand Owner queue
    res_bo_queue = client.get("/api/submissions/queue?role=brand-owner")
    assert res_bo_queue.status_code == 200
    bo_items = [s["submission_id"] for s in res_bo_queue.json()]
    assert sub_id not in bo_items, "Fresh submission cannot appear in Brand Owner queue before review & compliance"

    # Step C: Reviewer approves
    client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE",
        "feedback": "Approved by Meera"
    })

    # Step D: Still must NOT be in Brand Owner queue (only REVIEW_APPROVED, not COMPLIANCE_APPROVED)
    res_bo_queue2 = client.get("/api/submissions/queue?role=brand-owner")
    bo_items2 = [s["submission_id"] for s in res_bo_queue2.json()]
    assert sub_id not in bo_items2, "Reviewer-approved submission cannot appear in Brand Owner queue until Compliance approves"

    # Step E: Compliance approves
    client.post(f"/api/submissions/{sub_id}/compliance", json={
        "compliance_name": "Compliance Arjun",
        "decision": "APPROVE",
        "notes": "Verified against FTC and FDA guidelines."
    })

    # Step F: Now submission MUST appear in Brand Owner queue!
    res_bo_queue3 = client.get("/api/submissions/queue?role=brand-owner")
    bo_items3 = res_bo_queue3.json()
    matched = next((s for s in bo_items3 if s["submission_id"] == sub_id), None)
    assert matched is not None, f"Compliance-approved submission {sub_id} must appear in Brand Owner queue"
    assert matched["status"] == "COMPLIANCE_APPROVED"

def test_phase7_final_approval_cannot_be_granted_without_reviewer_and_compliance():
    """2. Mandatory Workflow Stage Verification: Final approval is rejected if Reviewer or Compliance stages are incomplete."""
    # Submission without approvals
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Bypass Attempt Post",
        "channel": "instagram",
        "original_content": "Unverified content bypass attempt",
        "current_content": "Unverified content bypass attempt",
        "findings": []
    }
    res_sub = client.post("/api/submissions", json=payload)
    sub_id = res_sub.json()["submission_id"]

    # Brand Owner attempts direct final approval -> must be rejected (400 Bad Request)
    res_fa = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "approver_name": "Brand Owner Kabir",
        "decision": "FINAL_APPROVE",
        "notes": "Attempting premature signoff"
    })
    assert res_fa.status_code == 400
    assert "submission must first successfully complete Reviewer approval and Compliance approval" in res_fa.json()["detail"]

def test_phase7_brand_owner_grants_final_approval_and_generates_release():
    """3. Release Generation: Verified approval creates unique release ID, SHA-256 digest, and immutable release record."""
    # Create, review-approve, compliance-approve
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Aurelle Vitamin C Serum Festive Spotlight",
        "channel": "instagram",
        "original_content": "Aurelle Vitamin C Serum delivers up to 32% dark spot reduction in 8 weeks (AUR-LAB-014). Available at ₹899.",
        "current_content": "Aurelle Vitamin C Serum delivers up to 32% dark spot reduction in 8 weeks (AUR-LAB-014). Available at ₹899.",
        "findings": []
    }
    res_sub = client.post("/api/submissions", json=payload)
    sub_id = res_sub.json()["submission_id"]

    client.post(f"/api/submissions/{sub_id}/review", json={"reviewer_name": "Reviewer Meera", "decision": "APPROVE"})
    client.post(f"/api/submissions/{sub_id}/compliance", json={"compliance_name": "Compliance Arjun", "decision": "APPROVE"})

    # Brand Owner grants final approval
    res_final = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "approver_name": "Brand Owner Kabir",
        "decision": "FINAL_APPROVE",
        "notes": "Executive sign-off granted for Q4 festive campaign."
    })
    assert res_final.status_code == 200, res_final.text
    final_sub = res_final.json()

    # Verify release ID and SHA-256 digest
    assert final_sub["status"] == "RELEASED"
    assert final_sub["release_id"] is not None
    assert final_sub["release_id"].startswith("BT-REL-2026-")
    assert final_sub["release_digest"] is not None
    assert len(final_sub["release_digest"]) == 64  # SHA-256 hex string

    # Verify approval history
    final_step = next(s for s in final_sub["approval_history"] if s["stage"] == "FINAL_RELEASE")
    assert final_step["status"] == "COMPLETED"
    assert "Final release approved by Brand Owner Kabir" in final_step["comments"]

def test_phase7_public_verification_zero_auth():
    """4. Public Verification: Zero-auth public verification of release ID and cryptographic integrity."""
    # Set up approved release
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Certified Public Release",
        "channel": "instagram",
        "original_content": "Certified pure botanical barrier cream backed by lab trial.",
        "current_content": "Certified pure botanical barrier cream backed by lab trial.",
        "findings": []
    }
    res_sub = client.post("/api/submissions", json=payload)
    sub_id = res_sub.json()["submission_id"]
    client.post(f"/api/submissions/{sub_id}/review", json={"reviewer_name": "Reviewer Meera", "decision": "APPROVE"})
    client.post(f"/api/submissions/{sub_id}/compliance", json={"compliance_name": "Compliance Arjun", "decision": "APPROVE"})
    res_final = client.post(f"/api/submissions/{sub_id}/final-approval", json={"approver_name": "Brand Owner Kabir", "decision": "FINAL_APPROVE"}).json()
    rel_id = res_final["release_id"]

    # Public verification via GET /public/verify/{release_id} (Zero authentication required)
    res_pub = client.get(f"/api/public/verify/{rel_id}")
    assert res_pub.status_code == 200, res_pub.text
    pub_data = res_pub.json()

    assert pub_data["is_authentic"] is True
    assert pub_data["status"] == "APPROVED"
    assert pub_data["seal_code"] is not None
    assert pub_data["computed_hash"] == res_final["release_digest"]
    # Check that confidential internal notes are NOT exposed in public response
    assert "internal_notes" not in pub_data

def test_phase7_brand_owner_rejects_and_requests_changes_with_mandatory_reasons():
    """5. Brand Owner rejection & revision: requires mandatory reasons."""
    # Submission at compliance stage
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Creative Tone Revision Post",
        "channel": "instagram",
        "original_content": "Tone test content",
        "current_content": "Tone test content",
        "findings": []
    }
    res_sub = client.post("/api/submissions", json=payload)
    sub_id = res_sub.json()["submission_id"]
    client.post(f"/api/submissions/{sub_id}/review", json={"reviewer_name": "Reviewer Meera", "decision": "APPROVE"})
    client.post(f"/api/submissions/{sub_id}/compliance", json={"compliance_name": "Compliance Arjun", "decision": "APPROVE"})

    # 1. Request changes without reason -> 400 Bad Request
    res_no_reason = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "approver_name": "Brand Owner Kabir",
        "decision": "REQUEST_CHANGES",
        "notes": ""
    })
    assert res_no_reason.status_code == 400
    assert "reason is required" in res_no_reason.json()["detail"].lower()

    # 2. Request changes with reason -> 200 OK, status RETURNED_TO_CREATOR
    res_changes = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "approver_name": "Brand Owner Kabir",
        "decision": "REQUEST_CHANGES",
        "notes": "Tone does not reflect luxury minimalism brand identity. Please adjust CTA."
    })
    assert res_changes.status_code == 200
    assert res_changes.json()["status"] == "RETURNED_TO_CREATOR"
    assert "luxury minimalism" in res_changes.json()["brand_owner_notes"]

    # 3. Reject without reason -> 400 Bad Request
    res_reject_no_reason = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "approver_name": "Brand Owner Kabir",
        "decision": "REJECT",
        "notes": ""
    })
    assert res_reject_no_reason.status_code == 400
    assert "reason is required" in res_reject_no_reason.json()["detail"].lower()

    # 4. Reject with reason -> 200 OK, status REJECTED
    res_reject = client.post(f"/api/submissions/{sub_id}/final-approval", json={
        "approver_name": "Brand Owner Kabir",
        "decision": "REJECT",
        "notes": "Strategic brand repositioning: discontinuing this product line."
    })
    assert res_reject.status_code == 200
    assert res_reject.json()["status"] == "REJECTED"
    assert "discontinuing" in res_reject.json()["rejection_reason"]

def test_phase7_publishing_restriction_blocks_unauthorized_external_publishing():
    """6. Publishing Restriction: Strictly gates publishing to authorized and configured API integrations."""
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Publishing Test Post",
        "channel": "instagram",
        "original_content": "Publishing test content",
        "current_content": "Publishing test content",
        "findings": []
    }
    res_sub = client.post("/api/submissions", json=payload)
    sub_id = res_sub.json()["submission_id"]

    # 1. Attempting to publish unreleased content -> 400 Bad Request
    res_pub_premature = client.post(f"/api/submissions/{sub_id}/publish", json={
        "platform": "instagram",
        "destination_account": "aurelle_official",
        "authorized_integration": True,
        "oauth_token": "valid_token"
    })
    assert res_pub_premature.status_code == 400
    assert "Content must receive successful Final Approval" in res_pub_premature.json()["detail"]

    # Pass Reviewer, Compliance, Final Approval
    client.post(f"/api/submissions/{sub_id}/review", json={"reviewer_name": "Reviewer Meera", "decision": "APPROVE"})
    client.post(f"/api/submissions/{sub_id}/compliance", json={"compliance_name": "Compliance Arjun", "decision": "APPROVE"})
    client.post(f"/api/submissions/{sub_id}/final-approval", json={"approver_name": "Brand Owner Kabir", "decision": "FINAL_APPROVE"})

    # 2. Attempting to publish without authorized integration / token -> RESTRICTED
    res_pub_unauth = client.post(f"/api/submissions/{sub_id}/publish", json={
        "platform": "instagram",
        "destination_account": "aurelle_official",
        "authorized_integration": False
    })
    assert res_pub_unauth.status_code == 200
    assert res_pub_unauth.json()["status"] == "RESTRICTED"
    assert "Automatic publishing to external platforms is prohibited" in res_pub_unauth.json()["message"]

    # 3. Publishing with authorized integration and token -> PUBLISHED
    res_pub_ok = client.post(f"/api/submissions/{sub_id}/publish", json={
        "platform": "instagram",
        "destination_account": "aurelle_official",
        "authorized_integration": True,
        "oauth_token": "valid_ig_oauth_token"
    })
    assert res_pub_ok.status_code == 200
    assert res_pub_ok.json()["status"] == "PUBLISHED"
    assert "instagram.com/aurelle_official" in res_pub_ok.json()["published_url"]

def test_phase7_role_rbac_isolation_brand_owner():
    """7. Role RBAC: Creators and Reviewers are forbidden from issuing final release approval."""
    creator_headers = _get_headers_for_role(UserRole.CREATOR, "USR-CREATOR-099", "Asha Creator")
    reviewer_headers = _get_headers_for_role(UserRole.REVIEWER, "USR-REVIEWER-099", "Meera Reviewer")
    brand_owner_headers = _get_headers_for_role(UserRole.BRAND_MANAGER, "USR-OWNER-099", "Kabir Brand Owner")

    # Set up compliance approved post
    sub = client.post("/api/submissions", json={
        "brand_id": "aurelle-tech",
        "title": "RBAC Final Test",
        "original_content": "RBAC content",
        "current_content": "RBAC content",
        "findings": []
    }).json()
    sub_id = sub["submission_id"]
    client.post(f"/api/submissions/{sub_id}/review", json={"decision": "APPROVE"})
    client.post(f"/api/submissions/{sub_id}/compliance", json={"decision": "APPROVE"})

    # Creator attempts final release -> 403 Forbidden
    res_c = client.post(f"/api/submissions/{sub_id}/final-approval", headers=creator_headers, json={"decision": "FINAL_APPROVE"})
    assert res_c.status_code == 403

    # Reviewer attempts final release -> 403 Forbidden
    res_r = client.post(f"/api/submissions/{sub_id}/final-approval", headers=reviewer_headers, json={"decision": "FINAL_APPROVE"})
    assert res_r.status_code == 403

    # Brand Owner attempts final release -> 200 OK
    res_bo = client.post(f"/api/submissions/{sub_id}/final-approval", headers=brand_owner_headers, json={"decision": "FINAL_APPROVE"})
    assert res_bo.status_code == 200
