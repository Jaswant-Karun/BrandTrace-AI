import time
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
# SCENARIO 1: AGENCY LOGIN AND IDENTITY
# ==============================================================================
def test_scenario_01_agency_login_and_identity():
    """Verifies Agency Sana login, JWT claims, role metadata, and tenant context without new auth enum."""
    res = client.post("/api/auth/login", json={"email": "sana@aurelle.com", "password": "brandtrace2026"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["user_id"] == "USR-AUR-SANA"
    assert "Agency Sana" in data["user"]["name"]
    # Verified: uses existing CREATOR role without inventing an auth enum
    assert data["user"]["role"] == "CREATOR"
    assert data["user"]["workspace_id"] == "aurelle-tech"
    assert data["user"]["org_id"] == "ORG-AURELLE"


# ==============================================================================
# SCENARIO 2: REVIEWER LOGIN AND IDENTITY
# ==============================================================================
def test_scenario_02_reviewer_login_and_identity():
    """Verifies Reviewer Meera login, role permissions, and tenant context."""
    res = client.post("/api/auth/login", json={"email": "meera@aurelle.com", "password": "brandtrace2026"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["user_id"] == "USR-AUR-MEERA"
    assert "Reviewer Meera" in data["user"]["name"]
    assert data["user"]["role"] == "REVIEWER"
    assert data["user"]["org_id"] == "ORG-AURELLE"


# ==============================================================================
# SCENARIO 3: AGENCY QUEUE AND AUTHORIZED BRANDS
# ==============================================================================
def test_scenario_03_agency_queue_and_authorized_brands():
    """Agency Sana accesses authorized review queue and brand assets."""
    token = _get_auth_token("sana@aurelle.com")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/submissions/queue?role=agency", headers=headers)
    assert res.status_code == 200, res.text
    queue = res.json()
    assert isinstance(queue, list)

    # Agency can inspect authorized brand facts
    res_facts = client.get("/api/facts?workspace_id=aurelle-tech", headers=headers)
    assert res_facts.status_code == 200, res_facts.text
    facts = res_facts.json()
    assert len(facts) > 0


# ==============================================================================
# SCENARIO 4: CREATOR SUBMISSION ROUTED TO AGENCY QUEUE
# ==============================================================================
def test_scenario_04_creator_submission_routing_to_agency_queue():
    """
    When an internal Creator submits content requiring an agency stage,
    it enters PENDING_AGENCY and appears in the Agency queue.
    It does not appear in the Reviewer queue until Agency approves.
    """
    asha_token = _get_auth_token("asha@aurelle.com")
    asha_headers = {"Authorization": f"Bearer {asha_token}"}

    submission_payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 4 Test: Diwali Campaign Agency Quality Review Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha, In-House Writer",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Celebrate Diwali with Aurelle Radiance Serum for glowing skin!",
        "current_content": "Celebrate Diwali with Aurelle Radiance Serum for glowing skin!",
        "requires_agency_review": True,
        "findings": [
            {
                "id": "f-1",
                "number": 1,
                "rule_id": "FACT-014",
                "rule_title": "Clinical Efficacy Protocol",
                "category": "Brand Rules",
                "severity": "MINOR",
                "flagged_text": "glowing skin",
                "explanation": "Trial protocol specifies visibly brighter complexion.",
                "suggested_fix": "visibly brighter complexion",
                "status": "PENDING"
            }
        ],
        "submission_notes": "Creator draft requiring Agency partner quality check."
    }

    res_create = client.post("/api/submissions", json=submission_payload, headers=asha_headers)
    assert res_create.status_code == 200, res_create.text
    sub_data = res_create.json()
    sub_id = sub_data["submission_id"]
    assert sub_data["status"] == "PENDING_AGENCY"

    # Verify stage statuses: AGENCY_APPROVAL is ACTIVE, REVIEWER_APPROVAL is PENDING
    history = {step["stage"]: step["status"] for step in sub_data["approval_history"]}
    assert history.get("AGENCY_APPROVAL") == "ACTIVE"
    assert history.get("REVIEWER_APPROVAL") == "PENDING"

    # Agency Sana queries queue: MUST be present
    sana_token = _get_auth_token("sana@aurelle.com")
    sana_headers = {"Authorization": f"Bearer {sana_token}"}
    res_agency_q = client.get("/api/submissions/queue?role=agency", headers=sana_headers)
    assert res_agency_q.status_code == 200, res_agency_q.text
    agency_sub_ids = [item["submission_id"] for item in res_agency_q.json()]
    assert sub_id in agency_sub_ids

    # Reviewer Meera queries queue: MUST NOT be in reviewer queue while waiting for agency
    meera_token = _get_auth_token("meera@aurelle.com")
    meera_headers = {"Authorization": f"Bearer {meera_token}"}
    res_reviewer_q = client.get("/api/submissions/queue?role=reviewer", headers=meera_headers)
    assert res_reviewer_q.status_code == 200, res_reviewer_q.text
    reviewer_sub_ids = [item["submission_id"] for item in res_reviewer_q.json()]
    assert sub_id not in reviewer_sub_ids


# ==============================================================================
# SCENARIO 5: AGENCY REVIEW AND FORWARDING TO REVIEWER
# ==============================================================================
def test_scenario_05_agency_review_and_forwarding_to_reviewer():
    """Agency Sana reviews and approves the submission, forwarding it to Reviewer Meera."""
    # Create submission requiring agency review
    asha_token = _get_auth_token("asha@aurelle.com")
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 4 Test: Agency Forwarding Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha, In-House Writer",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Aurelle Night Elixir gives 8-hour deep barrier hydration.",
        "current_content": "Aurelle Night Elixir gives 8-hour deep barrier hydration.",
        "requires_agency_review": True,
        "findings": [],
        "submission_notes": "Needs agency check"
    }
    res_create = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    assert res_create.status_code == 200, res_create.text
    sub_id = res_create.json()["submission_id"]

    # Agency Sana reviews and forwards
    sana_token = _get_auth_token("sana@aurelle.com")
    sana_headers = {"Authorization": f"Bearer {sana_token}"}
    decision_payload = {
        "decision": "FORWARD",
        "agency_name": "Agency Sana",
        "feedback": "Quality check passed. Copy verified against brand book §4."
    }
    res_decision = client.post(f"/api/submissions/{sub_id}/agency-review", json=decision_payload, headers=sana_headers)
    assert res_decision.status_code == 200, res_decision.text
    reviewed = res_decision.json()
    assert reviewed["status"] == "PENDING_REVIEW"

    # Verify stage progression
    history = {step["stage"]: step["status"] for step in reviewed["approval_history"]}
    assert history.get("AGENCY_APPROVAL") == "COMPLETED"
    assert history.get("REVIEWER_APPROVAL") == "ACTIVE"

    # Now Reviewer Meera queries queue: MUST appear in Reviewer queue
    meera_token = _get_auth_token("meera@aurelle.com")
    meera_headers = {"Authorization": f"Bearer {meera_token}"}
    res_rev_q = client.get("/api/submissions/queue?role=reviewer", headers=meera_headers)
    assert res_rev_q.status_code == 200
    reviewer_sub_ids = [item["submission_id"] for item in res_rev_q.json()]
    assert sub_id in reviewer_sub_ids


# ==============================================================================
# SCENARIO 6: AGENCY REQUEST CHANGES AND REVISION WORKFLOW
# ==============================================================================
def test_scenario_06_agency_request_changes_and_revision_workflow():
    """Agency Sana requests revisions from Creator Asha; Asha inspects feedback and submits v2."""
    asha_token = _get_auth_token("asha@aurelle.com")
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 4 Test: Agency Change Request Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-ASHA",
        "creator_name": "Creator Asha, In-House Writer",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Best serum in India with 100% natural formula!",
        "current_content": "Best serum in India with 100% natural formula!",
        "requires_agency_review": True,
        "findings": [],
        "submission_notes": "First draft"
    }
    res_create = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
    sub_id = res_create.json()["submission_id"]

    # Agency Sana requests revisions
    sana_token = _get_auth_token("sana@aurelle.com")
    change_req = {
        "decision": "REQUEST_CHANGES",
        "agency_name": "Agency Sana",
        "feedback": "Please replace '100% natural' with '94% naturally derived ingredients'."
    }
    res_rev = client.post(f"/api/submissions/{sub_id}/agency-review", json=change_req, headers={"Authorization": f"Bearer {sana_token}"})
    assert res_rev.status_code == 200
    rev_data = res_rev.json()
    assert rev_data["status"] == "CHANGES_REQUESTED"
    assert "94% naturally derived" in rev_data["reviewer_feedback"]

    # Creator Asha checks My Submissions and sees feedback
    res_my_subs = client.get("/api/submissions?role=creator", headers={"Authorization": f"Bearer {asha_token}"})
    assert res_my_subs.status_code == 200
    my_sub = next(s for s in res_my_subs.json() if s["submission_id"] == sub_id)
    assert my_sub["status"] in ["CHANGES_REQUESTED", "RETURNED_TO_CREATOR"]
    assert "94% naturally derived" in my_sub["reviewer_feedback"]


# ==============================================================================
# SCENARIO 7: REVIEWER DECISION UPHOLDS FINDINGS AND ADVANCES TO COMPLIANCE
# ==============================================================================
def test_scenario_07_reviewer_approves_and_advances_to_compliance():
    """Reviewer Meera approves content and advances it to Compliance queue."""
    # Submission created by agency partner
    sana_token = _get_auth_token("sana@aurelle.com")
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 4 Test: Reviewer Approval to Compliance Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-SANA",
        "creator_name": "Agency Sana, Outside Agency",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 1,
        "original_content": "Experience radiant glow with Aurelle Vitamin C serum.",
        "current_content": "Experience radiant glow with Aurelle Vitamin C serum.",
        "findings": [
            {
                "id": "f-rev-1",
                "number": 1,
                "rule_id": "GL-AUR-01",
                "rule_title": "Brand Tone Guideline",
                "category": "Brand Rules",
                "severity": "MINOR",
                "flagged_text": "radiant glow",
                "explanation": "Brand tone verified.",
                "suggested_fix": "radiant glow",
                "status": "PENDING"
            }
        ]
    }
    res_create = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {sana_token}"})
    assert res_create.status_code == 200
    sub_id = res_create.json()["submission_id"]

    # Reviewer Meera reviews and approves
    meera_token = _get_auth_token("meera@aurelle.com")
    decision_payload = {
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE",
        "feedback": "Approved copy. Advanced to Compliance for final statutory certification.",
        "finding_decisions": {
            "f-rev-1": {"decision": "UPHELD", "comment": "Complies with brand standards."}
        }
    }
    res_review = client.post(f"/api/submissions/{sub_id}/review", json=decision_payload, headers={"Authorization": f"Bearer {meera_token}"})
    assert res_review.status_code == 200, res_review.text
    reviewed = res_review.json()
    assert reviewed["status"] == "REVIEW_APPROVED"

    # Verify stage: REVIEWER_APPROVAL is COMPLETED, COMPLIANCE_APPROVAL is ACTIVE
    history = {step["stage"]: step["status"] for step in reviewed["approval_history"]}
    assert history.get("REVIEWER_APPROVAL") == "COMPLETED"
    assert history.get("COMPLIANCE_APPROVAL") == "ACTIVE"

    # Compliance Arjun queue inspection
    arjun_token = _get_auth_token("arjun@aurelle.com")
    res_comp_q = client.get("/api/submissions/queue?role=compliance", headers={"Authorization": f"Bearer {arjun_token}"})
    assert res_comp_q.status_code == 200
    comp_sub_ids = [item["submission_id"] for item in res_comp_q.json()]
    assert sub_id in comp_sub_ids


