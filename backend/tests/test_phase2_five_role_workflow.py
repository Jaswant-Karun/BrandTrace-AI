import pytest
from httpx import AsyncClient, ASGITransport
from brandtrace.main import app
from brandtrace.modules.auth.service import create_access_token

@pytest.mark.anyio
async def test_complete_five_role_workflow_end_to_end():
    """
    End-to-End Test for BrandTrace AI Phase 2:
    Validates complete workflow across all five roles:
    1. Creator: Create draft & submit for review
    2. Agency: Inspect draft, verify quality & forward to reviewer
    3. Reviewer: Inspect findings, uphold/overrule & approve
    4. Compliance: Verify clinical evidence (FACT-014) & sign off
    5. Brand Owner: Verify prior approvals, grant final release & generate cryptographic proof
    6. Public Verification: Zero-auth cryptographic verification
    7. Role Security Enforcement: Prevent unauthorized actions & workflow skipping
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create authenticated headers for each of the 5 roles
        creator_token = create_access_token({
            "sub": "USR-CREATOR-01",
            "email": "asha@aurelle.com",
            "name": "Creator Asha",
            "role": "CREATOR",
            "organization_id": "ORG-AURELLE"
        })
        creator_headers = {"Authorization": f"Bearer {creator_token}"}

        agency_token = create_access_token({
            "sub": "USR-AGENCY-01",
            "email": "sana@aurelle.com",
            "name": "Agency Sana",
            "role": "CREATOR",  # Agency user in system
            "organization_id": "ORG-AGENCY-PULSE"
        })
        agency_headers = {"Authorization": f"Bearer {agency_token}"}

        reviewer_token = create_access_token({
            "sub": "USR-REVIEWER-01",
            "email": "meera@aurelle.com",
            "name": "Reviewer Meera",
            "role": "REVIEWER",
            "organization_id": "ORG-AURELLE"
        })
        reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}

        compliance_token = create_access_token({
            "sub": "USR-COMPLIANCE-01",
            "email": "arjun@aurelle.com",
            "name": "Compliance Arjun",
            "role": "COMPLIANCE_REVIEWER",
            "organization_id": "ORG-AURELLE"
        })
        compliance_headers = {"Authorization": f"Bearer {compliance_token}"}

        brand_owner_token = create_access_token({
            "sub": "USR-OWNER-01",
            "email": "kabir@aurelle.com",
            "name": "Brand Owner Kabir",
            "role": "BRAND_MANAGER",
            "organization_id": "ORG-AURELLE"
        })
        brand_owner_headers = {"Authorization": f"Bearer {brand_owner_token}"}

        # ----------------------------------------------------------------------
        # STEP 1: CREATOR CREATES & SUBMITS MARKETING CONTENT
        # ----------------------------------------------------------------------
        submit_payload = {
            "title": "Aurelle Vitamin C Serum Festive Campaign",
            "channel": "instagram",
            "creator_id": "USR-CREATOR-01",
            "creator_name": "Creator Asha",
            "creator_type": "creator",
            "org_id": "ORG-AURELLE",
            "version": 1,
            "original_content": "Meet the NEW Vitamin C serum! Clinically proven to fade dark spots by 60% in just 2 weeks. ₹499 only!",
            "current_content": "Meet the NEW Vitamin C serum! Formulated with 94% naturally derived ingredients and clinically shown to fade dark spots by 32% in 8 weeks (FACT-014). ₹899 standard MRP.",
            "findings": [
                {
                    "id": "f-1",
                    "number": 1,
                    "severity": "BLOCKING",
                    "rule_id": "FACT-014",
                    "rule_title": "Exaggerated Dark Spots Claim",
                    "sentence_text": "Clinically proven to fade dark spots by 60% in just 2 weeks.",
                    "flagged_text": "60% in just 2 weeks",
                    "suggested_fix": "up to 32% in 8 weeks (protocol AUR-LAB-014)",
                    "explanation": "Clinical trial protocol AUR-LAB-014 certifies 32% reduction in dark spots after 8 weeks."
                },
                {
                    "id": "f-2",
                    "number": 2,
                    "severity": "BLOCKING",
                    "rule_id": "FACT-006",
                    "rule_title": "Incorrect Pricing Claim",
                    "sentence_text": "₹499 only!",
                    "flagged_text": "₹499",
                    "suggested_fix": "₹899 (30ml standard MRP)",
                    "explanation": "Approved commercial pricing for Aurelle Vitamin C serum is ₹899."
                }
            ],
            "submission_notes": "Creator submitted revised copy addressing clinical and pricing guidelines."
        }

        submit_resp = await client.post("/api/submissions", json=submit_payload, headers=creator_headers)
        assert submit_resp.status_code == 200, f"Submit failed: {submit_resp.text}"
        sub_data = submit_resp.json()

        submission_id = sub_data["submission_id"]
        assert submission_id.startswith("SUB-")
        assert sub_data["status"] == "PENDING_REVIEW"
        assert sub_data["version"] == 1
        assert len(sub_data["approval_history"]) >= 4

        # Verify submission can be fetched by ID
        fetch_resp = await client.get(f"/api/submissions/{submission_id}", headers=creator_headers)
        assert fetch_resp.status_code == 200
        assert fetch_resp.json()["submission_id"] == submission_id

        # ----------------------------------------------------------------------
        # STEP 2: AGENCY REVIEWS & FORWARDS CONTENT TO BRAND REVIEWER
        # ----------------------------------------------------------------------
        # Agency checks agency queue
        agency_queue_resp = await client.get("/api/submissions/queue?role=agency", headers=agency_headers)
        assert agency_queue_resp.status_code == 200

        # Agency verifies quality and forwards approved draft
        agency_review_payload = {
            "decision": "FORWARD",
            "agency_name": "Agency Sana",
            "agency_role": "AGENCY",
            "feedback": "Agency quality check passed: brand voice and aesthetic guidelines aligned."
        }
        agency_resp = await client.post(
            f"/api/submissions/{submission_id}/agency-review",
            json=agency_review_payload,
            headers=agency_headers
        )
        assert agency_resp.status_code == 200, f"Agency review failed: {agency_resp.text}"
        agency_data = agency_resp.json()
        assert agency_data["status"] == "PENDING_REVIEW"
        # Agency approval step should be COMPLETED
        agency_steps = [s for s in agency_data["approval_history"] if s.get("stage") == "AGENCY_APPROVAL"]
        assert len(agency_steps) > 0
        assert agency_steps[0]["status"] == "COMPLETED"

        # ----------------------------------------------------------------------
        # STEP 3: REVIEWER REVIEWS FINDINGS & APPROVES
        # ----------------------------------------------------------------------
        # Reviewer queue receives the submission
        rev_queue_resp = await client.get("/api/submissions/queue?role=reviewer", headers=reviewer_headers)
        assert rev_queue_resp.status_code == 200

        reviewer_payload = {
            "decision": "APPROVE",
            "reviewer_name": "Reviewer Meera",
            "reviewer_role": "REVIEWER",
            "feedback": "Verified FACT-014 and FACT-006 corrections against brand facts. Approved for compliance sign-off.",
            "finding_decisions": {
                "f-1": {"decision": "UPHELD", "comment": "Clinical evidence FACT-014 verified."},
                "f-2": {"decision": "UPHELD", "comment": "Standard MRP ₹899 verified."}
            }
        }
        rev_resp = await client.post(
            f"/api/submissions/{submission_id}/review",
            json=reviewer_payload,
            headers=reviewer_headers
        )
        assert rev_resp.status_code == 200, f"Reviewer approval failed: {rev_resp.text}"
        rev_data = rev_resp.json()
        assert rev_data["status"] == "REVIEW_APPROVED"
        rev_steps = [s for s in rev_data["approval_history"] if s.get("stage") == "REVIEWER_APPROVAL"]
        assert len(rev_steps) > 0
        assert rev_steps[0]["status"] == "COMPLETED"

        # ----------------------------------------------------------------------
        # STEP 4: COMPLIANCE OFFICER INSPECTS REGULATORY/CLINICAL FACTS & APPROVES
        # ----------------------------------------------------------------------
        comp_queue_resp = await client.get("/api/submissions/queue?role=compliance", headers=compliance_headers)
        assert comp_queue_resp.status_code == 200

        compliance_payload = {
            "decision": "APPROVE",
            "compliance_name": "Compliance Arjun",
            "compliance_role": "COMPLIANCE",
            "notes": "Fair-balance and clinical trial protocol AUR-LAB-014 substantiation confirmed.",
            "finding_decisions": {
                "f-1": {"decision": "UPHELD", "comment": "Protocol AUR-LAB-014 on file."},
                "f-2": {"decision": "UPHELD", "comment": "Commercial pricing registry confirmed."}
            }
        }
        comp_resp = await client.post(
            f"/api/submissions/{submission_id}/compliance",
            json=compliance_payload,
            headers=compliance_headers
        )
        assert comp_resp.status_code == 200, f"Compliance approval failed: {comp_resp.text}"
        comp_data = comp_resp.json()
        assert comp_data["status"] == "COMPLIANCE_APPROVED"
        assert comp_data["release_seal"] is not None
        assert comp_data["release_seal"].startswith("BT-SEAL-")
        comp_steps = [s for s in comp_data["approval_history"] if s.get("stage") == "COMPLIANCE_APPROVAL"]
        assert len(comp_steps) > 0
        assert comp_steps[0]["status"] == "COMPLETED"

        # ----------------------------------------------------------------------
        # STEP 5: BRAND OWNER VERIFIES ALL PRECEDING STAGES & PERFORMS FINAL APPROVAL
        # ----------------------------------------------------------------------
        owner_queue_resp = await client.get("/api/submissions/queue?role=brand-owner", headers=brand_owner_headers)
        assert owner_queue_resp.status_code == 200

        final_payload = {
            "decision": "FINAL_APPROVE",
            "approver_name": "Brand Owner Kabir",
            "approver_role": "BRAND_OWNER",
            "notes": "All brand governance gates cleared. Authorized for publication.",
            "reason": "Final commercial release release authorization"
        }
        owner_resp = await client.post(
            f"/api/submissions/{submission_id}/final-approval",
            json=final_payload,
            headers=brand_owner_headers
        )
        assert owner_resp.status_code == 200, f"Final approval failed: {owner_resp.text}"
        owner_data = owner_resp.json()

        assert owner_data["status"] == "RELEASED"
        release_id = owner_data["release_id"]
        release_digest = owner_data["release_digest"]
        assert release_id is not None
        assert release_id.startswith("BT-REL-2026-")
        assert release_digest is not None
        assert len(release_digest) == 64  # Valid SHA-256 hex string

        # ----------------------------------------------------------------------
        # STEP 6: PUBLIC ZERO-AUTH VERIFICATION
        # ----------------------------------------------------------------------
        pub_resp = await client.get(f"/api/public/verify/{release_id}")
        assert pub_resp.status_code == 200, f"Public verification failed: {pub_resp.text}"
        pub_data = pub_resp.json()
        assert pub_data["is_authentic"] is True
        assert pub_data["status"] == "APPROVED"
        assert pub_data["ledger_state"] == "VALID_UNCHANGED"
        assert pub_data["recorded_hash"] == release_digest

        # ----------------------------------------------------------------------
        # STEP 7: SECURITY & ROLE-BASED ACCESS CONTROL ENFORCEMENT
        # ----------------------------------------------------------------------
        # Test 7.1: Standard Creator cannot approve review
        unauth_review = await client.post(
            f"/api/submissions/{submission_id}/review",
            json={"decision": "APPROVE", "reviewer_name": "Creator Asha"},
            headers=creator_headers
        )
        assert unauth_review.status_code == 403

        # Test 7.2: Standard Creator cannot sign off on compliance
        unauth_comp = await client.post(
            f"/api/submissions/{submission_id}/compliance",
            json={"decision": "APPROVE", "compliance_name": "Creator Asha"},
            headers=creator_headers
        )
        assert unauth_comp.status_code == 403

        # Test 7.3: Reviewer cannot grant final brand release
        unauth_release = await client.post(
            f"/api/submissions/{submission_id}/final-approval",
            json={"decision": "FINAL_APPROVE", "approver_name": "Reviewer Meera"},
            headers=reviewer_headers
        )
        assert unauth_release.status_code == 403

        # Test 7.4: Brand Owner cannot approve unapproved submission without Reviewer & Compliance
        unapproved_sub = await client.post(
            "/api/submissions",
            json={
                "title": "Unapproved Skipping Attempt",
                "channel": "web",
                "creator_id": "USR-CREATOR-01",
                "creator_name": "Creator Asha",
                "original_content": "Unverified draft attempting to skip approval gates.",
                "current_content": "Unverified draft attempting to skip approval gates.",
            },
            headers=creator_headers
        )
        assert unapproved_sub.status_code == 200
        unapproved_id = unapproved_sub.json()["submission_id"]

        skip_attempt = await client.post(
            f"/api/submissions/{unapproved_id}/final-approval",
            json={"decision": "FINAL_APPROVE", "approver_name": "Brand Owner Kabir"},
            headers=brand_owner_headers
        )
        # Should be rejected with 400 Bad Request (Workflow skipping prevented)
        assert skip_attempt.status_code == 400
        assert "must first successfully complete Reviewer approval and Compliance approval" in skip_attempt.json()["detail"]

        # ----------------------------------------------------------------------
        # STEP 8: AUDIT TRAIL PERSISTENCE & INTEGRITY
        # ----------------------------------------------------------------------
        audit_resp = await client.get("/api/audit/events?limit=20")
        assert audit_resp.status_code == 200
        events = audit_resp.json()
        assert len(events) > 0
        event_descriptions = [e["what"] for e in events]
        # Verify that all stages logged audit events
        assert any("submitted draft" in d.lower() for d in event_descriptions)
        assert any("agency" in d.lower() for d in event_descriptions)
        assert any("reviewer" in d.lower() for d in event_descriptions)
        assert any("compliance" in d.lower() for d in event_descriptions)
