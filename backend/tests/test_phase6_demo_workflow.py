import pytest
from starlette.testclient import TestClient
from brandtrace.main import app

client = TestClient(app)

def test_demo_scenario_status():
    """Verify scenario status endpoint returns 12-step AURELLE lifecycle and 5 personas."""
    res = client.get("/api/demo/scenario-status")
    assert res.status_code == 200
    data = res.json()
    assert data["org_id"] == "ORG-AURELLE"
    assert data["workspace_id"] == "aurelle-tech"
    assert len(data["steps"]) == 12
    assert len(data["active_users"]) == 5

    # Check 5 demo RBAC users
    roles = [u["role"] for u in data["active_users"]]
    assert "ADMIN" in roles
    assert "BRAND_MANAGER" in roles
    assert "CREATOR" in roles
    assert "REVIEWER" in roles
    assert "COMPLIANCE_REVIEWER" in roles

def test_12_step_demo_lifecycle_execution():
    """Test full sequential execution of the 12-step AURELLE demonstration lifecycle."""
    # Step 1 & 2: Reset to baseline ₹499
    res = client.post("/api/demo/reset")
    assert res.status_code == 200
    assert res.json()["current_price"] == "₹499"

    # Step 3 & 4: Multi-agent pre-release verification of initial copy
    res_s4 = client.post("/api/demo/execute-step", json={"step_number": 4})
    assert res_s4.status_code == 200
    s4_data = res_s4.json()
    assert s4_data["mutations_applied"]["score"] == 100.0
    assert s4_data["mutations_applied"]["decision"] == "APPROVED_FOR_RELEASE"

    # Step 5: Propose price change ₹499 -> ₹599
    res_s5 = client.post("/api/demo/execute-step", json={
        "step_number": 5,
        "actor_role": "BRAND_MANAGER",
        "actor_name": "Julian Vance"
    })
    assert res_s5.status_code == 200
    assert res_s5.json()["mutations_applied"]["new_value"] == "₹599"

    # Step 6: BDIG DAG Traversal identifies 4 connected assets
    res_s6 = client.post("/api/demo/execute-step", json={"step_number": 6})
    assert res_s6.status_code == 200
    assert res_s6.json()["mutations_applied"]["affected_assets_count"] == 4

    # Step 7: Blast radius simulation
    res_s7 = client.post("/api/demo/execute-step", json={"step_number": 7})
    assert res_s7.status_code == 200
    assert res_s7.json()["mutations_applied"]["risk_score"] > 80.0

    # Step 8: Spawn 4 revision tasks
    res_s8 = client.post("/api/demo/execute-step", json={"step_number": 8})
    assert res_s8.status_code == 200
    assert res_s8.json()["mutations_applied"]["tasks_spawned"] == 4

    # Step 9: Creator updates copy to ₹599
    res_s9 = client.post("/api/demo/execute-step", json={
        "step_number": 9,
        "actor_role": "CREATOR",
        "actor_name": "Maya Lin"
    })
    assert res_s9.status_code == 200
    assert res_s9.json()["mutations_applied"]["tasks_updated_to_599"] == 4

    # Step 10: Reviewers verify & approve atomically
    res_s10 = client.post("/api/demo/execute-step", json={
        "step_number": 10,
        "actor_role": "REVIEWER",
        "actor_name": "Marcus Aurelius"
    })
    assert res_s10.status_code == 200
    assert res_s10.json()["mutations_applied"]["tasks_approved_and_sealed"] == 4

    # Step 11: Cryptographic audit ledger sealing
    res_s11 = client.post("/api/demo/execute-step", json={
        "step_number": 11,
        "actor_role": "COMPLIANCE_REVIEWER",
        "actor_name": "David Sterling"
    })
    assert res_s11.status_code == 200
    assert res_s11.json()["mutations_applied"]["audit_entries_sealed"] == 4

    # Step 12: Command center live sync
    res_s12 = client.post("/api/demo/execute-step", json={"step_number": 12})
    assert res_s12.status_code == 200
    assert res_s12.json()["mutations_applied"]["outdated_assets"] == 0

def test_demo_9_governance_cases():
    """Verify all 9 demonstration test cases return expected findings and policy citations."""
    cases_res = client.get("/api/demo/cases")
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert len(cases) == 9

    # Case 1: Unsupported 100% unbreakable claim
    c1 = client.post("/api/demo/run-case/CASE-01")
    assert c1.status_code == 200
    assert c1.json()["defects_detected_count"] >= 1
    assert any("FTC" in s["rule_citation"] or "unbreakable" in s["explanation"].lower() for s in c1.json()["risk_spans"])

    # Case 2: Expired 2025 founder promo
    c2 = client.post("/api/demo/run-case/CASE-02")
    assert c2.status_code == 200
    assert c2.json()["defects_detected_count"] >= 1
    assert any("FACT-AUR-EXP-01" in s["rule_citation"] or "expired" in s["explanation"].lower() for s in c2.json()["risk_spans"])

    # Case 3: Naming defect Horizun & missing ™
    c3 = client.post("/api/demo/run-case/CASE-03")
    assert c3.status_code == 200
    assert c3.json()["defects_detected_count"] >= 1
    assert any("TM-AUR" in s["rule_citation"] or "trademark" in s["category"].lower() for s in c3.json()["risk_spans"])

    # Case 4: Medical diagnostic cure (FDA §870)
    c4 = client.post("/api/demo/run-case/CASE-04")
    assert c4.status_code == 200
    assert c4.json()["defects_detected_count"] >= 1
    assert any("FDA" in s["rule_citation"] or "870" in s["rule_citation"] for s in c4.json()["risk_spans"])

    # Case 5: Logo clearance 12px < 20px
    c5 = client.post("/api/demo/run-case/CASE-05")
    assert c5.status_code == 200
    assert c5.json()["defects_detected_count"] >= 1
    assert any("GL-AUR-01" in s["rule_citation"] or "clearance" in s["explanation"].lower() for s in c5.json()["risk_spans"])

    # Case 6: Off-palette color #FF5500
    c6 = client.post("/api/demo/run-case/CASE-06")
    assert c6.status_code == 200
    assert c6.json()["defects_detected_count"] >= 1
    assert any("GL-AUR-02" in s["rule_citation"] or "#FF5500" in s["explanation"] for s in c6.json()["risk_spans"])

    # Case 7: Missing IEC disclosure
    c7 = client.post("/api/demo/run-case/CASE-07")
    assert c7.status_code == 200
    assert c7.json()["defects_detected_count"] >= 1
    assert any("IEC" in s["explanation"] or "GL-AUR-04" in s["rule_citation"] for s in c7.json()["risk_spans"])

    # Case 8: WCAG contrast 2.3:1 & missing alt-text
    c8 = client.post("/api/demo/run-case/CASE-08")
    assert c8.status_code == 200
    assert c8.json()["defects_detected_count"] >= 1
    assert any("WCAG" in s["rule_citation"] or "GL-AUR-07" in s["rule_citation"] for s in c8.json()["risk_spans"])

    # Case 9: Helvetica vs Editorial Serif conflict
    c9 = client.post("/api/demo/run-case/CASE-09")
    assert c9.status_code == 200
    assert c9.json()["defects_detected_count"] >= 1
    assert any("GL-AUR-06" in s["rule_citation"] or "typography" in s["category"].lower() for s in c9.json()["risk_spans"])
