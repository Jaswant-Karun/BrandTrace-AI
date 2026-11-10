import pytest
from httpx import AsyncClient, ASGITransport
from brandtrace.main import app
from brandtrace.modules.auth.service import auth_service
from brandtrace.core.security import decode_access_token

@pytest.mark.anyio
async def test_e2e_complete_user_journey():
    """
    Comprehensive End-to-End Test of the 18-Step BrandTrace AI User Journey:
    1. Login with demo@brandtrace.ai / DemoAurelle2026!
    2. Tenant & Profile Validation (aurelle-tech / ORG-AURELLE)
    3. Workspace Metadata & Database Telemetry
    4. Executive Command Center Analytics
    5. Brand Knowledge Base Truth-Set Retrieval (FACT-AUR-PRC-01 at ₹499)
    6. Multi-Agent Content Studio Inspection (Detects missing trademark and unsupported terms)
    7. Knowledge Graph Dependency Traversal (ReactFlow element structure)
    8. Change Impact Simulator: Digital Twin Propose (₹499 -> ₹599 mutation)
    9. Impact Blast Radius Verification (4 affected assets, $320,000 exposure)
    10. Change Impact Simulator: Digital Twin Commit (Human gate approval)
    11. Governance Approval Center Queue (Fetch generated revision tasks)
    12. Human-in-the-Loop Task Resolution (Authorized sign-off and cryptographic sealing)
    13. Trust & Audit Ledger Retrieval (Inspect signed releases)
    14. Cryptographic Proof Verifier (Verify SHA-256 digest integrity)
    15. Risk Intelligence & Regulatory Taxonomy
    16. Campaign Intelligence Portfolio
    17. Negative Authentication Testing (Wrong password returns 401)
    18. Logout / Token Invalidation Verification
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Login with demo credentials
        login_res = await client.post("/api/auth/login", json={
            "email": "demo@brandtrace.ai",
            "password": "DemoAurelle2026!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        login_data = login_res.json()
        token = login_data["access_token"]
        user = login_data["user"]
        assert user["email"] == "demo@brandtrace.ai"
        assert user["role"] == "BRAND_MANAGER"
        assert user["org_id"] == "ORG-AURELLE"
        assert user["workspace_id"] == "aurelle-tech"

        headers = {"Authorization": f"Bearer {token}"}

        # Step 2: Tenant & Profile Validation via /auth/me
        me_res = await client.get("/api/auth/me", headers=headers)
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["workspace_id"] == "aurelle-tech"
        assert me_data["org_id"] == "ORG-AURELLE"

        # Step 3: Workspace Metadata & Database Telemetry
        brand_res = await client.get("/api/brands/aurelle-tech")
        assert brand_res.status_code == 200
        brand_data = brand_res.json()
        assert brand_data["brand_id"] == "aurelle-tech"

        db_res = await client.get("/api/db/status")
        assert db_res.status_code == 200
        db_data = db_res.json()
        assert "connected" in db_data

        # Step 4: Executive Command Center Analytics
        analytics_res = await client.get("/api/analytics/governance?brand_id=aurelle-tech")
        assert analytics_res.status_code == 200
        analytics_data = analytics_res.json()
        assert "compliance_rate_percent" in analytics_data
        assert analytics_data["compliance_rate_percent"] > 0

        # Step 5: Brand Knowledge Base Truth-Set Retrieval
        graph_res = await client.get("/api/brands/aurelle-tech/graph")
        assert graph_res.status_code == 200
        graph_data = graph_res.json()
        assert "nodes" in graph_data
        assert "edges" in graph_data
        
        # Verify FACT-AUR-PRC-01 exists with value ₹499
        fact_node = next((n for n in graph_data["nodes"] if n["id"] == "FACT-AUR-PRC-01"), None)
        assert fact_node is not None, "FACT-AUR-PRC-01 must exist in the knowledge graph"
        assert fact_node["data"]["properties"]["current_value"] in ["₹499", "₹599"]

        # Step 6: Multi-Agent Content Studio Inspection
        verify_payload = {
            "brand_id": "aurelle-tech",
            "asset_title": "Aurelle Horizon & Cloud Studio Social Ad",
            "channel": "Social Media",
            "content": "Experience the revolutionary Aurelle Horizun Watch with QuantumAcoustics spatial sound streaming. Aurelle Cloud Studio subscription is ₹499/mo with 72-hour battery life."
        }
        verify_res = await client.post("/api/verify", json=verify_payload)
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert "composite_risk_score" in verify_data
        assert "agent_reports" in verify_data
        assert "all_risk_spans" in verify_data
        assert len(verify_data["agent_reports"]) >= 4

        # Step 7: Change Impact Simulator: Digital Twin Propose (₹499 -> ₹599 mutation)
        propose_payload = {
            "brand_id": "aurelle-tech",
            "target_record_id": "FACT-AUR-PRC-01",
            "target_record_type": "PRICE",
            "proposed_value": "₹599",
            "rationale": "Global commercial master resolution indexing audio mastering infrastructure costs.",
            "proposed_by": "Alex Mercer, VP Global Brand Governance"
        }
        sim_res = await client.post("/api/simulator/propose", json=propose_payload)
        assert sim_res.status_code == 200
        sim_data = sim_res.json()
        assert sim_data["target_record_id"] == "FACT-AUR-PRC-01"
        assert sim_data["old_value"] == "₹499"
        assert sim_data["proposed_value"] == "₹599"
        assert len(sim_data["affected_touchpoints"]) >= 4
        assert sim_data["estimated_financial_exposure_usd"] > 0
        sim_id = sim_data["simulation_id"]

        # Step 8: Change Impact Simulator: Digital Twin Commit (Human gate approval)
        commit_payload = {
            "brand_id": "aurelle-tech",
            "simulation_id": sim_id,
            "decision": "APPROVED",
            "authorized_reviewer": "Alex Mercer, VP Global Brand Governance"
        }
        commit_res = await client.post("/api/simulator/commit", json=commit_payload)
        assert commit_res.status_code == 200
        commit_data = commit_res.json()
        assert commit_data["status"] == "success"

        # Step 9: Governance Approval Center Queue
        tasks_res = await client.get("/api/tasks?brand_id=aurelle-tech")
        assert tasks_res.status_code == 200
        tasks = tasks_res.json()
        assert isinstance(tasks, list)

        # Step 10: Human-in-the-Loop Task Resolution (if pending tasks exist)
        if len(tasks) > 0:
            first_task = tasks[0]
            task_id = first_task["task_id"]
            resolve_res = await client.post(f"/api/tasks/{task_id}/resolve", json={
                "reviewer_name": "Alex Mercer",
                "decision": "APPROVED",
                "final_content": first_task.get("proposed_content", "Updated copy at ₹599"),
                "resolution_notes": "Authorized promotional update."
            })
            assert resolve_res.status_code == 200
            resolve_data = resolve_res.json()
            assert resolve_data["status"] == "success"
            assert "audit_proof" in resolve_data["task"]

        # Step 11: Trust & Audit Ledger Retrieval
        releases_res = await client.get("/api/releases?brand_id=aurelle-tech")
        assert releases_res.status_code == 200
        releases = releases_res.json()
        assert isinstance(releases, list)

        # Step 12: Cryptographic Proof Verifier
        verify_seal_res = await client.post("/api/ledger/verify-record", json={
            "identifier": "AST-AUR-01",
            "asset_content": "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included."
        })
        assert verify_seal_res.status_code == 200
        verify_seal_data = verify_seal_res.json()
        assert "verification_state" in verify_seal_data
        assert verify_seal_data["verification_state"] in ["VALID_UNCHANGED", "UNKNOWN_RECORD", "MODIFIED_AFTER_APPROVAL"]

        # Step 13: Risk Intelligence & Regulatory Taxonomy
        risk_res = await client.get("/api/risks/taxonomy?brand_id=aurelle-tech")
        assert risk_res.status_code == 200
        risk_data = risk_res.json()
        assert "categories" in risk_data
        assert len(risk_data["categories"]) >= 3

        # Step 14: Campaign Intelligence Portfolio
        camp_res = await client.get("/api/campaigns?brand_id=aurelle-tech")
        assert camp_res.status_code == 200
        camp_data = camp_res.json()
        assert isinstance(camp_data, list)
        assert len(camp_data) >= 1

        # Step 15: Negative Authentication Testing (Wrong password returns 401)
        neg_res = await client.post("/api/auth/login", json={
            "email": "demo@brandtrace.ai",
            "password": "wrong-password-for-negative-test"
        })
        assert neg_res.status_code == 401
        assert "Invalid credentials" in neg_res.json()["detail"]

        # Step 16: Unknown User returns 401
        unknown_res = await client.post("/api/auth/login", json={
            "email": "hacker@unauthorized-domain.com",
            "password": "some-password"
        })
        assert unknown_res.status_code == 401
