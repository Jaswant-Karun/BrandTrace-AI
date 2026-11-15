from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Body
from brandtrace.modules.demo.models import (
    DemoScenarioStatusResponse, ExecuteStepRequest, ExecuteStepResponse,
    DemoCase, RunCaseRequest
)
from brandtrace.modules.demo.service import demo_service
from brandtrace.modules.auth.router import get_current_user
from brandtrace.core.security import UserProfile

router = APIRouter(prefix="/demo", tags=["Demo Workflow & Scenarios"])

@router.get("/scenario-status", response_model=DemoScenarioStatusResponse)
async def get_scenario_status():
    """
    Returns the real-time status of the 12-step AURELLE demonstration scenario.
    Metrics are calculated directly from MongoDB Atlas / memory-backed repository.
    """
    return await demo_service.get_scenario_status()

@router.post("/execute-step", response_model=ExecuteStepResponse)
async def execute_scenario_step(req: ExecuteStepRequest):
    """
    Programmatically triggers or executes a specific step (1-12) of the AURELLE lifecycle.
    Applies live mutations to MongoDB Atlas documents.
    """
    if req.step_number < 1 or req.step_number > 12:
        raise HTTPException(status_code=400, detail="Step number must be between 1 and 12.")
    return await demo_service.execute_step(req.step_number, req.actor_role, req.actor_name)

@router.post("/reset", response_model=DemoScenarioStatusResponse)
async def reset_demo_scenario(user: UserProfile = Depends(get_current_user)):
    """
    Resets the AURELLE scenario to the initial baseline (₹499 price, 0 pending revision tasks).
    Allows judges and evaluators to re-run the 12-step lifecycle cleanly.
    Enforces RBAC: BRAND_MANAGER, COMPLIANCE_REVIEWER, and ADMIN roles can execute reset.
    CREATOR role is restricted from resetting workspace state.
    """
    role_str = str(user.role.value if hasattr(user.role, 'value') else user.role).upper()
    if role_str == "CREATOR":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Creator role is not authorized to reset the brand workspace. Contact Brand Manager."
        )
    return await demo_service.reset_scenario()

@router.get("/cases", response_model=List[DemoCase])
def list_demo_cases():
    """
    Returns the 9 governance demonstration cases covering:
    unsupported claims, expired facts, naming defects, prohibited medical claims,
    logo clearances, off-palette colors, missing disclosures, accessibility, and guideline conflicts.
    """
    return demo_service.get_cases()

@router.post("/run-case/{case_id}")
async def run_demo_case(case_id: str, req: Optional[RunCaseRequest] = Body(default=None)):
    """
    Runs the multi-agent inspection pipeline and explainable review engine on a specific demo test case.
    Returns composite risk scores, granular risk spans, agent scores, and explainable rewrites.
    """
    custom_content = req.custom_content if req else None
    try:
        return await demo_service.run_case(case_id, custom_content)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

