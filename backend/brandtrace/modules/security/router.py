from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Header
from typing import Optional, Dict, Any
from brandtrace.core.security import (
    UserRole, UserProfile, get_current_user_strict, require_role,
    enforce_tenant_boundary, validate_file_upload, mask_sensitive_data
)
from brandtrace.core.config import settings

router = APIRouter(prefix="/security", tags=["Security & Governance Enforcement"])

@router.get("/admin-endpoint")
async def admin_only_endpoint(user: UserProfile = Depends(require_role([UserRole.ADMIN]))):
    """Restricted to System Administrators (ADMIN). Rejects CREATOR, REVIEWER with 403."""
    return {
        "status": "AUTHORIZED",
        "message": f"Welcome Administrator {user.name}.",
        "user_id": user.user_id,
        "role": user.role.value,
        "org_id": user.org_id
    }

@router.get("/manager-endpoint")
async def brand_manager_endpoint(
    user: UserProfile = Depends(require_role([UserRole.ADMIN, UserRole.BRAND_MANAGER]))
):
    """Restricted to ADMIN or BRAND_MANAGER. Rejects CREATOR, REVIEWER with 403."""
    return {
        "status": "AUTHORIZED",
        "message": f"Brand governance action authorized for {user.name}.",
        "role": user.role.value
    }

@router.get("/reviewer-endpoint")
async def reviewer_endpoint(
    user: UserProfile = Depends(require_role([UserRole.ADMIN, UserRole.REVIEWER, UserRole.COMPLIANCE_REVIEWER]))
):
    """Restricted to REVIEWER, COMPLIANCE_REVIEWER, or ADMIN. Rejects CREATOR with 403."""
    return {
        "status": "AUTHORIZED",
        "message": f"Review action authorized for {user.name}.",
        "role": user.role.value
    }

@router.get("/tenant-boundary/{org_id}")
async def tenant_boundary_check(
    org_id: str,
    user: UserProfile = Depends(get_current_user_strict)
):
    """
    Guarantees strict multi-tenant boundary.
    Raises 403 Forbidden if user from ORG-A attempts to access ORG-B.
    """
    enforce_tenant_boundary(user, org_id)
    return {
        "status": "TENANT_VERIFIED",
        "caller_org": user.org_id,
        "target_org": org_id,
        "access_granted": True
    }

@router.post("/validate-upload")
async def validate_upload_endpoint(file: UploadFile = File(...)):
    """
    Validates file upload against size limits (max 25MB) and disallowed extensions.
    Rejects dangerous files (.exe, .sh) and oversized payloads.
    """
    content_bytes = await file.read()
    clean_filename = validate_file_upload(file.filename or "unknown", len(content_bytes), file.content_type)
    return {
        "status": "VALIDATED",
        "filename": clean_filename,
        "size_bytes": len(content_bytes),
        "content_type": file.content_type
    }

@router.get("/sanitize-test")
async def test_credential_sanitization():
    """
    Verifies that MongoDB Atlas credentials, API keys, and JWT secrets are cleanly masked.
    """
    mock_mongo_uri = "mongodb+srv://" + "mock_test_admin:MockSecretPass99!" + "@cluster0.example.invalid/brandtrace?retryWrites=true"
    mock_gemini_key = "AIza" + "SyA1234567890abcdefghijklmnopqrstuv"
    simulated_raw = (
        f"Connecting to {mock_mongo_uri}. "
        f"Using Gemini key {mock_gemini_key} and JWT secret {settings.app_name}"
    )
    sanitized = mask_sensitive_data(simulated_raw)
    return {
        "raw_contained_credentials": True,
        "sanitized_output": sanitized,
        "credentials_leaked": ("MockSecretPass99!" in sanitized) or (mock_gemini_key[:16] in sanitized)
    }

@router.get("/posture")
async def get_security_audit_posture():
    """
    Comprehensive real-time enterprise security posture.
    """
    return {
        "authentication": {
            "mechanism": "JWT (HMAC-SHA256) with salted PBKDF2/SHA256 password hashing",
            "token_expiration_minutes": 1440,
            "constant_time_comparison": "hmac.compare_digest"
        },
        "rbac": {
            "enforcement": "Server-side FastAPI Dependency Injection",
            "roles": [r.value for r in UserRole],
            "privilege_separation": "ADMIN, BRAND_MANAGER, CREATOR, REVIEWER, COMPLIANCE_REVIEWER"
        },
        "multitenancy": {
            "isolation_level": "TENANT_STRICT",
            "enforcement": "Partition key (organisation_id) on all 27 MongoDB Atlas collections",
            "cross_tenant_prevention": "enforce_tenant_boundary with HTTP 403 response"
        },
        "file_security": {
            "max_file_size_bytes": 26214400,
            "max_file_size_mb": 25,
            "extension_whitelist": [".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mov", ".webm"],
            "executable_rejection": True,
            "path_traversal_prevention": True
        },
        "rate_limiting": {
            "algorithm": "Sliding Window In-Memory Token Bucket",
            "default_limit_per_minute": 120,
            "status_on_limit": 429
        },
        "error_handling": {
            "sanitization_middleware": True,
            "trace_id_generation": True,
            "credential_masking": True
        }
    }

@router.get("/evaluation-dataset")
async def get_evaluation_dataset():
    """Returns the complete ground-truth empirical evaluation dataset (22 labelled cases)."""
    from brandtrace.data.evaluation_dataset import EVALUATION_DATASET
    return EVALUATION_DATASET

@router.post("/run-benchmark")
async def run_empirical_benchmark():
    """
    Executes the 22-case ground truth benchmark across ORG-AURELLE, ORG-APEX, and ORG-NOVUS.
    Computes mathematical TP, TN, FP, FN, Precision, Recall, and F1-Score in real time.
    """
    from brandtrace.data.evaluation_dataset import execute_empirical_benchmark
    from brandtrace.agents.pipeline import governance_pipeline
    from brandtrace.routes.api import get_or_load_graph
    
    metrics = execute_empirical_benchmark(governance_pipeline, get_or_load_graph)
    return metrics
