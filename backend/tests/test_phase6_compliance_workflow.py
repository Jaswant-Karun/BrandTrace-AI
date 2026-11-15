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

def test_phase6_only_reviewer_approved_submissions_enter_compliance_queue():
    """1. Compliance Queue isolation: Only submissions approved by Reviewer enter the Compliance queue."""
    # Step A: Creator submits new post
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Asha Ceramide Launch Reel",
        "channel": "instagram",
        "creator_id": "USR-CREATOR-001",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Ceramide Barrier Cream cures eczema and guarantees 100% natural relief in 48 hours.",
        "current_content": "Ceramide Barrier Cream cures eczema and guarantees 100% natural relief in 48 hours.",
        "findings": [
            {
                "id": "f-601",
                "number": 1,
                "rule_id": "REG-FDA-01",
                "rule_title": "Therapeutic Cure Prohibition",
                "category": "Regulatory FDA",
                "severity": "BLOCKING",
                "sentence_index": 0,
                "original_sentence": "cures eczema",
                "flagged_text": "cures eczema",
                "explanation": "Cosmetics cannot claim treatment or cure of medical conditions under FDA 21 CFR §201.",
                "suggested_fix": "deeply hydrates dry skin",
                "status": "PENDING"
            },
            {
                "id": "f-602",
                "number": 2,
                "rule_id": "REG-FTC-01",
                "rule_title": "Absolute Green Claim Prohibition",
                "category": "Regulatory FTC",
                "severity": "BLOCKING",
                "sentence_index": 0,
                "original_sentence": "100% natural relief",
                "flagged_text": "100% natural",
                "explanation": "Absolute natural claims violate FTC Green Guides 16 CFR §260.4.",
                "suggested_fix": "naturally derived ceramides",
                "status": "PENDING"
            }
        ],
        "submission_notes": "Creator Asha v1 ceramide reel"
    }
    res_sub = client.post("/api/submissions", json=payload)
    assert res_sub.status_code == 200, res_sub.text
    sub_id = res_sub.json()["submission_id"]

    # Step B: Confirm present in Reviewer queue (status is PENDING_REVIEW)
    res_rev_queue = client.get("/api/submissions/queue?role=reviewer")
    assert res_rev_queue.status_code == 200
    rev_items = [s["submission_id"] for s in res_rev_queue.json()]
    assert sub_id in rev_items, "Fresh submission must be present in Reviewer queue"

    # Step C: Confirm STRICTLY NOT present in Compliance queue before Reviewer approves
    res_comp_queue = client.get("/api/submissions/queue?role=compliance")
    assert res_comp_queue.status_code == 200
    comp_items = [s["submission_id"] for s in res_comp_queue.json()]
    assert sub_id not in comp_items, "Unapproved submission MUST NOT appear in Compliance queue"

    # Step D: Reviewer reviews and approves the submission
    rev_decision_payload = {
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE",
        "feedback": "Reviewer Meera verified fixes. Advancing to Compliance Arjun.",
        "finding_decisions": {
            "f-601": {"decision": "UPHELD", "comment": "Must strictly adhere to FDA §201 barrier cosmetic language"},
            "f-602": {"decision": "UPHELD", "comment": "FTC green guides compliance mandatory"}
        }
    }
    res_approve = client.post(f"/api/submissions/{sub_id}/review", json=rev_decision_payload)
    assert res_approve.status_code == 200, res_approve.text
    assert res_approve.json()["status"] == "REVIEW_APPROVED"

    # Step E: Confirm submission NOW enters Compliance queue
    res_comp_queue_after = client.get("/api/submissions/queue?role=compliance")
    assert res_comp_queue_after.status_code == 200
    comp_items_after = res_comp_queue_after.json()
    matched = next((s for s in comp_items_after if s["submission_id"] == sub_id), None)
    assert matched is not None, f"Reviewer-approved submission {sub_id} must now appear in Compliance queue"
    assert matched["status"] == "REVIEW_APPROVED"
    assert matched["reviewer_feedback"] == "Reviewer Meera verified fixes. Advancing to Compliance Arjun."

