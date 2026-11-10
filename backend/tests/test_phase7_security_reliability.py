import io
import pytest
from starlette.testclient import TestClient
from brandtrace.main import app
from brandtrace.core.security import hash_password, create_access_token, UserRole
from brandtrace.engine.explainable_review import explainable_engine, ExplainableClaimAssessment, ClaimClassification
from brandtrace.engine.multimodal import multimodal_engine
from brandtrace.routes.api import get_or_load_graph

client = TestClient(app)

# Helper to create authentic test JWTs
def get_auth_token(email: str, role: str, org_id: str, workspace_id: str) -> str:
    return create_access_token({
        "sub": f"USR-TEST-{role}",
        "email": email,
        "role": role,
        "org_id": org_id,
        "workspace_id": workspace_id,
        "name": f"Test User {role}"
    })

# ==============================================================================
# 1. SECURITY & AUTHENTICATION TESTS
# ==============================================================================

def test_unauthenticated_requests_blocked():
    """Verify that requests lacking authorization or with malformed tokens return HTTP 401."""
    # 1. No Authorization header
    res_no_auth = client.get("/api/security/admin-endpoint")
    assert res_no_auth.status_code == 401
    assert "credentials were not provided" in res_no_auth.json()["detail"].lower()

    # 2. Malformed Authorization header
    res_malformed = client.get(
        "/api/security/admin-endpoint",
        headers={"Authorization": "Token not_a_bearer_format"}
    )
    assert res_malformed.status_code == 401

    # 3. Invalid/Tampered JWT
    res_invalid_jwt = client.get(
        "/api/security/admin-endpoint",
        headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.bogus_tampered_payload.signature"}
    )
    assert res_invalid_jwt.status_code == 401
    assert "invalid or has expired" in res_invalid_jwt.json()["detail"].lower()

