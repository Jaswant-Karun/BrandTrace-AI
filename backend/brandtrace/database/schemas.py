import time
from typing import Dict, Any, List, Optional
from enum import Enum
from bson import ObjectId
from pydantic import BaseModel, Field

def current_epoch_ms() -> int:
    return int(time.time() * 1000)

class BaseMongoRecord(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    organisation_id: str
    workspace_id: Optional[str] = None
    created_at: int = Field(default_factory=current_epoch_ms)
    updated_at: int = Field(default_factory=current_epoch_ms)
    created_by: str = "system"
    status: str = "ACTIVE"

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }

# 1. users
class UserDoc(BaseMongoRecord):
    user_id: str
    email: str
    name: str
    role: str = "REVIEWER"
    department: str = "Governance"
    is_active: bool = True
    password_hash: Optional[str] = None

# 2. organisations
class OrganisationDoc(BaseMongoRecord):
    name: str
    slug: str
    tier: str = "ENTERPRISE"
    industry: str
    settings: Dict[str, Any] = Field(default_factory=dict)

# 3. workspace_memberships
class WorkspaceMembershipDoc(BaseMongoRecord):
    user_id: str
    role_name: str
    permissions: List[str] = Field(default_factory=list)

# 4. brand_workspaces
class BrandWorkspaceDoc(BaseMongoRecord):
    name: str
    slug: str
    description: Optional[str] = None
    primary_color: str = "#0F172A"
    accent_color: str = "#06B6D4"
    is_active: bool = True

# 5. roles_permissions
class RolePermissionDoc(BaseMongoRecord):
    role_name: str
    description: str
    allowed_actions: List[str]

# 6. brand_guidelines
class BrandGuidelineDoc(BaseMongoRecord):
    guideline_id: str
    title: str
    category: str # "VOICE", "PACKAGING", "REGULATORY", "SUSTAINABILITY", "VISUAL", "TRADEMARK"
    rule_statement: str
    severity: str = "HIGH"
    effective_date: int = Field(default_factory=current_epoch_ms)
    expiry_date: Optional[int] = None
    version_number: str = "1.0"
    restricted_terms: Optional[List[str]] = None
    required_phrases: Optional[List[str]] = None
    source_citation: Optional[str] = None

# 7. guideline_versions
class GuidelineVersionDoc(BaseMongoRecord):
    guideline_id: str
    version_number: str
    change_summary: str
    previous_rule: str
    new_rule: str
    approved_by: str

# 8. approved_facts
class ApprovedFactDoc(BaseMongoRecord):
    fact_id: str
    category: str # "PRICE", "SPECIFICATION", "CLAIM", "INGREDIENT", "COMPLIANCE"
    name: str
    current_value: str
    unit: Optional[str] = None
    description: str
    source_citation: str
    department_owner: str
    last_verified: str
    source_date: Optional[str] = None
    expiry_date: Optional[str] = None
    evidence_reference: Optional[str] = None
    restricted_terms: Optional[List[str]] = None
    required_phrases: Optional[List[str]] = None
    embedding: Optional[List[float]] = None

# 9. fact_sources
class FactSourceDoc(BaseMongoRecord):
    source_id: str
    fact_id: str
    source_type: str # "REGULATORY_FILING", "LAB_CERTIFICATE", "PRICING_RESOLUTION", "PATENT"
    title: str
    external_url_or_ref: str
    verified_by: str
    verification_hash: str

# 10. terminology
class TerminologyDoc(BaseMongoRecord):
    term_id: str
    term_text: str
    classification: str # "APPROVED_TRADEMARK", "PROHIBITED_TERM", "RESTRICTED_CLAIM"
    guidance: str
    replacement_term: Optional[str] = None

# 11. brand_assets
class BrandAssetDoc(BaseMongoRecord):
    asset_id: str
    asset_name: str
    asset_type: str # "LOGO", "COLOR_PALETTE", "TYPOGRAPHY", "PACKAGING_DIE", "IMAGERY"
    file_id: Optional[str] = None
    file_url: Optional[str] = None
    specifications: Dict[str, Any] = Field(default_factory=dict)

# 12. campaigns
class CampaignDoc(BaseMongoRecord):
    campaign_id: str
    name: str
    manager_name: str
    budget_allocated: float
    channels: List[str]
    objectives: str
    flight_start: int
    flight_end: int

# 13. content_assets
class ContentAssetDoc(BaseMongoRecord):
    asset_id: str
    campaign_id: Optional[str] = None
    title: str
    channel: str # "OOH Billboard", "Social Media", "PR Newswire", "Web Landing Page"
    raw_content: str
    content_hash: str
    current_version: str = "1.0"

# 14. content_versions
class ContentVersionDoc(BaseMongoRecord):
    asset_id: str
    version_label: str
    content_body: str
    content_hash: str
    mutation_rationale: str
    superseded_by: Optional[str] = None

# 15. graph_nodes
class GraphNodeDoc(BaseMongoRecord):
    node_id: str
    node_type: str # "APPROVED_FACT", "BRAND_GUIDELINE", "CONTENT_ASSET", "CAMPAIGN", "TRADEMARK"
    label: str
    description: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None

