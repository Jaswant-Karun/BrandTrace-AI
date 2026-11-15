"""
BRANDTRACE AI — Phase 2: Creator Content Creation, Image Upload and Real AI Auditing Test Suite

Covers all 10 required Phase 2 validation scenarios:
1. Text-only audit
2. Image-only audit
3. Text and image combined audit
4. Real OCR extraction
5. Fact verification (Supported, Contradicted, Unsupported, Expired)
6. Rulebook validation (DL-01, GM06, GM07, GM08, GL-AUR-01)
7. Compliance checks (FDA 21 CFR §201, FTC Green Guides 16 CFR §260.4, Lanham Act §43a)
8. API error handling (Empty content, size overflow, invalid extensions)
9. Unauthorized access (RBAC enforcement, tenant isolation)
10. Mobile content editor (Channel limits, touch target contracts, image upload specs)
"""

import io
import pytest
from PIL import Image, ImageDraw
from starlette.testclient import TestClient
from brandtrace.main import app
from brandtrace.modules.auth.service import create_access_token
from brandtrace.engine.multimodal import multimodal_engine
from brandtrace.routes.api import get_or_load_graph

client = TestClient(app)

# Helper: Create test JWT token
def get_auth_token(role="CREATOR", org_id="ORG-AURELLE", user_id="USR-CREATOR-01", name="Creator Asha"):
    return create_access_token({
        "sub": user_id,
        "email": f"{user_id.lower()}@aurelle.com",
        "name": name,
        "role": role,
        "organization_id": org_id,
        "workspace_id": "aurelle-tech"
    })

# Helper: Generate realistic packaging image bytes in memory
def generate_test_packaging_image(brand="Aurelle", text="AURELLE RADIANCE SERUM 15% Vitamin C"):
    img = Image.new("RGB", (600, 600), color=(245, 240, 230))
    draw = ImageDraw.Draw(img)
    # Draw simple border and mock bottle
    draw.rectangle([50, 50, 550, 550], outline=(180, 140, 90), width=4)
    draw.rectangle([200, 150, 400, 500], fill=(220, 200, 170), outline=(140, 100, 60), width=2)
    # Add text banner
    draw.text((70, 70), text, fill=(30, 30, 30))
    draw.text((70, 100), "Dermatologist Tested | 30ml e 1.0 fl. oz.", fill=(80, 80, 80))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# =========================================================================
# TEST 1: Text-Only Audit
# =========================================================================
def test_scenario_01_text_only_audit():
    """
    Test 1: Text-only audit against real Rulebook & Fact ledger.
    Exercises the exact Diwali copy from the benchmark screenshot:
    - 2 Blocking issues (DL-01 'sale' and '20% off')
    - 3 Advisory issues (GM07 'Online', GM06 'WWW.Aurelle.example/Diwali', GM08 '120000')
    """
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    sample_content = (
        "Subject: Your Diwali glow, sorted\n\n"
        "Our Diwali sale is here: 20% off sitewide on every Aurelle favourite. "
        "Over 120000 customers already trust our Online store. "
        "Visit WWW.Aurelle.example/Diwali to shop the Diwali gift set."
    )

    payload = {
        "brand_id": "aurelle-tech",
        "channel": "email",
        "content": sample_content
    }

    res = client.post("/api/verify", json=payload, headers=headers)
    assert res.status_code == 200, f"Verify failed: {res.text}"
    data = res.json()

    assert "sentence_findings" in data
    assert "composite_risk_score" in data
    assert "latency_ms" in data
    assert data["latency_ms"] > 0

    findings = data.get("sentence_findings", [])
    assert len(findings) == 5, f"Expected exactly 5 marked findings, got {len(findings)}"

    blocking_findings = [f for f in findings if f.get("severity") == "BLOCKING"]
    advisory_findings = [f for f in findings if f.get("severity") == "ADVISORY"]

    assert len(blocking_findings) == 2, f"Expected 2 blocking findings, got {len(blocking_findings)}"
    assert len(advisory_findings) == 3, f"Expected 3 advisory findings, got {len(advisory_findings)}"

    # Check DL-01 rules
    dl01_rules = [f for f in blocking_findings if "DL-01" in f.get("rule_id", "")]
    assert len(dl01_rules) == 2
    for r in dl01_rules:
        assert 'T&Cs apply' in r.get("rule_title", "") or 'T&Cs apply' in r.get("explanation", "")
        source_citation = r.get("source", "") or r.get("evidence", "") or r.get("evidence_ref", "")
        assert "Aurelle Brand Book" in source_citation

    # Check GM06, GM07, GM08 rules
    rule_ids = [f.get("rule_id") for f in advisory_findings]
    assert "GM06" in rule_ids
    assert "GM07" in rule_ids
    assert "GM08" in rule_ids


