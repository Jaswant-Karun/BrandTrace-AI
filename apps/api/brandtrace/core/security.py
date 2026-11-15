import hashlib
import json
import time
from typing import Dict, Any

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
