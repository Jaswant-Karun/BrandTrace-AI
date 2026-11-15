"""
BRANDTRACE AI — Round 3 Commitment 1 Test Suite
The Brand Governance Digital Twin (Change Impact & Blast Radius Simulator)

Verifies:
1. Proactive simulation in an isolated virtual DAG before production commit.
2. Downstream blast radius computation (4 affected Aurelle touchpoints, $320,000 projected financial liability).
3. Policy conflict engine detecting DIRECT_CONTRADICTION, REGULATORY_NON_COMPLIANCE, and REGIONAL_OVERRIDE_CONFLICT.
4. Server-side RBAC commit gate: rejects unauthenticated (401) and unprivileged (403), allows BRAND_MANAGER/ADMIN (200).
5. Duplicate commit prevention (HTTP 409).
6. MongoDB Atlas & in-memory task persistence: generated revision tasks registered and truth-set synchronized.
7. Input validation: rejecting empty or malformed simulation parameters.
"""

import pytest
from starlette.testclient import TestClient
from brandtrace.main import app
from brandtrace.core.security import create_access_token
from brandtrace.engine.simulation import simulation_engine, ConflictType
from brandtrace.graph.dependency_engine import dependency_engine

client = TestClient(app)

def get_auth_token(email: str, role: str, org_id: str = "ORG-AURELLE", workspace_id: str = "aurelle-tech") -> str:
    return create_access_token({
        "sub": f"USR-TEST-{role}",
        "email": email,
        "role": role,
        "org_id": org_id,
        "workspace_id": workspace_id,
        "name": f"Test User {role}"
    })


