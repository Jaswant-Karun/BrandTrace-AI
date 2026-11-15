from fastapi.testclient import TestClient
from brandtrace.main import app

client = TestClient(app)

def test_phase5_creator_submission_reaches_reviewer():
    """1. Creator submission reaching Reviewer queue with exact content fidelity."""
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Asha Serum Reel Copy",
        "channel": "instagram",
        "creator_id": "USR-CREATOR-001",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Aurelle Serum reduces wrinkles by 90% in 1 day! Only at ₹499.",
        "current_content": "Aurelle Serum reduces wrinkles by 90% in 1 day! Only at ₹499.",
        "findings": [
            {
                "id": "f-101",
                "number": 1,
                "rule_id": "FACT-014",
                "rule_title": "Efficacy Benchmark",
                "category": "Approved Brand Claims",
                "severity": "BLOCKING",
                "sentence_index": 0,
                "original_sentence": "reduces wrinkles by 90% in 1 day!",
                "flagged_text": "90% in 1 day",
                "explanation": "Clinical study confirms 32% in 8 weeks.",
                "suggested_fix": "32% in 8 weeks",
                "status": "PENDING"
            }
        ],
        "submission_notes": "Creator Asha v1 submission"
    }
    res = client.post("/api/submissions", json=payload)
    assert res.status_code == 200, res.text
    sub_id = res.json()["submission_id"]

    # Verify present in Reviewer queue
    res_queue = client.get("/api/submissions/queue")
    assert res_queue.status_code == 200
    queue = res_queue.json()
    matched = next((item for item in queue if item["submission_id"] == sub_id), None)
    assert matched is not None, f"Creator submission {sub_id} not found in reviewer queue"
    assert matched["creator_name"] == "Creator Asha"
    assert matched["creator_type"] == "creator"
    assert matched["org_id"] == "ORG-AURELLE"
    assert matched["original_content"] == payload["original_content"]

def test_phase5_agency_submission_reaches_reviewer():
    """2. Agency submission reaching Reviewer queue with client brand context."""
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Agency Pulse: Diwali Festive Teaser",
        "channel": "web",
        "creator_id": "USR-AGENCY-001",
        "creator_name": "Agency Sana",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 1,
        "original_content": "100% organic skincare with Aurelle Skin this Diwali season.",
        "current_content": "100% organic skincare with Aurelle Skin this Diwali season.",
        "findings": [
            {
                "id": "f-201",
                "number": 1,
                "rule_id": "REG-01",
                "rule_title": "Greenwashing Regulation",
                "category": "Regulatory Greenwashing",
                "severity": "BLOCKING",
                "sentence_index": 0,
                "original_sentence": "100% organic skincare with Aurelle Skin",
                "flagged_text": "100% organic",
                "explanation": "Absolute organic claims must provide certified organic accreditation.",
                "suggested_fix": "Formulated with certified organic seed extracts",
                "status": "PENDING"
            }
        ],
        "submission_notes": "Agency client draft submission"
    }
    res = client.post("/api/submissions", json=payload)
    assert res.status_code == 200, res.text
    sub_id = res.json()["submission_id"]

    # Verify in Reviewer queue
    res_queue = client.get("/api/submissions/queue")
    assert res_queue.status_code == 200
    queue = res_queue.json()
    matched = next((item for item in queue if item["submission_id"] == sub_id), None)
    assert matched is not None, f"Agency submission {sub_id} not found in reviewer queue"
    assert matched["creator_name"] == "Agency Sana"
    assert matched["creator_type"] == "agency"
    assert matched["org_id"] == "ORG-AGENCY-PULSE"

def test_phase5_reviewer_upholds_and_overturns_findings():
    """3 & 4. Reviewer upholding a finding and overturning a finding with reasoning."""
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Dual Finding Review Post",
        "channel": "instagram",
        "creator_id": "USR-CREATOR-002",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "100% natural formula clinically backed by 50 patients.",
        "current_content": "100% natural formula clinically backed by 50 patients.",
        "findings": [
            {
                "id": "f-301",
                "number": 1,
                "rule_id": "REG-01",
                "rule_title": "Greenwashing Check",
                "category": "Regulatory Greenwashing",
                "severity": "BLOCKING",
                "sentence_index": 0,
                "original_sentence": "100% natural formula",
                "flagged_text": "100% natural",
                "explanation": "Absolute natural claim prohibited.",
                "suggested_fix": "94% naturally derived ingredients",
                "status": "PENDING"
            },
            {
                "id": "f-302",
                "number": 2,
                "rule_id": "FACT-005",
                "rule_title": "Sensitive Skin Testing",
                "category": "Approved Brand Claims",
                "severity": "MINOR",
                "sentence_index": 0,
                "original_sentence": "clinically backed by 50 patients",
                "flagged_text": "50 patients",
                "explanation": "Verify if study participants were patients or healthy volunteers.",
                "suggested_fix": "tested on 50 participants",
                "status": "PENDING"
            }
        ]
    }
    res_sub = client.post("/api/submissions", json=payload)
    assert res_sub.status_code == 200
    sub_id = res_sub.json()["submission_id"]

    # Reviewer records decisions: Uphold #1, Overturn #2 with reason
    review_body = {
        "reviewer_name": "Reviewer Meera",
        "decision": "REQUEST_CHANGES",
        "feedback": "Upholding green claim blocker. Overruling participant phrasing.",
        "finding_decisions": {
            "f-301": {
                "decision": "UPHELD",
                "comment": "Enforcing ASCI guideline §260.4"
            },
            "f-302": {
                "decision": "OVERRULED",
                "overrule_reason": "Dermatology protocol AUR-LAB-005 explicitly used 50 sensitive-skin patients with clinical doctor supervision.",
                "comment": "Approved exception based on certified lab report"
            }
        }
    }
    res_review = client.post(f"/api/submissions/{sub_id}/review", json=review_body)
    assert res_review.status_code == 200, res_review.text
    reviewed = res_review.json()

    # Verify Finding #1 is UPHELD
    f1 = next(f for f in reviewed["findings"] if f["id"] == "f-301")
    assert f1["decision"] == "UPHELD"
    assert f1["resolved"] is True

    # Verify Finding #2 is OVERRULED and reason persisted
    f2 = next(f for f in reviewed["findings"] if f["id"] == "f-302")
    assert f2["decision"] == "OVERRULED"
    assert f2["resolved"] is True
    assert "protocol AUR-LAB-005" in f2["overrule_reason"]

