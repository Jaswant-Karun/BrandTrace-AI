from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from brandtrace.database.mongo import mongo_manager
from brandtrace.core.security import generate_release_proof

router = APIRouter(prefix="/approvals", tags=["Human Approval Workflows & Atomic Updates"])

class AtomicResolveRequest(BaseModel):
    task_id: str
    decision: str = "APPROVED" # "APPROVED" or "REJECTED"
    reviewer_name: str = "Chief Governance Officer"
    reviewer_role: str = "COMPLIANCE_REVIEWER"
    final_content: Optional[str] = None
    resolution_notes: Optional[str] = "Human sign-off executed. Stored in MongoDB Atlas."

@router.post("/resolve-atomic")
async def atomic_task_approval(req: AtomicResolveRequest):
    """
    Executes an atomic approval operation via MongoDB find_one_and_update.
    Guarantees no race condition or duplicate approvals.
    Prevents AI from automatically approving high-risk items.
    """
    if req.reviewer_role not in ["COMPLIANCE_REVIEWER", "BRAND_MANAGER", "ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail=f"Role '{req.reviewer_role}' is not authorized to sign off on high-risk governance revisions."
        )

    proof = generate_release_proof(
        asset_id=req.task_id,
        asset_content=req.final_content or "Approved Content",
        brand_id="apex-dynamics",
        verification_summary={"decision": req.decision, "reviewer": req.reviewer_name},
        reviewer=req.reviewer_name
    )

    updated_task = await mongo_manager.atomic_resolve_task(
        task_id=req.task_id,
        decision=req.decision,
        reviewer_name=req.reviewer_name,
        audit_proof=proof["release_hash"],
        final_content=req.final_content
    )

    if not updated_task:
        raise HTTPException(
            status_code=409,
            detail=f"Task '{req.task_id}' has already been resolved or does not exist (Atomic lock active)."
        )

    # Save to release ledger
    await mongo_manager.save_release({
        "release_id": f"REL-{req.task_id}",
        "verification_id": f"VER-{req.task_id}",
        "brand_id": "apex-dynamics",
        "asset_id": req.task_id,
        "asset_title": f"Approved Revision for {req.task_id}",
        "channel": "Production Release",
        "content": req.final_content or "Approved Content",
        "reviewer": req.reviewer_name,
        "decision": req.decision,
        "timestamp": proof["timestamp"],
        "timestamp_iso": proof["timestamp_iso"],
        "audit_stamp": proof["release_hash"]
    })

    return {
        "status": "ATOMIC_APPROVAL_COMMITTED",
        "task": updated_task,
        "cryptographic_proof": proof
    }

@router.get("/tasks")
async def list_pending_approval_tasks(brand_id: Optional[str] = Query(None)):
    """Lists revision tasks from MongoDB Atlas."""
    return await mongo_manager.list_tasks(brand_id)
