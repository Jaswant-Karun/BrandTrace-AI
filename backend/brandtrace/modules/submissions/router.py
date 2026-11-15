from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from brandtrace.modules.auth.router import get_current_user
from brandtrace.modules.auth.models import UserProfile
from brandtrace.modules.submissions.models import (
    DraftCreateRequest, DraftUpdateRequest, DraftResponse,
    DraftVersionRequest, DraftVersionResponse,
    SubmissionCreateRequest, SubmissionResponse,
    AgencyDecisionRequest, ReviewDecisionRequest, ComplianceDecisionRequest, FinalApprovalRequest,
    PublishRequest, PublishResponse,
    AuditRecordRequest, AuditEventResponse
)
from brandtrace.modules.submissions.service import submissions_service

router = APIRouter(tags=["Submissions & Workflow Lifecycle"])

# ==============================================================================
# 1. DRAFTS API
# ==============================================================================

@router.post("/drafts", response_model=DraftResponse)
async def create_draft(req: DraftCreateRequest, user: UserProfile = Depends(get_current_user)):
    """Saves or creates a draft copy in the user's workspace."""
    draft = await submissions_service.create_or_save_draft(
        user_id=user.user_id,
        author_name=user.name,
        req=req
    )
    return draft

@router.get("/drafts", response_model=List[DraftResponse])
async def list_drafts(
    brand_id: Optional[str] = Query(None),
    user: UserProfile = Depends(get_current_user)
):
    """Retrieves all drafts belonging to the authenticated user."""
    return await submissions_service.list_drafts(user_id=user.user_id, brand_id=brand_id)

@router.get("/drafts/{draft_id}", response_model=DraftResponse)
async def get_draft(draft_id: str, user: UserProfile = Depends(get_current_user)):
    """Fetches a specific draft by ID."""
    draft = await submissions_service.get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft

@router.put("/drafts/{draft_id}", response_model=DraftResponse)
async def update_draft(draft_id: str, req: DraftUpdateRequest, user: UserProfile = Depends(get_current_user)):
    """Updates an existing draft."""
    draft = await submissions_service.update_draft(draft_id, req)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft

