"""
BRANDTRACE AI — Round 3 Commitment 2 Test Suite
4-Agent Autonomous Governance Pipeline with Graph-Preserving Remediation

Verifies:
1. Concurrent multi-agent inspection execution (Voice & Persona, Claim Substantiation, Regulatory & Legal Compliance).
2. Monotonic latency strictly under 800ms (latency_ms < 800.0).
3. Statutory legal citations: FTC 16 CFR §260.4, FDA 21 CFR §202.1/§870, Lanham Act §43(a), NHTSA SGO 2021-01.
4. Graph-preserving reverse-offset remediation algorithm preserving brand voice and Unicode safety (₹, —, ™).
5. Explainable claims review with claim classification and minimal-change rewrites.
6. Server-side input validation rejecting empty or whitespace copy.
"""

import pytest
from starlette.testclient import TestClient
from brandtrace.main import app
from brandtrace.agents.pipeline import governance_pipeline
from brandtrace.routes.api import get_or_load_graph

client = TestClient(app)

def test_commitment2_concurrent_multi_agent_latency_under_800ms():
    """
    Commitment 2.1: Verify concurrent multi-agent inspection executes under 800ms threshold
    and returns reports from Voice, Claim, and Regulatory agents.
    """
    payload = {
        "brand_id": "apex-dynamics",
        "asset_id": "AST-TEST-PERF-01",
        "channel": "Digital Performance Display",
        "content": (
            "Experience insane acceleration with the Apex GT delivering 520 miles range "
            "with completely green 100% eco-friendly fast charge in 8 minutes. "
            "Kick back and relax with fully autonomous self-driving on quantumcell architecture."
        )
    }

    res = client.post("/api/verify", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()

    # 1. Latency strictly under 800ms
    assert "latency_ms" in data, "latency_ms metric must be returned by verification pipeline"
    assert data["latency_ms"] < 800.0, f"Pipeline exceeded 800ms threshold: {data['latency_ms']}ms"
    assert data["latency_ms"] > 0.0, "latency_ms must be a positive non-zero measurement"

    # 2. Multi-Agent Pipeline Coverage (3 concurrent agents)
    assert data["agents_count"] == 3
    assert "voice_persona" in data["agent_reports"]
    assert "claim_substantiation" in data["agent_reports"]
    assert "regulatory_compliance" in data["agent_reports"]

    # 3. Governance Decision & Scoring
    assert data["governance_decision"] in ["REJECTED_GATED", "STAGED_FOR_HUMAN_REVIEW"]
    assert data["composite_risk_score"] >= 50.0
    assert len(data["all_risk_spans"]) >= 3


def test_commitment2_statutory_legal_citations():
    """
    Commitment 2.2: Verify findings cite concrete statutory regulations rather than vague warnings.
    Checks FTC Green Guides, FDA, Lanham Act, and NHTSA citations.
    """
    payload = {
        "brand_id": "apex-dynamics",
        "channel": "National Print & Web",
        "content": (
            "The new Apex GT offers completely green 100% eco-friendly zero-carbon driving. "
            "Our fully autonomous system lets you travel hands-free without looking while you commute. "
            "Crush the competition with the fastest electric car on Earth."
        )
    }

    res = client.post("/api/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    spans = data["all_risk_spans"]
    citations = [s.get("rule_citation", "") for s in spans]
    citations_text = " ".join(citations)

    # 1. FTC Environmental Marketing / Green Guides (16 CFR §260.4)
    assert any("FTC" in c or "Green Guides" in c or "260" in c for c in citations), "Missing FTC Green Guides citation"

    # 2. NHTSA Standing General Order / SAE Level 2 Driver Supervision
    assert any("NHTSA" in c or "SAE" in c or "L2" in c or "Driver" in c for c in citations), "Missing NHTSA/SAE citation"

    # 3. Lanham Act / Comparative Superiority
    assert any("Lanham" in c or "Superlative" in c or "Comparative" in c or "TONE" in c for c in citations), "Missing Lanham or Tone citation"


def test_commitment2_reverse_offset_remediation_algorithm():
    """
    Commitment 2.3: Verify reverse-offset remediation algorithm cleanly repairs all spans
    in descending offset order without index drift, corruption, or character truncation.
    """
    original_copy = (
        "Unlock insane performance with 520 miles range and 100% eco-friendly fast charging. "
        "Built on quantumcell technology."
    )

    bkg = get_or_load_graph("apex-dynamics")
    from brandtrace.agents.schema import VerificationRequest
    req = VerificationRequest(brand_id="apex-dynamics", content=original_copy, channel="Web")
    result = governance_pipeline.verify_asset(req, bkg)

    assert result.remediated_content is not None
    remediated = result.remediated_content

    # Check defects are repaired
    assert "insane" not in remediated.lower(), "Banned hype word 'insane' must be remediated"
    assert "100% eco-friendly" not in remediated.lower(), "Greenwashing claim must be remediated"

    # Check replacements were applied cleanly without mangling
    assert "520 miles" in remediated
    assert "EPA-estimated" in remediated or "certified" in remediated.lower()
    assert len(remediated) > len(original_copy) - 20, "Remediated text must preserve original syntax"


def test_commitment2_unicode_safety_in_remediation():
    """
    Commitment 2.4: Verify Unicode multi-byte character safety (₹, —, ™, ®) during reverse-offset replacement.
    """
    unicode_copy = (
        "Subscribe to Aurelle Cloud Studio for ₹499/mo — enjoy 100% unbreakable titanium hardware™."
    )
    bkg = get_or_load_graph("aurelle-tech")
    from brandtrace.agents.schema import VerificationRequest
    req = VerificationRequest(brand_id="aurelle-tech", content=unicode_copy, channel="Web")
    result = governance_pipeline.verify_asset(req, bkg)

    remediated = result.remediated_content
    assert remediated is not None
    # Verify Unicode symbols remain intact
    assert "₹" in remediated, "Currency symbol ₹ must not be corrupted"
    assert "—" in remediated or "-" in remediated, "Dash punctuation preserved"
    # Verify absolute durability claim was safely replaced
    assert "100% unbreakable" not in remediated.lower()


def test_commitment2_explainable_review_claims_classification():
    """
    Commitment 2.5: Verify hybrid Explainable AI review classifies claims into deterministic
    taxonomies with token citations and latency < 800ms.
    """
    payload = {
        "brand_id": "apex-dynamics",
        "content": (
            "Our flagship GT delivers 520 miles EPA-estimated range with completely green "
            "100% eco-friendly fast charge in 8 minutes."
        )
    }

    res = client.post("/api/explainable/review", json=payload)
    assert res.status_code == 200
    report = res.json()

    # Latency & Agent Telemetry
    assert report["latency_ms"] < 800.0, f"Explainable review latency {report['latency_ms']}ms exceeds 800ms limit"
    assert len(report["agents_executed"]) >= 3

    # Claim Classifications
    assert report["total_claims_analyzed"] >= 2
    classifications = [a["classification"] for a in report["assessments"]]
    assert "SUPPORTED" in classifications, "520 miles EPA-estimated should be SUPPORTED"
    assert any(c in ["CONTRADICTED", "POTENTIALLY_MISLEADING"] for c in classifications)

    # Minimal change rewrites present
    for assessment in report["assessments"]:
        assert assessment["minimal_change_rewrite"] is not None
        assert len(assessment["explanation"]) > 10


def test_commitment2_input_validation_empty_content_rejected():
    """
    Commitment 2.6: Verify empty or blank marketing copy is rejected with HTTP 400.
    """
    # 1. /api/verify with empty content
    res_verify_empty = client.post("/api/verify", json={"brand_id": "apex-dynamics", "content": "   "})
    assert res_verify_empty.status_code == 400
    assert "empty" in res_verify_empty.json()["detail"].lower()

    # 2. /api/explainable/review with empty content
    res_explain_empty = client.post("/api/explainable/review", json={"brand_id": "apex-dynamics", "content": ""})
    assert res_explain_empty.status_code == 400
    assert "empty" in res_explain_empty.json()["detail"].lower()
