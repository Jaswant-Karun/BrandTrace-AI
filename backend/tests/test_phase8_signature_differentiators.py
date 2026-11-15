import pytest
from starlette.testclient import TestClient
from brandtrace.main import app
from brandtrace.engine.audit_ledger import audit_ledger_engine, ReleaseVerificationState
from brandtrace.engine.simulation import simulation_engine, ConflictType
from brandtrace.routes.api import get_or_load_graph

client = TestClient(app)

# ==============================================================================
# DIFFERENTIATOR 1: BRAND DEPENDENCY INTELLIGENCE GRAPH
# ==============================================================================

def test_graph_dependency_traversal_with_evidence():
    """Verify DAG traversal discovers connected assets, campaigns, and evidence-backed citations."""
    res = client.post("/api/graph/traverse", json={
        "brand_id": "aurelle-tech",
        "start_node_id": "FACT-AUR-PRC-01",
        "direction": "BOTH"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["start_node_id"] == "FACT-AUR-PRC-01"
    assert data["total_connected_nodes"] >= 4
    assert len(data["downstream_nodes"]) >= 2
    assert len(data["subgraph_node_ids"]) >= 4

    # Verify downstream assets include connected touchpoints
    downstream_ids = [n["id"] for n in data["downstream_nodes"]]
    assert any("AUR" in nid for nid in downstream_ids)

    # Verify evidence citations are present
    assert isinstance(data["evidence_citations"], list)
    assert len(data["evidence_citations"]) >= 1
    assert any("price" in str(c["evidence"]).lower() or "cites" in str(c["evidence"]).lower() for c in data["evidence_citations"])

def test_graph_serialization_for_aurelle():
    """Verify live MongoDB/BKG graph endpoint returns nodes and edges formatted for React Flow."""
    res = client.get("/api/brands/aurelle-tech/graph")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 10
    assert len(data["edges"]) >= 8

    # Check node categories
    node_types = {n.get("data", {}).get("nodeType") for n in data["nodes"]}
    assert "APPROVED_FACT" in node_types or "BRAND" in node_types
    assert any(n.get("data", {}).get("id") == "FACT-AUR-PRC-01" for n in data["nodes"])

# ==============================================================================
# DIFFERENTIATOR 2: BRAND GOVERNANCE DIGITAL TWIN (SIMULATION ENGINE)
# ==============================================================================

def test_digital_twin_fact_simulation_and_conflict_detection():
    """Verify digital twin simulates fact change, detects conflicts, and computes workload estimates."""
    prop_payload = {
        "brand_id": "aurelle-tech",
        "target_record_id": "FACT-AUR-PRC-01",
        "target_record_type": "PRICE",
        "record_label": "Aurelle Cloud Studio Subscription",
        "old_value": "₹499",
        "proposed_value": "₹599",
        "change_rationale": "High-fidelity spatial audio compute indexing",
        "proposed_by": "Julian Vance, VP Brand Governance"
    }

    res = client.post("/api/simulator/propose", json=prop_payload)
    assert res.status_code == 200
    report = res.json()

    assert report["status"] == "PROPOSED_PENDING_APPROVAL"
    assert report["is_production_active"] is False
    assert report["direct_dependencies_count"] >= 1
    assert len(report["affected_touchpoints"]) >= 1

    # Check workload estimate
    assert "workload_estimate" in report
    workload = report["workload_estimate"]
    assert workload["estimated_review_hours"] > 0.0
    assert workload["required_human_decisions_count"] >= 1

    # Check before-and-after inspection results
    assert "before_after_summary" in report
    b_after = report["before_after_summary"]
    assert b_after["baseline_compliance_score"] >= 90.0
    assert b_after["simulated_score_if_unaddressed"] < b_after["baseline_compliance_score"]
    assert b_after["simulated_score_if_remediated"] >= 95.0

    # Verify simulation findings are demarcated as preview only
    for tp in report["affected_touchpoints"]:
        assert tp["is_simulated"] is True
        assert tp["simulated_status"] == "SIMULATED_PREVIEW_ONLY"

def test_digital_twin_policy_conflict_detection_regulatory():
    """Verify simulation engine flags regulatory non-compliance on deceptive autonomy claims."""
    prop_payload = {
        "brand_id": "apex-dynamics",
        "target_record_id": "PC-02",
        "target_record_type": "TERMINOLOGY",
        "record_label": "Autonomy Marketing Directive",
        "old_value": "Driver-Supervised Level 2 Highway Assist",
        "proposed_value": "Hands-free autonomous driving sleep while you commute",
        "change_rationale": "Commercial growth acceleration",
        "proposed_by": "Marketing Producer"
    }

    res = client.post("/api/simulator/propose", json=prop_payload)
    assert res.status_code == 200
    report = res.json()

    assert len(report["policy_conflicts"]) >= 1
    conflicts = report["policy_conflicts"]
    assert any(c["conflict_type"] == ConflictType.REGULATORY_NON_COMPLIANCE.value for c in conflicts)
    assert any("NHTSA" in c["title"] or "autonomous" in c["explanation"].lower() for c in conflicts)

def test_digital_twin_typography_conflict_detection():
    """Verify simulation engine catches regional Helvetica font conflicting with master Editorial Serif rule."""
    prop_payload = {
        "brand_id": "aurelle-tech",
        "target_record_id": "GL-AUR-06",
        "target_record_type": "TYPOGRAPHY",
        "record_label": "Regional Font Rule",
        "old_value": "Editorial Serif",
        "proposed_value": "Helvetica Neue",
        "change_rationale": "Regional European branch preference",
        "proposed_by": "Regional Marketing Lead"
    }

    res = client.post("/api/simulator/propose", json=prop_payload)
    assert res.status_code == 200
    report = res.json()

    assert len(report["policy_conflicts"]) >= 1
    conflicts = report["policy_conflicts"]
    assert any("typography" in c["title"].lower() or "GL-AUR-06" in str(c["conflicting_rule_or_fact_ids"]) for c in conflicts)

def test_digital_twin_authorized_commit_activation():
    """Verify proposed change remains pending until explicit authorized human approval."""
    # 1. Propose change
    prop_payload = {
        "brand_id": "aurelle-tech",
        "target_record_id": "FACT-AUR-PRC-01",
        "target_record_type": "PRICE",
        "record_label": "Aurelle Studio Subscription",
        "old_value": "₹499",
        "proposed_value": "₹599",
        "change_rationale": "Commercial indexing",
        "proposed_by": "Julian Vance"
    }
    prop_res = client.post("/api/simulator/propose", json=prop_payload)
    sim_id = prop_res.json()["simulation_id"]

    # 2. Commit change with authorized brand manager approval
    commit_payload = {
        "brand_id": "aurelle-tech",
        "simulation_id": sim_id,
        "decision": "APPROVED",
        "authorized_reviewer": "Sarah Chen, Chief Technology Officer"
    }
    commit_res = client.post("/api/simulator/commit", json=commit_payload)
    assert commit_res.status_code == 200
    commit_data = commit_res.json()
    assert commit_data["status"] == "success"
    assert commit_data["report"]["status"] == "APPROVED_ACTIVE"
    assert commit_data["report"]["is_production_active"] is True
    assert "BT-COMM-SEAL" in commit_data["report"]["audit_hash"]

# ==============================================================================
# DIFFERENTIATOR 3: MULTIMODAL GOVERNANCE & 5-STATE VERIFIED RELEASE HISTORY
# ==============================================================================

def test_multimodal_approval_and_release_sealing():
    """Verify human sign-off on multimodal asset creates a tamper-evident release record."""
    sign_payload = {
        "verification_id": "VER-TEST-MULTI-01",
        "brand_id": "aurelle-tech",
        "asset_id": "AST-AUR-01",
        "asset_title": "Aurelle Studio Master Launch Copy",
        "channel": "Digital Web Banner",
        "content": "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included.",
        "reviewer": "Marcus Aurelius, Content Review Lead",
        "decision": "APPROVED"
    }

    sign_res = client.post("/api/releases/sign", json=sign_payload)
    assert sign_res.status_code == 200
    data = sign_res.json()
    assert data["status"] == "SEALED"
    assert "BT-SEAL" in data["release"]["audit_stamp"]
    assert data["release"]["asset_id"] == "AST-AUR-01"

def test_audit_ledger_5_integrity_verification_states():
    """Verify integrity verification distinguishes all 5 statutory release states."""
    # State 1: VALID_UNCHANGED
    valid_content = "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included."
    v1_res = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-01",
        "content_to_test": valid_content
    })
    assert v1_res.status_code == 200
    assert v1_res.json()["state"] == ReleaseVerificationState.VALID_UNCHANGED.value
    assert v1_res.json()["is_authentic"] is True

    # State 2: MODIFIED_AFTER_APPROVAL (Tampered content)
    tampered_content = "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹499 per month (UNAUTHORIZED TAMPER)."
    v2_res = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-01",
        "content_to_test": tampered_content
    })
    assert v2_res.status_code == 200
    assert v2_res.json()["state"] == ReleaseVerificationState.MODIFIED_AFTER_APPROVAL.value
    assert v2_res.json()["is_authentic"] is False
    assert "content mismatch" in v2_res.json()["explanation"].lower() or "hash mismatch" in v2_res.json()["explanation"].lower()

    # State 3: SUPERSEDED (Historical version superseded by newer approved release)
    v3_res = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-HIST-01"
    })
    assert v3_res.status_code == 200
    assert v3_res.json()["state"] == ReleaseVerificationState.SUPERSEDED.value
    assert v3_res.json()["is_authentic"] is False
    assert "superseded" in v3_res.json()["explanation"].lower()

    # State 4: REVOKED (Officially revoked release)
    v4_res = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-RECALLED"
    })
    assert v4_res.status_code == 200
    assert v4_res.json()["state"] == ReleaseVerificationState.REVOKED.value
    assert v4_res.json()["is_authentic"] is False
    assert "revoked" in v4_res.json()["explanation"].lower()

    # State 5: UNKNOWN_RECORD (Unregistered fake identifier)
    v5_res = client.post("/api/ledger/verify-record", json={
        "identifier": "NON-EXISTENT-SEAL-XYZ-999"
    })
    assert v5_res.status_code == 200
    assert v5_res.json()["state"] == ReleaseVerificationState.UNKNOWN_RECORD.value
    assert v5_res.json()["is_authentic"] is False
    assert "no cryptographic seal" in v5_res.json()["explanation"].lower() or "unknown" in v5_res.json()["explanation"].lower()

def test_supersede_and_revoke_endpoints():
    """Verify API endpoints allow authorized managers to supersede and revoke ledger records."""
    # Create test release
    rec = audit_ledger_engine.record_release(
        user_identity="Marcus Aurelius",
        user_role="REVIEWER",
        resource_id="AST-REVOKE-TEST",
        resource_type="ASSET",
        content="Promotional campaign flyer for testing revocation."
    )

    # 1. Supersede record
    sup_res = client.post("/api/ledger/supersede-record", json={
        "identifier": rec.record_id,
        "new_version": "v2.0-FINAL",
        "superseded_by": "Julian Vance"
    })
    assert sup_res.status_code == 200
    assert sup_res.json()["status"] == "SUPERSEDED"

    # 2. Revoke record
    rev_res = client.post("/api/ledger/revoke-record", json={
        "identifier": rec.record_id,
        "revocation_reason": "Statutory recall due to pricing dispute",
        "revoked_by": "David Sterling"
    })
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "REVOKED"
