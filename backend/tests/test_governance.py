import pytest
from fastapi.testclient import TestClient
from brandtrace.main import app

client = TestClient(app)

def test_health_and_db_status():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "database" in data

def test_list_brands():
    response = client.get("/api/brands")
    assert response.status_code == 200
    brands = response.json()
    assert len(brands) >= 2
    brand_ids = [b["brand_id"] for b in brands]
    assert "apex-dynamics" in brand_ids
    assert "novus-health" in brand_ids

def test_brand_knowledge_graph_structure():
    response = client.get("/api/brands/apex-dynamics/graph")
    assert response.status_code == 200
    graph = response.json()
    assert "nodes" in graph
    assert "edges" in graph
    assert graph["total_nodes"] > 10
    assert graph["total_edges"] > 10

def test_verification_compliant_content():
    # Asset with approved claim and proper mark
    payload = {
        "brand_id": "apex-dynamics",
        "content": "520 miles EPA-estimated range with QuantumCell™ Architecture.",
        "channel": "Print"
    }
    response = client.post("/api/verify", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["governance_decision"] == "APPROVED_FOR_RELEASE"
    assert result["composite_risk_score"] < 20
    assert result["release_proof"] is not None

def test_verification_critical_violations():
    # Asset with greenwashing + ungrounded autonomous driving claim + improper trademark mark
    payload = {
        "brand_id": "apex-dynamics",
        "content": "Kick back and relax with completely green 100% eco-friendly fully autonomous driving on quantumcell.",
        "channel": "Digital Video"
    }
    response = client.post("/api/verify", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["governance_decision"] == "REJECTED_GATED"
    assert result["composite_risk_score"] >= 50
    assert len(result["all_risk_spans"]) >= 3
    # Verify remediation was generated
    assert result["remediated_content"] is not None
    assert "remediation_rationale" in result

def test_cascading_blast_radius():
    payload = {
        "brand_id": "apex-dynamics",
        "mutated_node_id": "PC-01",
        "mutation_type": "REGULATORY_AMENDMENT"
    }
    response = client.post("/api/blast-radius", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["mutated_node_id"] == "PC-01"
    assert result["total_affected_assets"] > 0
    assert len(result["affected_targets"]) > 0

def test_sign_release_ledger():
    payload = {
        "verification_id": "VRF-TEST-001",
        "brand_id": "apex-dynamics",
        "asset_id": "AST-01",
        "asset_title": "Billboard 520 Miles",
        "channel": "OOH Billboard",
        "content": "520 Miles of Zero Compromise with QuantumCell™",
        "reviewer": "Chief Governance Officer",
        "decision": "APPROVED"
    }
    response = client.post("/api/releases/sign", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SEALED"
    assert "BT-SEAL-" in data["release"]["audit_stamp"]
