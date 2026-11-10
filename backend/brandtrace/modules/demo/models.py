from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ScenarioStepStatus(BaseModel):
    step_number: int
    title: str
    actor_role: str
    actor_name: str
    status: str # 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
    description: str
    before_value: Optional[str] = None
    after_value: Optional[str] = None
    artifact_generated: Optional[str] = None
    target_view: Optional[str] = None

class DemoScenarioStatusResponse(BaseModel):
    org_id: str
    workspace_id: str
    current_step: int
    current_price: str
    steps: List[ScenarioStepStatus]
    total_tasks: int
    pending_tasks: int
    approved_tasks: int
    audit_records_count: int
    active_users: List[Dict[str, str]]
    timestamp_iso: str

class ExecuteStepRequest(BaseModel):
    step_number: int
    actor_role: Optional[str] = None
    actor_name: Optional[str] = None

class ExecuteStepResponse(BaseModel):
    step_number: int
    status: str
    message: str
    mutations_applied: Dict[str, Any]
    next_step: int
    scenario_state: DemoScenarioStatusResponse

class DemoCase(BaseModel):
    case_id: str
    title: str
    category: str
    severity: str
    sample_content: str
    expected_violation: str
    governing_policy: str
    suggested_fix: str

class RunCaseRequest(BaseModel):
    case_id: str
    custom_content: Optional[str] = None