def test_server_side_rbac_permissions():
    """Verify strict role-based privilege boundaries (ADMIN, BRAND_MANAGER, REVIEWER, CREATOR)."""
    token_admin = get_auth_token("admin@aurelle.com", "ADMIN", "ORG-AURELLE", "aurelle-tech")
    token_manager = get_auth_token("bm@aurelle.com", "BRAND_MANAGER", "ORG-AURELLE", "aurelle-tech")
    token_reviewer = get_auth_token("rev@aurelle.com", "REVIEWER", "ORG-AURELLE", "aurelle-tech")
    token_creator = get_auth_token("creator@aurelle.com", "CREATOR", "ORG-AURELLE", "aurelle-tech")

    # 1. Admin endpoint: ADMIN succeeds, all others 403 Forbidden
    res_adm = client.get("/api/security/admin-endpoint", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_adm.status_code == 200
    assert res_adm.json()["status"] == "AUTHORIZED"

    res_mgr_on_adm = client.get("/api/security/admin-endpoint", headers={"Authorization": f"Bearer {token_manager}"})
    assert res_mgr_on_adm.status_code == 403
    assert "insufficient privileges" in res_mgr_on_adm.json()["detail"].lower()

    res_crt_on_adm = client.get("/api/security/admin-endpoint", headers={"Authorization": f"Bearer {token_creator}"})
    assert res_crt_on_adm.status_code == 403

    # 2. Manager endpoint: ADMIN & BRAND_MANAGER succeed, CREATOR fails (403)
    res_mgr = client.get("/api/security/manager-endpoint", headers={"Authorization": f"Bearer {token_manager}"})
    assert res_mgr.status_code == 200

    res_crt_on_mgr = client.get("/api/security/manager-endpoint", headers={"Authorization": f"Bearer {token_creator}"})
    assert res_crt_on_mgr.status_code == 403

    # 3. Reviewer endpoint: REVIEWER succeeds, CREATOR fails (403)
    res_rev = client.get("/api/security/reviewer-endpoint", headers={"Authorization": f"Bearer {token_reviewer}"})
    assert res_rev.status_code == 200

    res_crt_on_rev = client.get("/api/security/reviewer-endpoint", headers={"Authorization": f"Bearer {token_creator}"})
    assert res_crt_on_rev.status_code == 403

def test_cross_tenant_isolation_enforcement():
    """Verify that users cannot access resources belonging to a different organization."""
    token_apex = get_auth_token("creator@apex.com", "CREATOR", "ORG-APEX", "apex-dynamics")

    # Allowed access to own tenant
    res_same_tenant = client.get(
        "/api/security/tenant-boundary/ORG-APEX",
        headers={"Authorization": f"Bearer {token_apex}"}
    )
    assert res_same_tenant.status_code == 200
    assert res_same_tenant.json()["access_granted"] is True

    # Blocked cross-tenant access to ORG-AURELLE
    res_cross_tenant = client.get(
        "/api/security/tenant-boundary/ORG-AURELLE",
        headers={"Authorization": f"Bearer {token_apex}"}
    )
    assert res_cross_tenant.status_code == 403
    assert "cross-organisation tenant violation" in res_cross_tenant.json()["detail"].lower()

# ==============================================================================
# 2. RATE LIMITING & SECURITY HEADERS
# ==============================================================================

def test_rate_limiter_burst_enforcement():
    """Verify rate limiter blocks bursts exceeding quota with HTTP 429 and Retry-After header."""
    headers = {
        "X-Client-ID": "rate-limiter-isolated-test-client-99",
        "X-Test-Rate-Limit": "3"
    }
    
    # 3 allowed requests
    for _ in range(3):
        res = client.get("/api/security/posture", headers=headers)
        assert res.status_code == 200
        assert "X-RateLimit-Limit" in res.headers

    # 4th request exceeds burst quota -> 429 Too Many Requests
    res_exceeded = client.get("/api/security/posture", headers=headers)
    assert res_exceeded.status_code == 429
    assert res_exceeded.json()["status"] == "RATE_LIMITED"
    assert "Retry-After" in res_exceeded.headers

def test_security_headers_present():
    """Verify that mandatory enterprise HTTP security headers are injected."""
    res = client.get("/api/security/posture")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

# ==============================================================================
# 3. FILE UPLOAD RESTRICTIONS & SIZE LIMITS
# ==============================================================================

def test_file_upload_dangerous_extensions_rejected():
    """Verify that dangerous executables and scripts (.exe, .sh) are rejected."""
    # 1. Executable .exe
    files_exe = {"file": ("malicious_payload.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-msdownload")}
    res_exe = client.post("/api/security/validate-upload", files=files_exe)
    assert res_exe.status_code == 400
    assert "prohibited" in res_exe.json()["detail"].lower()

    # 2. Bash script .sh
    files_sh = {"file": ("deploy_script.sh", b"#!/bin/bash\nrm -rf /", "application/x-sh")}
    res_sh = client.post("/api/security/validate-upload", files=files_sh)
    assert res_sh.status_code == 400
    assert "prohibited" in res_sh.json()["detail"].lower()

def test_file_upload_size_limit_enforced():
    """Verify that uploads exceeding 25MB are rejected with HTTP 413 Payload Too Large."""
    # Create simulated oversized content (25MB + 1024 bytes)
    oversized_bytes = b"0" * (25 * 1024 * 1024 + 1024)
    files = {"file": ("huge_brand_archive.pdf", oversized_bytes, "application/pdf")}
    res = client.post("/api/security/validate-upload", files=files)
    assert res.status_code == 413
    assert "payload too large" in res.json()["detail"].lower()

def test_file_upload_valid_formats_accepted():
    """Verify that permitted media files (.pdf, .png, .docx, .txt) pass validation."""
    valid_pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    files = {"file": ("approved_guidelines.pdf", valid_pdf_content, "application/pdf")}
    res = client.post("/api/security/validate-upload", files=files)
    assert res.status_code == 200
    assert res.json()["filename"] == "approved_guidelines.pdf"

# ==============================================================================
# 4. SENSITIVE CREDENTIAL MASKING & SANITIZATION
# ==============================================================================

def test_sensitive_credentials_sanitized():
    """Verify that database connection strings, JWT secrets, and AI keys are never leaked."""
    res = client.get("/api/security/sanitize-test")
    assert res.status_code == 200
    data = res.json()
    assert data["credentials_leaked"] is False
    assert "MockSecretPass99!" not in data["sanitized_output"]
    sample_key_prefix = "AIza" + "SyA1234567890"
    assert sample_key_prefix not in data["sanitized_output"]
    assert "[REDACTED_CREDENTIALS]" in data["sanitized_output"]
    assert "[REDACTED_API_KEY]" in data["sanitized_output"]

# ==============================================================================
# 5. MULTIMODAL RESILIENCE & CORRUPTED UPLOADS
# ==============================================================================

def test_corrupted_multimodal_file_handling():
    """Verify corrupted PDF, image, and document payloads return structured reports without crashing."""
    bkg = get_or_load_graph("apex-dynamics")

    # 1. Corrupted image bytes (invalid header)
    corrupted_img_bytes = b"\x89PNG\r\n\x1a\nCorruptedByteStream_NotAValidImage"
    img_report = multimodal_engine.inspect_file("corrupt_logo.png", corrupted_img_bytes, bkg)
    assert img_report.overall_status == "REJECTED_GATED"
    assert any("corrupted" in f.explanation.lower() or "ERR-IMG" in f.id for f in img_report.findings)

    # 2. Corrupted PDF document
    corrupted_pdf_bytes = b"%PDF-1.4\nCorrupted_Incomplete_PDF_Stream_No_EOF"
    pdf_report = multimodal_engine.inspect_file("broken_contract.pdf", corrupted_pdf_bytes, bkg)
    assert pdf_report.overall_status in ["REJECTED_GATED", "FLAGGED_FOR_REMEDATION"]
    assert pdf_report.file_type == "PDF"

# ==============================================================================
# 6. AI RELIABILITY & SOURCE CATALOG VALIDATION
# ==============================================================================

def test_source_reference_catalog_validation():
    """Verify that cited source references are validated against registered catalog records."""
    catalog_ids = {"AC-01", "AC-02", "GL-AUR-01", "FACT-AUR-PRC-01"}
    
    # 1. Assessment citing a valid catalog ID
    valid_assessment = ExplainableClaimAssessment(
        claim_text="Up to 520 miles EPA-estimated range",
        classification=ClaimClassification.SUPPORTED,
        confidence_score=0.98,
        matched_source_id="AC-01",
        source_citation="EPA Certificate #EV-APX-982",
        explanation="Validated against approved EPA record.",
        minimal_change_rewrite="Up to 520 miles (EPA-estimated)"
    )

    # 2. Assessment citing a non-existent / hallucinated catalog ID
    hallucinated_assessment = ExplainableClaimAssessment(
        claim_text="Charges in 2 minutes",
        classification=ClaimClassification.SUPPORTED,
        confidence_score=0.90,
        matched_source_id="AC-FAKE-999",
        source_citation="Non-existent Lab Protocol",
        explanation="Asserted fast charging claim.",
        minimal_change_rewrite="Standard charge"
    )

    validated = explainable_engine.validate_source_references(
        [valid_assessment, hallucinated_assessment],
        catalog_ids
    )

    # Valid source preserved
    assert validated[0].classification == ClaimClassification.SUPPORTED
    assert validated[0].confidence_score == 0.98

    # Hallucinated source flagged as NEEDS_VERIFICATION with reduced confidence
    assert validated[1].classification == ClaimClassification.NEEDS_VERIFICATION
    assert validated[1].confidence_score <= 0.45
    assert "missing from the database catalog" in validated[1].explanation.lower()

def test_ai_fallback_on_simulated_service_failure():
    """Verify circuit breaker engages deterministic rule fallback when AI service fails."""
    bkg = get_or_load_graph("apex-dynamics")
    test_text = "The Apex GT delivers 650 miles on a single charge."
    
    fallback_report = explainable_engine.safe_evaluate_with_fallback(
        text=test_text,
        bkg=bkg,
        brand_id="apex-dynamics",
        simulated_ai_failure=True
    )
    assert fallback_report.total_claims_analyzed >= 1
    assert "deterministic engine engaged" in fallback_report.suggested_full_rewrite.lower()

# ==============================================================================
# 7. EMPIRICAL EVALUATION DATASET BENCHMARK (22 REALISTIC LABELLED CASES)
# ==============================================================================

def test_empirical_evaluation_dataset_precision_and_recall():
    """
    Executes all 23 labelled ground-truth evaluation cases across ORG-AURELLE, ORG-APEX, and ORG-NOVUS.
    Empirically verifies:
    - Precision >= 0.85
    - Recall >= 0.85
    - F1-Score >= 0.85
    - Total samples >= 20 with coverage across all 3 organisations.
    """
    res = client.post("/api/security/run-benchmark")
    assert res.status_code == 200
    metrics = res.json()

    assert metrics["total_samples"] >= 20
    assert metrics["total_samples"] == 23
    assert metrics["true_positives"] >= 15
    assert metrics["true_negatives"] >= 5
    assert metrics["false_positives"] <= 1
    assert metrics["false_negatives"] <= 1

    # Real mathematical performance thresholds
    assert metrics["precision"] >= 0.85, f"Expected Precision >= 0.85, got {metrics['precision']}"
    assert metrics["recall"] >= 0.85, f"Expected Recall >= 0.85, got {metrics['recall']}"
    assert metrics["f1_score"] >= 0.85, f"Expected F1-Score >= 0.85, got {metrics['f1_score']}"
    assert metrics["accuracy"] >= 0.90, f"Expected Accuracy >= 0.90, got {metrics['accuracy']}"

    # Verify coverage across all 3 enterprise organisations
    org_breakdown = metrics["samples_per_organization"]
    assert org_breakdown.get("ORG-AURELLE", 0) >= 10
    assert org_breakdown.get("ORG-APEX", 0) >= 6
    assert org_breakdown.get("ORG-NOVUS", 0) >= 4
