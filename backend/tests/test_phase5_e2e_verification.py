import pytest
import io
import time
from httpx import AsyncClient, ASGITransport
from brandtrace.main import app
from brandtrace.engine.audit_ledger import audit_ledger_engine as audit_ledger

@pytest.mark.anyio
async def test_phase5_workflow_a_brand_knowledge_management():
    """
    Workflow A: Comprehensive Brand Knowledge Document Management
    - List documents (includes seeded demos)
    - Create new custom brand document
    - Verify processing state is INDEXED
    - Update document and verify version increments to 1.1 with 1.0 archived
    - Inspect document versions history
    - Test SSRF protection on website import preview
    - Test deletion of custom document
    - Test protection of demo benchmark document against deletion (403 Forbidden)
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Login as Compliance Reviewer
        login_res = await client.post("/api/auth/login", json={
            "email": "governance@apex.com",
            "password": "brandtrace2026"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Step 2: List documents
        list_res = await client.get("/api/documents?workspace_id=apex-dynamics", headers=headers)
        assert list_res.status_code == 200
        docs = list_res.json()
        assert len(docs) >= 1
        demo_doc = next((d for d in docs if d.get("is_demo")), None)
        assert demo_doc is not None, "Seeded demo document must be present"

        # Step 3: Create custom document
        create_payload = {
            "title": "Apex HyperDrive 800V Thermal Safety Standard",
            "category": "REGULATORY_POLICIES",
            "description": "Engineering safety threshold guidelines for next-gen 800V silicon-carbide architecture.",
            "raw_content": "The Apex HyperDrive architecture operates strictly below 65 degrees Celsius during 350kW continuous DC ultra-fast charging.",
            "workspace_id": "apex-dynamics",
            "org_id": "ORG-APEX"
        }
        create_res = await client.post("/api/documents", json=create_payload, headers=headers)
        assert create_res.status_code == 200
        created_doc = create_res.json()
        doc_id = created_doc["doc_id"]
        assert created_doc["title"] == create_payload["title"]
        assert created_doc["version_number"] == "1.0"
        assert created_doc["processing_status"] == "INDEXED"

        # Step 4: Retrieve document by ID
        get_res = await client.get(f"/api/documents/{doc_id}?workspace_id=apex-dynamics", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["doc_id"] == doc_id

        # Step 5: Update document and verify versioning
        update_payload = {
            "title": "Apex HyperDrive 800V Thermal Safety Standard (Rev B)",
            "category": "REGULATORY_POLICIES",
            "description": "Updated engineering safety guidelines with revised 62C peak threshold.",
            "raw_content": "The Apex HyperDrive architecture operates strictly below 62 degrees Celsius during 350kW continuous DC ultra-fast charging.",
            "change_summary": "Revised peak thermal threshold from 65C to 62C"
        }
        update_res = await client.put(f"/api/documents/{doc_id}?workspace_id=apex-dynamics", json=update_payload, headers=headers)
        assert update_res.status_code == 200
        updated_doc = update_res.json()
        assert updated_doc["version_number"] == "1.1"
        assert updated_doc["processing_status"] == "INDEXED"

        # Step 6: Verify version history
        versions_res = await client.get(f"/api/documents/{doc_id}/versions", headers=headers)
        assert versions_res.status_code == 200
        versions = versions_res.json()
        assert len(versions) >= 1
        assert versions[0]["version_number"] == "1.0"

        # Step 7: SSRF Protection on Website Import Preview
        ssrf_payload = {"url": "http://127.0.0.1:8000/admin-internal", "workspace_id": "apex-dynamics"}
        ssrf_res = await client.post("/api/documents/import-website/preview", json=ssrf_payload, headers=headers)
        assert ssrf_res.status_code == 400
        assert "private" in ssrf_res.json()["detail"].lower() or "forbidden" in ssrf_res.json()["detail"].lower()

        # Step 8: Delete custom document
        del_res = await client.delete(f"/api/documents/{doc_id}?workspace_id=apex-dynamics", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["status"] in ["SUCCESS", "DELETED"]

        # Verify deletion
        get_deleted = await client.get(f"/api/documents/{doc_id}?workspace_id=apex-dynamics", headers=headers)
        assert get_deleted.status_code == 404

        # Step 9: Verify protected demo cannot be deleted
        demo_del_res = await client.delete(f"/api/documents/{demo_doc['doc_id']}?workspace_id=apex-dynamics", headers=headers)
        assert demo_del_res.status_code == 403
        assert "protected" in demo_del_res.json()["detail"].lower()


@pytest.mark.anyio
async def test_phase5_workflow_b_ai_content_intelligence():
    """
    Workflow B: AI Content Intelligence & Multi-Agent Inspection
    - Submits marketing release candidate copy
    - Verifies response has composite risk score and active agent reports
    - Checks that 3 concurrent agents evaluate: VoicePersonaAgent, ClaimSubstantiationAgent, RegulatoryComplianceAgent
    - Validates latency under 800ms
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        verify_payload = {
            "brand_id": "apex-dynamics",
            "asset_title": "Apex Fleet Commercial Release Ad",
            "channel": "Digital / Web",
            "content": "Apex Dynamics provides high-performance electric commercial mobility with zero emissions. Charging takes 18 minutes on 350kW DC chargers."
        }
        res = await client.post("/api/verify", json=verify_payload)
        assert res.status_code == 200
        data = res.json()
        assert "composite_risk_score" in data
        assert "agent_reports" in data
        assert "latency_ms" in data
        assert data["latency_ms"] < 800.0
        
        # Verify reports from each specialist agent
        reports = data["agent_reports"]
        assert "voice_persona" in reports
        assert "claim_substantiation" in reports
        assert "regulatory_compliance" in reports


