from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# ==============================================================================
# DRAFT MODELS
# ==============================================================================

class DraftCreateRequest(BaseModel):
    brand_id: str = "aurelle-tech"
    title: str = "Untitled Draft"
    content: str = ""
    channel: str = "instagram"
    key_phrases: Optional[str] = ""
    call_to_action: Optional[str] = ""

class DraftUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    channel: Optional[str] = None
    key_phrases: Optional[str] = None
    call_to_action: Optional[str] = None
    version: Optional[int] = None
    last_analysis: Optional[Dict[str, Any]] = None

class DraftResponse(BaseModel):
    draft_id: str
    user_id: str
    author_name: str
    brand_id: str
    title: str
    content: str
    channel: str
    key_phrases: str
    call_to_action: str
    version: int
    created_at: int
    updated_at: int
    is_submitted: bool = False

class DraftVersionRequest(BaseModel):
    content: str
    reason: Optional[str] = ""
    hash: Optional[str] = None

class DraftVersionResponse(BaseModel):
    version_id: str
    draft_id: str
    version_number: int
    content: str
    saved_by: str
    reason: str
    content_hash: str
    created_at: int

# ==============================================================================
# SUBMISSION & FINDINGS MODELS
# ==============================================================================

class FindingModel(BaseModel):
    id: str = "f-1"
    number: int = 1
    sentence_text: str = ""
    flagged_text: str = ""
    category: str = "Brand Rules"
    severity: str = "BLOCKING"  # BLOCKING, MAJOR, MINOR, NEEDS_HUMAN, ADVISORY
    rule_id: str
    rule_title: str = ""
    explanation: str = ""
    suggested_fix: str = ""
    suggested_sentence: Optional[str] = ""
    evidence_ref: Optional[str] = None
    needs_human_review: bool = False
    decision: str = "UNDECIDED"  # UNDECIDED, UPHELD, OVERRULED
    overrule_reason: Optional[str] = None
    resolved: bool = False
    start_char: Optional[int] = None
    end_char: Optional[int] = None

class ApprovalStepModel(BaseModel):
    stage: str  # CREATOR_SUBMISSION, REVIEWER_APPROVAL, COMPLIANCE_APPROVAL, FINAL_RELEASE
    label: str
    user: str
    role: str
    status: str  # COMPLETED, ACTIVE, PENDING, REJECTED
    timestamp: Optional[str] = None
    comments: Optional[str] = None

class SubmissionCreateRequest(BaseModel):
    submission_id: Optional[str] = None
    brand_id: str = "aurelle-tech"
    brand_name: str = "Aurelle Skin"
    title: str
    channel: str = "instagram"
    creator_id: str = "creator-asha"
    creator_name: str = "Creator Asha"
    creator_type: str = "creator"  # "creator" | "agency"
    org_id: str = "ORG-AURELLE"
    analysis_id: Optional[str] = None
    version: int = 1
    original_content: str
    current_content: str
    findings: List[FindingModel] = Field(default_factory=list)
    key_phrases: Optional[str] = ""
    call_to_action: Optional[str] = ""
    submission_notes: Optional[str] = ""

class SubmissionResponse(BaseModel):
    id: Optional[str] = None
    submission_id: str
    task_id: Optional[str] = None
    brand_id: str
    brand_name: str
    title: str
    channel: str
    creator_id: str
    creator_name: str
    creator_type: str = "creator"  # "creator" | "agency"
    org_id: str = "ORG-AURELLE"
    analysis_id: Optional[str] = None
    version: int
    original_content: str
    current_content: str
    findings: List[FindingModel]
    status: str  # DRAFT, PENDING_REVIEW, CHANGES_REQUESTED, REVIEW_APPROVED, COMPLIANCE_APPROVED, APPROVED, REJECTED
    submitted_at: str
    updated_at: str
    reviewer_feedback: Optional[str] = None
    compliance_notes: Optional[str] = None
    evidence_requested_notes: Optional[str] = None
    brand_owner_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    approval_history: List[ApprovalStepModel]
    release_id: Optional[str] = None
    release_seal: Optional[str] = None
    release_digest: Optional[str] = None
    released_at: Optional[str] = None

class AgencyDecisionRequest(BaseModel):
    decision: str = "APPROVE"  # APPROVE, FORWARD, REQUEST_CHANGES, REJECT
    agency_name: str = "Agency Sana"
    agency_role: str = "AGENCY"
    feedback: Optional[str] = None

class ReviewDecisionRequest(BaseModel):
    decision: str  # APPROVE, REQUEST_CHANGES, REJECT
    reviewer_name: str = "Reviewer Meera"
    reviewer_role: str = "REVIEWER"
    feedback: Optional[str] = None
    finding_decisions: Optional[Dict[str, Any]] = None

class ComplianceDecisionRequest(BaseModel):
    decision: str  # APPROVE, APPROVE_COMPLIANCE, REQUEST_EVIDENCE, REQUEST_CHANGES, RETURN_FOR_REVISION, REJECT
    compliance_name: str = "Compliance Arjun"
    compliance_role: str = "COMPLIANCE"
    notes: Optional[str] = None
    requested_evidence: Optional[str] = None
    finding_decisions: Optional[Dict[str, Any]] = None

class FinalApprovalRequest(BaseModel):
    decision: str = "FINAL_APPROVE"  # FINAL_APPROVE, APPROVE, REQUEST_CHANGES, REJECT
    approver_name: str = "Brand Owner Kabir"
    approver_role: str = "BRAND_OWNER"
    notes: Optional[str] = None
    reason: Optional[str] = None

class PublishRequest(BaseModel):
    platform: str = "instagram"
    destination_account: str
    authorized_integration: bool = False
    oauth_token: Optional[str] = None

class PublishResponse(BaseModel):
    status: str  # PUBLISHED, RESTRICTED, ERROR
    published_url: Optional[str] = None
    message: str
    release_id: Optional[str] = None

class AuditRecordRequest(BaseModel):
    what: str
    reason: Optional[str] = ""
    hash: str
    who: Optional[str] = None

class AuditEventResponse(BaseModel):
    id: str
    when: str
    who: str
    what: str
    reason: str
    hash: str
    action_type: Optional[str] = None
    resource_id: Optional[str] = None
    actor_id: Optional[str] = None
    org_id: Optional[str] = None
    timestamp: Optional[int] = None
