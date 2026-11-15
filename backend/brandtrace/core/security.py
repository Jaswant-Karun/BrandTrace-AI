import hashlib
import hmac
import json
import time
import os
import re
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timedelta, timezone
from enum import Enum
import jwt
from fastapi import HTTPException, Header, Depends
from pydantic import BaseModel

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "brandtrace-enterprise-governance-secret-key-2026-audit")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    BRAND_MANAGER = "BRAND_MANAGER"
    CREATOR = "CREATOR"
    REVIEWER = "REVIEWER"
    COMPLIANCE_REVIEWER = "COMPLIANCE_REVIEWER"

class UserProfile(BaseModel):
    user_id: str
    email: str
    name: str
    role: UserRole
    org_id: str
    workspace_id: str

def hash_password(password: str, salt: str = "brandtrace_salt_v1") -> str:
    """Computes SHA-256 salted password hash."""
    return hashlib.sha256(f"{password}:{salt}".encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str, salt: str = "brandtrace_salt_v1") -> bool:
    """Verifies plain password against stored salted hash using constant-time comparison."""
    computed = hash_password(plain_password, salt)
    return hmac.compare_digest(computed, hashed_password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates signed JWT token with expiry and tenant claims."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates JWT token."""
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded
    except (jwt.PyJWTError, Exception):
        return None

def compute_hash(content: str) -> str:
    """Computes SHA-256 hash of a string."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def compute_dict_hash(data: Dict[str, Any]) -> str:
    """Computes SHA-256 hash of a normalized JSON dictionary."""
    canonical_json = json.dumps(data, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()

def generate_release_proof(
    asset_id: str,
    asset_content: str,
    brand_id: str,
    verification_summary: Dict[str, Any],
    reviewer: str = "BrandTrace-Autonomous-Gate"
) -> Dict[str, Any]:
    """
    Generates a cryptographic tamper-evident release proof bundle.
    """
    timestamp = int(time.time())
    content_hash = compute_hash(asset_content)
    verification_hash = compute_dict_hash(verification_summary)
    
    proof_material = f"{asset_id}:{brand_id}:{content_hash}:{verification_hash}:{reviewer}:{timestamp}"
    release_hash = hashlib.sha256(proof_material.encode('utf-8')).hexdigest()
    
    return {
        "release_hash": f"BT-REL-{release_hash[:16].upper()}",
        "full_digest": release_hash,
        "content_hash": content_hash,
        "verification_hash": verification_hash,
        "timestamp": timestamp,
        "timestamp_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(timestamp)),
        "reviewer": reviewer,
        "signature_scheme": "SHA256-EDT-v1"
    }

# ==============================================================================
# SERVER-SIDE RBAC & TENANT ISOLATION DEPENDENCIES
# ==============================================================================

async def get_current_user_strict(authorization: Optional[str] = Header(None)) -> UserProfile:
    """
    Strict dependency that mandates a valid JWT Bearer token.
    Raises 401 Unauthorized if missing, expired, or invalid.
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication credentials were not provided. Missing Authorization header."
        )
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Must be 'Bearer <token>'."
        )
    
    token = parts[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Authentication token is invalid or has expired."
        )
    
    try:
        user_role = UserRole(payload.get("role", "REVIEWER"))
    except ValueError:
        user_role = UserRole.REVIEWER

    return UserProfile(
        user_id=payload.get("sub", "USR-ANON"),
        email=payload.get("email", "user@brandtrace.ai"),
        name=payload.get("name", "Enterprise User"),
        role=user_role,
        org_id=payload.get("org_id", "ORG-APEX"),
        workspace_id=payload.get("workspace_id", "apex-dynamics")
    )

def require_role(allowed_roles: List[UserRole]) -> Callable:
    """
    FastAPI dependency factory enforcing server-side Role-Based Access Control (RBAC).
    Raises 403 Forbidden if current user's role is not authorized.
    """
    async def role_checker(user: UserProfile = Depends(get_current_user_strict)) -> UserProfile:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Insufficient privileges. Role '{user.role.value}' cannot execute this action. Allowed: {[r.value for r in allowed_roles]}."
            )
        return user
    return role_checker

def enforce_tenant_boundary(user: UserProfile, target_org_id: str) -> None:
    """
    Strictly verifies that the caller belongs to target_org_id.
    Blocks cross-tenant data leakage with 403 Forbidden.
    """
    if target_org_id and user.org_id != target_org_id:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: Cross-organisation tenant violation. User from '{user.org_id}' cannot access '{target_org_id}'."
        )

# ==============================================================================
# FILE UPLOAD SECURITY, SIZE LIMITS & SANITIZATION
# ==============================================================================

MAX_UPLOAD_SIZE = 25 * 1024 * 1024  # 25MB max upload limit
ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mov", ".webm"
}
DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".bash", ".bin", ".dll", ".so",
    ".py", ".js", ".vbs", ".ps1", ".jar", ".msi", ".com", ".scr"
}

def validate_file_upload(filename: str, file_size: int, content_type: Optional[str] = None) -> str:
    """
    Validates file upload against size limits, dangerous extensions, and path traversal.
    Returns sanitized base filename or raises HTTPException.
    """
    # 1. Path traversal prevention
    clean_name = os.path.basename(filename.replace("\\", "/").strip())
    if ".." in clean_name or "/" in clean_name or "\\" in clean_name or not clean_name:
        raise HTTPException(
            status_code=400,
            detail="Security violation: Illegal file path characters or traversal detected."
        )

    # 2. Size limit enforcement (max 25MB)
    if file_size > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Payload Too Large: Uploaded file ({round(file_size / (1024*1024), 2)}MB) exceeds maximum permitted limit of 25MB."
        )

    # 3. Extension inspection
    _, ext = os.path.splitext(clean_name.lower())
    if ext in DANGEROUS_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Security violation: Executable or script file extension '{ext}' is prohibited."
        )

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported Media Type: File format '{ext}' is not permitted. Permitted formats: PDF, DOCX, TXT, MD, PNG, JPG, JPEG, WEBP, MP4, MOV, WEBM."
        )

    return clean_name

# ==============================================================================
# SENSITIVE CREDENTIAL MASKING & SANITIZATION
# ==============================================================================

MONGODB_URI_REGEX = re.compile(r"mongodb(?:\+srv)?:\/\/[^\s\"'<>]+", re.IGNORECASE)
API_KEY_REGEX = re.compile(r"(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9_-]{20,})")
JWT_SECRET_REGEX = re.compile(rf"{re.escape(SECRET_KEY)}")

def mask_sensitive_data(content: str) -> str:
    """
    Masks MongoDB connection credentials, AI API keys, and JWT secrets
    to guarantee zero credential leakage in error messages or logs.
    """
    if not isinstance(content, str):
        content = str(content)
    
    # Mask MongoDB URI
    content = MONGODB_URI_REGEX.sub("mongodb://[REDACTED_CREDENTIALS]@***", content)
    # Mask API Keys
    content = API_KEY_REGEX.sub("[REDACTED_API_KEY]", content)
    # Mask JWT Secret
    if SECRET_KEY and len(SECRET_KEY) > 8:
        content = JWT_SECRET_REGEX.sub("[REDACTED_SECRET]", content)
        
    return content
