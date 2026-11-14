"""
BrandTrace AI — Public Verification Router
Public endpoints for zero-auth cryptographic verification of seals, text, and images.
"""
import hashlib
import os
import re
import difflib
from typing import Optional, Dict, Any, Tuple
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from brandtrace.core.security import validate_file_upload
from brandtrace.engine.audit_ledger import audit_ledger_engine
from brandtrace.database.mongo import mongo_manager
from brandtrace.modules.public_verification.models import (
    PublicVerificationStatus,
    PublicVerificationResponse,
    VerifySealRequest,
    VerifyTextRequest
)

router = APIRouter(tags=["Public Verification"])

PUBLIC_BRAND_NAMES: Dict[str, str] = {
    "apex-dynamics": "Apex Dynamics",
    "org-apex": "Apex Dynamics",
    "aurelle-ai": "Aurelle Technologies",
    "org-aurelle": "Aurelle Technologies",
    "novus-health": "Novus Health Solutions",
    "org-novus": "Novus Health Solutions",
    "velora-money": "Velora Money",
    "org-velora": "Velora Money",
}

def resolve_public_brand_name(brand_id: Optional[str], default: str = "BrandTrace Verified Entity") -> str:
    if not brand_id:
        return default
    clean = brand_id.lower().strip()
    return PUBLIC_BRAND_NAMES.get(clean, brand_id.replace("-", " ").title())

def canonicalize_text(text: str) -> str:
    """
    Canonically normalizes text for tamper verification:
    - Quote styles are ignored (normalizes/strips single, double, curly, and backtick quotes)
    - Whitespace is ignored (collapses repeated spaces, tabs, and newlines into single spaces)
    - Strips leading and trailing whitespace
    """
    if not text:
        return ""
    t = re.sub(r'["\'“”‘’`]', '', text)
    t = t.replace("\u00a0", " ")
    t = re.sub(r"\s+", " ", t)
    return t.strip()

def validate_image_file_bytes(filename: str, file_bytes: bytes) -> str:
    """
    Validates image bytes against magic byte signatures, extension whitelist, and size limit.
    Raises HTTPException (400, 413, or 415) on security failure.
    """
    clean_name = validate_file_upload(filename, len(file_bytes))
    
    _, ext = os.path.splitext(clean_name.lower())
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported Media Type: Public image verification supports PNG, JPG, JPEG, and WEBP. Found: {ext}"
        )
    
    # Magic bytes check
    if ext == ".png":
        if not file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(status_code=400, detail="Invalid image signature: File header does not match valid PNG binary format.")
    elif ext in [".jpg", ".jpeg"]:
        if not file_bytes.startswith(b"\xff\xd8\xff"):
            raise HTTPException(status_code=400, detail="Invalid image signature: File header does not match valid JPEG binary format.")
    elif ext == ".webp":
        if not (file_bytes[:4] == b"RIFF" and len(file_bytes) >= 12 and file_bytes[8:12] == b"WEBP"):
            raise HTTPException(status_code=400, detail="Invalid image signature: File header does not match valid WEBP binary format.")
            
    return clean_name

