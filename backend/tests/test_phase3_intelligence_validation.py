import pytest
from httpx import AsyncClient, ASGITransport
from brandtrace.main import app
from brandtrace.modules.auth.service import create_access_token

@pytest.mark.anyio
async def test_creator_content_intelligence_validation():
    """
    BrandTrace AI Phase 3 Intelligence Validation Test:
    Tests genuine content inspection across all 8 defect categories:
    1. Valid marketing claims (clean approval)
    2. Unsupported factual claims (FACT-014: 60% in 2 weeks vs 32% in 8 weeks)
    3. Incorrect prices (FACT-006: ₹499 vs ₹899 MRP)
    4. Misleading superlatives (GL-AUR-03: guaranteed glass skin in 7 days)
    5. Exaggerated marketing statements (CDSCO: treatment for eczema / cured barrier)
    6. Regulatory violations (REG-01: 100% natural, zero toxins greenwashing)
    7. Incorrect product specifications (GL-AUR-04: 72-hour battery without IEC footnote)
    8. Expired promotional statements (FACT-033: embargoed Diwali sale; FACT-AUR-EXP-01: expired founder trial)
    9. Brand guideline violations (CIA-02: generic 'link in bio' CTA)
    10. Inspection history persistence (/api/verifications)
    11. Handshake to 5-role review submission
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        creator_token = create_access_token({
            "sub": "USR-CREATOR-01",
            "email": "asha@aurelle.com",
            "name": "Creator Asha",
            "role": "CREATOR",
            "organization_id": "ORG-AURELLE"
        })
        creator_headers = {"Authorization": f"Bearer {creator_token}"}

        # ----------------------------------------------------------------------
        # TEST 1: FULLY VALID MARKETING CONTENT (CLEAN APPROVAL)
        # ----------------------------------------------------------------------
        valid_copy = (
            "Meet the NEW Aurelle Vitamin C Brightening Serum! "
            "Formulated with 94% naturally derived ingredients and clinically shown to fade dark spots by 32% in 8 weeks (FACT-014). "
            "Dermatologist tested for ₹899 standard MRP. "
            "Shop Aurelle Radiant Glow Serum."
        )
        res_valid = await client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "content": valid_copy,
            "channel": "instagram"
        })
        assert res_valid.status_code == 200, f"Verify valid copy failed: {res_valid.text}"
        data_valid = res_valid.json()

        assert data_valid["summary_counts"]["blocking"] == 0
        assert data_valid["verdict_badge"] == "READY FOR REVIEW"
        assert data_valid["composite_risk_score"] < 25.0

        # ----------------------------------------------------------------------
        # TEST 2: UNSUPPORTED FACTUAL CLAIM (60% IN 2 WEEKS)
        # ----------------------------------------------------------------------
        unsupported_claim = "Clinically proven to fade dark spots by 60% in just 2 weeks. Shop Aurelle Radiant Glow Serum."
        res_unsup = await client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "content": unsupported_claim,
            "channel": "instagram"
        })
        assert res_unsup.status_code == 200
        data_unsup = res_unsup.json()

        finding_rules = [f["rule_id"] for f in data_unsup["sentence_findings"]]
        assert "FACT-014" in finding_rules
        f_014 = next(f for f in data_unsup["sentence_findings"] if f["rule_id"] == "FACT-014")
        assert f_014["severity"] == "BLOCKING"
        assert "60%" in f_014["flagged_text"]
        assert "32%" in f_014["explanation"] and "8 weeks" in f_014["explanation"]
        assert "suggested_sentence" in f_014
        assert "32% in 8 weeks" in f_014["suggested_sentence"]

        # ----------------------------------------------------------------------
        # TEST 3: INCORRECT PRICING (₹499 VS ₹899)
        # ----------------------------------------------------------------------
        price_copy = "Shop the Aurelle Vitamin C Serum today for ₹499 only! Shop Aurelle Radiant Glow Serum."
        res_price = await client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "content": price_copy,
            "channel": "instagram"
        })
        assert res_price.status_code == 200
        data_price = res_price.json()

        finding_rules_prc = [f["rule_id"] for f in data_price["sentence_findings"]]
        assert "FACT-006" in finding_rules_prc
        f_prc = next(f for f in data_price["sentence_findings"] if f["rule_id"] == "FACT-006")
        assert f_prc["severity"] == "BLOCKING"
        assert "₹499" in f_prc["flagged_text"]
        assert "₹899" in f_prc["suggested_fix"]

        # ----------------------------------------------------------------------
        # TEST 4: MISLEADING SUPERLATIVES (GUARANTEED GLASS SKIN IN 7 DAYS)
        # ----------------------------------------------------------------------
        superlative_copy = "Get guaranteed glass skin in 7 days! Shop Aurelle Radiant Glow Serum."
        res_sup = await client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "content": superlative_copy,
            "channel": "instagram"
        })
        assert res_sup.status_code == 200
        data_sup = res_sup.json()

        finding_rules_sup = [f["rule_id"] for f in data_sup["sentence_findings"]]
        assert "GL-AUR-03" in finding_rules_sup

        # ----------------------------------------------------------------------
        # TEST 5: REGULATORY VIOLATIONS (GREENWASHING & MEDICAL DRUG CLAIMS)
        # ----------------------------------------------------------------------
        green_copy = "Formulated with 100% natural, zero toxins ingredients for your skin. Shop Aurelle Radiant Glow Serum."
        res_green = await client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "content": green_copy,
            "channel": "instagram"
        })
        assert res_green.status_code == 200
        data_green = res_green.json()

        finding_rules_green = [f["rule_id"] for f in data_green["sentence_findings"]]
        assert "REG-01" in finding_rules_green
        f_reg = next(f for f in data_green["sentence_findings"] if f["rule_id"] == "REG-01")
        assert f_reg["severity"] == "BLOCKING"

        eczema_copy = "Our Ceramide Cream is the proven treatment for eczema and dry itchy skin. Shop Aurelle Radiant Glow Serum."
        res_eczema = await client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "content": eczema_copy,
            "channel": "instagram"
        })
        assert res_eczema.status_code == 200
        data_eczema = res_eczema.json()

        finding_rules_ecz = [f["rule_id"] for f in data_eczema["sentence_findings"]]
        assert any("201" in f.get("explanation", "") or "GL-AUR-03" in f.get("rule_id", "") or "eczema" in f.get("flagged_text", "").lower() for f in data_eczema["sentence_findings"])

        # ----------------------------------------------------------------------
        # TEST 6: EXPIRED PROMOTIONS & EMBARGO VIOLATIONS (FACT-033 & FACT-AUR-EXP-01)
        # ----------------------------------------------------------------------
        diwali_copy = "Our Diwali sale is here: 20% off everything! Shop Aurelle Radiant Glow Serum."
        res_diwali = await client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "content": diwali_copy,
            "channel": "email"
        })
        assert res_diwali.status_code == 200
        data_diwali = res_diwali.json()

        finding_rules_diwali = [f["rule_id"] for f in data_diwali["sentence_findings"]]
        assert "FACT-033" in finding_rules_diwali or "DL-01" in finding_rules_diwali

        expired_copy = "Claim your ₹0 free for 6 months founder launch trial today! Shop Aurelle Radiant Glow Serum."
        res_exp = await client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "content": expired_copy,
            "channel": "web"
        })
        assert res_exp.status_code == 200
        data_exp = res_exp.json()

        finding_rules_exp = [f["rule_id"] for f in data_exp["sentence_findings"]]
        assert "FACT-AUR-EXP-01" in finding_rules_exp

        # ----------------------------------------------------------------------
        # TEST 7: INCORRECT PRODUCT SPECIFICATIONS (72-HOUR BATTERY & 12PX LOGO)
        # ----------------------------------------------------------------------
        spec_copy = "Experience 72-hour battery life with 12px clearance around our brand mark. Shop Aurelle Horizon."
        res_spec = await client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "content": spec_copy,
            "channel": "web"
        })
        assert res_spec.status_code == 200
        data_spec = res_spec.json()

        finding_rules_spec = [f["rule_id"] for f in data_spec["sentence_findings"]]
        assert "GL-AUR-04" in finding_rules_spec
        assert "GL-AUR-01" in finding_rules_spec

        # ----------------------------------------------------------------------
        # TEST 8: BRAND GUIDELINE VIOLATIONS (GENERIC CTA 'LINK IN BIO')
        # ----------------------------------------------------------------------
        cta_copy = "Check link in bio to shop now!"
        res_cta = await client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "content": cta_copy,
            "channel": "instagram"
        })
        assert res_cta.status_code == 200
        data_cta = res_cta.json()

        finding_rules_cta = [f["rule_id"] for f in data_cta["sentence_findings"]]
        assert "CIA-02" in finding_rules_cta

        # ----------------------------------------------------------------------
        # TEST 9: VERIFY REMEDIATED REWRITE PRESERVES ORIGINAL TEXT & APPLIES CORRECTIONS
        # ----------------------------------------------------------------------
        assert "remediated_content" in data_unsup
        assert data_unsup["raw_content"] == unsupported_claim  # Preserved original text
        assert "32% in 8 weeks" in data_unsup["remediated_content"]

        # ----------------------------------------------------------------------
        # TEST 10: INSPECTION HISTORY PERSISTENCE (/api/verifications)
        # ----------------------------------------------------------------------
        res_hist = await client.get("/api/verifications?brand_id=aurelle-tech&limit=10")
        assert res_hist.status_code == 200
        hist_records = res_hist.json()
        assert len(hist_records) > 0
        assert any(r.get("brand_id") == "aurelle-tech" for r in hist_records)

        # ----------------------------------------------------------------------
        # TEST 11: HANDSHAKE TO SUBMISSION WORKFLOW
        # ----------------------------------------------------------------------
        # Creator takes remediated text from inspection and submits for review
        remediated_text = data_unsup["remediated_content"]
        sub_resp = await client.post("/api/submissions", json={
            "title": "Aurelle Remediated Campaign Draft",
            "channel": "instagram",
            "creator_id": "USR-CREATOR-01",
            "creator_name": "Creator Asha",
            "creator_type": "creator",
            "org_id": "ORG-AURELLE",
            "original_content": unsupported_claim,
            "current_content": remediated_text,
            "findings": [
                {
                    "id": f["id"],
                    "number": f["number"],
                    "rule_id": f["rule_id"],
                    "rule_title": f["rule_title"],
                    "category": f["category"],
                    "severity": f["severity"],
                    "sentence_text": f["sentence_text"],
                    "flagged_text": f["flagged_text"],
                    "explanation": f["explanation"],
                    "suggested_fix": f["suggested_fix"],
                    "suggested_sentence": f["suggested_sentence"],
                    "decision": "UNDECIDED"
                }
                for f in data_unsup["sentence_findings"]
            ],
            "submission_notes": "Submitted with AI-assisted remediation applied."
        }, headers=creator_headers)
        assert sub_resp.status_code == 200
        sub_data = sub_resp.json()
        assert sub_data["status"] == "PENDING_REVIEW"
        assert sub_data["current_content"] == remediated_text
        assert sub_data["original_content"] == unsupported_claim

        # ----------------------------------------------------------------------
        # TEST 12: ERROR HANDLING & INPUT VALIDATION
        # ----------------------------------------------------------------------
        # Empty content returns 400
        res_empty = await client.post("/api/verify", json={"brand_id": "aurelle-tech", "content": "   "})
        assert res_empty.status_code == 400

        # Excessive content (>50,000 chars) returns 413
        res_large = await client.post("/api/verify", json={"brand_id": "aurelle-tech", "content": "A" * 50001})
        assert res_large.status_code == 413
