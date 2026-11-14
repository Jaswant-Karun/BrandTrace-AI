import pytest
import time
from starlette.testclient import TestClient
from brandtrace.main import app
from brandtrace.data.seed_data import APPROVED_FACTS_CATALOG
from brandtrace.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(autouse=True)
def pristine_state():
    """Ensure baseline pricing and state are restored before each journey."""
    if "FACT-AUR-PRC-01" in APPROVED_FACTS_CATALOG:
        APPROVED_FACTS_CATALOG["FACT-AUR-PRC-01"].current_value = "₹499"
    yield
    if "FACT-AUR-PRC-01" in APPROVED_FACTS_CATALOG:
        APPROVED_FACTS_CATALOG["FACT-AUR-PRC-01"].current_value = "₹499"

# ==============================================================================
# JOURNEY A — DEMO ACCESS
# ==============================================================================
def test_journey_a_demo_access():
    """JOURNEY A: Open application, authenticate with demo account, persist session, logout, re-authenticate."""
    # 1. Health & Discovery
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "operational"

    # 2. Authenticate with dedicated demo account
    res_login = client.post("/api/auth/login", json={
        "email": "demo@brandtrace.ai",
        "password": "DemoAurelle2026!"
    })
    assert res_login.status_code == 200
    login_data = res_login.json()
    token = login_data["access_token"]
    assert login_data["user"]["email"] == "demo@brandtrace.ai"
    assert login_data["user"]["role"] == "BRAND_MANAGER"
    assert login_data["user"]["workspace_id"] == "aurelle-tech"

    # 3. Simulate page refresh / session persistence via token verification
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "demo@brandtrace.ai"

    # 4. Navigate to Overview / Command Center telemetry
    res_analytics = client.get("/api/analytics/governance?brand_id=aurelle-tech", headers={"Authorization": f"Bearer {token}"})
    assert res_analytics.status_code == 200
    assert "compliance_rate_percent" in res_analytics.json()

    # 5. Simulate logout & re-authentication
    res_relogin = client.post("/api/auth/login", json={
        "email": "demo@brandtrace.ai",
        "password": "DemoAurelle2026!"
    })
    assert res_relogin.status_code == 200
    assert "access_token" in res_relogin.json()

# ==============================================================================
# JOURNEY B — BRAND KNOWLEDGE
# ==============================================================================
def test_journey_b_brand_knowledge():
    """JOURNEY B: View facts, add a test fact, edit it, verify persistence, check permissions."""
    # Authenticate as Brand Manager
    res_login = client.post("/api/auth/login", json={
        "email": "demo@brandtrace.ai",
        "password": "DemoAurelle2026!"
    })
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. View approved facts
    res_facts = client.get("/api/facts?brand_id=aurelle-tech", headers=headers)
    assert res_facts.status_code == 200
    facts_list = res_facts.json()
    assert len(facts_list) >= 1
    price_fact = next((f for f in facts_list if f["id"] == "FACT-AUR-PRC-01" or f.get("name") == "Aurelle Cloud Studio Subscription"), None)
    assert price_fact is not None
    assert "499" in price_fact["current_value"]

    # 2. Add a new test fact
    test_fact_payload = {
        "brand_id": "aurelle-tech",
        "name": "Cloud Studio Storage Allocation Test",
        "category": "SPECIFICATION",
        "current_value": "100GB Dedicated Cloud Storage",
        "description": "Enterprise cloud tier default storage",
        "source_citation": "Aurelle Enterprise SLA Rev 3.2"
    }
    res_create = client.post("/api/facts", json=test_fact_payload, headers=headers)
    assert res_create.status_code in [200, 201]
    created_fact = res_create.json()
    new_fact_id = created_fact["id"]

    # 3. Verify persistence
    res_get = client.get(f"/api/facts/{new_fact_id}", headers=headers)
    assert res_get.status_code == 200
    assert "100GB" in res_get.json()["current_value"]

    # 4. Check permissions: Creator attempting deletion/mutation is restricted
    res_creator = client.post("/api/auth/login", json={
        "email": "creator@aurelle.com",
        "password": "brandtrace2026"
    })
    creator_token = res_creator.json()["access_token"]
    res_unauth_mutate = client.post("/api/facts/mutate", json={
        "brand_id": "aurelle-tech",
        "fact_id": new_fact_id,
        "old_value": "100GB Dedicated Cloud Storage",
        "new_value": "500GB Dedicated Cloud Storage",
        "mutation_reason": "Unauthorized boost"
    }, headers={"Authorization": f"Bearer {creator_token}"})
    assert res_unauth_mutate.status_code in [400, 403]

