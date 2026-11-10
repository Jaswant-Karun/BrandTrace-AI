export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFO';

export interface RiskSpan {
  start_char: number;
  end_char: number;
  matched_text: string;
  category: string;
  severity: SeverityLevel;
  explanation: string;
  rule_citation: string;
  suggested_fix?: string;
}

export interface AgentFinding {
  agent_name: string;
  score: number;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  confidence: number;
  summary: string;
  risk_spans: RiskSpan[];
  citations: string[];
}

export interface ReleaseProof {
  release_hash: string;
  full_digest: string;
  content_hash: string;
  verification_hash: string;
  timestamp: number;
  timestamp_iso: string;
  reviewer: string;
  signature_scheme: string;
}

export interface VerificationResult {
  verification_id: string;
  brand_id: string;
  asset_id?: string;
  asset_title?: string;
  channel: string;
  raw_content: string;
  composite_risk_score: number;
  governance_decision: 'APPROVED_FOR_RELEASE' | 'STAGED_FOR_HUMAN_REVIEW' | 'REJECTED_GATED';
  agent_reports: {
    voice_persona: AgentFinding;
    claim_substantiation: AgentFinding;
    regulatory_compliance: AgentFinding;
  };
  all_risk_spans: RiskSpan[];
  remediated_content?: string;
  remediation_rationale?: string;
  release_proof?: ReleaseProof;
  timestamp: number;
  timestamp_iso: string;
}

export interface BrandProfile {
  brand_id: string;
  brand_name: string;
  industry: string;
  description: string;
  node_count?: number;
  edge_count?: number;
}

export interface BlastRadiusTarget {
  asset_id: string;
  asset_name: string;
  campaign_id: string;
  campaign_name: string;
  channel: string;
  current_status: string;
  exposure_level: SeverityLevel;
  traversal_path: string[];
  citation_rule: string;
  remediation_required: string;
}

export interface BlastRadiusResponse {
  mutated_node_id: string;
  mutation_type: string;
  total_affected_assets: number;
  total_affected_campaigns: number;
  overall_risk_score: number;
  impact_tier: SeverityLevel;
  affected_targets: BlastRadiusTarget[];
  summary_rationale: string;
}

export interface ReleaseLedgerEntry {
  release_id: string;
  verification_id: string;
  brand_id: string;
  asset_id: string;
  asset_title: string;
  channel: string;
  content: string;
  reviewer: string;
  decision: string;
  timestamp: number;
  timestamp_iso: string;
  audit_stamp: string;
}

export interface DatabaseStatus {
  connected: boolean;
  engine: string;
  database: string;
  uri?: string;
  collections?: Record<string, number>;
  error?: string;
}

// ==============================================================================
// BDIG (Brand Dependency Intelligence Graph) Types
// ==============================================================================

export interface ApprovedFact {
  id: string;
  brand_id: string;
  name: string;
  category: string;
  current_value: string;
  unit?: string;
  description: string;
  source_citation: string;
  department_owner: string;
  last_verified: string;
}

export interface RevisionTask {
  task_id: string;
  brand_id: string;
  asset_id: string;
  asset_name: string;
  asset_type: string;
  campaign_id: string;
  campaign_name: string;
  department: string;
  assigned_reviewer_role: string;
  priority: SeverityLevel;
  status: 'PENDING_REVIEW' | 'IN_REVISION' | 'APPROVED_SEALED' | 'REJECTED';
  old_value: string;
  new_value: string;
  current_content: string;
  proposed_content: string;
  diff_summary: string;
  created_at: number;
  created_at_iso: string;
  resolved_at?: number;
  resolved_by?: string;
  audit_proof?: string;
}

export interface AssetVersionRecord {
  version_id: string;
  asset_id: string;
  brand_id: string;
  version_number: string;
  content: string;
  status: 'APPROVED_HISTORICAL' | 'ACTIVE_APPROVED' | 'FLAGGED_NEEDS_REVISION';
  approval_record?: {
    reviewer: string;
    approved_timestamp: number;
    audit_hash: string;
    resolution_notes?: string;
  };
  timestamp: number;
  timestamp_iso: string;
  change_notes: string;
}

export interface DependencyIntelligenceResult {
  mutation_id: string;
  brand_id: string;
  fact_id: string;
  fact_name: string;
  fact_category: string;
  old_value: string;
  new_value: string;
  impact_summary: string;
  total_affected_assets: number;
  total_affected_campaigns: number;
  total_departments: number;
  affected_departments: string[];
  commercial_risk_score: number;
  risk_level: SeverityLevel;
  dependency_graph: {
    nodes: any[];
    edges: any[];
  };
  revision_tasks: RevisionTask[];
  timestamp: number;
}
