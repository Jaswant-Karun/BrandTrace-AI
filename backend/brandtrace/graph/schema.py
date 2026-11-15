from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class NodeType(str, Enum):
    BRAND = "BRAND"
    PILLAR = "PILLAR"
    TONE_ATTRIBUTE = "TONE_ATTRIBUTE"
    APPROVED_FACT = "APPROVED_FACT"     # Prices, Specs, Verified Claims, Legal Disclaimers
    APPROVED_CLAIM = "APPROVED_CLAIM"
    PROHIBITED_CLAIM = "PROHIBITED_CLAIM"
    TRADEMARK = "TRADEMARK"
    REGULATION = "REGULATION"
    CAMPAIGN = "CAMPAIGN"
    ASSET = "ASSET"                     # Creative Assets, Copy, Packaging
    ADVERTISEMENT = "ADVERTISEMENT"     # Live Ads (Instagram, Meta, Google Ads)
    WEBSITE = "WEBSITE"                 # Landing Pages, Pricing Cards, Checkout Pages
    DOCUMENT = "DOCUMENT"               # PDFs, Whitepapers, Spec Sheets, Brochures
    CHANNEL = "CHANNEL"

class EdgeType(str, Enum):
    DEFINES = "DEFINES"
    MANDATES_TONE = "MANDATES_TONE"
    SUBSTANTIATES = "SUBSTANTIATES"
    CONSTRAINS = "CONSTRAINS"
    PROTECTS = "PROTECTS"
    GOVERNS = "GOVERNS"
    CONTAINS_CLAIM = "CONTAINS_CLAIM"
    REFERENCES_FACT = "REFERENCES_FACT"
    DEPENDS_ON = "DEPENDS_ON"
    DEPENDS_ON_FACT = "DEPENDS_ON_FACT"
    DEPLOYED_IN = "DEPLOYED_IN"
    TARGETS_CHANNEL = "TARGETS_CHANNEL"

class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"
    INFO = "INFO"

class Node(BaseModel):
    id: str
    label: str
    type: NodeType
    description: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
    category: Optional[str] = None
    status: str = "active"

class Edge(BaseModel):
    id: Optional[str] = None
    source: str
    target: str
    type: EdgeType
    label: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)

class BrandGraphData(BaseModel):
    brand_id: str
    brand_name: str
    industry: str
    description: str
    nodes: List[Node]
    edges: List[Edge]

class BlastRadiusTarget(BaseModel):
    asset_id: str
    asset_name: str
    campaign_id: str
    campaign_name: str
    channel: str
    current_status: str
    exposure_level: SeverityLevel
    traversal_path: List[str]
    citation_rule: str
    remediation_required: str

class BlastRadiusResponse(BaseModel):
    mutated_node_id: str
    mutation_type: str
    total_affected_assets: int
    total_affected_campaigns: int
    overall_risk_score: float
    impact_tier: SeverityLevel
    affected_targets: List[BlastRadiusTarget]
    summary_rationale: str

# ==============================================================================
# BRAND DEPENDENCY INTELLIGENCE GRAPH (BDIG) MODELS
# ==============================================================================

class ApprovedFact(BaseModel):
    id: str
    brand_id: str
    name: str
    category: str # "PRICE", "SPECIFICATION", "CLAIM", "DISCLAIMER", "POLICY"
    current_value: str
    unit: Optional[str] = None
    description: str
    source_citation: str
    department_owner: str
    last_verified: str

class FactMutationRequest(BaseModel):
    brand_id: str
    fact_id: str
    old_value: str
    new_value: str
    mutation_reason: str
    initiated_by: str = "Commercial Operations Director"

class RevisionTask(BaseModel):
    task_id: str
    brand_id: str
    asset_id: str
    asset_name: str
    asset_type: str # "ADVERTISEMENT", "WEBSITE", "DOCUMENT", "ASSET"
    campaign_id: str
    campaign_name: str
    department: str
    assigned_reviewer_role: str
    priority: SeverityLevel
    status: str # "PENDING_REVIEW", "IN_REVISION", "APPROVED_SEALED", "REJECTED"
    old_value: str
    new_value: str
    current_content: str
    proposed_content: str
    diff_summary: str
    created_at: int
    created_at_iso: str
    resolved_at: Optional[int] = None
    resolved_by: Optional[str] = None
    audit_proof: Optional[str] = None

class AssetVersionRecord(BaseModel):
    version_id: str
    asset_id: str
    brand_id: str
    version_number: str
    content: str
    status: str # "APPROVED_HISTORICAL", "ACTIVE_APPROVED", "FLAGGED_NEEDS_REVISION"
    approval_record: Optional[Dict[str, Any]] = None
    timestamp: int
    timestamp_iso: str
    change_notes: str

class DependencyIntelligenceResult(BaseModel):
    mutation_id: str
    brand_id: str
    fact_id: str
    fact_name: str
    fact_category: str
    old_value: str
    new_value: str
    impact_summary: str
    total_affected_assets: int
    total_affected_campaigns: int
    total_departments: int
    affected_departments: List[str]
    commercial_risk_score: float # 0 to 100
    risk_level: SeverityLevel
    dependency_graph: Dict[str, Any] # ReactFlow nodes & edges for the dependency tree
    revision_tasks: List[RevisionTask]
    timestamp: int
