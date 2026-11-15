from fastapi.testclient import TestClient
from brandtrace.main import app

client = TestClient(app)

def test_unified_creator_and_agency_submissions_flow():
    """
    Tests the unified submission pipeline:
    1. Creator Asha submits a post.
    2. Agency Sana submits a post on behalf of client Aurelle Skin.
    3. Both appear in the centralized Reviewer queue.
    4. Reviewer Meera reviews the Agency submission and requests changes.
    5. Agency Sana inspects feedback and resubmits version 2.
    """
    # 1. Creator Asha submission
    creator_payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Creator Asha: Hydration Routine Serum Post",
        "channel": "instagram",
        "creator_id": "USR-CREATOR-001",
        "creator_name": "Creator Asha",
        "creator_type": "creator",
        "org_id": "ORG-AURELLE",
        "version": 1,
        "original_content": "Obsessed with Aurelle Serum! Clinically proven to reduce dark spots by 32% in 8 weeks.",
        "current_content": "Obsessed with Aurelle Serum! Clinically proven to reduce dark spots by 32% in 8 weeks.",
        "findings": [
            {
                "id": "f-1",
                "number": 1,
                "rule_id": "FACT-014",
                "rule_title": "Clinical Hydration Benchmark",
                "category": "Approved Brand Claims",
                "severity": "MINOR",
                "sentence_index": 0,
                "original_sentence": "Clinically proven to reduce dark spots by 32% in 8 weeks.",
                "flagged_text": "32% in 8 weeks",
                "explanation": "Complies with clinical trial protocol AUR-LAB-014.",
                "suggested_fix": "32% in 8 weeks",
                "status": "PENDING"
            }
        ],
        "submission_notes": "Initial Creator draft for review"
    }
    res_creator = client.post("/api/submissions", json=creator_payload)
    assert res_creator.status_code == 200, res_creator.text
    creator_data = res_creator.json()
    creator_sub_id = creator_data["id"]
    assert creator_data["creator_type"] == "creator"
    assert creator_data["org_id"] == "ORG-AURELLE"

    # 2. Agency Sana submission
    agency_payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Agency Sana: Diwali Campaign Teaser Post",
        "channel": "instagram",
        "creator_id": "USR-AGENCY-001",
        "creator_name": "Agency Sana",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 1,
        "original_content": "Get 100% natural flawless skin with Aurelle this Diwali!",
        "current_content": "Get 100% natural flawless skin with Aurelle this Diwali!",
        "findings": [
            {
                "id": "f-1",
                "number": 1,
                "rule_id": "REG-01",
                "rule_title": "Greenwashing Directive",
                "category": "Regulatory Greenwashing",
                "severity": "BLOCKING",
                "sentence_index": 0,
                "original_sentence": "Get 100% natural flawless skin",
                "flagged_text": "100% natural",
                "explanation": "Prohibited absolute green claim.",
                "suggested_fix": "formulated with 94% naturally derived ingredients",
                "status": "PENDING"
            }
        ],
        "submission_notes": "Agency partner teaser draft submitted for client Aurelle Skin"
    }
    res_agency = client.post("/api/submissions", json=agency_payload)
    assert res_agency.status_code == 200, res_agency.text
    agency_data = res_agency.json()
    agency_sub_id = agency_data["id"]
    assert agency_data["creator_type"] == "agency"
    assert agency_data["org_id"] == "ORG-AGENCY-PULSE"

    # 3. Check Centralized Reviewer Queue
    res_queue = client.get("/api/submissions/queue")
    assert res_queue.status_code == 200, res_queue.text
    queue = res_queue.json()
    queue_ids = [item["id"] for item in queue]
    assert creator_sub_id in queue_ids
    assert agency_sub_id in queue_ids

    # Verify agency item metadata in queue
    agency_in_queue = next(item for item in queue if item["id"] == agency_sub_id)
    assert agency_in_queue["creator_type"] == "agency"
    assert agency_in_queue["org_id"] == "ORG-AGENCY-PULSE"
    assert agency_in_queue["creator_name"] == "Agency Sana"

    # 4. Reviewer Meera reviews Agency submission: requests changes
    review_payload = {
        "reviewer_name": "Reviewer Meera",
        "decision": "REQUEST_CHANGES",
        "feedback": "Please replace '100% natural' with '94% naturally derived ingredients' to comply with ASCI.",
        "finding_decisions": {
            "f-1": {"decision": "UPHELD"}
        }
    }
    res_review = client.post(f"/api/submissions/{agency_sub_id}/review", json=review_payload)
    assert res_review.status_code == 200, res_review.text
    reviewed_data = res_review.json()
    assert reviewed_data["status"] == "CHANGES_REQUESTED"
    assert "94% naturally derived" in reviewed_data["reviewer_feedback"]

    # 5. Agency queries submissions list and verifies status
    res_subs = client.get("/api/submissions?role=agency")
    assert res_subs.status_code == 200, res_subs.text
    subs = res_subs.json()
    my_agency_sub = next(s for s in subs if s["id"] == agency_sub_id)
    assert my_agency_sub["status"] == "CHANGES_REQUESTED"

    # 6. Agency submits version 2 (Revision workflow)
    resubmit_payload = {
        "brand_id": "aurelle-tech",
        "brand_name": "Aurelle Skin",
        "title": "Agency Sana: Diwali Campaign Teaser Post (v2 Revised)",
        "channel": "instagram",
        "creator_id": "USR-AGENCY-001",
        "creator_name": "Agency Sana",
        "creator_type": "agency",
        "org_id": "ORG-AGENCY-PULSE",
        "version": 2,
        "original_content": "Get 100% natural flawless skin with Aurelle this Diwali!",
        "current_content": "Formulated with 94% naturally derived ingredients for radiant skin this Diwali with Aurelle!",
        "findings": [],
        "submission_notes": "Revised copy removing 100% natural per Reviewer Meera feedback"
    }
    res_v2 = client.post("/api/submissions", json=resubmit_payload)
    assert res_v2.status_code == 200, res_v2.text
    v2_data = res_v2.json()
    assert v2_data["version"] == 2
    assert v2_data["status"] == "PENDING_REVIEW"
