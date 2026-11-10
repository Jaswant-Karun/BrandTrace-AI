from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from brandtrace.graph.schema import SeverityLevel

class RiskSpan(BaseModel):
    start_char: int
    end_char: int
    matched_text: str
    category: str  # "REGULATORY", "CLAIM", "VOICE", "TRADEMARK"
    severity: SeverityLevel
    explanation: str
    rule_citation: str
    suggested_fix: Optional[str] = None

class AgentFinding(BaseModel):
    agent_name: str
    score: float  # 0 to 100
    status: str   # "PASSED", "WARNING", "FAILED"
    confidence: float # 0.0 to 1.0
    summary: str
    risk_spans: List[RiskSpan] = Field(default_factory=list)
    citations: List[str] = Field(default_factory=list)

class VerificationRequest(BaseModel):
    brand_id: str
    content: str
    asset_id: Optional[str] = None
    asset_title: Optional[str] = None
    channel: str = "Digital"
    target_jurisdiction: str = "US"

class VerificationResult(BaseModel):
    verification_id: str
    brand_id: str
    asset_id: Optional[str] = None
    asset_title: Optional[str] = None
    channel: str
    raw_content: str
    composite_risk_score: float  # 0 (Zero risk) to 100 (Extreme risk)
    governance_decision: str     # "APPROVED_FOR_RELEASE", "STAGED_FOR_HUMAN_REVIEW", "REJECTED_GATED"
    agent_reports: Dict[str, AgentFinding]
    all_risk_spans: List[RiskSpan]
    remediated_content: Optional[str] = None
    remediation_rationale: Optional[str] = None
    release_proof: Optional[Dict[str, Any]] = None
    timestamp: int
    timestamp_iso: str

