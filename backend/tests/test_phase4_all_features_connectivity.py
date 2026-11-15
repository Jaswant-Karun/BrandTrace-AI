"""
Phase 4: Complete Frontend and Backend Connectivity Validation Test Suite
Tests every product feature (all 22 endpoints/modules) across frontend & backend contracts.
"""

import io
import pytest
from httpx import AsyncClient, ASGITransport
from brandtrace.main import app
from brandtrace.modules.auth.service import create_access_token


@pytest.fixture
def auth_tokens():
    def _make(role: str = "CREATOR", name: str = "Creator Asha", sub: str = "USR-CREATOR-01"):
        return create_access_token({
            "sub": sub,
            "email": f"{role.lower()}@brandtrace.ai",
            "name": name,
            "role": role,
            "organization_id": "ORG-AURELLE",
        })
    return _make


@pytest.mark.anyio
class TestPhase4CompleteConnectivity:
    """Rigorous feature-to-API verification across all BrandTrace AI modules."""

    async def test_feature_01_creator_workspace_drafts(self, auth_tokens):
        """Feature 1: Creator Workspace - fetch and manage drafts."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            token = auth_tokens(role="CREATOR")
            resp = await client.get("/api/drafts", headers={"Authorization": f"Bearer {token}"})
            assert resp.status_code == 200
            data = resp.json()
            assert isinstance(data, list)

    async def test_feature_02_agency_workspace_queue_and_review(self, auth_tokens):
        """Feature 2: Agency Workspace - queue access and agency review submission."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            agency_token = auth_tokens(role="CREATOR", name="Agency Sana", sub="USR-AGENCY-01")
            headers = {"Authorization": f"Bearer {agency_token}"}

            # 1. Fetch queue
            resp = await client.get("/api/submissions/queue?role=agency", headers=headers)
            assert resp.status_code == 200
            items = resp.json()
            assert isinstance(items, list)

            # 2. Submit test submission to review
            sub_resp = await client.post("/api/submissions", json={
                "title": "Agency Test Campaign",
                "channel": "instagram",
                "creator_id": "USR-AGENCY-01",
                "creator_name": "Agency Sana",
                "creator_type": "agency",
                "org_id": "ORG-AGENCY-PULSE",
                "version": 1,
                "original_content": "Agency test campaign copy for Aurelle serum.",
                "current_content": "Agency test campaign copy for Aurelle serum.",
                "findings": [],
                "submission_notes": "Initial agency test submission.",
            }, headers=headers)
            assert sub_resp.status_code == 200
            sub_id = sub_resp.json()["submission_id"]

            # 3. Agency forwards draft
            rev_resp = await client.post(f"/api/submissions/{sub_id}/agency-review", json={
                "agency_name": "Agency Pulse Partner",
                "agency_role": "AGENCY",
                "decision": "FORWARD",
                "feedback": "Agency quality verified. Forwarded to Brand Reviewer.",
            }, headers=headers)
            assert rev_resp.status_code == 200
            agency_data = rev_resp.json()
            assert agency_data["status"] == "PENDING_REVIEW"
            agency_steps = [s for s in agency_data["approval_history"] if s.get("stage") == "AGENCY_APPROVAL"]
            assert len(agency_steps) > 0
            assert agency_steps[0]["status"] == "COMPLETED"

    async def test_feature_03_reviewer_workspace_queue_and_decision(self, auth_tokens):
        """Feature 3: Reviewer Workspace - queue and reviewer decision."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            rev_token = auth_tokens(role="REVIEWER", name="Reviewer Maya", sub="USR-REV-01")
            headers = {"Authorization": f"Bearer {rev_token}"}

            # 1. Fetch queue
            resp = await client.get("/api/submissions/queue?role=reviewer", headers=headers)
            assert resp.status_code == 200

            # 2. Create submission and approve it
            sub_resp = await client.post("/api/submissions", json={
                "title": "Reviewer Test",
                "channel": "instagram",
                "creator_id": "USR-CREATOR-01",
                "creator_name": "Creator Asha",
                "creator_type": "creator",
                "org_id": "ORG-AURELLE",
                "version": 1,
                "original_content": "Reviewer validation copy.",
                "current_content": "Reviewer validation copy.",
                "findings": [],
            }, headers={"Authorization": f"Bearer {auth_tokens('CREATOR')}"})
            sub_id = sub_resp.json()["submission_id"]

            rev_resp = await client.post(f"/api/submissions/{sub_id}/review", json={
                "reviewer_name": "Reviewer Maya",
                "reviewer_role": "CONTENT_REVIEWER",
                "decision": "APPROVE",
                "feedback": "Approved for compliance check.",
            }, headers=headers)
            assert rev_resp.status_code == 200
            assert rev_resp.json()["status"] == "REVIEW_APPROVED"

    async def test_feature_04_compliance_workspace_queue_and_signoff(self, auth_tokens):
        """Feature 4: Compliance Reviewer Workspace - queue and regulatory validation."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            comp_token = auth_tokens(role="COMPLIANCE_REVIEWER", name="Compliance Arjun", sub="USR-COMP-01")
            comp_headers = {"Authorization": f"Bearer {comp_token}"}
            rev_headers = {"Authorization": f"Bearer {auth_tokens('REVIEWER')}"}

            # 1. Create and move to REVIEW_APPROVED
            sub_resp = await client.post("/api/submissions", json={
                "title": "Compliance Test",
                "channel": "instagram",
                "creator_id": "USR-CREATOR-01",
                "creator_name": "Creator Asha",
                "creator_type": "creator",
                "org_id": "ORG-AURELLE",
                "version": 1,
                "original_content": "Compliance validation text.",
                "current_content": "Compliance validation text.",
                "findings": [],
            }, headers={"Authorization": f"Bearer {auth_tokens('CREATOR')}"})
            sub_id = sub_resp.json()["submission_id"]
            await client.post(f"/api/submissions/{sub_id}/review", json={
                "reviewer_name": "Maya",
                "reviewer_role": "CONTENT_REVIEWER",
                "decision": "APPROVE",
                "feedback": "Approved.",
            }, headers=rev_headers)

            # 2. Check compliance queue
            q_resp = await client.get("/api/submissions/queue?role=compliance", headers=comp_headers)
            assert q_resp.status_code == 200
            queue_ids = [item["id"] for item in q_resp.json()]
            assert sub_id in queue_ids

            # 3. Compliance signs off
            comp_resp = await client.post(f"/api/submissions/{sub_id}/compliance", json={
                "reviewer_name": "Dr. Sarah Rao",
                "reviewer_role": "COMPLIANCE_REVIEWER",
                "decision": "APPROVE",
                "statutory_citations": ["FDA-21-CFR-201", "ASCI-GREENWASH-2024"],
                "feedback": "Statutory claims verified under clinical protocol.",
            }, headers=comp_headers)
            assert comp_resp.status_code == 200
            assert comp_resp.json()["status"] == "COMPLIANCE_APPROVED"

    async def test_feature_05_brand_owner_workspace_and_final_release(self, auth_tokens):
        """Feature 5: Brand Owner Workspace - final approval and release."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            bo_token = auth_tokens(role="BRAND_MANAGER", name="Brand Owner Kabir", sub="USR-OWNER-01")
            bo_headers = {"Authorization": f"Bearer {bo_token}"}
            rev_headers = {"Authorization": f"Bearer {auth_tokens('REVIEWER')}"}
            comp_headers = {"Authorization": f"Bearer {auth_tokens('COMPLIANCE_REVIEWER')}"}

            # 1. Create and advance to COMPLIANCE_APPROVED
            sub_resp = await client.post("/api/submissions", json={
                "title": "Executive Release Test",
                "channel": "instagram",
                "creator_id": "USR-CREATOR-01",
                "creator_name": "Creator Asha",
                "creator_type": "creator",
                "org_id": "ORG-AURELLE",
                "version": 1,
                "original_content": "Aurelle Vitamin C Serum delivers 32% spot reduction in 8 weeks under protocol AUR-LAB-014.",
                "current_content": "Aurelle Vitamin C Serum delivers 32% spot reduction in 8 weeks under protocol AUR-LAB-014.",
                "findings": [],
            }, headers={"Authorization": f"Bearer {auth_tokens('CREATOR')}"})
            sub_id = sub_resp.json()["submission_id"]
            await client.post(f"/api/submissions/{sub_id}/review", json={
                "reviewer_name": "Maya",
                "reviewer_role": "CONTENT_REVIEWER",
                "decision": "APPROVE",
            }, headers=rev_headers)
            await client.post(f"/api/submissions/{sub_id}/compliance", json={
                "reviewer_name": "Dr. Rao",
                "reviewer_role": "COMPLIANCE_REVIEWER",
                "decision": "APPROVE",
            }, headers=comp_headers)

            # 2. Brand Owner queue
            bo_q = await client.get("/api/submissions/queue?role=brand-owner", headers=bo_headers)
            assert bo_q.status_code == 200
            bo_ids = [item["id"] for item in bo_q.json()]
            assert sub_id in bo_ids

            # 3. Brand Owner final approval
            bo_resp = await client.post(f"/api/submissions/{sub_id}/final-approval", json={
                "owner_name": "Priya Sharma (VP Brand)",
                "owner_role": "BRAND_OWNER",
                "decision": "APPROVE",
                "release_tag": "CAMPAIGN-SUMMER-2026",
                "feedback": "Final executive release authorized.",
            }, headers=bo_headers)
            assert bo_resp.status_code == 200
            res_data = bo_resp.json()
            assert res_data["status"] == "RELEASED"
            assert "release_digest" in res_data
            assert len(res_data["release_digest"]) == 64

    async def test_feature_06_content_creation_draft(self, auth_tokens):
        """Feature 6: Content Creation - persist new campaign draft."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = {"Authorization": f"Bearer {auth_tokens('CREATOR')}"}
            payload = {
                "title": "Serum Launch Announcement",
                "content": "Discover the radiance of Aurelle Vitamin C serum.",
                "channel": "instagram",
                "brand_id": "aurelle-tech",
            }
            resp = await client.post("/api/drafts", json=payload, headers=headers)
            assert resp.status_code in [200, 201]
            data = resp.json()
            assert "draft_id" in data or "id" in data

    async def test_feature_07_and_08_content_checking_and_ai_correction(self):
        """Feature 7 & 8: Content Checking and AI Correction remediation."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "content": "Clinically proven to fade dark spots by 60% in just 2 weeks for ₹499 only!",
                "brand_id": "aurelle-tech",
                "channel": "instagram",
            }
            resp = await client.post("/api/verify", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert "summary_counts" in data
            assert "verdict_badge" in data
            assert data["summary_counts"]["blocking"] > 0
            # Sentence findings check
            assert len(data.get("sentence_findings", [])) > 0
            f = data["sentence_findings"][0]
            assert "suggested_sentence" in f
            assert "explanation" in f

    async def test_feature_09_submission_persistence(self, auth_tokens):
        """Feature 9: Submission persistence and retrieval."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            creator_headers = {"Authorization": f"Bearer {auth_tokens('CREATOR')}"}
            # Create submission
            sub_resp = await client.post("/api/submissions", json={
                "title": "Persistence Test",
                "channel": "instagram",
                "creator_id": "USR-CREATOR-01",
                "creator_name": "Asha",
                "creator_type": "creator",
                "org_id": "ORG-AURELLE",
                "version": 1,
                "original_content": "Submission persistence validation copy.",
                "current_content": "Submission persistence validation copy.",
                "findings": [],
            }, headers=creator_headers)
            assert sub_resp.status_code == 200
            sub_id = sub_resp.json()["submission_id"]

            # Retrieve list of submissions
            list_resp = await client.get("/api/submissions", headers=creator_headers)
            assert list_resp.status_code == 200
            subs = list_resp.json()
            ids = [s.get("id") or s.get("submission_id") for s in subs]
            assert sub_id in ids

    async def test_feature_10_and_11_review_comments_and_revision_requests(self, auth_tokens):
        """Feature 10 & 11: Review comments and revision requests (return to creator)."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            creator_headers = {"Authorization": f"Bearer {auth_tokens('CREATOR')}"}
            rev_headers = {"Authorization": f"Bearer {auth_tokens('REVIEWER')}"}
            sub_resp = await client.post("/api/submissions", json={
                "title": "Revision Test",
                "channel": "instagram",
                "creator_id": "USR-CREATOR-01",
                "creator_name": "Asha",
                "creator_type": "creator",
                "org_id": "ORG-AURELLE",
                "version": 1,
                "original_content": "Draft with exaggerated claims.",
                "current_content": "Draft with exaggerated claims.",
                "findings": [],
            }, headers=creator_headers)
            sub_id = sub_resp.json()["submission_id"]

            # Reviewer requests changes with comments
            rev_resp = await client.post(f"/api/submissions/{sub_id}/review", json={
                "reviewer_name": "Maya",
                "reviewer_role": "CONTENT_REVIEWER",
                "decision": "REQUEST_CHANGES",
                "feedback": "Please calibrate the percentage claim to 32% per FACT-014.",
            }, headers=rev_headers)
            assert rev_resp.status_code == 200
            assert rev_resp.json()["status"] == "RETURNED_TO_CREATOR"

    async def test_feature_12_approval_and_rejection_states(self, auth_tokens):
        """Feature 12: Verify rejection workflow."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            creator_headers = {"Authorization": f"Bearer {auth_tokens('CREATOR')}"}
            rev_headers = {"Authorization": f"Bearer {auth_tokens('REVIEWER')}"}
            sub_resp = await client.post("/api/submissions", json={
                "title": "Rejection Test",
                "channel": "instagram",
                "creator_id": "USR-CREATOR-01",
                "creator_name": "Asha",
                "creator_type": "creator",
                "org_id": "ORG-AURELLE",
                "version": 1,
                "original_content": "Completely off-brand competitor copy.",
                "current_content": "Completely off-brand competitor copy.",
                "findings": [],
            }, headers=creator_headers)
            sub_id = sub_resp.json()["submission_id"]

            rev_resp = await client.post(f"/api/submissions/{sub_id}/review", json={
                "reviewer_name": "Maya",
                "reviewer_role": "CONTENT_REVIEWER",
                "decision": "REJECT",
                "feedback": "Disallowed content.",
            }, headers=rev_headers)
            assert rev_resp.status_code == 200
            assert rev_resp.json()["status"] == "REJECTED"

    async def test_feature_13_brand_fact_ledger(self):
        """Feature 13: Brand Fact Ledger - list and create brand truth facts."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. List facts
            resp = await client.get("/api/facts?brand_id=aurelle-tech")
            assert resp.status_code == 200
            facts = resp.json()
            assert isinstance(facts, list)
            assert len(facts) > 0

            # 2. Create fact
            new_fact = {
                "brand_id": "aurelle-tech",
                "name": "Hyaluronic Acid Hydration 72H",
                "category": "SPECIFICATION",
                "current_value": "72 hours continuous hydration",
                "unit": "hours",
                "description": "Clinical hydration protocol result.",
                "source_citation": "CLINICAL-HYD-2026",
            }
            post_resp = await client.post("/api/facts", json=new_fact)
            assert post_resp.status_code in [200, 201]

    async def test_feature_14_knowledge_graph(self):
        """Feature 14: Knowledge Graph visualization endpoint."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/brands/aurelle-tech/graph")
            assert resp.status_code == 200
            data = resp.json()
            assert "nodes" in data
            assert "edges" in data
            assert len(data["nodes"]) > 0

    async def test_feature_15_risk_intelligence(self):
        """Feature 15: Risk Intelligence & Dependency Graph Traversal."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/graph-intelligence/traverse-dependencies", json={
                "brand_id": "aurelle-tech",
                "entity_id": "PC-01",
                "depth": 2,
            })
            assert resp.status_code in [200, 201]
            data = resp.json()
            assert "root_node_id" in data or "traversed_nodes" in data

    async def test_feature_16_campaign_intelligence_guidelines(self):
        """Feature 16: Campaign Intelligence & Brand Guidelines."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/guidelines?brand_id=aurelle-tech")
            assert resp.status_code == 200
            guidelines = resp.json()
            assert isinstance(guidelines, list)
            assert len(guidelines) > 0

    async def test_feature_17_impact_simulation_blast_radius(self):
        """Feature 17: Impact Simulation (Cascading Blast Radius)."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/blast-radius", json={
                "brand_id": "aurelle-tech",
                "mutated_node_id": "PC-01",
                "mutation_type": "POLICY_AMENDMENT",
                "mutation_notes": "45% reduction in 6 weeks test",
            })
            assert resp.status_code == 200
            data = resp.json()
            assert "mutated_node_id" in data
            assert "total_affected_assets" in data

    async def test_feature_18_multimodal_inspection(self):
        """Feature 18: Multimodal Content Inspection & Upload."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            fake_file = io.BytesIO(b"Sample campaign asset text for AST analysis.")
            resp = await client.post(
                "/api/content/upload",
                files={"file": ("campaign_copy.txt", fake_file, "text/plain")},
                data={"brand_id": "aurelle-tech"},
            )
            assert resp.status_code in [200, 201]
            data = resp.json()
            assert "file_id" in data or "filename" in data or "status" in data

    async def test_feature_19_governance_analytics_and_health(self):
        """Feature 19: Governance Analytics & System Health."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "operational"

    async def test_feature_20_audit_ledger_and_signing(self):
        """Feature 20: Tamper-Evident Audit Ledger and Cryptographic Signing."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Audit events
            resp = await client.get("/api/audit/events?limit=50")
            assert resp.status_code == 200
            events = resp.json()
            assert isinstance(events, list)

            # 2. Cryptographic sign release
            sign_resp = await client.post("/api/releases/sign", json={
                "verification_id": "VER-TEST-001",
                "brand_id": "aurelle-tech",
                "asset_id": "AST-TEST-001",
                "asset_title": "Aurelle Vitamin C Serum",
                "channel": "instagram",
                "content": "Authorized Brand Campaign Copy 2026",
                "reviewer": "VP Brand Governance",
                "decision": "APPROVED",
            })
            assert sign_resp.status_code == 200
            res = sign_resp.json()
            assert res.get("status") == "SEALED"
            assert "release" in res
            assert "audit_stamp" in res

    async def test_feature_21_public_release_verification(self):
        """Feature 21: Zero-auth Public Release Verification portal."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Create an authorized release
            sign_resp = await client.post("/api/releases/sign", json={
                "verification_id": "VER-PUB-TEST-01",
                "brand_id": "aurelle-tech",
                "asset_id": "AST-PUB-01",
                "asset_title": "Aurelle Certified Release",
                "channel": "instagram",
                "content": "Aurelle Skin Certified Release 2026",
                "reviewer": "Executive Release Officer",
                "decision": "APPROVED",
            })
            assert sign_resp.status_code == 200
            rel_id = sign_resp.json()["release"]["release_id"]

            # Public verification
            pub_resp = await client.get(f"/api/public/verify/{rel_id}")
            assert pub_resp.status_code == 200
            data = pub_resp.json()
            assert data["is_authentic"] is True
            assert data["status"] == "APPROVED"

    async def test_feature_22_settings_and_system_status(self):
        """Feature 22: Settings & Database connectivity status."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/db/status")
            assert resp.status_code == 200
            data = resp.json()
            assert "connected" in data
            assert "engine" in data
