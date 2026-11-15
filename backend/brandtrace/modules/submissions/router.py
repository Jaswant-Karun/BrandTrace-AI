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
    AuditRecordRequest, AuditEventResponse, CommentCreateRequest
)
from brandtrace.modules.submissions.service import submissions_service
from brandtrace.database.mongo import mongo_manager

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
    
    is_agency_user = (
        "agency" in user.name.lower()
        or getattr(user, "user_id", "") == "USR-AUR-SANA"
        or getattr(req, "creator_type", "creator") == "agency"
    )
    c_type = "agency" if is_agency_user else "creator"
    user_org = "ORG-AGENCY-PULSE" if is_agency_user else user.org_id

    if user.role.value == "CREATOR":
        req = req.model_copy(update={
            "creator_id": user.user_id,
            "creator_name": user.name,
            "creator_type": c_type,
            "org_id": user_org,
            "brand_id": req.brand_id or user.workspace_id,
        })
    for file_id in req.attachment_ids:
        file_meta = await mongo_manager.get_file_meta(file_id)
        if not file_meta or (file_meta.get("org_id") != user.org_id and not is_agency_user):
            raise HTTPException(status_code=400, detail=f"Attachment '{file_id}' is unavailable for this organization.")
    submission = await submissions_service.create_submission(req)
    await mongo_manager.link_claims_to_submission(
        verification_id=req.analysis_id,
        submission_id=submission.get("submission_id", ""),
        org_id=user.org_id,
    )
    return submission

