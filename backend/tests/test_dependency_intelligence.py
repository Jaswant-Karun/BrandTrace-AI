import pytest
from fastapi.testclient import TestClient
from brandtrace.main import app

client = TestClient(app)

def test_list_approved_facts():
    response = client.get("/api/facts?brand_id=apex-dynamics")
    assert response.status_code == 200
    facts = response.json()
    assert len(facts) >= 2
    fact_ids = [f["id"] for f in facts]
    assert "FACT-PRC-01" in fact_ids
    price_fact = next(f for f in facts if f["id"] == "FACT-PRC-01")
    assert price_fact["current_value"] == "₹499"
    assert price_fact["category"] == "PRICE"

def test_price_mutation_from_499_to_599_dependency_workflow():
    """
    Evaluates the complete Brand Dependency Intelligence workflow:
    Company changes product price from ₹499 to ₹599.
    1. Identifies the modified approved fact.
    2. Finds content assets referencing the old price.
    3. Identifies connected advertisements, campaigns, and documents.
    4. Calculates potential impact.
    5. Displays affected resources in a dependency graph.
    6. Creates revision tasks.
    7. Routes affected assets to authorized reviewers.
    8. Preserves old versions and approval records.
    9. Never silently modifies or republishes approved content.
    """
    mutation_payload = {
        "brand_id": "apex-dynamics",
        "fact_id": "FACT-PRC-01",
        "old_value": "₹499",
        "new_value": "₹599",
        "mutation_reason": "Q1 Inflationary Indexing and Cloud Infrastructure Cost Adjustments",
        "initiated_by": "Commercial Operations Director"
    }
    response = client.post("/api/facts/mutate", json=mutation_payload)
    assert response.status_code == 200
    data = response.json()

    # 1. Identified Fact
    assert data["fact_id"] == "FACT-PRC-01"
    assert data["old_value"] == "₹499"
    assert data["new_value"] == "₹599"

    # 2 & 3. Connected Advertisements, Campaigns, Websites, Documents
    assert data["total_affected_assets"] >= 3
    assert data["total_affected_campaigns"] >= 1
    assert data["total_departments"] >= 2
    assert "Performance Marketing" in data["affected_departments"]
    assert "E-Commerce & Digital Products" in data["affected_departments"]

    # 4. Impact calculation
    assert data["commercial_risk_score"] > 0
    assert data["risk_level"] in ["CRITICAL", "HIGH"]

    # 5. Dependency Graph elements
    dep_graph = data["dependency_graph"]
    assert "nodes" in dep_graph
    assert "edges" in dep_graph
    node_ids = [n["id"] for n in dep_graph["nodes"]]
    assert "FACT-PRC-01" in node_ids
    assert "AD-META-01" in node_ids
    assert "WEB-PRC-01" in node_ids

    # 6 & 7. Revision Tasks with Reviewer Routing
    tasks = data["revision_tasks"]
    assert len(tasks) >= 3
    first_task = tasks[0]
    assert first_task["status"] == "PENDING_REVIEW"
    assert "₹499" in first_task["current_content"]
    assert "₹599" in first_task["proposed_content"]
    assert first_task["assigned_reviewer_role"] is not None

    # 8 & 9. Verify Version History & Never Silently Overwrite
    asset_id = first_task["asset_id"]
    hist_resp = client.get(f"/api/assets/{asset_id}/history")
    assert hist_resp.status_code == 200
    versions = hist_resp.json()
    assert len(versions) >= 2
    # Verify original approved version is preserved
    v1 = versions[0]
    assert "v1.0" in v1["version_number"]
    assert v1["status"] == "APPROVED_HISTORICAL"
    # Verify pending version is flagged
    v2 = versions[1]
    assert v2["status"] == "FLAGGED_NEEDS_REVISION"

    # Test Human Review & Approval Gate
    task_id = first_task["task_id"]
    resolve_payload = {
        "reviewer_name": "VP of Commercial Marketing",
        "decision": "APPROVED",
        "resolution_notes": "Reviewed and validated for live ad flighting at ₹599."
    }
    resolve_resp = client.post(f"/api/tasks/{task_id}/resolve", json=resolve_payload)
    assert resolve_resp.status_code == 200
    resolve_data = resolve_resp.json()
    assert resolve_data["status"] == "success"
    assert resolve_data["task"]["status"] == "APPROVED_SEALED"
    assert "BT-TASK-SEAL-" in resolve_data["task"]["audit_proof"]
