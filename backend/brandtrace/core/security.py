import hashlib
import json
import time
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "brandtrace-enterprise-governance-secret-key-2026-audit")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

def hash_password(password: str, salt: str = "brandtrace_salt_v1") -> str:
    """Computes SHA-256 salted password hash."""
    return hashlib.sha256(f"{password}:{salt}".encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str, salt: str = "brandtrace_salt_v1") -> bool:
    """Verifies plain password against stored salted hash."""
    return hash_password(plain_password, salt) == hashed_password

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
    except jwt.PyJWTError:
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
