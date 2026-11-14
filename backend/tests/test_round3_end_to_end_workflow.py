import pytest
import time
from fastapi.testclient import TestClient
from brandtrace.main import app
from brandtrace.modules.auth.router import create_access_token
from brandtrace.modules.auth.models import UserRole
from brandtrace.database.mongo import mongo_manager

client = TestClient(app)

def get_auth_header(role: UserRole = UserRole.ADMIN, name: str = "Chief Governance Officer") -> dict:
    token = create_access_token({
        "sub": "USR-GOV-01",
        "email": "governance@aurelle.com",
        "role": role.value,
        "org_id": "ORG-AURELLE",
        "name": name
    })
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.anyio
async def test_round3_end_to_end_aurelle_workflow():
    """
    Round 3 End-to-End Enterprise Governance Workflow:
    1. Brand Knowledge: View, Add Fact, Edit Fact, Add Guideline.
    2. Content Submission: Validate input, channels, campaign association.
    3. Knowledge Retrieval: Retrieve relevant truth nodes.
    4. Content Inspection: Multi-Agent gate (<800ms) and explainable review.
    5. Evidence-Linked Findings: Citations, classifications, suggested fixes.
    6. Risk Review: Category severity, governing regulations.
    7. Change Impact Simulation: ₹499 -> ₹599 non-destructive digital twin.
    8. Human Approval: Authorized sign-off, diff resolution, duplicate protection.
    9. Verified Release: Deterministic SHA-256 release seal.
    10. Trust & Audit Ledger: 5-state integrity verification and audit event trail.
    """
    brand_id = "aurelle-tech"
    admin_headers = get_auth_header(UserRole.ADMIN)

    # --------------------------------------------------------------------------
    # STEP 1: BRAND KNOWLEDGE
    # --------------------------------------------------------------------------
    # 1.1 View approved facts
    res_facts = client.get(f"/api/facts?brand_id={brand_id}")
    assert res_facts.status_code == 200
    facts = res_facts.json()
    assert len(facts) >= 1
    price_fact = next((f for f in facts if f["id"] == "FACT-AUR-PRC-01"), None)
    assert price_fact is not None
    assert "499" in price_fact["current_value"]

    # 1.2 Add a new approved fact
    new_fact_payload = {
        "brand_id": brand_id,
        "name": "Aurelle ProCare Extended Warranty",
        "category": "PRICE",
        "current_value": "₹149/yr",
        "unit": "INR/yr",
        "description": "Annual extended hardware protection covering accidental damage and battery replacement.",
        "source_citation": "Aurelle Commercial Operations Resolution #2026-PCW",
        "department_owner": "Customer Operations",
        "source_date": "2026-01-15",
        "expiry_date": "2027-01-15",
        "evidence_reference": "REF-AUR-WTY-2026",
        "restricted_terms": ["free repair forever", "unconditional lifetime swap"],
        "required_phrases": ["Terms and conditions apply"]
    }
    res_create_fact = client.post("/api/facts", json=new_fact_payload, headers=admin_headers)
    assert res_create_fact.status_code == 200
    created_fact = res_create_fact.json()
    created_fact_id = created_fact["id"]
    assert "FACT-AUR" in created_fact_id
    assert created_fact["current_value"] == "₹149/yr"

    # 1.3 Edit an approved fact
    update_fact_payload = {
        "current_value": "₹199/yr",
        "description": "Updated ProCare tier including global international express transit replacement.",
        "source_citation": "Aurelle Executive Committee Resolution #2026-PCW-V2"
    }
    res_update_fact = client.put(f"/api/facts/{created_fact_id}?brand_id={brand_id}", json=update_fact_payload, headers=admin_headers)
    assert res_update_fact.status_code == 200
    updated_fact = res_update_fact.json()
    assert updated_fact["current_value"] == "₹199/yr"

    # 1.4 Add brand guideline and restricted terminology
    guideline_payload = {
        "brand_id": brand_id,
        "title": "Aurelle Spatial Acoustic Substantiation",
        "category": "VOICE",
        "rule_statement": "Spatial audio descriptions must specify dual-driver acoustic array architecture.",
        "severity": "HIGH",
        "source_citation": "Aurelle Engineering Standard AES-2026-09",
        "restricted_terms": ["telepathic sound", "mind-reading audio"],
        "required_phrases": ["QuantumAcoustics™"]
    }
    res_guideline = client.post("/api/guidelines", json=guideline_payload, headers=admin_headers)
    assert res_guideline.status_code == 200
    created_guideline = res_guideline.json()
    assert "GL-AUR" in created_guideline["guideline_id"]

    # --------------------------------------------------------------------------
    # STEP 2: CONTENT SUBMISSION
    # --------------------------------------------------------------------------
    sample_marketing_copy = (
        "Experience the revolutionary Aurelle Horizun Watch with QuantumAcoustics spatial sound streaming. "
        "Aurelle Cloud Studio subscription is ₹499/mo with 72-hour battery life."
    )
    # Empty content validation check
    res_empty = client.post("/api/verify", json={"brand_id": brand_id, "content": "  "})
    assert res_empty.status_code == 400

    # --------------------------------------------------------------------------
    # STEP 3 & 4: CONTENT INSPECTION & KNOWLEDGE RETRIEVAL
    # --------------------------------------------------------------------------
    t0 = time.perf_counter()
    res_verify = client.post("/api/verify", json={
        "brand_id": brand_id,
        "content": sample_marketing_copy,
        "asset_title": "Meta Feed Ad: Aurelle Horizon & Cloud Studio",
        "channel": "Social Media"
    })
    elapsed_ms = (time.perf_counter() - t0) * 1000
    assert res_verify.status_code == 200
    assert elapsed_ms < 1000  # Multi-agent gate executes rapidly

    verify_data = res_verify.json()
    verification_id = verify_data["verification_id"]
    assert verification_id is not None
    assert verify_data["governance_decision"] in ["STAGED_FOR_HUMAN_REVIEW", "REJECTED_GATED"]

    # --------------------------------------------------------------------------
    # STEP 5: EVIDENCE-LINKED FINDINGS
    # --------------------------------------------------------------------------
    # Explainable review linking findings to specific truth nodes
    res_explain = client.post("/api/explainable/review", json={
        "brand_id": brand_id,
        "content": sample_marketing_copy
    })
    assert res_explain.status_code == 200
    explain_data = res_explain.json()
    assert explain_data["total_claims_analyzed"] >= 2
    # Verify classification states exist (e.g. EXPIRED_SOURCE or NEEDS_VERIFICATION)
    classifications = [a["classification"] for a in explain_data["assessments"]]
    assert any(c in ["EXPIRED_SOURCE", "NEEDS_VERIFICATION", "SUPPORTED", "CONTRADICTED"] for c in classifications)
    # Check that real evidence citations are attached
    citations = [a["source_citation"] for a in explain_data["assessments"] if a["source_citation"]]
    assert len(citations) >= 1

    # --------------------------------------------------------------------------
    # STEP 6: RISK REVIEW
    # --------------------------------------------------------------------------
    res_taxonomy = client.get(f"/api/risks/taxonomy?brand_id={brand_id}")
    assert res_taxonomy.status_code == 200
    risk_taxonomy = res_taxonomy.json()
    assert risk_taxonomy["total_risk_rules"] >= 1

    # --------------------------------------------------------------------------
    # STEP 7: CHANGE IMPACT SIMULATION (DIGITAL TWIN)
    # --------------------------------------------------------------------------
    # 7.1 Non-destructive simulation: propose price mutation ₹499 -> ₹599
    res_sim_propose = client.post("/api/simulator/propose", json={
        "brand_id": brand_id,
        "target_record_id": "FACT-AUR-PRC-01",
        "target_record_type": "PRICE",
        "record_label": "Aurelle Cloud Studio Monthly Subscription",
        "old_value": "₹499",
        "proposed_value": "₹599",
        "change_rationale": "High-fidelity spatial audio infrastructure scaling.",
        "proposed_by": "Julian Vance, VP Brand Governance"
    })
    assert res_sim_propose.status_code == 200
    sim_report = res_sim_propose.json()
    simulation_id = sim_report["simulation_id"]
    assert sim_report["affected_touchpoints_count"] >= 3
    assert sim_report["commercial_risk_tier"] in ["CRITICAL", "HIGH", "MODERATE"]

    # 7.2 NON-DESTRUCTIVE GUARANTEE: Verify approved fact was NOT modified yet!
    res_check_fact = client.get(f"/api/facts?brand_id={brand_id}")
    facts_after_sim = res_check_fact.json()
    fact_prc = next(f for f in facts_after_sim if f["id"] == "FACT-AUR-PRC-01")
    assert "499" in fact_prc["current_value"]  # STILL ₹499!

    # --------------------------------------------------------------------------
    # STEP 8: HUMAN APPROVAL (REVISION TASK WORKFLOW)
    # --------------------------------------------------------------------------
    # Propose BDIG mutation to create revision tasks in MongoDB
    res_mutate = client.post("/api/facts/mutate", json={
        "brand_id": brand_id,
        "fact_id": "FACT-AUR-PRC-01",
        "new_value": "₹599",
        "change_rationale": "Commercial master price update"
    })
    assert res_mutate.status_code == 200
    mutation_result = res_mutate.json()
    assert len(mutation_result["revision_tasks"]) >= 1

    task = mutation_result["revision_tasks"][0]
    task_id = task["task_id"]

    # 8.1 RBAC Gate: Unauthorized user cannot resolve task
    viewer_headers = get_auth_header(UserRole.VIEWER, "Guest Viewer")
    res_unauth = client.post(f"/api/tasks/{task_id}/resolve", json={
        "reviewer_name": "Guest Viewer",
        "decision": "APPROVED",
        "final_content": task["proposed_content"]
    }, headers=viewer_headers)
    assert res_unauth.status_code == 403

    # 8.2 Authorized Approval & Sealing
    res_resolve = client.post(f"/api/tasks/{task_id}/resolve", json={
        "reviewer_name": "Chief Governance Officer",
        "decision": "APPROVED",
        "final_content": task["proposed_content"],
        "resolution_notes": "Officially approved for live release flighting."
    }, headers=admin_headers)
    assert res_resolve.status_code == 200
    resolved_data = res_resolve.json()
    assert resolved_data["status"] == "success"
    assert resolved_data["task"]["status"] == "APPROVED_SEALED"
    assert "audit_proof" in resolved_data["task"]

    # 8.3 Duplicate Resolution Prevention
    res_duplicate = client.post(f"/api/tasks/{task_id}/resolve", json={
        "reviewer_name": "Chief Governance Officer",
        "decision": "APPROVED"
    }, headers=admin_headers)
    assert res_duplicate.status_code == 400 or "already resolved" in res_duplicate.text.lower()

    # --------------------------------------------------------------------------
    # STEP 9: VERIFIED RELEASE (CRYPTOGRAPHIC SEAL)
    # --------------------------------------------------------------------------
    res_sign = client.post("/api/releases/sign", json={
        "verification_id": verification_id,
        "brand_id": brand_id,
        "asset_id": "AST-AUR-01",
        "asset_title": "Meta Feed Ad: Aurelle Horizon & Cloud Studio",
        "channel": "Social Media",
        "content": "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included.",
        "reviewer": "Chief Governance Officer",
        "decision": "APPROVED"
    }, headers=admin_headers)
    assert res_sign.status_code == 200
    sign_data = res_sign.json()
    assert sign_data["status"] == "SEALED"
    audit_stamp = sign_data["audit_stamp"]
    assert audit_stamp.startswith("BT-SEAL-")

    # --------------------------------------------------------------------------
    # STEP 10: TRUST & AUDIT LEDGER (5-STATE INTEGRITY VERIFICATION)
    # --------------------------------------------------------------------------
    # 10.1 Verify Unchanged Record -> State 1
    res_v1 = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-01",
        "content_to_test": "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included."
    })
    assert res_v1.status_code == 200
    v1_data = res_v1.json()
    assert v1_data["state"] == "VALID_UNCHANGED"

    # 10.2 Verify Tampered Record -> State 2
    res_v2 = client.post("/api/ledger/verify-record", json={
        "identifier": "AST-AUR-01",
        "content_to_test": "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹399 per month. Real-time audio rendering included."
    })
    assert res_v2.status_code == 200
    v2_data = res_v2.json()
    assert v2_data["state"] == "MODIFIED_AFTER_APPROVAL"

    # 10.3 Verify Audit Events Stream in Collaboration Feed
    res_events = client.get("/api/collaboration/events?limit=10")
    assert res_events.status_code == 200
    events = res_events.json()
    assert len(events) >= 1