def test_phase6_compliance_approves_and_advances_to_brand_owner():
    """2. Compliance Officer approves submission: advances to Brand Owner queue with cryptographic seal."""
    # Create submission and review-approve it
    sub_payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Aurelle Peptide Launch Copy",
        "channel": "instagram",
        "creator_id": "USR-AGENCY-001",
        "creator_name": "Agency Sana",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 2,
        "original_content": "Aurelle Multi-Peptide Serum boosts skin firmness by up to 32% in 8 weeks (protocol AUR-LAB-014).",
        "current_content": "Aurelle Multi-Peptide Serum boosts skin firmness by up to 32% in 8 weeks (protocol AUR-LAB-014).",
        "findings": [],
        "submission_notes": "Clinical claims certified by protocol AUR-LAB-014"
    }
    res_sub = client.post("/api/submissions", json=sub_payload)
    assert res_sub.status_code == 200
    sub_id = res_sub.json()["submission_id"]

    # Reviewer approves
    client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE",
        "feedback": "Approved by Meera"
    })

    # Compliance approves
    comp_payload = {
        "compliance_name": "Compliance Arjun",
        "compliance_role": "COMPLIANCE",
        "decision": "APPROVE",
        "notes": "Statutory validation verified against FDA 21 CFR §201 and FTC Green Guides §260. Clinical protocol AUR-LAB-014 verified.",
    }
    res_comp = client.post(f"/api/submissions/{sub_id}/compliance", json=comp_payload)
    assert res_comp.status_code == 200, res_comp.text
    comp_sub = res_comp.json()

    # Verify status advanced to COMPLIANCE_APPROVED
    assert comp_sub["status"] == "COMPLIANCE_APPROVED"
    assert comp_sub["release_seal"] is not None
    assert comp_sub["release_seal"].startswith("BT-SEAL-")

    # Verify Approval Stages: COMPLIANCE_APPROVAL completed, FINAL_RELEASE active
    history = comp_sub["approval_history"]
    comp_step = next(s for s in history if s["stage"] == "COMPLIANCE_APPROVAL")
    assert comp_step["status"] == "COMPLETED"
    assert "Statutory validation verified" in comp_step["comments"]

    release_step = next(s for s in history if s["stage"] == "FINAL_RELEASE")
    assert release_step["status"] == "ACTIVE"
    assert "Brand Owner" in release_step["comments"]

    # Verify Notification to Brand Owner
    res_notifs = client.get("/api/notifications?role=BRAND_OWNER")
    assert res_notifs.status_code == 200
    notifs = res_notifs.json()
    assert any("Compliance Approved" in n.get("title", "") and n.get("submission_id") == sub_id for n in notifs)

def test_phase6_compliance_requests_additional_evidence():
    """3. Compliance requests additional clinical evidence, keeping item in compliance review."""
    sub_payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Eco Packaging Sustainability Claim",
        "channel": "web",
        "creator_id": "USR-CREATOR-001",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "100% biodegradable ocean waste bottle.",
        "current_content": "100% biodegradable ocean waste bottle.",
        "findings": [],
        "submission_notes": "Packaging claim"
    }
    res_sub = client.post("/api/submissions", json=sub_payload)
    sub_id = res_sub.json()["submission_id"]

    # Reviewer approves
    client.post(f"/api/submissions/{sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE",
        "feedback": "Needs compliance verification of ocean waste certification."
    })

    # Compliance requests evidence
    comp_payload = {
        "compliance_name": "Compliance Arjun",
        "decision": "REQUEST_EVIDENCE",
        "requested_evidence": "Upload certified ISO 14855 biodegradation certificate and Ocean Waste supply-chain manifest."
    }
    res_comp = client.post(f"/api/submissions/{sub_id}/compliance", json=comp_payload)
    assert res_comp.status_code == 200, res_comp.text
    comp_sub = res_comp.json()

    assert comp_sub["status"] == "EVIDENCE_REQUESTED"
    assert "ISO 14855" in comp_sub["evidence_requested_notes"]

    # Verify item stays in Compliance queue under EVIDENCE_REQUESTED
    res_comp_queue = client.get("/api/submissions/queue?role=compliance")
    comp_items = res_comp_queue.json()
    assert any(s["submission_id"] == sub_id and s["status"] == "EVIDENCE_REQUESTED" for s in comp_items)

    # Verify notifications to Creator and Reviewer
    res_creator_notifs = client.get("/api/notifications?role=CREATOR")
    assert any("Evidence Requested" in n.get("title", "") for n in res_creator_notifs.json())