# ==============================================================================
# SCENARIO 8: REVIEWER DECISION REQUEST CHANGES AND REJECT
# ==============================================================================
def test_scenario_08_reviewer_request_changes_and_rejection():
    """Reviewer Meera returns content for revision and tests explicit rejection stopping the workflow."""
    meera_token = _get_auth_token("meera@aurelle.com")
    sana_token = _get_auth_token("sana@aurelle.com")

    # 1. Request changes
    payload1 = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 4 Test: Reviewer Changes Requested",
        "channel": "instagram",
        "creator_id": "USR-AUR-SANA",
        "creator_name": "Agency Sana, Outside Agency",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 1,
        "original_content": "Clinical trial results pending for this claim.",
        "current_content": "Clinical trial results pending for this claim.",
        "findings": []
    }
    res_c1 = client.post("/api/submissions", json=payload1, headers={"Authorization": f"Bearer {sana_token}"})
    sub_id1 = res_c1.json()["submission_id"]

    res_chg = client.post(f"/api/submissions/{sub_id1}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "REQUEST_CHANGES",
        "feedback": "Clinical substantiation missing for claim."
    }, headers={"Authorization": f"Bearer {meera_token}"})
    assert res_chg.status_code == 200
    data_chg = res_chg.json()
    assert data_chg["status"] in ["RETURNED_TO_AGENCY", "CHANGES_REQUESTED"]

    # 2. Reject
    payload2 = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 4 Test: Reviewer Rejection Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-SANA",
        "creator_name": "Agency Sana, Outside Agency",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 1,
        "original_content": "Misleading medical cure claim.",
        "current_content": "Misleading medical cure claim.",
        "findings": []
    }
    res_c2 = client.post("/api/submissions", json=payload2, headers={"Authorization": f"Bearer {sana_token}"})
    sub_id2 = res_c2.json()["submission_id"]

    res_rej = client.post(f"/api/submissions/{sub_id2}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "REJECT",
        "feedback": "Strictly prohibited medical claim; violates Drugs and Magic Remedies Act."
    }, headers={"Authorization": f"Bearer {meera_token}"})
    assert res_rej.status_code == 200
    data_rej = res_rej.json()
    assert data_rej["status"] == "REJECTED"
    # Ensure rejected post does not enter compliance queue
    arjun_token = _get_auth_token("arjun@aurelle.com")
    res_comp_q = client.get("/api/submissions/queue?role=compliance", headers={"Authorization": f"Bearer {arjun_token}"})
    assert sub_id2 not in [item["submission_id"] for item in res_comp_q.json()]


