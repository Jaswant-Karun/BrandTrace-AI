"""
Phase 4: Complete Frontend and Backend Connectivity Validation Test Suite
Tests every product feature (all 22 endpoints/modules) across frontend & backend contracts.
"""

import io
import pytest
from starlette.testclient import TestClient
from brandtrace.main import app
from brandtrace.modules.auth.service import create_access_token


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers():
    def _make_headers(role: str = "CREATOR", user_id: str = "usr_test_01", brand_id: str = "aurelle-tech"):
        token = create_access_token(
            user_id=user_id,
            email=f"{role.lower()}@brandtrace.ai",
            role=role,
            brand_id=brand_id,
        )
        return {"Authorization": f"Bearer {token}"}
    return _make_headers


class TestPhase4CompleteConnectivity:
    """Rigorous feature-to-API verification across all BrandTrace AI modules."""

    def test_feature_01_creator_workspace_drafts(self, client, auth_headers):
        """Feature 1: Creator Workspace - fetch and manage drafts."""
        headers = auth_headers(role="CREATOR")
        resp = client.get("/api/drafts", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_feature_02_agency_workspace_queue_and_review(self, client, auth_headers):
        """Feature 2: Agency Workspace - queue access and agency review submission."""
        # 1. Fetch queue
        resp = client.get("/api/submissions/queue?role=agency")
        assert resp.status_code == 200
        items = resp.json()
        assert isinstance(items, list)

        # 2. Submit test submission to review
        sub_resp = client.post("/api/submissions", json={
            "content": "Agency test campaign copy for Aurelle serum.",
            "channel": "instagram",
            "creator_name": "Agency Creator",
            "creator_type": "agency",
            "org_id": "ORG-AGENCY-TEST",
            "version": 1,
            "title": "Agency Test Campaign",
        })
        assert sub_resp.status_code == 200
        sub_id = sub_resp.json()["submission_id"]

        # 3. Agency forwards draft
        rev_resp = client.post(f"/api/submissions/{sub_id}/agency-review", json={
            "agency_name": "Agency Pulse Partner",
            "agency_role": "AGENCY",
            "decision": "FORWARD",
            "feedback": "Agency quality verified. Forwarded to Brand Reviewer.",
        })
        assert rev_resp.status_code == 200
        assert rev_resp.json()["status"] == "AGENCY_APPROVED"

    def test_feature_03_reviewer_workspace_queue_and_decision(self, client, auth_headers):
        """Feature 3: Reviewer Workspace - queue and reviewer decision."""
        # 1. Fetch queue
        resp = client.get("/api/submissions/queue?role=reviewer")
        assert resp.status_code == 200

        # 2. Create submission and approve it
        sub_resp = client.post("/api/submissions", json={
            "content": "Reviewer validation copy.",
            "channel": "instagram",
            "creator_name": "Asha",
            "creator_type": "creator",
            "org_id": "ORG-AURELLE",
            "version": 1,
            "title": "Reviewer Test",
        })
        sub_id = sub_resp.json()["submission_id"]

        rev_resp = client.post(f"/api/submissions/{sub_id}/review", json={
            "reviewer_name": "Reviewer Maya",
            "reviewer_role": "CONTENT_REVIEWER",
            "decision": "APPROVE",
            "finding_decisions": [],
            "feedback": "Approved for compliance check.",
        })
        assert rev_resp.status_code == 200
        assert rev_resp.json()["status"] == "REVIEW_APPROVED"

    def test_feature_04_compliance_workspace_queue_and_signoff(self, client):
        """Feature 4: Compliance Reviewer Workspace - queue and regulatory validation."""
        # 1. Create and move to REVIEW_APPROVED
        sub_resp = client.post("/api/submissions", json={
            "content": "Compliance validation text.",
            "channel": "instagram",
            "creator_name": "Asha",
            "creator_type": "creator",
            "org_id": "ORG-AURELLE",
            "version": 1,
            "title": "Compliance Test",
        })
        sub_id = sub_resp.json()["submission_id"]
        client.post(f"/api/submissions/{sub_id}/review", json={
            "reviewer_name": "Maya",
            "reviewer_role": "CONTENT_REVIEWER",
            "decision": "APPROVE",
            "feedback": "Approved.",
        })

        # 2. Check compliance queue
        q_resp = client.get("/api/submissions/queue?role=compliance")
        assert q_resp.status_code == 200
        queue_ids = [item["id"] for item in q_resp.json()]
        assert sub_id in queue_ids

        # 3. Compliance signs off
        comp_resp = client.post(f"/api/submissions/{sub_id}/compliance", json={
            "reviewer_name": "Dr. Sarah Rao",
            "reviewer_role": "COMPLIANCE_REVIEWER",
            "decision": "APPROVE",
            "statutory_citations": ["FDA-21-CFR-201", "ASCI-GREENWASH-2024"],
            "feedback": "Statutory claims verified under clinical protocol.",
        })
        assert comp_resp.status_code == 200
        assert comp_resp.json()["status"] == "COMPLIANCE_APPROVED"

    def test_feature_05_brand_owner_workspace_and_final_release(self, client):
        """Feature 5: Brand Owner Workspace - final approval and release."""
        # 1. Create and advance to COMPLIANCE_APPROVED
        sub_resp = client.post("/api/submissions", json={
            "content": "Aurelle Vitamin C Serum delivers 32% spot reduction in 8 weeks under protocol AUR-LAB-014.",
            "channel": "instagram",
            "creator_name": "Asha",
            "creator_type": "creator",
            "org_id": "ORG-AURELLE",
            "version": 1,
            "title": "Executive Release Test",
        })
        sub_id = sub_resp.json()["submission_id"]
        client.post(f"/api/submissions/{sub_id}/review", json={
            "reviewer_name": "Maya",
            "reviewer_role": "CONTENT_REVIEWER",
            "decision": "APPROVE",
        })
        client.post(f"/api/submissions/{sub_id}/compliance", json={
            "reviewer_name": "Dr. Rao",
            "reviewer_role": "COMPLIANCE_REVIEWER",
            "decision": "APPROVE",
        })

        # 2. Brand Owner queue
        bo_q = client.get("/api/submissions/queue?role=brand-owner")
        assert bo_q.status_code == 200
        bo_ids = [item["id"] for item in bo_q.json()]
        assert sub_id in bo_ids

        # 3. Brand Owner final approval
        bo_resp = client.post(f"/api/submissions/{sub_id}/final-approval", json={
            "owner_name": "Priya Sharma (VP Brand)",
            "owner_role": "BRAND_OWNER",
            "decision": "APPROVE",
            "release_tag": "CAMPAIGN-SUMMER-2026",
            "feedback": "Final executive release authorized.",
        })
        assert bo_resp.status_code == 200
        res_data = bo_resp.json()
        assert res_data["status"] == "RELEASED"
        assert "release_digest" in res_data
        assert res_data["release_digest"].startswith("SHA256:")

    def test_feature_06_content_creation_draft(self, client, auth_headers):
        """Feature 6: Content Creation - persist new campaign draft."""
        headers = auth_headers(role="CREATOR")
        payload = {
            "title": "Serum Launch Announcement",
            "content": "Discover the radiance of Aurelle Vitamin C serum.",
            "channel": "instagram",
            "brand_id": "aurelle-tech",
        }
        resp = client.post("/api/drafts", json=payload, headers=headers)
        assert resp.status_code in [200, 201]
        data = resp.json()
        assert "id" in data or "draft_id" in data

    def test_feature_07_and_08_content_checking_and_ai_correction(self, client):
        """Feature 7 & 8: Content Checking and AI Correction remediation."""
        payload = {
            "text": "Clinically proven to fade dark spots by 60% in just 2 weeks for ₹499 only!",
            "brand_id": "aurelle-tech",
            "channel": "instagram",
        }
        resp = client.post("/api/verify", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "claims_found" in data
        assert "violations" in data

        # AI correction check: remediation recommendations exist
        assert len(data["violations"]) > 0
        v = data["violations"][0]
        assert "suggested_fix" in v or "explanation" in v or "remediation" in v

    def test_feature_09_submission_persistence(self, client):
        """Feature 9: Submission persistence and retrieval."""
        # Create submission
        sub_resp = client.post("/api/submissions", json={
            "content": "Submission persistence validation copy.",
            "channel": "instagram",
            "creator_name": "Asha",
            "creator_type": "creator",
            "org_id": "ORG-AURELLE",
            "version": 1,
            "title": "Persistence Test",
        })
        assert sub_resp.status_code == 200
        sub_id = sub_resp.json()["submission_id"]

        # Retrieve list of submissions
        list_resp = client.get("/api/submissions")
        assert list_resp.status_code == 200
        subs = list_resp.json()
        ids = [s.get("id") or s.get("submission_id") for s in subs]
        assert sub_id in ids

    def test_feature_10_and_11_review_comments_and_revision_requests(self, client):
        """Feature 10 & 11: Review comments and revision requests (return to creator)."""
        sub_resp = client.post("/api/submissions", json={
            "content": "Draft with exaggerated claims.",
            "channel": "instagram",
            "creator_name": "Asha",
            "creator_type": "creator",
            "org_id": "ORG-AURELLE",
            "version": 1,
            "title": "Revision Test",
        })
        sub_id = sub_resp.json()["submission_id"]

        # Reviewer requests changes with comments
        rev_resp = client.post(f"/api/submissions/{sub_id}/review", json={
            "reviewer_name": "Maya",
            "reviewer_role": "CONTENT_REVIEWER",
            "decision": "REQUEST_CHANGES",
            "feedback": "Please calibrate the percentage claim to 32% per FACT-014.",
        })
        assert rev_resp.status_code == 200
        assert rev_resp.json()["status"] == "RETURNED_TO_CREATOR"

    def test_feature_12_approval_and_rejection_states(self, client):
        """Feature 12: Verify rejection workflow."""
        sub_resp = client.post("/api/submissions", json={
            "content": "Completely off-brand competitor copy.",
            "channel": "instagram",
            "creator_name": "Asha",
            "creator_type": "creator",
            "org_id": "ORG-AURELLE",
            "version": 1,
            "title": "Rejection Test",
        })
        sub_id = sub_resp.json()["submission_id"]

        rev_resp = client.post(f"/api/submissions/{sub_id}/review", json={
            "reviewer_name": "Maya",
            "reviewer_role": "CONTENT_REVIEWER",
            "decision": "REJECT",
            "feedback": "Disallowed content.",
        })
        assert rev_resp.status_code == 200
        assert rev_resp.json()["status"] == "REJECTED"

    def test_feature_13_brand_fact_ledger(self, client):
        """Feature 13: Brand Fact Ledger - list and create brand truth facts."""
        # 1. List facts
        resp = client.get("/api/facts?brand_id=aurelle-tech")
        assert resp.status_code == 200
        facts = resp.json()
        assert isinstance(facts, list)
        assert len(facts) > 0

        # 2. Create fact
        new_fact = {
            "fact_id": "FACT-PHASE4-001",
            "brand_id": "aurelle-tech",
            "entity": "Hyaluronic Acid Serum",
            "attribute": "Hydration Duration",
            "value": "72 hours continuous hydration",
            "source_doc": "CLINICAL-HYD-2026",
            "confidence": 0.99,
        }
        post_resp = client.post("/api/facts", json=new_fact)
        assert post_resp.status_code in [200, 201]

    def test_feature_14_knowledge_graph(self, client):
        """Feature 14: Knowledge Graph visualization endpoint."""
        resp = client.get("/api/knowledge-graph/aurelle-tech")
        assert resp.status_code == 200
        data = resp.json()
        assert "nodes" in data
        assert "edges" in data
        assert len(data["nodes"]) > 0

    def test_feature_15_risk_intelligence(self, client):
        """Feature 15: Risk Intelligence & Dependency Graph Traversal."""
        resp = client.post("/api/graph-intelligence/traverse-dependencies", json={
            "brand_id": "aurelle-tech",
            "entity_id": "FACT-014",
            "depth": 2,
        })
        assert resp.status_code in [200, 201]
        data = resp.json()
        assert "traversed_nodes" in data or "dependencies" in data or "subgraph" in data or "nodes" in data

    def test_feature_16_campaign_intelligence_guidelines(self, client):
        """Feature 16: Campaign Intelligence & Brand Guidelines."""
        resp = client.get("/api/guidelines?brand_id=aurelle-tech")
        assert resp.status_code == 200
        guidelines = resp.json()
        assert isinstance(guidelines, list)
        assert len(guidelines) > 0

    def test_feature_17_impact_simulation_blast_radius(self, client):
        """Feature 17: Impact Simulation (Cascading Blast Radius)."""
        resp = client.post("/api/blast-radius", json={
            "brand_id": "aurelle-tech",
            "changed_fact_id": "FACT-014",
            "new_value": "45% reduction in 6 weeks",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "affected_campaigns" in data or "blast_radius" in data or "impact_score" in data

    def test_feature_18_multimodal_inspection(self, client):
        """Feature 18: Multimodal Content Inspection & Upload."""
        fake_file = io.BytesIO(b"Sample campaign asset text for AST analysis.")
        resp = client.post(
            "/api/content/upload",
            files={"file": ("campaign_copy.txt", fake_file, "text/plain")},
            data={"brand_id": "aurelle-tech"},
        )
        assert resp.status_code in [200, 201]
        data = resp.json()
        assert "file_id" in data or "filename" in data or "status" in data

    def test_feature_19_governance_analytics_and_health(self, client):
        """Feature 19: Governance Analytics & System Health."""
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

    def test_feature_20_audit_ledger_and_signing(self, client):
        """Feature 20: Tamper-Evident Audit Ledger and Cryptographic Signing."""
        # 1. Audit events
        resp = client.get("/api/audit/events?limit=50")
        assert resp.status_code == 200
        events = resp.json()
        assert isinstance(events, list)

        # 2. Cryptographic sign release
        sign_resp = client.post("/api/releases/sign", json={
            "brand_id": "aurelle-tech",
            "release_id": "REL-AUDIT-TEST-001",
            "canonical_payload": "Authorized Brand Campaign Copy 2026",
            "signer_identity": "VP Brand Governance",
        })
        assert sign_resp.status_code == 200
        assert "release_digest" in sign_resp.json() or "proof" in sign_resp.json() or "signature" in sign_resp.json()

    def test_feature_21_public_release_verification(self, client):
        """Feature 21: Zero-auth Public Release Verification portal."""
        # Create an authorized release
        bo_resp = client.post("/api/releases/sign", json={
            "brand_id": "aurelle-tech",
            "release_id": "REL-PUB-VERIFY-001",
            "canonical_payload": "Aurelle Skin Certified Release 2026",
            "signer_identity": "Executive Release Officer",
        })
        assert bo_resp.status_code == 200

        # Public verification
        pub_resp = client.get("/api/public/verify/REL-PUB-VERIFY-001")
        assert pub_resp.status_code == 200
        data = pub_resp.json()
        assert data["is_authentic"] is True
        assert data["status"] == "APPROVED"

    def test_feature_22_settings_and_system_status(self, client):
        """Feature 22: Settings & Database connectivity status."""
        resp = client.get("/api/db/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "connection" in data