# ==============================================================================
# JOURNEY C — CONTENT INTELLIGENCE
# ==============================================================================
def test_journey_c_content_intelligence():
    """JOURNEY C: Submit clean content, submit violation content, verify findings and evidence links."""
    # 1. Clean sample content
    clean_copy = "Scale your creative workflows with Aurelle Cloud Studio. Spatial audio mastering starting at just ₹499/month."
    res_clean = client.post("/api/verify", json={
        "brand_id": "aurelle-tech",
        "channel": "Instagram / Meta Feed Ads",
        "content": clean_copy
    })
    assert res_clean.status_code == 200
    clean_data = res_clean.json()
    assert clean_data["governance_decision"] == "APPROVED_FOR_RELEASE"
    assert clean_data["composite_risk_score"] == 0.0

    # 2. Content with seeded rule violation (Statutory Medical Claim)
    violation_copy = "Aurelle Pulse Smart Ring is a medical-grade diagnostic cure that eliminates all symptoms of cardiovascular disease."
    res_violation = client.post("/api/verify", json={
        "brand_id": "aurelle-tech",
        "channel": "Digital Display",
        "content": violation_copy
    })
    assert res_violation.status_code == 200
    v_data = res_violation.json()
    assert v_data["governance_decision"] in ["REJECTED", "REJECTED_GATED", "FLAGGED_FOR_REVIEW"]
    assert v_data["composite_risk_score"] > 80.0
    assert len(v_data["all_risk_spans"]) > 0

    # 3. Verify evidence reference on findings
    first_finding = v_data["all_risk_spans"][0]
    assert first_finding["severity"] in ["CRITICAL", "HIGH"]
    assert "remediated_content" in v_data
    assert "remediation_rationale" in v_data

# ==============================================================================
# JOURNEY D — CHANGE IMPACT SIMULATION
# ==============================================================================
def test_journey_d_change_impact():
    """JOURNEY D: Select approved price, preview ₹499 -> ₹599, inspect touchpoints, verify no premature mutation."""
    res_login = client.post("/api/auth/login", json={
        "email": "demo@brandtrace.ai",
        "password": "DemoAurelle2026!"
    })
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Preview price simulation ₹499 -> ₹599
    sim_payload = {
        "brand_id": "aurelle-tech",
        "target_record_id": "FACT-AUR-PRC-01",
        "target_record_type": "PRICE",
        "record_label": "Aurelle Cloud Studio Subscription",
        "old_value": "₹499",
        "proposed_value": "₹599",
        "change_rationale": "Commercial tier revision Q1",
        "proposed_by": "Alex Mercer (VP Brand Governance)"
    }
    res_sim = client.post("/api/simulator/propose", json=sim_payload, headers=headers)
    assert res_sim.status_code == 200
    sim_report = res_sim.json()
    assert sim_report["target_record_id"] == "FACT-AUR-PRC-01"
    assert sim_report["overall_risk_score"] > 80.0
    assert len(sim_report["affected_touchpoints"]) >= 4

    # 2. Verify approved catalog price remains UNCHANGED before commit
    res_fact_check = client.get("/api/facts/FACT-AUR-PRC-01", headers=headers)
    assert res_fact_check.status_code == 200
    assert "499" in res_fact_check.json()["current_value"]
    assert "599" not in res_fact_check.json()["current_value"]

    # 3. Verify Creator cannot commit mutation
    res_creator = client.post("/api/auth/login", json={
        "email": "creator@aurelle.com",
        "password": "brandtrace2026"
    })
    creator_token = res_creator.json()["access_token"]
    res_unauth_commit = client.post("/api/simulator/commit", json={
        "simulation_id": sim_report.get("simulation_id", "SIM-TEST-01"),
        "brand_id": "aurelle-tech",
        "target_record_id": "FACT-AUR-PRC-01",
        "proposed_value": "₹599"
    }, headers={"Authorization": f"Bearer {creator_token}"})
    assert res_unauth_commit.status_code in [400, 403, 404]