def test_phase5_reviewer_returns_content_for_revision():
    """5. Reviewer returning content -> sets RETURNED_TO_CREATOR/AGENCY with feedback."""
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Post for Return Review",
        "channel": "instagram",
        "creator_id": "USR-CREATOR-003",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Guaranteed cure for acne in 24 hours!",
        "current_content": "Guaranteed cure for acne in 24 hours!",
        "findings": [
            {
                "id": "f-401",
                "number": 1,
                "rule_id": "FDA-CURE-01",
                "rule_title": "Therapeutic Cure Prohibition",
                "category": "Medical / Disease Treatment",
                "severity": "BLOCKING",
                "sentence_index": 0,
                "original_sentence": "Guaranteed cure for acne in 24 hours!",
                "flagged_text": "Guaranteed cure",
                "explanation": "Cosmetic products cannot claim therapeutic cures.",
                "suggested_fix": "Helps clarify acne-prone skin",
                "status": "PENDING"
            }
        ]
    }
    res_sub = client.post("/api/submissions", json=payload)
    assert res_sub.status_code == 200
    sub_id = res_sub.json()["submission_id"]

    # Reviewer sends back for revision
    res_return = client.post(
        f"/api/submissions/{sub_id}/review",
        json={
            "reviewer_name": "Reviewer Meera",
            "decision": "REQUEST_CHANGES",
            "feedback": "Remove 'guaranteed cure' and replace with 'clarifying support' per CDSCO regulations."
        }
    )
    assert res_return.status_code == 200
    returned_sub = res_return.json()
    assert returned_sub["status"] in ["RETURNED_TO_CREATOR", "CHANGES_REQUESTED"]
    assert "CDSCO regulations" in returned_sub["reviewer_feedback"]

    # Verify visible in Creator dashboard submissions list
    res_list = client.get("/api/submissions?role=creator")
    assert res_list.status_code == 200
    subs = res_list.json()
    found = next(s for s in subs if s["submission_id"] == sub_id)
    assert found["status"] in ["RETURNED_TO_CREATOR", "CHANGES_REQUESTED"]
    assert "CDSCO regulations" in found["reviewer_feedback"]

def test_phase5_reviewer_approves_content_and_advances_to_compliance():
    """6. Reviewer approving content -> REVIEW_APPROVED and moves to Compliance queue."""
    payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Clean Compliant Post for Final Approval",
        "channel": "instagram",
        "creator_id": "USR-CREATOR-004",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 2,
        "original_content": "Hydrating barrier support with 5 ceramides. Dermatologist tested.",
        "current_content": "Hydrating barrier support with 5 ceramides. Dermatologist tested.",
        "findings": [
            {
                "id": "f-501",
                "number": 1,
                "rule_id": "FACT-005",
                "rule_title": "Dermatologist Tested",
                "category": "Approved Brand Claims",
                "severity": "MINOR",
                "sentence_index": 0,
                "original_sentence": "Dermatologist tested.",
                "flagged_text": "Dermatologist tested",
                "explanation": "Certified by clinical study AUR-LAB-005.",
                "suggested_fix": "Dermatologist tested",
                "status": "PENDING"
            }
        ]
    }
    res_sub = client.post("/api/submissions", json=payload)
    assert res_sub.status_code == 200
    sub_id = res_sub.json()["submission_id"]

    # Reviewer approves submission
    res_approve = client.post(
        f"/api/submissions/{sub_id}/review",
        json={
            "reviewer_name": "Reviewer Meera",
            "decision": "APPROVE",
            "feedback": "All claims backed by verified facts. Forwarding to Compliance Arjun."
        }
    )
    assert res_approve.status_code == 200
    approved_data = res_approve.json()
    assert approved_data["status"] in ["REVIEW_APPROVED", "APPROVED"]

    # Verify approval step history
    reviewer_step = next(s for s in approved_data["approval_history"] if s["stage"] == "REVIEWER_APPROVAL")
    assert reviewer_step["status"] == "COMPLETED"

    # Verify present in Compliance view/queue
    res_queue = client.get("/api/submissions/queue")
    assert res_queue.status_code == 200
    queue = res_queue.json()
    in_queue = next(item for item in queue if item["submission_id"] == sub_id)
    assert in_queue["status"] in ["REVIEW_APPROVED", "APPROVED"]
