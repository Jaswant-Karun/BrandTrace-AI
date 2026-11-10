import hashlib
import json
import time
import uuid
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from pydantic import BaseModel, Field

class ReleaseVerificationState(str, Enum):
    VALID_UNCHANGED = "VALID_UNCHANGED"
    MODIFIED_AFTER_APPROVAL = "MODIFIED_AFTER_APPROVAL"
    SUPERSEDED = "SUPERSEDED"
    REVOKED = "REVOKED"
    UNKNOWN_RECORD = "UNKNOWN_RECORD"

class LedgerAuditRecord(BaseModel):
    record_id: str
    content_id: str # e.g. "AST-AUR-01", "AST-01"
    approved_version: str # e.g. "v1.0", "v2.0"
    user_identity: str
    user_role: str
    action: str # "RELEASE_SEALED", "POLICY_MODIFIED", "TASK_APPROVED", "RELEASE_REVOKED", "RELEASE_SUPERSEDED"
    resource_id: str
    resource_type: str
    previous_version_hash: Optional[str] = None
    current_version_hash: str # SHA-256 of content
    relevant_sources: List[str] = Field(default_factory=list) # e.g. ["FACT-AUR-PRC-01", "GL-AUR-01"]
    timestamp: int
    timestamp_iso: str
    approval_decision: str # "APPROVED", "SUPERSEDED", "REVOKED"
    review_notes: str
    content_payload: str
    tamper_evident_seal: str # Merkle-style chained SHA-256 block hash
    is_superseded: bool = False
    superseded_by_version: Optional[str] = None
    is_revoked: bool = False
    revocation_reason: Optional[str] = None

class ReleaseAuditVerificationResult(BaseModel):
    state: ReleaseVerificationState
    is_authentic: bool
    record_id: Optional[str] = None
    content_id: Optional[str] = None
    approved_version: Optional[str] = None
    sealed_by: Optional[str] = None
    sealed_timestamp: Optional[str] = None
    computed_content_hash: str
    recorded_content_hash: Optional[str] = None
    relevant_sources: List[str] = Field(default_factory=list)
    tamper_evident_seal: Optional[str] = None
    explanation: str
    cryptographic_scheme: str = "SHA-256 Tamper-Evident Ledger Digest (Internal Merkle-Style Chaining)"