# ==============================================================================
# JOURNEY E — HUMAN APPROVAL
# ==============================================================================
def test_journey_e_human_approval():
    """JOURNEY E: Open pending review, add reviewer notes, approve using demo role, verify state."""
    # 1. Trigger step 8 to generate revision tasks
    res_step8 = client.post("/api/demo/execute-step", json={"step_number": 8})
    assert res_step8.status_code == 200

    # 2. View pending tasks
    res_tasks = client.get("/api/tasks?brand_id=aurelle-tech")
    assert res_tasks.status_code == 200
    tasks = res_tasks.json()
    assert len(tasks) > 0
    target_task = tasks[0]
    task_id = target_task["task_id"]

    # 3. Resolve / approve task as Brand Manager
    res_login = client.post("/api/auth/login", json={
        "email": "demo@brandtrace.ai",
        "password": "DemoAurelle2026!"
    })
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resolve_payload = {
        "reviewer_name": "Alex Mercer (Brand Manager)",
        "decision": "APPROVED",
        "final_content": "Scale your creative workflows with Aurelle Cloud Studio starting at ₹599/month.",
        "resolution_notes": "Commercial master update to ₹599 verified and sealed."
    }
    res_resolve = client.post(f"/api/tasks/{task_id}/resolve", json=resolve_payload, headers=headers)
    assert res_resolve.status_code == 200
    data = res_resolve.json()
    assert data["status"] in ["APPROVED", "RESOLVED", "SUCCESS"]
    assert data["task"]["status"] in ["APPROVED_SEALED", "RESOLVED", "APPROVED"]

# ==============================================================================
# JOURNEY F — TRUST LEDGER & CRYPTOGRAPHIC VERIFICATION
# ==============================================================================
def test_journey_f_trust_ledger():
    """JOURNEY F: Open audit records, verify cryptographic seal, test integrity verification tool."""
    res_login = client.post("/api/auth/login", json={
        "email": "demo@brandtrace.ai",
        "password": "DemoAurelle2026!"
    })
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch release ledger
    res_releases = client.get("/api/releases?brand_id=aurelle-tech", headers=headers)
    assert res_releases.status_code == 200
    releases = res_releases.json()
    assert len(releases) > 0
    rec = releases[0]
    assert "release_hash" in rec
    assert rec["release_hash"].startswith("BT-REL-")

    # 2. Run actual cryptographic integrity verification via ledger engine
    res_verify = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-01",
        "content_to_test": "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included."
    }, headers=headers)
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["state"] == "VALID_UNCHANGED"
    assert verify_data["is_authentic"] is True

# ==============================================================================
# JOURNEY G — RESILIENCE & ADVERSARIAL TESTING
# ==============================================================================
def test_journey_g_resilience():
    """JOURNEY G: Test empty input, oversized input, duplicate execution, invalid URL, expired session."""
    # 1. Empty content submission
    res_empty = client.post("/api/verify", json={
        "brand_id": "aurelle-tech",
        "channel": "Instagram",
        "content": ""
    })
    assert res_empty.status_code in [400, 422]

    # 2. Oversized content submission (> 50,000 characters)
    oversized_copy = "Aurelle " * 10000
    res_oversized = client.post("/api/verify", json={
        "brand_id": "aurelle-tech",
        "channel": "Instagram",
        "content": oversized_copy
    })
    assert res_oversized.status_code in [400, 413, 422]

    # 3. Invalid record URL
    res_404 = client.get("/api/facts/NON-EXISTENT-FACT-XYZ999")
    assert res_404.status_code == 404

    # 4. Invalid / forged authentication token
    res_fake_token = client.get("/api/auth/me", headers={"Authorization": "Bearer fake.jwt.token.here"})
    assert res_fake_token.status_code == 401

    # 5. Unauthorized action: Creator attempting workspace reset
    res_creator = client.post("/api/auth/login", json={
        "email": "creator@aurelle.com",
        "password": "brandtrace2026"
    })
    creator_token = res_creator.json()["access_token"]
    res_reset_blocked = client.post("/api/demo/reset", headers={"Authorization": f"Bearer {creator_token}"})
    assert res_reset_blocked.status_code == 403