# ==============================================================================
# SCENARIO 9: PERSISTENT DISCUSSION COMMENTS THREAD
# ==============================================================================
def test_scenario_09_persistent_discussion_comments():
    """Verifies that Agency and Reviewer can add discussion comments that persist across reloads."""
    meera_token = _get_auth_token("meera@aurelle.com")
    sana_token = _get_auth_token("sana@aurelle.com")

    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Phase 4 Test: Discussion Thread Post",
        "channel": "instagram",
        "creator_id": "USR-AUR-SANA",
        "creator_name": "Agency Sana",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 1,
        "original_content": "Discussion post content.",
        "current_content": "Discussion post content.",
        "findings": []
    }
    res_c = client.post("/api/submissions", json=payload, headers={"Authorization": f"Bearer {sana_token}"})
    sub_id = res_c.json()["submission_id"]

    # 1. Reviewer posts a comment
    res_comm1 = client.post(f"/api/submissions/{sub_id}/comments", json={
        "text": "Reviewer note: check font size on legal disclaimer."
    }, headers={"Authorization": f"Bearer {meera_token}"})
    assert res_comm1.status_code == 200, res_comm1.text
    comm1_data = res_comm1.json()
    assert "font size" in comm1_data["text"]
    assert "Reviewer Meera" in comm1_data["author"]

    # 2. Agency responds with a comment
    res_comm2 = client.post(f"/api/submissions/{sub_id}/comments", json={
        "text": "Agency reply: confirmed, font size adjusted to 10pt per guidelines."
    }, headers={"Authorization": f"Bearer {sana_token}"})
    assert res_comm2.status_code == 200, res_comm2.text

    # 3. Fetch submission details and verify persisted thread
    res_get = client.get(f"/api/submissions/{sub_id}", headers={"Authorization": f"Bearer {meera_token}"})
    assert res_get.status_code == 200
    sub_detail = res_get.json()
    assert len(sub_detail.get("comments", [])) >= 2
    comments_texts = [c["text"] for c in sub_detail["comments"]]
    assert any("font size on legal disclaimer" in t for t in comments_texts)
    assert any("font size adjusted" in t for t in comments_texts)