def ensure_baseline_ledger():
    """Populates baseline demonstration records in AuditTrustLedger if not present."""
    resource_ids = {r.resource_id for r in audit_ledger_engine.records.values()}
    
    if "AST-01" not in resource_ids:
        audit_ledger_engine.record_release(
            user_identity="David Sterling, Chief Governance Officer",
            user_role="COMPLIANCE_REVIEWER",
            resource_id="AST-01",
            resource_type="ASSET",
            content="520 Miles of Zero Compromise. Powered by QuantumCell™ 800V Architecture. The Apex GT arrives.",
            approved_version="v1.0",
            relevant_sources=["AC-01", "TM-01", "TONE-01"]
        )

    if "AST-AUR-01" not in resource_ids:
        audit_ledger_engine.record_release(
            user_identity="Marcus Aurelius, Content Review Lead",
            user_role="REVIEWER",
            resource_id="AST-AUR-01",
            resource_type="ASSET",
            content="Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included.",
            approved_version="v2.0",
            relevant_sources=["FACT-AUR-PRC-01", "TM-AUR-01"]
        )

    if "AST-AUR-HIST-01" not in resource_ids:
        r_old = audit_ledger_engine.record_release(
            user_identity="Julian Vance, VP Brand Governance",
            user_role="BRAND_MANAGER",
            resource_id="AST-AUR-HIST-01",
            resource_type="ASSET",
            content="Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹499 per month.",
            approved_version="v1.0",
            relevant_sources=["FACT-AUR-PRC-01"]
        )
        audit_ledger_engine.supersede_release(r_old.record_id, "v2.0", "Julian Vance")

    if "AST-AUR-RECALLED" not in resource_ids:
        r_rev = audit_ledger_engine.record_release(
            user_identity="David Sterling, Compliance Reviewer",
            user_role="COMPLIANCE_REVIEWER",
            resource_id="AST-AUR-RECALLED",
            resource_type="ASSET",
            content="Aurelle Pulse Smart Ring provides a medical-grade diagnostic cure for cardiovascular heart disease.",
            approved_version="v1.0",
            relevant_sources=["GL-AUR-03"]
        )
        audit_ledger_engine.revoke_release(r_rev.record_id, "Violates FDA 21 CFR §870 Wellness Device Classification")

async def find_release_record_by_seal(seal_code: str) -> Optional[Dict[str, Any]]:
    clean_seal = seal_code.strip()
    
    # 1. Search in-memory AuditTrustLedger
    for rec in audit_ledger_engine.records.values():
        if (rec.tamper_evident_seal.lower() == clean_seal.lower() or
            rec.record_id.lower() == clean_seal.lower() or
            rec.resource_id.lower() == clean_seal.lower() or
            rec.content_id.lower() == clean_seal.lower()):
            return {
                "source": "MEMORY_LEDGER",
                "record_id": rec.record_id,
                "asset_id": rec.resource_id,
                "asset_title": rec.resource_id,
                "seal_code": rec.tamper_evident_seal,
                "content": rec.content_payload,
                "content_hash": rec.current_version_hash,
                "approved_version": rec.approved_version,
                "timestamp_iso": rec.timestamp_iso,
                "is_superseded": rec.is_superseded,
                "superseded_by": rec.superseded_by_version,
                "is_revoked": rec.is_revoked,
                "revocation_reason": rec.revocation_reason,
                "brand_id": "aurelle-ai" if "aur" in rec.resource_id.lower() else "apex-dynamics"
            }
            
    # 2. Search MongoDB release_ledger if available
    if mongo_manager.is_connected and mongo_manager.db is not None:
        try:
            doc = await mongo_manager.db.release_ledger.find_one({
                "$or": [
                    {"audit_stamp": clean_seal},
                    {"tamper_evident_seal": clean_seal},
                    {"release_id": clean_seal},
                    {"asset_id": clean_seal}
                ]
            })
            if doc:
                return {
                    "source": "MONGO_LEDGER",
                    "record_id": doc.get("release_id"),
                    "asset_id": doc.get("asset_id"),
                    "asset_title": doc.get("asset_title") or doc.get("asset_id"),
                    "seal_code": doc.get("audit_stamp") or doc.get("tamper_evident_seal"),
                    "content": doc.get("content", ""),
                    "content_hash": doc.get("content_hash"),
                    "approved_version": doc.get("approved_version", "v1.0"),
                    "timestamp_iso": doc.get("timestamp_iso"),
                    "is_superseded": doc.get("is_superseded", False),
                    "superseded_by": doc.get("superseded_by_version"),
                    "is_revoked": doc.get("is_revoked", False),
                    "revocation_reason": doc.get("revocation_reason"),
                    "brand_id": doc.get("brand_id", "")
                }
        except Exception:
            pass

    # 3. Check in-memory MongoDB releases fallback
    for r in mongo_manager._memory_releases:
        if (r.get("audit_stamp", "").lower() == clean_seal.lower() or
            r.get("tamper_evident_seal", "").lower() == clean_seal.lower() or
            r.get("release_id", "").lower() == clean_seal.lower() or
            r.get("asset_id", "").lower() == clean_seal.lower()):
            return {
                "source": "MEMORY_RELEASES",
                "record_id": r.get("release_id"),
                "asset_id": r.get("asset_id"),
                "asset_title": r.get("asset_title") or r.get("asset_id"),
                "seal_code": r.get("audit_stamp") or r.get("tamper_evident_seal"),
                "content": r.get("content", ""),
                "content_hash": r.get("content_hash"),
                "approved_version": r.get("approved_version", "v1.0"),
                "timestamp_iso": r.get("timestamp_iso"),
                "is_superseded": r.get("is_superseded", False),
                "superseded_by": r.get("superseded_by_version"),
                "is_revoked": r.get("is_revoked", False),
                "revocation_reason": r.get("revocation_reason"),
                "brand_id": r.get("brand_id", "")
            }
            
    return None

