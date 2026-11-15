import pytest
from fastapi.testclient import TestClient
from brandtrace.main import app
from brandtrace.core.security import create_access_token, UserRole

client = TestClient(app)

def get_auth_headers(role: UserRole = UserRole.ADMIN, user_id: str = "USR-SARAH-01", org_id: str = "ORG-AURELLE"):
    token = create_access_token({
        "sub": user_id,
        "email": f"{user_id.lower()}@aurelle.com",
        "role": role.value if hasattr(role, 'value') else role,
        "org_id": org_id,
        "workspace_id": "aurelle-tech",
        "name": "Sarah Chen"
    })
    return {
        "Authorization": f"Bearer {token}",
        "X-Client-ID": f"phase9-test-{role.value if hasattr(role, 'value') else role}"
    }

def test_phase9_module1_approved_fact_registration_and_listing():
    """Verify Step 1: Create an approved brand fact & query knowledge base."""
    headers = get_auth_headers(UserRole.BRAND_MANAGER)
    payload = {
        "workspace_id": "aurelle-tech",
        "org_id": "ORG-AURELLE",
        "name": "Horizon Watch Titanium Alloy Specification",
        "category": "SPECIFICATION",
        "current_value": "Grade 5 Aerospace Titanium (Ti-6Al-4V)",
        "unit": "metallurgical standard",
        "description": "Certified aerospace titanium chassis composition.",
        "source_citation": "ASTM B265 Grade 5 Metallurgical Testing Certification #MT-8842",
        "department_owner": "Hardware Engineering & Brand Governance"
    }
    res = client.post("/api/knowledge-base/facts", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["fact_id"].startswith("FACT-AUR-")
    assert data["name"] == payload["name"]
    assert data["current_value"] == payload["current_value"]
    assert data["status"] == "ACTIVE"

    # Query facts list
    list_res = client.get("/api/knowledge-base/facts?workspace_id=aurelle-tech", headers=headers)
    assert list_res.status_code == 200
    facts = list_res.json()
    assert len(facts) >= 1
    assert any(f["name"] == payload["name"] for f in facts)

def test_phase9_module_endpoints_audit():
    """Verify that all core endpoints backing the 14 application modules respond successfully."""
    headers = get_auth_headers(UserRole.ADMIN)

    # 1. Command Center & Governance Analytics
    cc_res = client.get("/api/analytics/governance?brand_id=aurelle-tech", headers=headers)
    assert cc_res.status_code == 200

    # 2. Brand Knowledge Graph
    bkg_res = client.get("/api/brands/aurelle-tech/graph", headers=headers)
    assert bkg_res.status_code == 200
    assert len(bkg_res.json()["nodes"]) > 0

    # 3. Content Studio Verification
    verify_res = client.post("/api/verify", json={
        "brand_id": "aurelle-tech",
        "content": "Aurelle Horizon Watch is priced at ₹499 with Grade 5 Titanium chassis.",
        "channel": "INSTAGRAM",
        "asset_title": "Test Promo"
    }, headers=headers)
    assert verify_res.status_code == 200
    assert "composite_risk_score" in verify_res.json()
    assert "governance_decision" in verify_res.json()

    # 4. Change Impact Simulator
    sim_res = client.post("/api/simulator/propose", json={
        "brand_id": "aurelle-tech",
        "target_record_id": "FACT-AUR-PRC-01",
        "target_record_type": "PRICE",
        "record_label": "Aurelle Studio Subscription",
        "old_value": "₹499",
        "proposed_value": "₹599",
        "change_rationale": "Commercial indexing",
        "proposed_by": "Julian Vance"
    }, headers=headers)
    assert sim_res.status_code == 200
    assert "affected_touchpoints" in sim_res.json()

    # 5. Multimodal Creative Inspection
    mm_res = client.post("/api/multimodal/inspect", json={
        "brand_id": "aurelle-tech",
        "modality": "IMAGE",
        "visual_elements": {
            "primary_color": "#D4AF37",
            "logo_clearance_px": 24,
            "has_alt_text": True
        },
        "extracted_text": "Aurelle Horizon Watch ₹499"
    }, headers=headers)
    assert mm_res.status_code == 200

    # 6. Campaign Intelligence
    camp_res = client.get("/api/campaigns?brand_id=aurelle-tech", headers=headers)
    assert camp_res.status_code == 200

    # 7. Risk Intelligence
    risk_res = client.get("/api/risks?brand_id=aurelle-tech", headers=headers)
    assert risk_res.status_code == 200

    # 8. Approval Center Tasks
    task_res = client.get("/api/tasks?brand_id=aurelle-tech", headers=headers)
    assert task_res.status_code == 200

    # 9. Knowledge Base Atlas Config
    atlas_res = client.get("/api/knowledge-base/atlas-index-config", headers=headers)
    assert atlas_res.status_code == 200
    assert atlas_res.json()["index_name"] == "vector_index"

    # 10. Governance Analytics
    analytics_res = client.get("/api/analytics?brand_id=aurelle-tech", headers=headers)
    assert analytics_res.status_code == 200

    # 11. Audit Trust Center Releases
    rel_res = client.get("/api/releases?brand_id=aurelle-tech", headers=headers)
    assert rel_res.status_code == 200

    # 12. Settings / Security Posture & DB Status
    posture_res = client.get("/api/security/posture", headers=headers)
    assert posture_res.status_code == 200
    db_res = client.get("/api/db/status", headers=headers)
    assert db_res.status_code == 200

def test_phase9_judge_demonstration_12_step_repeatable_lifecycle():
    """
    Executes the complete 12-step Judge Demonstration scenario:
    1. Workspace Provisioning / Approved Fact Creation
    2. Fact definition & Content Submission
    3. Multimodal Inspection & Pre-release Gate
    4. Evidence-linked findings display
    5. Knowledge Graph Traversal
    6. Proposing brand fact change (₹499 -> ₹599)
    7. Running Digital Twin simulation & blast radius
    8. Identifying affected campaigns & policy conflicts
    9. Creating and assigning revision tasks
    10. Reviewer resolution & atomic approval
    11. Cryptographic release verification (5-state)
    12. Governance analytics & velocity calculation
    """
    headers = get_auth_headers(UserRole.ADMIN)

    # 1. Reset scenario to pristine baseline
    reset_res = client.post("/api/demo/reset", headers=headers)
    assert reset_res.status_code == 200

    # 2. Check initial scenario status
    status_res = client.get("/api/demo/scenario-status", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["current_price"] == "₹499"

    # 3. Execute Step 5: Propose Price Mutation (₹499 -> ₹599)
    step5_res = client.post("/api/demo/execute-step", json={
        "step_number": 5,
        "actor_role": "BRAND_MANAGER",
        "actor_name": "Julian Vance"
    }, headers=headers)
    assert step5_res.status_code == 200
    assert step5_res.json()["step_number"] == 5

    # 4. Execute Step 6: Apply Mutation & Trigger Dependency Blast Radius
    step6_res = client.post("/api/demo/execute-step", json={
        "step_number": 6,
        "actor_role": "BRAND_MANAGER",
        "actor_name": "Julian Vance"
    }, headers=headers)
    assert step6_res.status_code == 200
    assert step6_res.json()["scenario_state"]["current_price"] == "₹599"

    # 5. Execute Step 7: Automated Detection of Affected Assets
    step7_res = client.post("/api/demo/execute-step", json={
        "step_number": 7,
        "actor_role": "SYSTEM",
        "actor_name": "BrandTrace Dependency Engine"
    }, headers=headers)
    assert step7_res.status_code == 200

    # 6. Execute Step 8: Route Revision Tasks to Creators
    step8_res = client.post("/api/demo/execute-step", json={
        "step_number": 8,
        "actor_role": "CREATOR",
        "actor_name": "Maya Lin"
    }, headers=headers)
    assert step8_res.status_code == 200

    # 7. Execute Step 9: Content Creator Remediates Touchpoints
    step9_res = client.post("/api/demo/execute-step", json={
        "step_number": 9,
        "actor_role": "CREATOR",
        "actor_name": "Maya Lin"
    }, headers=headers)
    assert step9_res.status_code == 200

    # 8. Execute Step 10: Compliance & Brand Sign-Off
    step10_res = client.post("/api/demo/execute-step", json={
        "step_number": 10,
        "actor_role": "COMPLIANCE_REVIEWER",
        "actor_name": "David Sterling"
    }, headers=headers)
    assert step10_res.status_code == 200

    # 9. Execute Step 11: Cryptographic Block Sealing & Ledger Verification
    step11_res = client.post("/api/demo/execute-step", json={
        "step_number": 11,
        "actor_role": "COMPLIANCE_REVIEWER",
        "actor_name": "David Sterling"
    }, headers=headers)
    assert step11_res.status_code == 200

    # 10. Execute Step 12: Final Governance Audit & Velocity Metrics
    step12_res = client.post("/api/demo/execute-step", json={
        "step_number": 12,
        "actor_role": "ADMIN",
        "actor_name": "Sarah Chen"
    }, headers=headers)
    assert step12_res.status_code == 200
    final_status = step12_res.json()["scenario_state"]
    assert final_status["current_price"] == "₹599"
    assert final_status["approved_tasks"] >= 4
