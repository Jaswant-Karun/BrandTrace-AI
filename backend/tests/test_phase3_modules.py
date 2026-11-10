import pytest
from fastapi.testclient import TestClient
from brandtrace.main import app

client = TestClient(app)

def test_explainable_review_claims_classification():
    payload = {
        "brand_id": "apex-dynamics",
        "content": "Our flagship GT delivers 520 miles EPA-estimated range with completely green 100% eco-friendly fast charge in 8 minutes."
    }
    resp = client.post("/api/explainable/review", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_claims_analyzed"] >= 2
    
    classes = [a["classification"] for a in data["assessments"]]
    # Should detect supported 520 miles and contradicted/misleading 8 min or green claims
    assert "SUPPORTED" in classes
    assert any(c in ["CONTRADICTED", "POTENTIALLY_MISLEADING"] for c in classes)

def test_multimodal_file_inspection_txt():
    test_content = b"The Apex GT delivers 520 miles with QuantumCell and 100% eco-friendly zero-carbon design."
    files = {"file": ("press_release.txt", test_content, "text/plain")}
    data = {"brand_id": "apex-dynamics"}
    
    resp = client.post("/api/multimodal/upload-and-inspect", files=files, data=data)
    assert resp.status_code == 200
    report = resp.json()
    assert report["file_type"] == "TXT"
    assert len(report["findings"]) > 0
    categories = [f["category"] for f in report["findings"]]
    assert "TEXT_INTELLIGENCE" in categories

def test_simulation_proposal_and_commit():
    prop_payload = {
        "brand_id": "apex-dynamics",
        "target_record_id": "FACT-SPEC-01",
        "target_record_type": "SPECIFICATION",
        "record_label": "Supercharger Peak Output",
        "old_value": "350kW",
        "proposed_value": "400kW",
        "change_rationale": "Hardware inverter upgrade roll-out",
        "proposed_by": "Powertrain Systems Lead"
    }
    resp = client.post("/api/simulator/propose", json=prop_payload)
    assert resp.status_code == 200
    sim_data = resp.json()
    assert sim_data["status"] == "PROPOSED_PENDING_APPROVAL"
    assert sim_data["old_value"] == "350kW"
    assert sim_data["proposed_value"] == "400kW"
    sim_id = sim_data["simulation_id"]

    # Test commit
    commit_payload = {
        "brand_id": "apex-dynamics",
        "simulation_id": sim_id,
        "decision": "APPROVED",
        "authorized_reviewer": "Chief Commercial Officer"
    }
    commit_resp = client.post("/api/simulator/commit", json=commit_payload)
    assert commit_resp.status_code == 200
    commit_data = commit_resp.json()
    assert commit_data["status"] == "success"
    assert commit_data["report"]["status"] == "APPROVED_ACTIVE"
    assert "BT-COMM-SEAL-" in commit_data["report"]["audit_hash"]

def test_audit_ledger_verification_lifecycle():
    # 1. Unknown record check
    resp = client.post("/api/ledger/verify-record", json={"identifier": "NON-EXISTENT-SEAL-999"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["state"] == "UNKNOWN_RECORD"
    assert not data["is_authentic"]

    # 2. Valid record check against pre-seeded AST-01
    resp_ast = client.post("/api/ledger/verify-record", json={"identifier": "AST-01"})
    assert resp_ast.status_code == 200
    data_ast = resp_ast.json()
    assert data_ast["state"] == "VALID_UNCHANGED"
    assert data_ast["is_authentic"]

    # 3. Content tampering / modification check
    tampered_resp = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-01",
        "content_to_test": "TAMPERED COPY: 700 Miles of Unapproved Range"
    })
    assert tampered_resp.status_code == 200
    tampered_data = tampered_resp.json()
    assert tampered_data["state"] == "MODIFIED_AFTER_APPROVAL"
    assert not tampered_data["is_authentic"]