def test_phase6_compliance_returns_for_revision_and_rejects():
    """4. Compliance returns submission for revision and handles full rejection."""
    # Part 1: Return for revision
    sub_payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "SPF 100 All-Day Protection",
        "channel": "instagram",
        "creator_id": "USR-CREATOR-001",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "All day sunblock protection without reapplication.",
        "current_content": "All day sunblock protection without reapplication.",
        "findings": []
    }
    res_sub = client.post("/api/submissions", json=sub_payload)
    sub_id = res_sub.json()["submission_id"]

    client.post(f"/api/submissions/{sub_id}/review", json={"reviewer_name": "Reviewer Meera", "decision": "APPROVE"})

    # Compliance returns for revision
    res_return = client.post(f"/api/submissions/{sub_id}/compliance", json={
        "compliance_name": "Compliance Arjun",
        "decision": "RETURN_FOR_REVISION",
        "notes": "FDA Sunscreen Final Monograph prohibits 'all day protection' or 'sunblock' claims. Reapply every 2 hours mandatory."
    })
    assert res_return.status_code == 200
    returned_sub = res_return.json()
    assert returned_sub["status"] == "RETURNED_TO_CREATOR"
    assert "FDA Sunscreen Final Monograph" in returned_sub["compliance_notes"]

    # Part 2: Outright rejection
    sub_payload2 = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Unapproved Experimental Prescription Compound",
        "channel": "instagram",
        "creator_id": "USR-AGENCY-001",
        "creator_name": "Agency Sana",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 1,
        "original_content": "Contains prescription tretinoin 0.1% over the counter.",
        "current_content": "Contains prescription tretinoin 0.1% over the counter.",
        "findings": []
    }
    res_sub2 = client.post("/api/submissions", json=sub_payload2)
    sub_id2 = res_sub2.json()["submission_id"]

    client.post(f"/api/submissions/{sub_id2}/review", json={"reviewer_name": "Reviewer Meera", "decision": "APPROVE"})

    res_reject = client.post(f"/api/submissions/{sub_id2}/compliance", json={
        "compliance_name": "Compliance Arjun",
        "decision": "REJECT",
        "notes": "Illegal distribution of Schedule H prescription drug via cosmetic channel. Permanent rejection."
    })
    assert res_reject.status_code == 200
    rejected_sub = res_reject.json()
    assert rejected_sub["status"] == "REJECTED"
    assert "Schedule H prescription drug" in rejected_sub["rejection_reason"]

def test_phase6_security_role_isolation():
    """5. Role isolation: Creators cannot sign off on review or compliance; Reviewers cannot sign off on compliance."""
    # Token for Creator
    creator_headers = _get_headers_for_role(UserRole.CREATOR, "USR-CREATOR-099", "Asha Creator")
    # Token for Reviewer
    reviewer_headers = _get_headers_for_role(UserRole.REVIEWER, "USR-REVIEWER-099", "Meera Reviewer")
    # Token for Compliance
    compliance_headers = _get_headers_for_role(UserRole.COMPLIANCE_REVIEWER, "USR-COMPLIANCE-099", "Arjun Compliance")

    # Create dummy submission
    sub = client.post("/api/submissions", json={
        "brand_id": "aurelle-tech",
        "title": "Security RBAC Post",
        "original_content": "Content test",
        "current_content": "Content test",
        "findings": []
    }).json()
    sub_id = sub["submission_id"]

    # 1. Creator attempts to review -> 403 Forbidden
    res_c_rev = client.post(f"/api/submissions/{sub_id}/review", headers=creator_headers, json={"decision": "APPROVE"})
    assert res_c_rev.status_code == 403, f"Creator must be forbidden from reviewing: {res_c_rev.text}"

    # 2. Creator attempts to approve compliance -> 403 Forbidden
    res_c_comp = client.post(f"/api/submissions/{sub_id}/compliance", headers=creator_headers, json={"decision": "APPROVE"})
    assert res_c_comp.status_code == 403, f"Creator must be forbidden from compliance approval: {res_c_comp.text}"

    # 3. Reviewer attempts to approve compliance -> 403 Forbidden
    res_r_comp = client.post(f"/api/submissions/{sub_id}/compliance", headers=reviewer_headers, json={"decision": "APPROVE"})
    assert res_r_comp.status_code == 403, f"Reviewer must be forbidden from compliance approval: {res_r_comp.text}"

    # 4. Compliance officer approves compliance -> 200 OK
    res_comp_ok = client.post(f"/api/submissions/{sub_id}/compliance", headers=compliance_headers, json={"decision": "APPROVE"})
    assert res_comp_ok.status_code == 200, f"Compliance officer must succeed: {res_comp_ok.text}"