# 16. graph_relationships
class GraphRelationshipDoc(BaseMongoRecord):
    source_node_id: str
    target_node_id: str
    relationship_type: str # "DEPENDS_ON_FACT", "GOVERNED_BY_GUIDELINE", "PART_OF_CAMPAIGN"
    evidence: str
    relationship_status: str = "ACTIVE_VERIFIED"

# 17. inspection_jobs
class InspectionJobDoc(BaseMongoRecord):
    job_id: str
    asset_id: str
    file_id: Optional[str] = None
    trigger_type: str = "PRE_RELEASE_GATE" # "ON_DEMAND", "PRE_RELEASE_GATE", "MUTATION_CASCADING"
    findings_count: int = 0
    composite_risk_score: float = 0.0

# 18. inspection_findings
class InspectionFindingDoc(BaseMongoRecord):
    job_id: str
    asset_id: str
    finding_category: str # "STATUTORY_VIOLATION", "FACT_CONTRADICTION", "TERMINOLOGY", "WCAG_ACCESSIBILITY"
    severity: str # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    exact_text: str
    explanation: str
    relevant_rule_or_fact_id: Optional[str] = None
    confidence: float = 0.95

# 19. evidence_references
class EvidenceReferenceDoc(BaseMongoRecord):
    finding_id: str
    citation_id: str
    statutory_law: str # "FTC 16 CFR §260", "EU Directive 2024/825", "FDA 21 CFR §202.1", "Lanham Act §43(a)"
    clause_text: str
    official_register_ref: str

# 20. suggested_corrections
class SuggestedCorrectionDoc(BaseMongoRecord):
    finding_id: str
    original_text: str
    suggested_rewrite: str
    remediation_strategy: str # "MINIMAL_CHANGE", "GRAPH_COMPLIANT_SUBSTITUTION"

# 21. review_assignments
class ReviewAssignmentDoc(BaseMongoRecord):
    assignment_id: str
    asset_id: str
    assigned_reviewer_id: str
    assigned_role: str
    due_date: int
    is_completed: bool = False

# 22. comments
class CommentDoc(BaseMongoRecord):
    comment_id: str
    asset_id: str
    author_id: str
    author_name: str
    message: str
    highlighted_text: Optional[str] = None

# 23. approval_decisions
class ApprovalDecisionDoc(BaseMongoRecord):
    decision_id: str
    asset_id: str
    reviewer_identity: str
    reviewer_role: str
    decision: str # "APPROVED", "REJECTED", "REVISION_REQUESTED"
    rationale: str
    cryptographic_seal: str

# 24. change_simulations
class ChangeSimulationDoc(BaseMongoRecord):
    simulation_id: str
    target_record_id: str
    target_record_type: str # "PRICE", "SPECIFICATION", "CLAIM", "GUIDELINE"
    old_value: str
    proposed_value: str
    rationale: str
    proposed_by: str

# 25. impact_reports
class ImpactReportDoc(BaseMongoRecord):
    simulation_id: str
    direct_dependencies_count: int
    indirect_dependencies_count: int
    outdated_campaigns_count: int
    overall_risk_score: float
    exposure_tier: str

# 26. audit_events
class AuditEventDoc(BaseMongoRecord):
    event_id: str
    action_type: str # "FACT_MUTATION", "ASSET_SEALED", "POLICY_REVISION", "ACCESS_VIOLATION"
    resource_id: str
    user_identity: str
    previous_hash: Optional[str] = None
    current_hash: str
    tamper_evident_digest: str

# 27. notifications
class NotificationDoc(BaseMongoRecord):
    notification_id: str
    recipient_user_id: str
    title: str
    message: str
    severity: str = "INFO"
    is_read: bool = False
    action_link: Optional[str] = None

# 28. brand_documents
class DocumentCategory(str, Enum):
    BRAND_GUIDELINES = "BRAND_GUIDELINES"
    PRODUCT_FACTS = "PRODUCT_FACTS"
    PRICING_POLICIES = "PRICING_POLICIES"
    BRAND_VOICE = "BRAND_VOICE"
    REGULATORY_POLICIES = "REGULATORY_POLICIES"
    MARKETING_CLAIMS = "MARKETING_CLAIMS"

class DocumentProcessingStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    INDEXED = "INDEXED"
    FAILED = "FAILED"

class DocumentSourceType(str, Enum):
    MANUAL_ENTRY = "MANUAL_ENTRY"
    FILE_UPLOAD = "FILE_UPLOAD"
    WEBSITE_IMPORT = "WEBSITE_IMPORT"

class BrandDocumentDoc(BaseMongoRecord):
    doc_id: str
    title: str
    category: str = DocumentCategory.BRAND_GUIDELINES.value
    source_type: str = DocumentSourceType.MANUAL_ENTRY.value
    description: str = ""
    raw_content: str
    version_number: str = "1.0"
    processing_status: str = DocumentProcessingStatus.UPLOADED.value
    processing_error: Optional[str] = None
    is_demo: bool = False
    file_metadata: Optional[Dict[str, Any]] = None
    source_url: Optional[str] = None
    extracted_facts: List[str] = Field(default_factory=list)
    indexed_nodes_count: int = 0
    embedding: Optional[List[float]] = None

# 29. document_versions
class DocumentVersionDoc(BaseMongoRecord):
    version_id: str
    doc_id: str
    version_number: str
    title: str
    category: str
    raw_content: str
    change_summary: str
    edited_by: str
    archived_at: int = Field(default_factory=current_epoch_ms)