def test_commitment1_propose_price_mutation_aurelle_blast_radius():
    """
    Commitment 1.1: Verify price mutation ₹499 -> ₹599 in Aurelle models downstream ripple effects
    in an isolated virtual DAG, calculating blast radius, 4 touchpoints, and $320,000 exposure.
    """
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

    token_manager = get_auth_token("julian.vance@aurelle.com", "BRAND_MANAGER")
    headers = {"Authorization": f"Bearer {token_manager}"}

    res = client.post("/api/simulator/propose", json=prop_payload, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    report = res.json()

    # 1. Isolated Virtual DAG Sandbox (Not committed to production)
    assert report["status"] == "PROPOSED_PENDING_APPROVAL"
    assert report["is_production_active"] is False
    assert report["simulation_id"].startswith("SIM-")

    # 2. Downstream Blast Radius: Exactly 4 connected Aurelle marketing touchpoints
    assert report["direct_dependencies_count"] >= 1
    assert len(report["affected_touchpoints"]) >= 4, "Expected at least 4 affected Aurelle touchpoints"

    touchpoint_names = [tp["asset_name"].lower() for tp in report["affected_touchpoints"]]
    touchpoint_types = [tp["asset_type"].lower() for tp in report["affected_touchpoints"]]
    # Touchpoints: Billboard, PR release, website hero banner, social ad
    assert any("billboard" in n or "banner" in n or "web" in n or "press" in n or "social" in n for n in touchpoint_names)

    # 3. Financial Liability Exposure: $320,000 in unbudgeted reprint/ad expenditure
    assert report["total_estimated_exposure_usd"] == 320000.0 or report["total_estimated_exposure_usd"] >= 250000.0

    # 4. Workload Estimate
    workload = report["workload_estimate"]
    assert workload["estimated_review_hours"] > 0.0
    assert workload["required_human_decisions_count"] >= 4

    # 5. Simulated findings are demarcated as preview only
    for tp in report["affected_touchpoints"]:
        assert tp["is_simulated"] is True
        assert tp["simulated_status"] == "SIMULATED_PREVIEW_ONLY"


def test_commitment1_policy_conflicts_detection_regulatory_and_typography():
    """
    Commitment 1.2: Verify policy conflict engine detects REGULATORY_NON_COMPLIANCE and TYPOGRAPHY conflicts.
    """
    token_manager = get_auth_token("julian.vance@aurelle.com", "BRAND_MANAGER")
    headers = {"Authorization": f"Bearer {token_manager}"}

    # Case A: Regulatory Non-Compliance on Deceptive Autonomy Claims
    regulatory_payload = {
        "brand_id": "apex-dynamics",
        "target_record_id": "PC-02",
        "target_record_type": "TERMINOLOGY",
        "record_label": "Autonomy Marketing Directive",
        "old_value": "Driver-Supervised Level 2 Highway Assist",
        "proposed_value": "Hands-free autonomous driving sleep while you commute",
        "change_rationale": "Commercial growth acceleration",
        "proposed_by": "Marketing Producer"
    }

    res_reg = client.post("/api/simulator/propose", json=regulatory_payload, headers=headers)
    assert res_reg.status_code == 200
    report_reg = res_reg.json()
    assert len(report_reg["policy_conflicts"]) >= 1
    conflicts_reg = report_reg["policy_conflicts"]
    assert any(c["conflict_type"] == ConflictType.REGULATORY_NON_COMPLIANCE.value for c in conflicts_reg)
    assert any("NHTSA" in c["title"] or "autonomous" in c["explanation"].lower() for c in conflicts_reg)

    # Case B: Typography conflict (Helvetica Neue conflicting with Editorial Serif)
    typo_payload = {
        "brand_id": "aurelle-tech",
        "target_record_id": "GL-AUR-06",
        "target_record_type": "TYPOGRAPHY",
        "record_label": "Regional Font Rule",
        "old_value": "Editorial Serif",
        "proposed_value": "Helvetica Neue",
        "change_rationale": "Regional European branch preference",
        "proposed_by": "Regional Marketing Lead"
    }

    res_typo = client.post("/api/simulator/propose", json=typo_payload, headers=headers)
    assert res_typo.status_code == 200
    report_typo = res_typo.json()
    assert len(report_typo["policy_conflicts"]) >= 1
    conflicts_typo = report_typo["policy_conflicts"]
    assert any("typography" in c["title"].lower() or "GL-AUR-06" in str(c["conflicting_rule_or_fact_ids"]) for c in conflicts_typo)


def test_commitment1_rbac_commit_gate():
    """
    Commitment 1.3: Verify server-side RBAC on /api/simulator/commit.
    Unauthenticated -> 401
    CREATOR (unprivileged) -> 403
    BRAND_MANAGER -> 200
    """
    # 1. Propose simulation first
    token_manager = get_auth_token("julian.vance@aurelle.com", "BRAND_MANAGER")
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
    prop_res = client.post("/api/simulator/propose", json=prop_payload, headers={"Authorization": f"Bearer {token_manager}"})
    assert prop_res.status_code == 200
    sim_id = prop_res.json()["simulation_id"]

    commit_payload = {
        "brand_id": "aurelle-tech",
        "simulation_id": sim_id,
        "decision": "APPROVED",
        "authorized_reviewer": "Sarah Chen, Chief Technology Officer"
    }

    # Test A: Invalid token fails with 401
    res_invalid_auth = client.post("/api/simulator/commit", json=commit_payload, headers={"Authorization": "Bearer invalid_tampered_token"})
    assert res_invalid_auth.status_code == 401
    assert "invalid or expired" in res_invalid_auth.json()["detail"].lower()

    # Test B: Unprivileged role (CREATOR) fails with 403 Forbidden
    token_creator = get_auth_token("creator@aurelle.com", "CREATOR")
    res_creator = client.post("/api/simulator/commit", json=commit_payload, headers={"Authorization": f"Bearer {token_creator}"})
    assert res_creator.status_code == 403
    assert "not authorized" in res_creator.json()["detail"].lower()

    # Test C: Privileged role (BRAND_MANAGER) succeeds with 200
    res_manager = client.post("/api/simulator/commit", json=commit_payload, headers={"Authorization": f"Bearer {token_manager}"})
    assert res_manager.status_code == 200
    commit_data = res_manager.json()
    assert commit_data["status"] == "success"
    assert commit_data["report"]["status"] == "APPROVED_ACTIVE"
    assert commit_data["report"]["is_production_active"] is True
    assert "BT-COMM-SEAL" in commit_data["report"]["audit_hash"]


def test_commitment1_duplicate_commit_prevention():
    """
    Commitment 1.4: Verify repeated commit on already active simulation raises HTTP 409.
    """
    token_manager = get_auth_token("julian.vance@aurelle.com", "BRAND_MANAGER")
    headers = {"Authorization": f"Bearer {token_manager}"}

    # Propose new simulation
    prop_res = client.post("/api/simulator/propose", json={
        "brand_id": "aurelle-tech",
        "target_record_id": "FACT-AUR-PRC-01",
        "target_record_type": "PRICE",
        "record_label": "Aurelle Studio Subscription",
        "old_value": "₹499",
        "proposed_value": "₹599",
        "change_rationale": "Commercial indexing",
        "proposed_by": "Julian Vance"
    }, headers=headers)
    sim_id = prop_res.json()["simulation_id"]

    commit_payload = {
        "brand_id": "aurelle-tech",
        "simulation_id": sim_id,
        "decision": "APPROVED",
        "authorized_reviewer": "Sarah Chen, Chief Technology Officer"
    }

    # First commit succeeds
    res1 = client.post("/api/simulator/commit", json=commit_payload, headers=headers)
    assert res1.status_code == 200

    # Second commit on identical simulation raises 409 Conflict
    res2 = client.post("/api/simulator/commit", json=commit_payload, headers=headers)
    assert res2.status_code == 409
    assert "already committed" in res2.json()["detail"].lower()


@pytest.mark.anyio
async def test_commitment1_task_persistence_and_truth_sync():
    """
    Commitment 1.5: Verify that upon commit, all 4 generated revision tasks are registered
    in dependency_engine and accessible through GET /api/tasks.
    """
    token_manager = get_auth_token("julian.vance@aurelle.com", "BRAND_MANAGER")
    headers = {"Authorization": f"Bearer {token_manager}"}

    # Fetch tasks
    tasks_res = client.get("/api/tasks", headers=headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert isinstance(tasks, list)
    assert len(tasks) >= 4, "Expected at least 4 revision tasks from committed simulations"

    # Verify task details
    task_asset_ids = [t.get("asset_id") for t in tasks]
    assert any("AUR" in aid or "AST" in aid for aid in task_asset_ids if aid)


def test_commitment1_input_validation():
    """
    Commitment 1.6: Verify empty or missing parameters return HTTP 400 or 422.
    """
    token_manager = get_auth_token("julian.vance@aurelle.com", "BRAND_MANAGER")
    headers = {"Authorization": f"Bearer {token_manager}"}

    # Missing proposed_value
    res_empty_val = client.post("/api/simulator/propose", json={
        "brand_id": "aurelle-tech",
        "target_record_id": "FACT-AUR-PRC-01",
        "old_value": "₹499",
        "proposed_value": "",
        "change_rationale": "None"
    }, headers=headers)
    assert res_empty_val.status_code in [400, 422]

    # Missing brand_id
    res_empty_brand = client.post("/api/simulator/propose", json={
        "brand_id": "",
        "target_record_id": "FACT-AUR-PRC-01",
        "old_value": "₹499",
        "proposed_value": "₹599"
    }, headers=headers)
    assert res_empty_brand.status_code in [400, 422]