async def find_release_record_by_text(text: str) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Looks for matching release record by raw SHA-256 or canonicalized text hash.
    Returns (record_dict, match_type) where match_type is:
    'EXACT_RAW_HASH', 'CANONICAL_TEXT_HASH', 'NEAR_MATCH_MODIFIED', or 'NONE'
    """
    raw_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    canon_text = canonicalize_text(text)
    canon_hash = hashlib.sha256(canon_text.encode("utf-8")).hexdigest()
    
    all_records = []
    for rec in audit_ledger_engine.records.values():
        all_records.append({
            "source": "MEMORY_LEDGER",
            "record_id": rec.record_id,
            "asset_id": rec.resource_id,
            "asset_title": rec.resource_id,
            "seal_code": rec.tamper_evident_seal,
            "content": rec.content_payload,
            "content_hash": rec.current_version_hash,
            "approved_version": rec.approved_version,
            "timestamp_iso": rec.timestamp_iso,
            "is_superseded": rec.is_superseded,
            "superseded_by": rec.superseded_by_version,
            "is_revoked": rec.is_revoked,
            "revocation_reason": rec.revocation_reason,
            "brand_id": "aurelle-ai" if "aur" in rec.resource_id.lower() else "apex-dynamics"
        })
    if mongo_manager.is_connected and mongo_manager.db is not None:
        try:
            cursor = mongo_manager.db.release_ledger.find({}, {"_id": 0})
            docs = await cursor.to_list(length=100)
            for doc in docs:
                all_records.append({
                    "source": "MONGO_LEDGER",
                    "record_id": doc.get("release_id"),
                    "asset_id": doc.get("asset_id"),
                    "asset_title": doc.get("asset_title") or doc.get("asset_id"),
                    "seal_code": doc.get("audit_stamp") or doc.get("tamper_evident_seal"),
                    "content": doc.get("content", ""),
                    "content_hash": doc.get("content_hash"),
                    "approved_version": doc.get("approved_version", "v1.0"),
                    "timestamp_iso": doc.get("timestamp_iso"),
                    "is_superseded": doc.get("is_superseded", False),
                    "superseded_by": doc.get("superseded_by_version"),
                    "is_revoked": doc.get("is_revoked", False),
                    "revocation_reason": doc.get("revocation_reason"),
                    "brand_id": doc.get("brand_id", "")
                })
        except Exception:
            pass
    for r in mongo_manager._memory_releases:
        all_records.append({
            "source": "MEMORY_RELEASES",
            "record_id": r.get("release_id"),
            "asset_id": r.get("asset_id"),
            "asset_title": r.get("asset_title") or r.get("asset_id"),
            "seal_code": r.get("audit_stamp") or r.get("tamper_evident_seal"),
            "content": r.get("content", ""),
            "content_hash": r.get("content_hash"),
            "approved_version": r.get("approved_version", "v1.0"),
            "timestamp_iso": r.get("timestamp_iso"),
            "is_superseded": r.get("is_superseded", False),
            "superseded_by": r.get("superseded_by_version"),
            "is_revoked": r.get("is_revoked", False),
            "revocation_reason": r.get("revocation_reason"),
            "brand_id": r.get("brand_id", "")
        })

    # 1. Exact raw hash match
    for rec in all_records:
        if rec["content_hash"] == raw_hash:
            return rec, "EXACT_RAW_HASH"

    # 2. Canonical hash match
    for rec in all_records:
        rec_canon = canonicalize_text(rec["content"])
        rec_canon_hash = hashlib.sha256(rec_canon.encode("utf-8")).hexdigest()
        if rec_canon_hash == canon_hash or rec["content_hash"] == canon_hash:
            return rec, "CANONICAL_TEXT_HASH"

    # 3. Near match detection (text resembles an approved release but differs e.g. price altered)
    best_ratio = 0.0
    best_rec = None
    for rec in all_records:
        if rec.get("content"):
            ratio = difflib.SequenceMatcher(None, canon_text.lower(), canonicalize_text(rec["content"]).lower()).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_rec = rec

    if best_ratio >= 0.70 and best_rec is not None:
        return best_rec, "NEAR_MATCH_MODIFIED"

    return None, "NONE"

async def find_release_record_by_image_hash(image_hash: str) -> Optional[Dict[str, Any]]:
    clean_hash = image_hash.lower().strip()
    for rec in audit_ledger_engine.records.values():
        rec_hash = (rec.current_version_hash or "").lower()
        rec_payload = (rec.content_payload or "").lower()
        if rec_hash == clean_hash or rec_payload == clean_hash:
            return {
                "source": "MEMORY_LEDGER",
                "record_id": rec.record_id,
                "asset_id": rec.resource_id,
                "asset_title": rec.resource_id,
                "seal_code": rec.tamper_evident_seal,
                "content_hash": clean_hash,
                "approved_version": rec.approved_version,
                "timestamp_iso": rec.timestamp_iso,
                "is_superseded": rec.is_superseded,
                "superseded_by": rec.superseded_by_version,
                "is_revoked": rec.is_revoked,
                "revocation_reason": rec.revocation_reason,
                "brand_id": "aurelle-ai" if "aur" in rec.resource_id.lower() else "apex-dynamics"
            }
    if mongo_manager.is_connected and mongo_manager.db is not None:
        try:
            doc = await mongo_manager.db.release_ledger.find_one({
                "$or": [
                    {"content_hash": image_hash},
                    {"content": image_hash},
                    {"image_hash": image_hash}
                ]
            })
            if doc:
                return {
                    "source": "MONGO_LEDGER",
                    "record_id": doc.get("release_id"),
                    "asset_id": doc.get("asset_id"),
                    "asset_title": doc.get("asset_title") or doc.get("asset_id"),
                    "seal_code": doc.get("audit_stamp") or doc.get("tamper_evident_seal"),
                    "content_hash": clean_hash,
                    "approved_version": doc.get("approved_version", "v1.0"),
                    "timestamp_iso": doc.get("timestamp_iso"),
                    "is_superseded": doc.get("is_superseded", False),
                    "superseded_by": doc.get("superseded_by_version"),
                    "is_revoked": doc.get("is_revoked", False),
                    "revocation_reason": doc.get("revocation_reason"),
                    "brand_id": doc.get("brand_id", "")
                }
        except Exception:
            pass
    for r in mongo_manager._memory_releases:
        r_hash = (r.get("content_hash") or "").lower()
        r_payload = (r.get("content") or "").lower()
        if r_hash == clean_hash or r_payload == clean_hash:
            return {
                "source": "MEMORY_RELEASES",
                "record_id": r.get("release_id"),
                "asset_id": r.get("asset_id"),
                "asset_title": r.get("asset_title") or r.get("asset_id"),
                "seal_code": r.get("audit_stamp") or r.get("tamper_evident_seal"),
                "content_hash": clean_hash,
                "approved_version": r.get("approved_version", "v1.0"),
                "timestamp_iso": r.get("timestamp_iso"),
                "is_superseded": r.get("is_superseded", False),
                "superseded_by": r.get("superseded_by_version"),
                "is_revoked": r.get("is_revoked", False),
                "revocation_reason": r.get("revocation_reason"),
                "brand_id": r.get("brand_id", "")
            }
    return None


@router.post("/public/verify-seal", response_model=PublicVerificationResponse)
async def verify_public_seal(req: VerifySealRequest):
    """
    Public zero-auth cryptographic verification of brand release seals.
    Distinguishes: APPROVED, OUTDATED, MODIFIED, and UNKNOWN.
    """
    ensure_baseline_ledger()
    seal_code = (req.seal_code or "").strip()
    if not seal_code:
        raise HTTPException(status_code=400, detail="Seal code cannot be empty.")
    if len(seal_code) > 128:
        raise HTTPException(status_code=400, detail="Seal code exceeds maximum permitted length of 128 characters.")
    if req.content_text and len(req.content_text) > 100000:
        raise HTTPException(status_code=413, detail=f"Content text length ({len(req.content_text)}) exceeds 100,000 characters limit.")

    computed_hash = hashlib.sha256((req.content_text or seal_code).encode("utf-8")).hexdigest()

    rec = await find_release_record_by_seal(seal_code)
    if not rec:
        return PublicVerificationResponse(
            status=PublicVerificationStatus.UNKNOWN,
            is_authentic=False,
            ledger_state="UNKNOWN_RECORD",
            seal_code=seal_code,
            brand_name=resolve_public_brand_name(req.brand_id),
            computed_hash=computed_hash,
            recorded_hash=None,
            verification_method="SEAL_LEDGER_LOOKUP",
            explanation=f"Unknown Record: No cryptographic seal or approved release ledger record matches seal code '{seal_code}'."
        )

    brand_name = resolve_public_brand_name(req.brand_id or rec.get("brand_id"))
    recorded_hash = rec.get("content_hash")

    # If content text is provided, verify whether it matches the approved record's content
    if req.content_text:
        content_canon = canonicalize_text(req.content_text)
        content_canon_hash = hashlib.sha256(content_canon.encode("utf-8")).hexdigest()
        rec_content_canon = canonicalize_text(rec.get("content", ""))
        rec_canon_hash = hashlib.sha256(rec_content_canon.encode("utf-8")).hexdigest()

        if computed_hash != recorded_hash and content_canon_hash != rec_canon_hash and content_canon_hash != recorded_hash:
            return PublicVerificationResponse(
                status=PublicVerificationStatus.MODIFIED,
                is_authentic=False,
                ledger_state="MODIFIED_AFTER_APPROVAL",
                seal_code=rec.get("seal_code"),
                brand_name=brand_name,
                asset_title=rec.get("asset_title"),
                approved_version=rec.get("approved_version"),
                sealed_date=rec.get("timestamp_iso"),
                computed_hash=computed_hash,
                recorded_hash=recorded_hash,
                verification_method="SEAL_CONTENT_HASH_CHECK",
                explanation="Modified After Approval: Cryptographic hash mismatch! Content has been altered since formal approval."
            )

    # Check revoked
    if rec.get("is_revoked"):
        return PublicVerificationResponse(
            status=PublicVerificationStatus.OUTDATED,
            is_authentic=False,
            ledger_state="REVOKED",
            seal_code=rec.get("seal_code"),
            brand_name=brand_name,
            asset_title=rec.get("asset_title"),
            approved_version=rec.get("approved_version"),
            sealed_date=rec.get("timestamp_iso"),
            computed_hash=computed_hash,
            recorded_hash=recorded_hash,
            verification_method="SEAL_LEDGER_LOOKUP",
            explanation="Outdated (Revoked): This release was officially revoked by enterprise compliance."
        )

    # Check superseded
    if rec.get("is_superseded"):
        return PublicVerificationResponse(
            status=PublicVerificationStatus.OUTDATED,
            is_authentic=False,
            ledger_state="SUPERSEDED",
            seal_code=rec.get("seal_code"),
            brand_name=brand_name,
            asset_title=rec.get("asset_title"),
            approved_version=rec.get("approved_version"),
            sealed_date=rec.get("timestamp_iso"),
            computed_hash=computed_hash,
            recorded_hash=recorded_hash,
            verification_method="SEAL_LEDGER_LOOKUP",
            explanation=f"Outdated (Superseded): Version {rec.get('approved_version', 'v1.0')} has been superseded by newer approved release {rec.get('superseded_by', 'v2.0')}."
        )

    # Valid unchanged
    return PublicVerificationResponse(
        status=PublicVerificationStatus.APPROVED,
        is_authentic=True,
        ledger_state="VALID_UNCHANGED",
        seal_code=rec.get("seal_code"),
        brand_name=brand_name,
        asset_title=rec.get("asset_title"),
        approved_version=rec.get("approved_version"),
        sealed_date=rec.get("timestamp_iso"),
        computed_hash=recorded_hash or computed_hash,
        recorded_hash=recorded_hash,
        verification_method="SEAL_LEDGER_LOOKUP",
        explanation="Approved & Authentic: Cryptographic seal verified against immutable SHA-256 release ledger."
    )


@router.post("/public/verify-text", response_model=PublicVerificationResponse)
async def verify_public_text(req: VerifyTextRequest):
    """
    Public zero-auth cryptographic verification of marketing/brand text.
    Canonically normalizes quotes & whitespace, then matches against release ledger.
    """
    ensure_baseline_ledger()
    content = (req.content_text or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content text cannot be empty.")
    if len(content) > 100000:
        raise HTTPException(status_code=413, detail=f"Content text length ({len(content)}) exceeds 100,000 characters limit.")

    computed_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
    rec, match_type = await find_release_record_by_text(content)

    if not rec or match_type == "NONE":
        return PublicVerificationResponse(
            status=PublicVerificationStatus.UNKNOWN,
            is_authentic=False,
            ledger_state="UNKNOWN_RECORD",
            seal_code=None,
            brand_name=resolve_public_brand_name(req.brand_id),
            computed_hash=computed_hash,
            recorded_hash=None,
            verification_method="LEDGER_SHA256_SCAN",
            explanation="Unknown Record: No cryptographic seal or approved release ledger record matches this content."
        )

    brand_name = resolve_public_brand_name(req.brand_id or rec.get("brand_id"))
    recorded_hash = rec.get("content_hash")

    if match_type == "NEAR_MATCH_MODIFIED":
        return PublicVerificationResponse(
            status=PublicVerificationStatus.MODIFIED,
            is_authentic=False,
            ledger_state="MODIFIED_AFTER_APPROVAL",
            seal_code=rec.get("seal_code"),
            brand_name=brand_name,
            asset_title=rec.get("asset_title"),
            approved_version=rec.get("approved_version"),
            sealed_date=rec.get("timestamp_iso"),
            computed_hash=computed_hash,
            recorded_hash=recorded_hash,
            verification_method="CANONICAL_SIMILARITY_CHECK",
            explanation="Modified After Approval: Content closely resembles approved release, but cryptographic hash mismatch indicates post-approval alteration."
        )

    if rec.get("is_revoked"):
        return PublicVerificationResponse(
            status=PublicVerificationStatus.OUTDATED,
            is_authentic=False,
            ledger_state="REVOKED",
            seal_code=rec.get("seal_code"),
            brand_name=brand_name,
            asset_title=rec.get("asset_title"),
            approved_version=rec.get("approved_version"),
            sealed_date=rec.get("timestamp_iso"),
            computed_hash=computed_hash,
            recorded_hash=recorded_hash,
            verification_method=match_type,
            explanation="Outdated (Revoked): This release was officially revoked by enterprise compliance."
        )

    if rec.get("is_superseded"):
        return PublicVerificationResponse(
            status=PublicVerificationStatus.OUTDATED,
            is_authentic=False,
            ledger_state="SUPERSEDED",
            seal_code=rec.get("seal_code"),
            brand_name=brand_name,
            asset_title=rec.get("asset_title"),
            approved_version=rec.get("approved_version"),
            sealed_date=rec.get("timestamp_iso"),
            computed_hash=computed_hash,
            recorded_hash=recorded_hash,
            verification_method=match_type,
            explanation=f"Outdated (Superseded): Version {rec.get('approved_version', 'v1.0')} has been superseded by newer approved release {rec.get('superseded_by', 'v2.0')}."
        )

    return PublicVerificationResponse(
        status=PublicVerificationStatus.APPROVED,
        is_authentic=True,
        ledger_state="VALID_UNCHANGED",
        seal_code=rec.get("seal_code"),
        brand_name=brand_name,
        asset_title=rec.get("asset_title"),
        approved_version=rec.get("approved_version"),
        sealed_date=rec.get("timestamp_iso"),
        computed_hash=recorded_hash or computed_hash,
        recorded_hash=recorded_hash,
        verification_method=match_type,
        explanation="Approved & Authentic: Exact cryptographic match verified against immutable release ledger."
    )


@router.post("/public/verify-image", response_model=PublicVerificationResponse)
async def verify_public_image(
    file: UploadFile = File(...),
    brand_id: Optional[str] = Form(None),
    seal_code: Optional[str] = Form(None)
):
    """
    Public zero-auth cryptographic verification of marketing/brand images.
    Performs byte-level SHA-256 matching against signed release records.
    Distinguishes exact hash matching from visual/heuristic inspection.
    """
    ensure_baseline_ledger()
    content_bytes = await file.read()
    filename = file.filename or "image.png"

    clean_filename = validate_image_file_bytes(filename, content_bytes)
    image_hash = hashlib.sha256(content_bytes).hexdigest()
    brand_name = resolve_public_brand_name(brand_id)

    # If seal_code was provided, verify against that seal
    if seal_code and seal_code.strip():
        rec = await find_release_record_by_seal(seal_code.strip())
        if rec:
            recorded_hash = rec.get("content_hash")
            rec_content = rec.get("content")
            clean_image_hash = image_hash.lower()
            if clean_image_hash != (recorded_hash or "").lower() and clean_image_hash != (rec_content or "").lower():
                return PublicVerificationResponse(
                    status=PublicVerificationStatus.MODIFIED,
                    is_authentic=False,
                    ledger_state="MODIFIED_AFTER_APPROVAL",
                    seal_code=rec.get("seal_code"),
                    brand_name=resolve_public_brand_name(brand_id or rec.get("brand_id")),
                    asset_title=rec.get("asset_title"),
                    approved_version=rec.get("approved_version"),
                    sealed_date=rec.get("timestamp_iso"),
                    computed_hash=image_hash,
                    recorded_hash=recorded_hash,
                    verification_method="SEAL_HASH_MISMATCH",
                    explanation="Modified After Approval: Image byte hash does not match the cryptographic seal record. Image has been altered or replaced.",
                    disclaimer="Cryptographic release verification requires an exact byte-level SHA-256 ledger match."
                )
            if rec.get("is_revoked"):
                return PublicVerificationResponse(
                    status=PublicVerificationStatus.OUTDATED,
                    is_authentic=False,
                    ledger_state="REVOKED",
                    seal_code=rec.get("seal_code"),
                    brand_name=resolve_public_brand_name(brand_id or rec.get("brand_id")),
                    asset_title=rec.get("asset_title"),
                    approved_version=rec.get("approved_version"),
                    sealed_date=rec.get("timestamp_iso"),
                    computed_hash=image_hash,
                    recorded_hash=recorded_hash,
                    verification_method="EXACT_SHA256_FILE_HASH",
                    explanation="Outdated (Revoked): This visual release was officially revoked by enterprise compliance.",
                    disclaimer="Cryptographic release verification requires an exact byte-level SHA-256 ledger match."
                )
            if rec.get("is_superseded"):
                return PublicVerificationResponse(
                    status=PublicVerificationStatus.OUTDATED,
                    is_authentic=False,
                    ledger_state="SUPERSEDED",
                    seal_code=rec.get("seal_code"),
                    brand_name=resolve_public_brand_name(brand_id or rec.get("brand_id")),
                    asset_title=rec.get("asset_title"),
                    approved_version=rec.get("approved_version"),
                    sealed_date=rec.get("timestamp_iso"),
                    computed_hash=image_hash,
                    recorded_hash=recorded_hash,
                    verification_method="EXACT_SHA256_FILE_HASH",
                    explanation=f"Outdated (Superseded): Visual release {rec.get('approved_version', 'v1.0')} has been superseded by an updated version.",
                    disclaimer="Cryptographic release verification requires an exact byte-level SHA-256 ledger match."
                )
            return PublicVerificationResponse(
                status=PublicVerificationStatus.APPROVED,
                is_authentic=True,
                ledger_state="VALID_UNCHANGED",
                seal_code=rec.get("seal_code"),
                brand_name=resolve_public_brand_name(brand_id or rec.get("brand_id")),
                asset_title=rec.get("asset_title"),
                approved_version=rec.get("approved_version"),
                sealed_date=rec.get("timestamp_iso"),
                computed_hash=image_hash,
                recorded_hash=recorded_hash,
                verification_method="EXACT_SHA256_FILE_HASH",
                explanation="Approved & Authentic: Image matches immutable SHA-256 ledger record under seal.",
                disclaimer="Verified by cryptographic byte-level SHA-256 matching."
            )

    # Look up by exact image hash
    rec = await find_release_record_by_image_hash(image_hash)
    if rec:
        brand_name = resolve_public_brand_name(brand_id or rec.get("brand_id"))
        recorded_hash = rec.get("content_hash")
        if rec.get("is_revoked"):
            return PublicVerificationResponse(
                status=PublicVerificationStatus.OUTDATED,
                is_authentic=False,
                ledger_state="REVOKED",
                seal_code=rec.get("seal_code"),
                brand_name=brand_name,
                asset_title=rec.get("asset_title"),
                approved_version=rec.get("approved_version"),
                sealed_date=rec.get("timestamp_iso"),
                computed_hash=image_hash,
                recorded_hash=recorded_hash,
                verification_method="EXACT_SHA256_FILE_HASH",
                explanation="Outdated (Revoked): This visual release was officially revoked by enterprise compliance.",
                disclaimer="Cryptographic release verification requires an exact byte-level SHA-256 ledger match."
            )
        if rec.get("is_superseded"):
            return PublicVerificationResponse(
                status=PublicVerificationStatus.OUTDATED,
                is_authentic=False,
                ledger_state="SUPERSEDED",
                seal_code=rec.get("seal_code"),
                brand_name=brand_name,
                asset_title=rec.get("asset_title"),
                approved_version=rec.get("approved_version"),
                sealed_date=rec.get("timestamp_iso"),
                computed_hash=image_hash,
                recorded_hash=recorded_hash,
                verification_method="EXACT_SHA256_FILE_HASH",
                explanation=f"Outdated (Superseded): Visual release {rec.get('approved_version', 'v1.0')} has been superseded by an updated version.",
                disclaimer="Cryptographic release verification requires an exact byte-level SHA-256 ledger match."
            )
        return PublicVerificationResponse(
            status=PublicVerificationStatus.APPROVED,
            is_authentic=True,
            ledger_state="VALID_UNCHANGED",
            seal_code=rec.get("seal_code"),
            brand_name=brand_name,
            asset_title=rec.get("asset_title"),
            approved_version=rec.get("approved_version"),
            sealed_date=rec.get("timestamp_iso"),
            computed_hash=image_hash,
            recorded_hash=recorded_hash,
            verification_method="EXACT_SHA256_FILE_HASH",
            explanation="Approved & Authentic: Exact byte-level image hash matches signed release record.",
            disclaimer="Verified by cryptographic byte-level SHA-256 matching."
        )

    # Heuristic fallback (visual inspection)
    try:
        from brandtrace.engine.multimodal import multimodal_engine
        findings, palette, access = multimodal_engine.analyze_image_bytes(content_bytes, asset_name=clean_filename)
        visual_note = f"Visual analysis detected {len(palette)} dominant colors, dimensions {access.get('dimensions', 'N/A')}."
    except Exception:
        visual_note = "Visual inspection completed."

    return PublicVerificationResponse(
        status=PublicVerificationStatus.UNKNOWN,
        is_authentic=False,
        ledger_state="UNKNOWN_RECORD",
        seal_code=None,
        brand_name=brand_name,
        asset_title=clean_filename,
        computed_hash=image_hash,
        recorded_hash=None,
        verification_method="VISUAL_INSPECTION_NO_HASH_MATCH",
        explanation=f"Unknown Record: No cryptographic seal or approved release ledger record matches this image's SHA-256 hash ({image_hash[:16]}...). {visual_note}",
        disclaimer="Never claim that OCR or visual similarity alone proves image authenticity. Cryptographic authenticity requires exact ledger hash match."
    )