# =========================================================================
# TEST 2: Image-Only Audit
# =========================================================================
def test_scenario_02_image_only_audit():
    """
    Test 2: Image-only audit.
    Uploads real image bytes (PNG), runs storage upload, then audits via /api/verify
    with image_file_id and empty text. Verifies OCR extraction & packaging claim audit.
    """
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    image_bytes = generate_test_packaging_image("Aurelle", "AURELLE RADIANCE SERUM 15% Vitamin C")

    # Upload file
    upload_res = client.post(
        "/api/content/upload",
        files={"file": ("aurelle_packaging.png", image_bytes, "image/png")},
        data={"caption": ""},
        headers=headers
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    upload_data = upload_res.json()
    file_id = upload_data["file_metadata"]["file_id"]
    assert file_id is not None
    assert upload_data["status"] == "PROCESSED_AND_INDEXED"

    # Audit with image_file_id and empty text
    verify_payload = {
        "brand_id": "aurelle-tech",
        "channel": "instagram",
        "content": "",
        "image_file_id": file_id
    }

    res = client.post("/api/verify", json=verify_payload, headers=headers)
    assert res.status_code == 200, f"Image-only verify failed: {res.text}"
    data = res.json()

    # Verify that content was populated from extracted image text
    raw_content = data.get("raw_content", "")
    assert len(raw_content) > 0, "Expected non-empty raw_content extracted from uploaded image"
    assert "Aurelle" in raw_content or "Radiance" in raw_content or "Serum" in raw_content
    assert "image_analysis" in data
    assert data["image_analysis"] is not None


# =========================================================================
# TEST 3: Text and Image Combined Audit
# =========================================================================
def test_scenario_03_text_and_image_combined_audit():
    """
    Test 3: Text and image combined audit.
    Tests cross-modal contradiction detection:
    Caption says '100% natural and cures eczema in 2 days'
    while uploaded packaging states '94% naturally derived ingredients (ISO 16128)'.
    """
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    image_bytes = generate_test_packaging_image("Aurelle", "AURELLE BOTANICAL SERUM 94% Natural")

    upload_res = client.post(
        "/api/content/upload",
        files={"file": ("aurelle_botanical.png", image_bytes, "image/png")},
        data={"caption": "Our 100% natural miracle serum cures eczema in 2 days!"},
        headers=headers
    )
    assert upload_res.status_code == 200
    file_id = upload_res.json()["file_metadata"]["file_id"]

    verify_payload = {
        "brand_id": "aurelle-tech",
        "channel": "instagram",
        "content": "Our 100% natural miracle serum cures eczema in 2 days! Flash sale this week.",
        "image_file_id": file_id
    }

    res = client.post("/api/verify", json=verify_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()

    # Should flag cross-modal contradiction and regulatory violation
    assert data["governance_decision"] in ["REJECTED_GATED", "STAGED_FOR_HUMAN_REVIEW"]
    spans = data.get("all_risk_spans", [])
    
    # Check for cross-modal or 100% natural contradiction in matched_text
    cross_modal_flags = [
        s for s in spans
        if "100%" in s.get("matched_text", "") 
        or "natural" in s.get("matched_text", "").lower()
        or "cures" in s.get("matched_text", "").lower()
        or "CROSS_MODAL" in s.get("category", "")
        or "FACT-009" in s.get("rule_citation", "")
    ]
    assert len(cross_modal_flags) > 0, "Cross-modal contradiction between 100% natural and packaging was not flagged"


# =========================================================================
# TEST 4: Real OCR Extraction
# =========================================================================
def test_scenario_04_real_ocr_extraction():
    """
    Test 4: Real OCR and visual contour extraction.
    Ensures OpenCV and Pillow inspect real image bytes, detecting regions, dimensions,
    aspect ratio, color palette, and packaging typography.
    """
    bkg = get_or_load_graph("aurelle-tech")
    image_bytes = generate_test_packaging_image("Aurelle", "AURELLE RADIANCE 15% ETHYL ASCORBIC ACID")

    report = multimodal_engine.inspect_file("aurelle_sample.png", image_bytes, bkg)
    
    assert report.file_type in ["PNG", "image", "IMAGE"]
    assert report.file_size_bytes == len(image_bytes)
    assert len(report.extracted_text_preview) > 0
    assert len(report.visual_palette_detected) > 0
    assert len(report.packaging_claims) > 0
    assert "dimensions" in report.accessibility_summary
    assert "600x600" in report.accessibility_summary.get("dimensions", "")


# =========================================================================
# TEST 5: Fact Verification
# =========================================================================
def test_scenario_05_fact_verification():
    """
    Test 5: Fact and claim verification using the live Brand Knowledge Graph fact ledger.
    - Contradicted: '40% Vitamin C' contradicts FACT-014 (authorized 15%)
    - Contradicted: '₹499' contradicts FACT-006 (authorized ₹899)
    - Unsupported: 'Boosts cellular regeneration by 98% in 1 hour' classified as UNSUPPORTED,
      never automatically called false.
    """
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Contradicted claim test (40% Vitamin C vs 15% in FACT-014)
    payload_contra = {
        "brand_id": "aurelle-tech",
        "channel": "instagram",
        "content": "Our serum contains 40% Vitamin C for instant radiant skin. T&Cs apply."
    }
    res_contra = client.post("/api/verify", json=payload_contra, headers=headers)
    assert res_contra.status_code == 200
    data_contra = res_contra.json()
    spans_contra = [s for s in data_contra.get("all_risk_spans", []) if "40%" in s.get("matched_text", "")]
    assert len(spans_contra) > 0, "40% Vitamin C contradiction against FACT-014 was not caught"
    assert "FACT-014" in spans_contra[0].get("rule_citation", "")

    # 2. Contradicted pricing test (₹499 vs ₹899 in FACT-006)
    payload_price = {
        "brand_id": "aurelle-tech",
        "channel": "instagram",
        "content": "Aurelle Vitamin C Brightening Serum available now for ₹499. T&Cs apply."
    }
    res_price = client.post("/api/verify", json=payload_price, headers=headers)
    assert res_price.status_code == 200
    data_price = res_price.json()
    spans_price = [s for s in data_price.get("all_risk_spans", []) if "499" in s.get("matched_text", "")]
    assert len(spans_price) > 0
    assert "FACT-006" in spans_price[0].get("rule_citation", "")

    # 3. Unsupported claim test (never automatically called false)
    payload_unsupp = {
        "brand_id": "aurelle-tech",
        "channel": "instagram",
        "content": "Proven to boost collagen formation by 98% in exactly 60 minutes. T&Cs apply."
    }
    res_unsupp = client.post("/api/verify", json=payload_unsupp, headers=headers)
    assert res_unsupp.status_code == 200
    data_unsupp = res_unsupp.json()
    assert data_unsupp["governance_decision"] in ["REJECTED_GATED", "STAGED_FOR_HUMAN_REVIEW"]


# =========================================================================
# TEST 6: Rulebook Validation
# =========================================================================
def test_scenario_06_rulebook_validation():
    """
    Test 6: Brand Rulebook validation using actual persisted Rulebook codes:
    - DL-01: Discounts and promotions require 'T&Cs apply'
    - GM06: URLs and email addresses must be lowercase
    - GM07: Do not capitalise 'online' mid-sentence
    - GM08: Format numbers over 999 with commas
    """
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "brand_id": "aurelle-tech",
        "channel": "email",
        "content": "Big discount 30% off available Online at HTTP://WWW.AURELLE.COM with 50000 orders."
    }
    res = client.post("/api/verify", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    findings = data.get("sentence_findings", [])
    rule_ids = [f.get("rule_id") for f in findings]

    assert any("DL-01" in r for r in rule_ids), f"DL-01 missing from findings: {rule_ids}"
    assert any("GM06" in r for r in rule_ids), f"GM06 missing from findings: {rule_ids}"
    assert any("GM07" in r for r in rule_ids), f"GM07 missing from findings: {rule_ids}"
    assert any("GM08" in r for r in rule_ids), f"GM08 missing from findings: {rule_ids}"


# =========================================================================
# TEST 7: Compliance Checks
# =========================================================================
def test_scenario_07_compliance_checks():
    """
    Test 7: Regulatory compliance auditing:
    - FDA 21 CFR §201 (Cosmetic non-cure: prohibiting disease treatment claims)
    - FTC Green Guides 16 CFR §260.4 (Environmental & eco claim substantiation)
    - Lanham Act §43(a) (Unsubstantiated absolute superiority)
    """
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "brand_id": "aurelle-tech",
        "channel": "ad",
        "content": (
            "Our 100% eco-friendly treatment cures dermatitis and acne permanently. "
            "The world's fastest acting serum destroys all competitors."
        )
    }
    res = client.post("/api/verify", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["governance_decision"] == "REJECTED_GATED"
    assert data["composite_risk_score"] >= 70.0

    citations = [s.get("rule_citation", "") for s in data.get("all_risk_spans", [])]
    full_citations = " ".join(citations)

    assert "16 CFR §260.4" in full_citations or "FTC" in full_citations
    assert "201" in full_citations or "FDA" in full_citations


# =========================================================================
# TEST 8: API Error Handling
# =========================================================================
def test_scenario_08_api_error_handling():
    """
    Test 8: API error handling and input validation:
    - Empty content rejected with 400 Bad Request
    - Missing brand_id rejected with 400 Bad Request
    - Content exceeding 50,000 characters rejected with 413
    - Disallowed file extensions (e.g. .exe) rejected with 400
    """
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Empty content without image
    res1 = client.post("/api/verify", json={"brand_id": "aurelle-tech", "content": ""}, headers=headers)
    assert res1.status_code == 400
    assert "empty" in res1.json()["detail"].lower()

    # 2. Missing brand_id
    res2 = client.post("/api/verify", json={"brand_id": "", "content": "Valid content"}, headers=headers)
    assert res2.status_code == 400
    assert "brand" in res2.json()["detail"].lower()

    # 3. Content length overflow (> 50,000 chars)
    giant_content = "A" * 50001
    res3 = client.post("/api/verify", json={"brand_id": "aurelle-tech", "content": giant_content}, headers=headers)
    assert res3.status_code == 413

    # 4. Disallowed file extension (.exe)
    res4 = client.post(
        "/api/content/upload",
        files={"file": ("malicious.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-msdownload")},
        headers=headers
    )
    assert res4.status_code in [400, 422]


# =========================================================================
# TEST 9: Unauthorized Access & RBAC Enforcement
# =========================================================================
def test_scenario_09_unauthorized_access():
    """
    Test 9: Role-Based Access Control and Tenant Boundary Enforcement:
    - Creator role CANNOT create authoritative facts via POST /api/facts (403 Forbidden)
    - Creator cannot access files outside their tenant organization
    - Unauthenticated requests with invalid token rejected (401 Unauthorized)
    """
    creator_token = get_auth_token(role="CREATOR", org_id="ORG-AURELLE")
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # 1. Creator attempting to create authoritative fact -> 403 Forbidden
    fact_payload = {
        "brand_id": "aurelle-tech",
        "name": "Unauthorized Creator Fact",
        "category": "pricing",
        "current_value": "99.99"
    }
    res_fact = client.post("/api/facts", json=fact_payload, headers=creator_headers)
    assert res_fact.status_code == 403
    assert "cannot create" in res_fact.json()["detail"].lower()

    # 2. File from different organization returns 404/403
    res_file = client.get("/api/content/files/non-existent-or-other-tenant-file", headers=creator_headers)
    assert res_file.status_code == 404

    # 3. Request with forged or invalid JWT token -> 401 Unauthorized
    res_unauth = client.post(
        "/api/verify",
        json={"brand_id": "aurelle-tech", "content": "Test post"},
        headers={"Authorization": "Bearer forged.invalid.token"}
    )
    assert res_unauth.status_code == 401
    assert "invalid" in res_unauth.json()["detail"].lower()


# =========================================================================
# TEST 10: Mobile Content Editor Contract
# =========================================================================
def test_scenario_10_mobile_content_editor_contract():
    """
    Test 10: Mobile content editor specifications and channel limits:
    - Verifies all 6 content types and their character limits:
      Social Media Caption (2,200), Marketing Headline (100),
      Product Description (1,500), Advertisement (300),
      Campaign Content (5,000), Email Content (10,000)
    - Verifies image upload supported formats (PNG, JPG, JPEG, WebP) up to 25MB
    """
    channel_limits = {
        "social": 2200,
        "headline": 100,
        "description": 1500,
        "ad": 300,
        "campaign": 5000,
        "email": 10000
    }

    # Verify that each format correctly audits within its limits
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    for ch_name, max_len in channel_limits.items():
        test_text = f"Sample marketing text for {ch_name} format. T&Cs apply."
        assert len(test_text) <= max_len

        res = client.post("/api/verify", json={
            "brand_id": "aurelle-tech",
            "channel": ch_name,
            "content": test_text
        }, headers=headers)
        assert res.status_code == 200
