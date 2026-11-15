import pytest
import time
from fastapi.testclient import TestClient
from brandtrace.main import app
from brandtrace.core.security import create_access_token
from brandtrace.modules.auth.models import UserRole

client = TestClient(app)

def get_auth_header(role: UserRole = UserRole.ADMIN, name: str = "Chief Governance Officer") -> dict:
    token = create_access_token({
        "sub": "USR-GOV-01",
        "email": "governance@aurelle.com",
        "role": role.value,
        "org_id": "ORG-AURELLE",
        "name": name
    })
    return {"Authorization": f"Bearer {token}"}

def test_full_five_role_workflow_lifecycle():
    auth_headers = get_auth_header()

    # ----------------------------------------------------------------------
    # 1. CREATOR WORKFLOW
    # ----------------------------------------------------------------------
    # Step 1.1: Creator writes draft content and runs content inspection
    draft_content = (
        "Meet the NEW Aurelle Vitamin-C serum! 100% natural, eco-friendly and "
        "clinically proven to fade dark spots by 60% in just 2 weeks. Zero side effects. Shop today!"
    )
    verify_res = client.post("/api/verify", json={
        "brand_id": "aurelle-tech",
        "content": draft_content,
        "campaign_name": "Aurelle Vitamin C Launch",
        "channel": "instagram",
        "key_phrases": "dark spots, vitamin c",
        "call_to_action": "Shop"
    }, headers=auth_headers)
    assert verify_res.status_code == 200, f"Verify failed: {verify_res.text}"
    analysis_data = verify_res.json()
    assert "sentence_findings" in analysis_data or "all_risk_spans" in analysis_data

    # Step 1.2: Creator applies certified corrections and submits to Reviewer Queue
    corrected_content = (
        "Meet the NEW Aurelle Vitamin-C serum! Formulated with 94% naturally derived ingredients and "
        "clinically shown to fade dark spots by 32% in 8 weeks (FACT-014). Dermatologist tested. Shop now!"
    )
    creator_sub_res = client.post("/api/submissions", json={
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "creator_id": "creator-asha@aurelle.com",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "channel": "instagram",
        "title": "Aurelle Vitamin C Serum Launch Post",
        "original_content": draft_content,
        "current_content": corrected_content,
        "version": 1,
        "status": "PENDING_REVIEW",
        "findings": [
            {
                "id": "f-1",
                "number": 1,
                "rule_id": "FACT-014",
                "rule_title": "Approved Clinical Trial Benchmark",
                "category": "Approved Brand Claims",
                "severity": "BLOCKING",
                "sentence_text": "fade dark spots by 60% in just 2 weeks",
                "flagged_text": "by 60% in just 2 weeks",
                "suggested_fix": "by 32% in 8 weeks (FACT-014)",
                "explanation": "Clinical evidence confirms 32% reduction under protocol AUR-LAB-014.",
                "decision": "UPHELD",
                "resolved": True
            }
        ],
        "submission_notes": "Draft corrected with FACT-014 evidence citation."
    }, headers=auth_headers)
    assert creator_sub_res.status_code == 200, f"Creator submission failed: {creator_sub_res.text}"
    creator_sub = creator_sub_res.json()
    creator_sub_id = creator_sub["submission_id"]
    assert creator_sub["status"] == "PENDING_REVIEW"
    assert creator_sub["creator_type"] == "creator"

    # ----------------------------------------------------------------------
    # 2. AGENCY WORKFLOW
    # ----------------------------------------------------------------------
    agency_draft = (
        "Something game-changing is dropping this Friday. Aurelle Skin is launching the ultimate defense. "
        "100% natural, zero toxins, guaranteed glass skin in 7 days."
    )
    agency_sub_res = client.post("/api/submissions", json={
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "creator_id": "USR-AGENCY-001",
        "creator_name": "Agency Sana",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "channel": "instagram",
        "title": "Agency Teaser: Aurelle Environmental Defense",
        "original_content": agency_draft,
        "current_content": agency_draft,
        "version": 1,
        "status": "PENDING_REVIEW",
        "findings": [
            {
                "id": "f-agy-1",
                "number": 1,
                "rule_id": "REG-01",
                "rule_title": "ASCI Greenwashing Directive",
                "category": "Regulatory Greenwashing",
                "severity": "BLOCKING",
                "sentence_text": "100% natural, zero toxins",
                "flagged_text": "100% natural, zero toxins",
                "suggested_fix": "formulated with 94% naturally derived ingredients",
                "explanation": "Absolute green claims require lifecycle proof.",
                "decision": "UNDECIDED",
                "resolved": False
            }
        ],
        "submission_notes": "Agency campaign draft for client Aurelle Skin."
    }, headers=auth_headers)
    assert agency_sub_res.status_code == 200, f"Agency submission failed: {agency_sub_res.text}"
    agency_sub = agency_sub_res.json()
    agency_sub_id = agency_sub["submission_id"]
    assert agency_sub["creator_type"] == "agency"
    assert agency_sub["org_id"] == "ORG-AGENCY-PULSE"

    # ----------------------------------------------------------------------
    # 3. REVIEWER WORKFLOW
    # ----------------------------------------------------------------------
    # Step 3.1: Reviewer gets queue (must show both Creator and Agency submissions)
    rev_queue_res = client.get("/api/submissions/queue?role=reviewer", headers=auth_headers)
    assert rev_queue_res.status_code == 200
    rev_queue = rev_queue_res.json()
    rev_ids = [s["submission_id"] for s in rev_queue]
    assert creator_sub_id in rev_ids, f"Creator sub {creator_sub_id} not in reviewer queue"
    assert agency_sub_id in rev_ids, f"Agency sub {agency_sub_id} not in reviewer queue"

    # Step 3.2: Reviewer approves Creator submission
    rev_dec_res = client.post(f"/api/submissions/{creator_sub_id}/review", json={
        "decision": "APPROVE",
        "reviewer_name": "Reviewer Meera",
        "feedback": "All claims verified against FACT-014. Approved for compliance sign-off.",
        "finding_decisions": {"f-1": {"decision": "UPHELD", "comment": "Verified against clinical trial."}}
    }, headers=auth_headers)
    assert rev_dec_res.status_code == 200
    rev_sub = rev_dec_res.json()
    assert rev_sub["status"] == "REVIEW_APPROVED"

    # Step 3.3: Reviewer returns Agency submission for revision
    agy_rev_res = client.post(f"/api/submissions/{agency_sub_id}/review", json={
        "decision": "REQUEST_CHANGES",
        "reviewer_name": "Reviewer Meera",
        "feedback": "Please remove '100% natural' and 'guaranteed glass skin in 7 days' per REG-01.",
        "finding_decisions": {"f-agy-1": {"decision": "UPHELD", "comment": "Violates green claims directive."}}
    }, headers=auth_headers)
    assert agy_rev_res.status_code == 200
    agy_returned = agy_rev_res.json()
    assert agy_returned["status"] == "RETURNED_TO_AGENCY"

    # ----------------------------------------------------------------------
    # 4. AGENCY REVISION WORKFLOW
    # ----------------------------------------------------------------------
    # Agency resubmits as version 2
    agency_v2_content = (
        "Something game-changing is dropping this Friday. Aurelle Skin is launching the ultimate defense "
        "with 94% naturally derived ingredients for visibly brighter skin. Link in bio!"
    )
    agy_resubmit_res = client.post("/api/submissions", json={
        "submission_id": agency_sub_id,
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "creator_id": "USR-AGENCY-001",
        "creator_name": "Agency Sana",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "channel": "instagram",
        "title": "Agency Teaser: Aurelle Environmental Defense (v2)",
        "original_content": agency_draft,
        "current_content": agency_v2_content,
        "version": 2,
        "status": "PENDING_REVIEW",
        "findings": [],
        "submission_notes": "Version 2 resubmitted addressing Reviewer Meera's feedback."
    }, headers=auth_headers)
    assert agy_resubmit_res.status_code == 200
    assert agy_resubmit_res.json()["status"] == "PENDING_REVIEW"
    assert agy_resubmit_res.json()["version"] == 2

    # Reviewer approves Agency v2
    agy_v2_app_res = client.post(f"/api/submissions/{agency_sub_id}/review", json={
        "decision": "APPROVE",
        "reviewer_name": "Reviewer Meera",
        "feedback": "V2 revisions approved. Ready for compliance verification."
    }, headers=auth_headers)
    assert agy_v2_app_res.status_code == 200
    assert agy_v2_app_res.json()["status"] == "REVIEW_APPROVED"

    # ----------------------------------------------------------------------
    # 5. COMPLIANCE WORKFLOW
    # ----------------------------------------------------------------------
    # Step 5.1: Compliance queue shows REVIEW_APPROVED submissions
    comp_queue_res = client.get("/api/submissions/queue?role=compliance", headers=auth_headers)
    assert comp_queue_res.status_code == 200
    comp_queue = comp_queue_res.json()
    comp_ids = [s["submission_id"] for s in comp_queue]
    assert creator_sub_id in comp_ids
    assert agency_sub_id in comp_ids

    # Step 5.2: Compliance officer signs off Creator submission
    comp_dec_res = client.post(f"/api/submissions/{creator_sub_id}/compliance", json={
        "decision": "APPROVE",
        "compliance_name": "Compliance Arjun",
        "notes": "Statutory requirements verified under ASCI and FDA Fair Balance doctrine. Compliance approved."
    }, headers=auth_headers)
    assert comp_dec_res.status_code == 200
    comp_sub = comp_dec_res.json()
    assert comp_sub["status"] == "COMPLIANCE_APPROVED"

    # ----------------------------------------------------------------------
    # 6. BRAND OWNER WORKFLOW
    # ----------------------------------------------------------------------
    # Step 6.1: Brand owner queue shows COMPLIANCE_APPROVED submissions
    bo_queue_res = client.get("/api/submissions/queue?role=brand-owner", headers=auth_headers)
    assert bo_queue_res.status_code == 200
    bo_queue = bo_queue_res.json()
    bo_ids = [s["submission_id"] for s in bo_queue]
    assert creator_sub_id in bo_ids

    # Step 6.2: Brand Owner grants Final Release Approval
    bo_dec_res = client.post(f"/api/submissions/{creator_sub_id}/final-approval", json={
        "decision": "FINAL_APPROVE",
        "approver_name": "Brand Owner Kabir",
        "notes": "Authorized for publication across Instagram with cryptographic release proof.",
        "reason": "Final brand governance release sign-off."
    }, headers=auth_headers)
    assert bo_dec_res.status_code == 200
    released_sub = bo_dec_res.json()
    assert released_sub["status"] in ["APPROVED", "RELEASED"]
    assert released_sub.get("release_id") is not None
    assert released_sub["release_id"].startswith("BT-REL-2026-")
    assert released_sub.get("release_digest") is not None
    release_id = released_sub["release_id"]
    release_digest = released_sub["release_digest"]

    # ----------------------------------------------------------------------
    # 7. PUBLIC ZERO-AUTHENTICATION VERIFICATION
    # ----------------------------------------------------------------------
    pub_verify_res = client.get(f"/api/public/verify/{release_id}")
    assert pub_verify_res.status_code == 200
    pub_data = pub_verify_res.json()
    assert pub_data["is_authentic"] is True
    assert pub_data["status"] == "APPROVED"
    assert pub_data["computed_hash"] == release_digest or pub_data.get("recorded_hash") == release_digest

    # Verify by seal code directly
    seal_verify_res = client.post("/api/public/verify-seal", json={
        "seal_code": release_id,
        "brand_id": "aurelle-tech"
    })
    assert seal_verify_res.status_code == 200
    assert seal_verify_res.json()["is_authentic"] is True

    # ----------------------------------------------------------------------
    # 8. AUDIT LOG LEDGER VERIFICATION
    # ----------------------------------------------------------------------
    audit_res = client.get("/api/audit/events?limit=20", headers=auth_headers)
    assert audit_res.status_code == 200
    audit_events = audit_res.json()
    assert len(audit_events) > 0
    actors = [e["who"] for e in audit_events]
    assert any("Creator" in a or "Asha" in a or "Reviewer" in a or "Kabir" in a for a in actors)