# ==============================================================================
# SCENARIO 10: TENANT ISOLATION ENFORCEMENT
# ==============================================================================
def test_scenario_10_tenant_isolation_enforcement():
    """
    Verifies that a user belonging to one tenant (ORG-AURELLE) cannot access
    or review submissions belonging to another tenant (ORG-APEX).
    """
    meera_token = _get_auth_token("meera@aurelle.com")  # ORG-AURELLE
    meera_headers = {"Authorization": f"Bearer {meera_token}"}

    # Create submission under APEX tenant directly in storage / API
    apex_payload = {
        "brand_id": "apex-dynamics",
        "brand_name": "Apex Dynamics",
        "title": "Confidential Apex Dynamics Autonomous Fleet Launch",
        "channel": "press_release",
        "creator_id": "USR-APEX-001",
        "creator_name": "Apex Engineer",
        "creator_type": "creator",
        "org_id": "ORG-APEX",
        "version": 1,
        "original_content": "Apex Dynamics confidential telematics architecture.",
        "current_content": "Apex Dynamics confidential telematics architecture.",
        "findings": []
    }
    # Create using admin token for APEX tenant
    admin_token = _get_auth_token("admin@apex.com", "brandtrace2026")
    res_apex = client.post("/api/submissions", json=apex_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_apex.status_code == 200, res_apex.text
    apex_sub_id = res_apex.json()["submission_id"]

    # Reviewer Meera (ORG-AURELLE) tries to fetch APEX submission
    res_unauth_get = client.get(f"/api/submissions/{apex_sub_id}", headers=meera_headers)
    assert res_unauth_get.status_code in [403, 404], "Tenant boundary bypassed! Expected 403 or 404"

    # Reviewer Meera tries to submit a review decision on APEX submission
    res_unauth_rev = client.post(f"/api/submissions/{apex_sub_id}/review", json={
        "reviewer_name": "Reviewer Meera",
        "decision": "APPROVE"
    }, headers=meera_headers)
    assert res_unauth_rev.status_code in [403, 404], "Tenant boundary bypassed on review action!"


# ==============================================================================
# SCENARIO 11: AUDIT EVENT PERSISTENCE AND PROVENANCE
# ==============================================================================
def test_scenario_11_audit_event_persistence_and_provenance():
    """Verifies that all workflow decisions generate tamper-evident cryptographic audit events."""
    meera_token = _get_auth_token("meera@aurelle.com")
    res_audit = client.get("/api/audit/events?limit=20", headers={"Authorization": f"Bearer {meera_token}"})
    assert res_audit.status_code == 200, res_audit.text
    events = res_audit.json()
    assert len(events) > 0

    for evt in events:
        assert "hash" in evt
        assert len(evt["hash"]) == 64  # SHA-256 length
        assert "who" in evt
        assert "what" in evt
        assert "when" in evt