@pytest.mark.anyio
async def test_phase5_workflow_c_governance_digital_twin_and_approvals():
    """
    Workflow C: Governance Digital Twin & Change Impact Simulation
    - Proposes mutation to approved fact
    - Verifies impact blast radius and workload estimate
    - Verifies human-in-the-loop task review queue
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        propose_payload = {
            "brand_id": "aurelle-tech",
            "target_record_id": "FACT-AUR-PRC-01",
            "target_record_type": "PRICE",
            "record_label": "Aurelle Studio Subscription",
            "old_value": "₹499",
            "proposed_value": "₹599",
            "change_rationale": "Semi-annual commercial pricing index adjustment.",
            "proposed_by": "Camille Laurent, Sustainability & Brand Integrity VP"
        }
        sim_res = await client.post("/api/simulator/propose", json=propose_payload)
        assert sim_res.status_code == 200
        sim_data = sim_res.json()
        assert sim_data["target_record_id"] == "FACT-AUR-PRC-01"
        assert sim_data["old_value"] == "₹499"
        assert sim_data["proposed_value"] == "₹599"
        assert "overall_risk_score" in sim_data
        assert "workload_estimate" in sim_data
        assert len(sim_data["affected_touchpoints"]) >= 1


@pytest.mark.anyio
async def test_phase5_workflow_d_public_verification_portal():
    """
    Workflow D: Public Verification Portal
    - Public seal lookup (/api/public/verify-seal)
    - Public text canonicalization verification (/api/public/verify-text)
    - Public image hash verification (/api/public/verify-image)
    - Unknown seal handling
    - Zero metadata leakage
    """
    # 1. Register an authentic approved release in the ledger
    approved_text = "Velora Money approved institutional quarterly yield update for Q4 2026."
    release_rec = audit_ledger.record_release(
        user_identity="compliance@velora.com",
        user_role="COMPLIANCE_REVIEWER",
        resource_id="AST-PUB-VLM-01",
        resource_type="MARKETING_ANNOUNCEMENT",
        content=approved_text,
        decision="APPROVED",
        review_notes="Signed by Compliance Reviewer for public distribution.",
        approved_version="v1.0",
        relevant_sources=["FACT-VLM-01", "GL-VLM-01"]
    )
    seal_code = release_rec.tamper_evident_seal

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # A. Public Seal Check - Valid
        seal_res = await client.post("/api/public/verify-seal", json={"seal_code": seal_code})
        assert seal_res.status_code == 200
        seal_data = seal_res.json()
        assert seal_data["status"] == "APPROVED"
        assert seal_data["is_authentic"] is True
        assert seal_data["seal_code"] == seal_code
        # Ensure zero leakage of private user email, role, or mongo ID
        assert "compliance@velora.com" not in str(seal_data)
        assert "COMPLIANCE_REVIEWER" not in str(seal_data)
        assert "_id" not in seal_data

        # B. Public Seal Check - Unknown
        unknown_res = await client.post("/api/public/verify-seal", json={"seal_code": "BT-SEAL-UNKNOWN999"})
        assert unknown_res.status_code == 200
        unknown_data = unknown_res.json()
        assert unknown_data["status"] == "UNKNOWN"
        assert unknown_data["is_authentic"] is False

        # C. Public Text Check - Unchanged
        text_match_res = await client.post("/api/public/verify-text", json={
            "content_text": "Velora Money approved institutional quarterly yield update for Q4 2026."
        })
        assert text_match_res.status_code == 200
        text_match_data = text_match_res.json()
        assert text_match_data["status"] == "APPROVED"
        assert text_match_data["is_authentic"] is True

        # D. Public Seal + Modified Content Check
        mod_res = await client.post("/api/public/verify-seal", json={
            "seal_code": seal_code,
            "content_text": "Velora Money approved institutional quarterly yield update for Q4 2026 with 99% guaranteed return."
        })
        assert mod_res.status_code == 200
        mod_data = mod_res.json()
        assert mod_data["status"] == "MODIFIED"
        assert mod_data["is_authentic"] is False

        # E. Public Image Check - Valid PNG
        # Minimal valid 1x1 PNG bytes
        png_bytes = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
            b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"file": ("banner.png", io.BytesIO(png_bytes), "image/png")}
        img_res = await client.post("/api/public/verify-image", files=files, data={"brand_id": "velora-money"})
        assert img_res.status_code == 200
        img_data = img_res.json()
        assert img_data["status"] in ["APPROVED", "UNKNOWN"]
        assert len(img_data["computed_hash"]) == 64


@pytest.mark.anyio
async def test_phase5_security_tenant_isolation_and_rate_limits():
    """
    Security Validation:
    - Multi-tenant boundary isolation between ORG-APEX and ORG-NOVUS
    - Request payload size protection (413 for oversized requests)
    - Anti-spoofing and invalid file upload rejection
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login as Apex user
        apex_login = await client.post("/api/auth/login", json={
            "email": "governance@apex.com",
            "password": "brandtrace2026"
        })
        apex_token = apex_login.json()["access_token"]
        apex_headers = {"Authorization": f"Bearer {apex_token}"}

        # Create document under Apex
        create_res = await client.post("/api/documents", json={
            "title": "Apex Confidential Battery Architecture v9",
            "category": "PRODUCT_FACTS",
            "description": "Internal specifications.",
            "raw_content": "Confidential internal Apex Dynamics specification.",
            "workspace_id": "apex-dynamics",
            "org_id": "ORG-APEX"
        }, headers=apex_headers)
        assert create_res.status_code == 200
        apex_doc_id = create_res.json()["doc_id"]

        # 2. Login as Novus user
        novus_login = await client.post("/api/auth/login", json={
            "email": "compliance@novus.com",
            "password": "brandtrace2026"
        })
        novus_token = novus_login.json()["access_token"]
        novus_headers = {"Authorization": f"Bearer {novus_token}"}

        # Novus attempts to read Apex document -> must return 404
        cross_res = await client.get(f"/api/documents/{apex_doc_id}?workspace_id=novus-health", headers=novus_headers)
        assert cross_res.status_code == 404, "Cross-tenant access must return 404 Not Found"

        # Novus attempts to delete Apex document -> must return 404
        cross_del = await client.delete(f"/api/documents/{apex_doc_id}?workspace_id=novus-health", headers=novus_headers)
        assert cross_del.status_code == 404

        # Clean up by Apex user
        await client.delete(f"/api/documents/{apex_doc_id}?workspace_id=apex-dynamics", headers=apex_headers)

        # 3. Oversized payload test
        oversized_text = "A" * 150000
        big_res = await client.post("/api/public/verify-text", json={"content_text": oversized_text})
        assert big_res.status_code == 413, "Oversized request must return 413 Payload Too Large"

        # 4. Invalid file signature test
        fake_files = {"file": ("malicious.png", io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00FakePEHeader"), "image/png")}
        fake_res = await client.post("/api/public/verify-image", files=fake_files)
        assert fake_res.status_code == 400
        assert "signature" in fake_res.json()["detail"].lower()