@router.post("/drafts/{draft_id}/version", response_model=DraftVersionResponse)
async def save_draft_version(
    draft_id: str,
    req: DraftVersionRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Saves an immutable historical version snapshot of the draft."""
    return await submissions_service.save_draft_version(
        draft_id=draft_id,
        content=req.content,
        reason=req.reason or "Private draft revision saved",
        saved_by=user.name,
        custom_hash=req.hash
    )

@router.get("/drafts/{draft_id}/versions", response_model=List[DraftVersionResponse])
async def list_draft_versions(draft_id: str, user: UserProfile = Depends(get_current_user)):
    """Lists all historical snapshots of a draft."""
    return await submissions_service.get_draft_versions(draft_id)

# ==============================================================================
# 2. SUBMISSIONS API
# ==============================================================================

@router.post("/submissions", response_model=SubmissionResponse)
async def create_submission(req: SubmissionCreateRequest, user: UserProfile = Depends(get_current_user)):
    """Submits draft marketing content into the Reviewer Queue."""
    if not req.original_content.strip():
        raise HTTPException(status_code=400, detail="Cannot submit empty content")
    return await submissions_service.create_submission(req)

@router.get("/submissions", response_model=List[SubmissionResponse])
async def list_submissions(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    brand_id: Optional[str] = Query(None),
    creator_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user: UserProfile = Depends(get_current_user)
):
    """Lists submissions filtered by user role, brand, or review state with pagination."""
    active_creator_id = creator_id
    return await submissions_service.list_submissions(
        creator_id=active_creator_id,
        role=role,
        status=status,
        brand_id=brand_id,
        skip=skip,
        limit=limit
    )

@router.get("/submissions/queue", response_model=List[SubmissionResponse])
async def get_reviewer_queue(
    brand_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user: UserProfile = Depends(get_current_user)
):
    """Retrieves submissions queue filtered by role (reviewer vs compliance vs brand-owner) with pagination."""
    return await submissions_service.list_submissions(
        brand_id=brand_id,
        role=role,
        skip=skip,
        limit=limit
    )

@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(submission_id: str, user: UserProfile = Depends(get_current_user)):
    """Retrieves full details, finding-by-finding status, and approval history for a submission."""
    sub = await submissions_service.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

@router.post("/submissions/{submission_id}/agency-review", response_model=SubmissionResponse)
async def agency_review_submission(
    submission_id: str,
    req: AgencyDecisionRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Agency quality check: forwards approved content to reviewer or requests revisions from creator."""
    if user and getattr(user, "role", None):
        user_role_str = (user.role.value if hasattr(user.role, "value") else str(user.role)).upper()
        if user_role_str in ["CREATOR"] and "agency" not in getattr(user, "name", "").lower():
            raise HTTPException(status_code=403, detail="Standard creators cannot record agency quality review decisions.")

    sub = await submissions_service.record_agency_decision(
        submission_id=submission_id,
        decision=req.decision,
        agency_name=req.agency_name or user.name,
        feedback=req.feedback
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

@router.post("/submissions/{submission_id}/review", response_model=SubmissionResponse)
async def review_submission(
    submission_id: str,
    req: ReviewDecisionRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Reviewer decision: upholds/overrules findings and marks APPROVE, REQUEST_CHANGES, or REJECT."""
    if user and getattr(user, "role", None):
        user_role_str = (user.role.value if hasattr(user.role, "value") else str(user.role)).upper()
        if user_role_str in ["CREATOR"]:
            raise HTTPException(status_code=403, detail="Creators are not authorized to record review decisions.")

    sub = await submissions_service.record_reviewer_decision(
        submission_id=submission_id,
        decision=req.decision,
        reviewer_name=req.reviewer_name or user.name,
        feedback=req.feedback,
        finding_decisions=req.finding_decisions
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

@router.post("/submissions/{submission_id}/compliance", response_model=SubmissionResponse)
async def compliance_submission(
    submission_id: str,
    req: ComplianceDecisionRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Compliance officer decision: checks statutory findings, requests evidence, or signs off."""
    if user and getattr(user, "role", None):
        user_role_str = (user.role.value if hasattr(user.role, "value") else str(user.role)).upper()
        if user_role_str in ["CREATOR"]:
            raise HTTPException(status_code=403, detail="Creators are not authorized to record compliance decisions.")
        if user_role_str in ["REVIEWER"]:
            raise HTTPException(status_code=403, detail="Reviewers are not authorized to sign off on statutory compliance.")

    sub = await submissions_service.record_compliance_decision(
        submission_id=submission_id,
        decision=req.decision,
        compliance_name=req.compliance_name or user.name,
        notes=req.notes,
        finding_decisions=req.finding_decisions,
        requested_evidence=req.requested_evidence
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

@router.post("/submissions/{submission_id}/final-approval", response_model=SubmissionResponse)
async def final_approval_submission(
    submission_id: str,
    req: FinalApprovalRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Brand Owner decision: verifies Reviewer & Compliance stages, issues unique Release ID and immutable release record."""
    if user and getattr(user, "role", None):
        user_role_str = (user.role.value if hasattr(user.role, "value") else str(user.role)).upper()
        if user_role_str in ["CREATOR"]:
            raise HTTPException(status_code=403, detail="Creators are not authorized to grant final brand release.")
        if user_role_str in ["REVIEWER"]:
            raise HTTPException(status_code=403, detail="Reviewers are not authorized to grant final brand release.")
        if user_role_str in ["COMPLIANCE"]:
            raise HTTPException(status_code=403, detail="Compliance officers are not authorized to grant final brand release.")

    try:
        sub = await submissions_service.record_final_approval(
            submission_id=submission_id,
            decision=req.decision,
            approver_name=req.approver_name or user.name,
            notes=req.notes,
            reason=req.reason
        )
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))

    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

@router.post("/submissions/{submission_id}/publish", response_model=PublishResponse)
async def publish_submission_route(
    submission_id: str,
    req: PublishRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Restricted publishing gateway: strictly gates external publishing to authorized and configured integrations."""
    try:
        res = await submissions_service.publish_submission(
            submission_id=submission_id,
            platform=req.platform,
            destination_account=req.destination_account,
            authorized_integration=req.authorized_integration,
            oauth_token=req.oauth_token
        )
        return PublishResponse(**res)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))

# ==============================================================================
# 3. AUDIT LOG API
# ==============================================================================

@router.get("/audit/events", response_model=List[AuditEventResponse])
async def list_audit_events(limit: int = Query(50)):
    """Lists chronological audit log events with tamper-evident cryptographic hashes."""
    return await submissions_service.list_audit_events(limit=limit)

@router.post("/audit/record", response_model=AuditEventResponse)
async def record_audit_event(
    req: AuditRecordRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Records an explicit audit event into the ledger."""
    return await submissions_service.record_audit_event(
        what=req.what,
        reason=req.reason,
        actor_name=req.who or user.name,
        event_hash=req.hash
    )

# ==============================================================================
# 4. NOTIFICATIONS API
# ==============================================================================

@router.get("/notifications")
async def list_notifications(role: Optional[str] = Query(None)):
    """Retrieves notifications for the current role."""
    return submissions_service.list_notifications(role=role)
