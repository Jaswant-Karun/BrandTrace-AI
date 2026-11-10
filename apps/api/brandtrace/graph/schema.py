from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class NodeType(str, Enum):
    BRAND = "BRAND"
    PILLAR = "PILLAR"
    TONE_ATTRIBUTE = "TONE_ATTRIBUTE"
    APPROVED_CLAIM = "APPROVED_CLAIM"
    PROHIBITED_CLAIM = "PROHIBITED_CLAIM"
    TRADEMARK = "TRADEMARK"
    REGULATION = "REGULATION"
    CAMPAIGN = "CAMPAIGN"
    ASSET = "ASSET"
    CHANNEL = "CHANNEL"

class EdgeType(str, Enum):
    DEFINES = "DEFINES"
    MANDATES_TONE = "MANDATES_TONE"
    SUBSTANTIATES = "SUBSTANTIATES"
    CONSTRAINS = "CONSTRAINS"
    PROTECTS = "PROTECTS"
    GOVERNS = "GOVERNS"
    CONTAINS_CLAIM = "CONTAINS_CLAIM"
    DEPENDS_ON = "DEPENDS_ON"
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
    overall_risk_score: float # 0 to 100
    impact_tier: SeverityLevel
    affected_targets: List[BlastRadiusTarget]
    summary_rationale: str