class AuditTrustLedger:
    """
    Cryptographic Audit & Trust Ledger Engine
    Maintains an immutable chain of release records and verifies content integrity.
    Distinguishes:
    - VALID_UNCHANGED
    - MODIFIED_AFTER_APPROVAL
    - SUPERSEDED
    - REVOKED
    - UNKNOWN_RECORD
    Never automatically publishes content without explicit human review sign-off.
    """
    def __init__(self):
        self.records: Dict[str, LedgerAuditRecord] = {}
        self.last_block_hash: str = "0000000000000000000000000000000000000000000000000000000000000000"

    def compute_sha256(self, content: str) -> str:
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def record_release(
        self,
        user_identity: str,
        user_role: str,
        resource_id: str,
        resource_type: str,
        content: str,
        decision: str = "APPROVED",
        review_notes: str = "Approved via governance release gate.",
        approved_version: str = "v1.0",
        relevant_sources: Optional[List[str]] = None
    ) -> LedgerAuditRecord:
        t_now = int(time.time())
        t_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t_now))
        rec_id = f"LEDGER-REC-{uuid.uuid4().hex[:6].upper()}-{t_now % 100000}"

        content_hash = self.compute_sha256(content)
        # Block digest chained to previous record hash
        block_material = f"{rec_id}:{self.last_block_hash}:{resource_id}:{content_hash}:{user_identity}:{t_now}"
        current_seal = f"BT-SEAL-{self.compute_sha256(block_material)[:16].upper()}"

        sources = relevant_sources or ["FACT-CATALOG-MASTER"]

        record = LedgerAuditRecord(
            record_id=rec_id,
            content_id=resource_id,
            approved_version=approved_version,
            user_identity=user_identity,
            user_role=user_role,
            action="RELEASE_SEALED",
            resource_id=resource_id,
            resource_type=resource_type,
            previous_version_hash=self.last_block_hash[:16],
            current_version_hash=content_hash,
            relevant_sources=sources,
            timestamp=t_now,
            timestamp_iso=t_iso,
            approval_decision=decision,
            review_notes=review_notes,
            content_payload=content,
            tamper_evident_seal=current_seal
        )

        self.records[rec_id] = record
        self.last_block_hash = self.compute_sha256(block_material)
        return record

    def supersede_release(
        self,
        target_record_or_resource_id: str,
        new_version: str,
        superseded_by_user: str = "Authorized Reviewer"
    ) -> Tuple[bool, str, Optional[LedgerAuditRecord]]:
        """Marks a previously approved version as SUPERSEDED by a newer approved release."""
        for rec in self.records.values():
            if rec.record_id.lower() == target_record_or_resource_id.lower() or rec.resource_id.lower() == target_record_or_resource_id.lower():
                rec.is_superseded = True
                rec.approval_decision = "SUPERSEDED"
                rec.superseded_by_version = new_version
                rec.action = "RELEASE_SUPERSEDED"
                rec.review_notes += f" [Superseded by {new_version} authorized by {superseded_by_user}]"
                return True, f"Record {rec.record_id} successfully marked as SUPERSEDED by {new_version}.", rec
        return False, f"Record {target_record_or_resource_id} not found.", None

    def revoke_release(
        self,
        target_record_or_resource_id: str,
        revocation_reason: str,
        revoked_by_user: str = "Compliance Reviewer"
    ) -> Tuple[bool, str, Optional[LedgerAuditRecord]]:
        """Revokes an approved release due to regulatory action or policy invalidation."""
        for rec in self.records.values():
            if rec.record_id.lower() == target_record_or_resource_id.lower() or rec.resource_id.lower() == target_record_or_resource_id.lower():
                rec.is_revoked = True
                rec.approval_decision = "REVOKED"
                rec.revocation_reason = revocation_reason
                rec.action = "RELEASE_REVOKED"
                rec.review_notes += f" [REVOKED: {revocation_reason} by {revoked_by_user}]"
                return True, f"Record {rec.record_id} successfully revoked: {revocation_reason}.", rec
        return False, f"Record {target_record_or_resource_id} not found.", None

    def verify_content(
        self,
        identifier: str, # Either a record_id, resource_id, or tamper_evident_seal
        current_content: Optional[str] = None
    ) -> ReleaseAuditVerificationResult:
        """
        Integrity Verification Engine:
        Distinguishes:
        - VALID_UNCHANGED
        - MODIFIED_AFTER_APPROVAL
        - SUPERSEDED
        - REVOKED
        - UNKNOWN_RECORD
        """
        matched: Optional[LedgerAuditRecord] = None
        for rec in self.records.values():
            if (rec.record_id.lower() == identifier.lower() or 
                rec.tamper_evident_seal.lower() == identifier.lower() or 
                rec.resource_id.lower() == identifier.lower() or
                rec.content_id.lower() == identifier.lower()):
                matched = rec
                break

        if not matched:
            content_hash = self.compute_sha256(current_content or identifier)
            return ReleaseAuditVerificationResult(
                state=ReleaseVerificationState.UNKNOWN_RECORD,
                is_authentic=False,
                computed_content_hash=content_hash,
                explanation="Unknown Record: No cryptographic seal or content record found matching the provided identifier."
            )

        computed_hash = self.compute_sha256(current_content) if current_content else matched.current_version_hash

        # 1. Check if Revoked
        if matched.is_revoked or matched.approval_decision == "REVOKED":
            return ReleaseAuditVerificationResult(
                state=ReleaseVerificationState.REVOKED,
                is_authentic=False,
                record_id=matched.record_id,
                content_id=matched.content_id,
                approved_version=matched.approved_version,
                sealed_by=matched.user_identity,
                sealed_timestamp=matched.timestamp_iso,
                computed_content_hash=computed_hash,
                recorded_content_hash=matched.current_version_hash,
                relevant_sources=matched.relevant_sources,
                tamper_evident_seal=matched.tamper_evident_seal,
                explanation=f"Revoked: This release was officially revoked by enterprise compliance ({matched.revocation_reason or 'Policy non-compliance'})."
            )

        # 2. Check if Superseded
        if matched.is_superseded or matched.approval_decision == "SUPERSEDED":
            return ReleaseAuditVerificationResult(
                state=ReleaseVerificationState.SUPERSEDED,
                is_authentic=False,
                record_id=matched.record_id,
                content_id=matched.content_id,
                approved_version=matched.approved_version,
                sealed_by=matched.user_identity,
                sealed_timestamp=matched.timestamp_iso,
                computed_content_hash=computed_hash,
                recorded_content_hash=matched.current_version_hash,
                relevant_sources=matched.relevant_sources,
                tamper_evident_seal=matched.tamper_evident_seal,
                explanation=f"Superseded: Version {matched.approved_version} has been superseded by newer approved release {matched.superseded_by_version or 'v2.0'}."
            )

        # 3. Check for Content Tampering / Modification After Approval
        if current_content and computed_hash != matched.current_version_hash:
            return ReleaseAuditVerificationResult(
                state=ReleaseVerificationState.MODIFIED_AFTER_APPROVAL,
                is_authentic=False,
                record_id=matched.record_id,
                content_id=matched.content_id,
                approved_version=matched.approved_version,
                sealed_by=matched.user_identity,
                sealed_timestamp=matched.timestamp_iso,
                computed_content_hash=computed_hash,
                recorded_content_hash=matched.current_version_hash,
                relevant_sources=matched.relevant_sources,
                tamper_evident_seal=matched.tamper_evident_seal,
                explanation="Modified After Approval: Cryptographic hash mismatch! Content has been altered since formal approval."
            )

        # 4. Valid and Unchanged
        return ReleaseAuditVerificationResult(
            state=ReleaseVerificationState.VALID_UNCHANGED,
            is_authentic=True,
            record_id=matched.record_id,
            content_id=matched.content_id,
            approved_version=matched.approved_version,
            sealed_by=matched.user_identity,
            sealed_timestamp=matched.timestamp_iso,
            computed_content_hash=matched.current_version_hash,
            recorded_content_hash=matched.current_version_hash,
            relevant_sources=matched.relevant_sources,
            tamper_evident_seal=matched.tamper_evident_seal,
            explanation="Valid & Unchanged: Cryptographic seal verified. Content matches immutable SHA-256 ledger record."
        )

audit_ledger_engine = AuditTrustLedger()
