"""
BrandTrace AI — Public Verification Models
Safe public-facing schemas with zero confidential tenant or audit leakage.
"""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class PublicVerificationStatus(str, Enum):
    APPROVED = "APPROVED"
    OUTDATED = "OUTDATED"
    MODIFIED = "MODIFIED"
    UNKNOWN = "UNKNOWN"

class VerifySealRequest(BaseModel):
    seal_code: str = Field(..., min_length=1, description="Cryptographic seal code e.g. BT-SEAL-...")
    brand_id: Optional[str] = Field(None, description="Optional public brand identifier")
    content_text: Optional[str] = Field(None, description="Optional content text to verify against seal")

class VerifyTextRequest(BaseModel):
    content_text: str = Field(..., min_length=1, description="Pasted marketing or public content text")
    brand_id: Optional[str] = Field(None, description="Optional public brand identifier")

class PublicVerificationResponse(BaseModel):
    status: PublicVerificationStatus
    is_authentic: bool
    ledger_state: str  # VALID_UNCHANGED, SUPERSEDED, REVOKED, MODIFIED_AFTER_APPROVAL, UNKNOWN_RECORD
    seal_code: Optional[str] = None
    brand_name: Optional[str] = None
    asset_title: Optional[str] = None
    approved_version: Optional[str] = None
    sealed_date: Optional[str] = None
    computed_hash: str
    recorded_hash: Optional[str] = None
    verification_method: str
    explanation: str
    disclaimer: Optional[str] = None