@router.get("/submissions", response_model=List[SubmissionResponse])
async def list_submissions(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    brand_id: Optional[str] = Query(None),
    creator_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user: UserProfile = Depends(get_current_user)
):
    """Lists submissions filtered by user role, brand, or review state with pagination."""
    requested_role = (role or "").lower()
    user_role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    # BRAND_MANAGER and ADMIN can view all submission workspaces for governance
    is_admin_or_owner = user_role_val in {"BRAND_MANAGER", "ADMIN"}
    allowed_roles = {
        "creator": {"CREATOR", "BRAND_MANAGER", "ADMIN"},
        "agency": {"CREATOR", "BRAND_MANAGER", "ADMIN"},
        "reviewer": {"REVIEWER", "BRAND_MANAGER", "ADMIN"},
        "compliance": {"COMPLIANCE_REVIEWER", "BRAND_MANAGER", "ADMIN"},
        "brand-owner": {"BRAND_MANAGER", "ADMIN"},
        "brand_owner": {"BRAND_MANAGER", "ADMIN"},
    }
    if requested_role in allowed_roles and user_role_val not in allowed_roles[requested_role]:
        raise HTTPException(status_code=403, detail="This account is not authorized for the requested submission workspace.")

    active_creator_id = creator_id
    # Scope to this creator's own submissions unless they are an admin/owner viewing all
    if user_role_val == "CREATOR" and role in ("creator", "agency"):
        # If agency user is asking for agency submissions queue/workspace, do not hard-filter creator_id
        is_agency_user = "agency" in user.name.lower() or user.user_id == "USR-AUR-SANA"
        if not (is_agency_user and role == "agency"):
            active_creator_id = user.user_id
    return await submissions_service.list_submissions(
        creator_id=active_creator_id,
        role=role,
        status=status,
        brand_id=brand_id,
        search=search,
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
    requested_role = (role or "reviewer").lower()
    allowed_roles = {
        "creator": {"CREATOR", "BRAND_MANAGER", "ADMIN"},
        "agency": {"CREATOR", "BRAND_MANAGER", "ADMIN"},
        "reviewer": {"REVIEWER", "BRAND_MANAGER", "ADMIN"},
        "compliance": {"COMPLIANCE_REVIEWER", "BRAND_MANAGER", "ADMIN"},
        "brand-owner": {"BRAND_MANAGER", "ADMIN"},
        "brand_owner": {"BRAND_MANAGER", "ADMIN"},
    }
    if requested_role in allowed_roles and user.role.value not in allowed_roles[requested_role]:
        raise HTTPException(status_code=403, detail="This account is not authorized for the requested review queue.")
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
    
    is_admin_or_owner = user.role.value in {"BRAND_MANAGER", "ADMIN"}
    is_agency_user = "agency" in user.name.lower() or user.user_id == "USR-AUR-SANA"
    
    if not is_admin_or_owner:
        sub_org = sub.get("org_id", "")
        sub_brand = sub.get("brand_id", "")
        is_authorized = (
            sub_org == user.org_id
            or sub_brand == user.workspace_id
            or (is_agency_user and (sub_org in ["ORG-AURELLE", "ORG-AGENCY-PULSE"] or sub_brand == "aurelle-tech"))
            or (user.org_id == "ORG-AURELLE" and sub_org in ["ORG-AURELLE", "ORG-AGENCY-PULSE"])
        )
        if not is_authorized:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have access to submissions from another organization or brand tenant.")

        if user.role.value == "CREATOR" and not is_agency_user:
            if sub.get("creator_id") != user.user_id:
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
        if user_role_str not in ["CREATOR", "ADMIN", "BRAND_MANAGER"]:
            raise HTTPException(status_code=403, detail="Only creator/agency accounts can record agency quality review decisions.")

    sub = await submissions_service.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    is_admin_or_owner = user.role.value in {"BRAND_MANAGER", "ADMIN"}
    is_agency_user = "agency" in user.name.lower() or user.user_id == "USR-AUR-SANA"
    if not is_admin_or_owner:
        sub_org = sub.get("org_id", "")
        sub_brand = sub.get("brand_id", "")
        is_authorized = (
            sub_org == user.org_id
            or sub_brand == user.workspace_id
            or (is_agency_user and (sub_org in ["ORG-AURELLE", "ORG-AGENCY-PULSE"] or sub_brand == "aurelle-tech"))
        )
        if not is_authorized:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have access to submissions from another organization or brand tenant.")

    sub = await submissions_service.record_agency_decision(
        submission_id=submission_id,
        decision=req.decision,
        agency_name=req.agency_name or user.name,
        feedback=req.feedback,
        actor_id=user.user_id,
        org_id=user.org_id
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
        if user_role_str not in ["REVIEWER", "ADMIN", "BRAND_MANAGER"]:
            raise HTTPException(status_code=403, detail="Only reviewer accounts can record review decisions.")

    sub = await submissions_service.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    is_admin_or_owner = user.role.value in {"BRAND_MANAGER", "ADMIN"}
    if not is_admin_or_owner:
        sub_org = sub.get("org_id", "")
        sub_brand = sub.get("brand_id", "")
        is_authorized = (
            sub_org == user.org_id
            or sub_brand == user.workspace_id
            or (user.org_id == "ORG-AURELLE" and sub_org in ["ORG-AURELLE", "ORG-AGENCY-PULSE"])
        )
        if not is_authorized:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have access to submissions from another organization or brand tenant.")

    sub = await submissions_service.record_reviewer_decision(
        submission_id=submission_id,
        decision=req.decision,
        reviewer_name=req.reviewer_name or user.name,
        feedback=req.feedback,
        finding_decisions=req.finding_decisions,
        actor_id=user.user_id,
        org_id=user.org_id
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

@router.post("/submissions/{submission_id}/comments")
async def add_submission_comment(
    submission_id: str,
    req: CommentCreateRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Appends an immutable discussion comment to the submission."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Comment text cannot be empty.")
    
    sub = await submissions_service.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    is_admin_or_owner = user.role.value in {"BRAND_MANAGER", "ADMIN"}
    is_agency_user = "agency" in user.name.lower() or user.user_id == "USR-AUR-SANA"
    if not is_admin_or_owner:
        sub_org = sub.get("org_id", "")
        sub_brand = sub.get("brand_id", "")
        is_authorized = (
            sub_org == user.org_id
            or sub_brand == user.workspace_id
            or (is_agency_user and (sub_org in ["ORG-AURELLE", "ORG-AGENCY-PULSE"] or sub_brand == "aurelle-tech"))
            or (user.org_id == "ORG-AURELLE" and sub_org in ["ORG-AURELLE", "ORG-AGENCY-PULSE"])
        )
        if not is_authorized:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have access to submissions from another organization or brand tenant.")

    comment = await submissions_service.add_submission_comment(
        submission_id=submission_id,
        author_name=user.name,
        text=req.text.strip(),
        author_id=user.user_id,
        author_role=user.role.value,
        org_id=user.org_id
    )
    return comment

@router.post("/submissions/{submission_id}/compliance", response_model=SubmissionResponse)
async def compliance_submission(
    submission_id: str,
    req: ComplianceDecisionRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Compliance officer decision: checks statutory findings, requests evidence, or signs off."""
    if user and getattr(user, "role", None):
        user_role_str = (user.role.value if hasattr(user.role, "value") else str(user.role)).upper()
        if user_role_str not in ["COMPLIANCE_REVIEWER", "ADMIN", "BRAND_MANAGER"]:
            raise HTTPException(status_code=403, detail="Only compliance reviewer accounts can record compliance decisions.")

    sub = await submissions_service.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub_org = sub.get("org_id", "")
    sub_brand = sub.get("brand_id", "")
    is_authorized = (
        sub_org == user.org_id
        or sub_brand == user.workspace_id
        or (user.org_id == "ORG-AURELLE" and (sub_org in ["ORG-AURELLE", "ORG-AGENCY-PULSE"] or sub_brand == "aurelle-tech"))
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to submissions from another organization or brand tenant.")

    sub = await submissions_service.record_compliance_decision(
        submission_id=submission_id,
        decision=req.decision,
        compliance_name=req.compliance_name or user.name,
        notes=req.notes,
        finding_decisions=req.finding_decisions,
        requested_evidence=req.requested_evidence,
        actor_id=user.user_id,
        org_id=user.org_id
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
        if user_role_str not in ["BRAND_MANAGER", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Only brand owners or administrators can grant final brand release.")

    sub = await submissions_service.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub_org = sub.get("org_id", "")
    sub_brand = sub.get("brand_id", "")
    is_authorized = (
        sub_org == user.org_id
        or sub_brand == user.workspace_id
        or (user.org_id == "ORG-AURELLE" and (sub_org in ["ORG-AURELLE", "ORG-AGENCY-PULSE"] or sub_brand == "aurelle-tech"))
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to submissions from another organization or brand tenant.")

    try:
        sub = await submissions_service.record_final_approval(
            submission_id=submission_id,
            decision=req.decision,
            approver_name=req.approver_name or user.name,
            notes=req.notes,
            reason=req.reason,
            actor_id=user.user_id,
            org_id=user.org_id
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
async def list_audit_events(
    limit: int = Query(50, ge=1, le=500),
    user: UserProfile = Depends(get_current_user),
):
    """Lists chronological audit log events with tamper-evident cryptographic hashes."""
    if user.role.value == "CREATOR":
        is_agency_user = "agency" in user.name.lower() or user.user_id == "USR-AUR-SANA"
        if is_agency_user:
            return await submissions_service.list_audit_events(
                limit=limit,
                org_id=user.org_id,
            )
        return await submissions_service.list_audit_events(
            limit=limit,
            actor_id=user.user_id,
            org_id=user.org_id,
        )
    if user.role.value != "ADMIN":
        return await submissions_service.list_audit_events(limit=limit, org_id=user.org_id)
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
        event_hash=req.hash,
        actor_id=user.user_id,
        org_id=user.org_id,
        action_type="CREATOR_ACTION" if user.role.value == "CREATOR" else "AUDIT_EVENT",
    )

# ==============================================================================
# 4. NOTIFICATIONS API
# ==============================================================================

@router.get("/notifications")
async def list_notifications(role: Optional[str] = Query(None)):
    """Retrieves notifications for the current role."""
    return submissions_service.list_notifications(role=role)
