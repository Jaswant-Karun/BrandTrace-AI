import time
import uuid
import re
import networkx as nx
from typing import Dict, List, Optional, Any, Set, Tuple
from enum import Enum
from pydantic import BaseModel, Field

from brandtrace.graph.engine import BrandKnowledgeGraph
from brandtrace.graph.schema import (
    NodeType, EdgeType, SeverityLevel, RevisionTask
)

class ConflictType(str, Enum):
    DIRECT_CONTRADICTION = "DIRECT_CONTRADICTION"
    AMBIGUOUS_SCOPE = "AMBIGUOUS_SCOPE"
    REGULATORY_NON_COMPLIANCE = "REGULATORY_NON_COMPLIANCE"
    REGIONAL_OVERRIDE_CONFLICT = "REGIONAL_OVERRIDE_CONFLICT"

class PolicyConflict(BaseModel):
    conflict_id: str
    conflict_type: ConflictType
    conflicting_rule_or_fact_ids: List[str]
    severity: SeverityLevel
    title: str
    explanation: str
    recommended_resolution: str

class WorkloadEstimate(BaseModel):
    estimated_review_hours: float
    affected_departments: Dict[str, int] # department -> count of assets
    required_human_decisions_count: int
    estimated_lead_time_days: float

class BeforeAfterScore(BaseModel):
    baseline_compliance_score: float # e.g. 100.0 or 95.0
    simulated_score_if_unaddressed: float # e.g. 42.0 (drops significantly due to outdated content)
    simulated_score_if_remediated: float # e.g. 98.5
    projected_risk_delta: float # e.g. +56.5 risk points if unaddressed

class SimulationProposedChange(BaseModel):
    brand_id: str
    target_record_id: str # e.g. "FACT-AUR-PRC-01", "FACT-PRC-01", "GL-AUR-01", "PC-01", "AC-01"
    target_record_type: str # "PRICE", "SPECIFICATION", "CLAIM", "TERMINOLOGY", "GUIDELINE", "CAMPAIGN_POLICY"
    record_label: str
    old_value: str
    proposed_value: str
    change_rationale: str
    proposed_by: str = "Commercial Operations Lead"

class DependencyExposureDetail(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: str
    campaign_id: str
    campaign_name: str
    relationship_kind: str # "DIRECT_GRAPH_DEPENDENCY" vs "INFERRED_LEXICAL_MENTION"
    exposure_tier: SeverityLevel
    graph_path: List[str]
    old_content_preview: str
    remediated_content_preview: str
    required_human_action: str
    is_simulated: bool = True
    simulated_status: str = "SIMULATED_PREVIEW_ONLY"
    before_score: float = 100.0
    after_score_unaddressed: float = 40.0
    after_score_remediated: float = 98.0

class SimulationReport(BaseModel):
    simulation_id: str
    brand_id: str
    target_record_id: str
    record_label: str
    target_record_type: str
    old_value: str
    proposed_value: str
    status: str # "PROPOSED_PENDING_APPROVAL", "APPROVED_ACTIVE", "REJECTED"
    overall_risk_score: float # 0 to 100
    risk_tier: SeverityLevel
    direct_dependencies_count: int
    indirect_dependencies_count: int
    outdated_campaigns_count: int
    affected_touchpoints: List[DependencyExposureDetail]
    policy_conflicts: List[PolicyConflict] = Field(default_factory=list)
    workload_estimate: WorkloadEstimate
    before_after_summary: BeforeAfterScore
    generated_tasks: List[RevisionTask]
    simulation_timestamp: int
    is_production_active: bool = False
    approved_by: Optional[str] = None
    approval_timestamp: Optional[int] = None
    audit_hash: Optional[str] = None

class ChangeImpactSimulationEngine:
    """
    Brand Governance Digital Twin & Simulation Engine
    Simulates proposed product fact, policy, terminology, claim restriction, or guideline changes.
    Detects potential policy conflicts, computes before/after inspection results, and estimates human review workload.
    Guarantees zero silent mutation of live approved policies until authorized human approval.
    """
    def __init__(self):
        self.active_simulations: Dict[str, SimulationReport] = {}

    def detect_policy_conflicts(
        self,
        bkg: BrandKnowledgeGraph,
        change: SimulationProposedChange
    ) -> List[PolicyConflict]:
        """
        Policy Conflict Detection Engine:
        Identifies guidelines that contradict each other, lack operational clarity,
        or conflict with statutory regulations.
        """
        conflicts: List[PolicyConflict] = []
        rec_id = change.target_record_id.upper()
        prop_val = change.proposed_value.lower()
        old_val = change.old_value.lower()

        # 1. Price Change Conflicts (e.g. ₹499 -> ₹599)
        if "prc" in rec_id or "price" in change.target_record_type.lower():
            # Check if any active promotional campaign enforces a lower price ceiling
            for n_id, data in bkg.graph.nodes(data=True):
                if data.get("type") == NodeType.CAMPAIGN.value:
                    camp_props = data.get("properties", {})
                    camp_desc = data.get("description", "").lower()
                    if "entry" in camp_desc or "sub-₹500" in camp_desc or "budget" in camp_desc:
                        conflicts.append(
                            PolicyConflict(
                                conflict_id=f"CONF-PRC-{len(conflicts)+1:02d}",
                                conflict_type=ConflictType.DIRECT_CONTRADICTION,
                                conflicting_rule_or_fact_ids=[rec_id, n_id],
                                severity=SeverityLevel.HIGH,
                                title=f"Price Point Contradicts Campaign Charter ({data.get('label')})",
                                explanation=f"Proposed price of {change.proposed_value} exceeds the sub-₹500 budget charter of active campaign '{data.get('label')}'.",
                                recommended_resolution="Amend campaign budget bracket or create an grandfathered promotional tier."
                            )
                        )

        # 2. Typography / Font Conflicts (e.g. Helvetica vs Editorial Serif)
        if "font" in change.target_record_type.lower() or "typography" in change.target_record_type.lower() or "helvetica" in prop_val:
            conflicts.append(
                PolicyConflict(
                    conflict_id=f"CONF-TYPO-{len(conflicts)+1:02d}",
                    conflict_type=ConflictType.REGIONAL_OVERRIDE_CONFLICT,
                    conflicting_rule_or_fact_ids=[rec_id, "GL-AUR-06"],
                    severity=SeverityLevel.HIGH,
                    title="Typography Contradiction with Master Global Directive",
                    explanation="Proposed font specification conflicts with Global Master Rule GL-AUR-06 (Editorial Serif headlines, Inter Enterprise UI). Master rule takes precedence.",
                    recommended_resolution="Restrict Helvetica Neue to regional digital displays and preserve Editorial Serif for brand headlines."
                )
            )

        # 3. Terminology & Regulatory Safety Conflicts (e.g. Autonomous / Self-Driving)
        if any(w in prop_val for w in ["autonomous", "hands-free", "self-driving", "sleep"]):
            conflicts.append(
                PolicyConflict(
                    conflict_id=f"CONF-REG-{len(conflicts)+1:02d}",
                    conflict_type=ConflictType.REGULATORY_NON_COMPLIANCE,
                    conflicting_rule_or_fact_ids=[rec_id, "REG-03", "PC-02"],
                    severity=SeverityLevel.CRITICAL,
                    title="NHTSA Regulatory Non-Compliance in Automated Driving Claim",
                    explanation="Proposed terminology 'hands-free autonomous' violates NHTSA Standing General Order 2021-01 for SAE Level 2 systems.",
                    recommended_resolution="Replace with 'Driver-Supervised Level 2 Highway Assist' with mandatory hands-on-wheel disclaimer."
                )
            )

        # 4. Environmental & Green Claims Ambiguity Check
        if any(w in prop_val for w in ["100% eco", "zero-carbon", "completely green"]):
            conflicts.append(
                PolicyConflict(
                    conflict_id=f"CONF-AMB-{len(conflicts)+1:02d}",
                    conflict_type=ConflictType.AMBIGUOUS_SCOPE,
                    conflicting_rule_or_fact_ids=[rec_id, "REG-01", "PC-01"],
                    severity=SeverityLevel.CRITICAL,
                    title="Unqualified Environmental Claim Lacks Operational Lifecycle Clarity",
                    explanation="Blanket environmental claim violates FTC Green Guides 16 CFR §260.4 without certified cradle-to-grave lifecycle proof.",
                    recommended_resolution="Specify exact certified recycled content percentage (e.g. '85% certified recycled aluminum')."
                )
            )

        # 5. Medical Diagnostic Cure Claim on Consumer Wearable (Aurelle Pulse Smart Ring)
        if any(w in prop_val for w in ["cure", "medical-grade", "diagnostic"]):
            conflicts.append(
                PolicyConflict(
                    conflict_id=f"CONF-FDA-{len(conflicts)+1:02d}",
                    conflict_type=ConflictType.REGULATORY_NON_COMPLIANCE,
                    conflicting_rule_or_fact_ids=[rec_id, "GL-AUR-03"],
                    severity=SeverityLevel.CRITICAL,
                    title="FDA 21 CFR §870 Wellness vs Diagnostic Medical Device Classification",
                    explanation="Aurelle Pulse Smart Ring is a consumer general wellness monitor. Stating it is a medical-grade diagnostic cure triggers severe FDA Class II/III penalties.",
                    recommended_resolution="Use 'lifestyle tracking and recovery monitoring' without disease treatment or cure claims."
                )
            )

        return conflicts

    def simulate_change(
        self,
        bkg: BrandKnowledgeGraph,
        change: SimulationProposedChange
    ) -> SimulationReport:
        sim_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"
        t_now = int(time.time())

        rec_id = change.target_record_id
        old_val = change.old_value
        new_val = change.proposed_value

        direct_asset_ids: Set[str] = set()
        inferred_asset_ids: Set[str] = set()
        outdated_campaigns: Set[str] = set()

        # 1. Actual Dependencies: Direct Graph Reachability
        rev_graph = bkg.graph.reverse()
        if rec_id in bkg.graph:
            for desc in nx.descendants(rev_graph, rec_id):
                ntype = bkg.graph.nodes[desc].get("type")
                if ntype in [NodeType.ASSET.value, NodeType.ADVERTISEMENT.value, NodeType.WEBSITE.value, NodeType.DOCUMENT.value]:
                    direct_asset_ids.add(desc)
                elif ntype == NodeType.CAMPAIGN.value:
                    outdated_campaigns.add(desc)

        # 2. Inferred Relationships: Content Mentions not yet explicitly linked in DAG
        for n_id, data in bkg.graph.nodes(data=True):
            ntype = data.get("type")
            if ntype in [NodeType.ASSET.value, NodeType.ADVERTISEMENT.value, NodeType.WEBSITE.value, NodeType.DOCUMENT.value]:
                if n_id not in direct_asset_ids:
                    content = data.get("properties", {}).get("content", "")
                    if old_val.lower() in content.lower():
                        inferred_asset_ids.add(n_id)

        # 3. Detect Policy Conflicts
        conflicts = self.detect_policy_conflicts(bkg, change)

        # 4. Build Exposure Details & Review Tasks
        touchpoints: List[DependencyExposureDetail] = []
        tasks: List[RevisionTask] = []
        department_counts: Dict[str, int] = {}

        all_affected = [(a_id, "DIRECT_GRAPH_DEPENDENCY") for a_id in direct_asset_ids] + \
                       [(a_id, "INFERRED_LEXICAL_MENTION") for a_id in inferred_asset_ids]

        total_review_hours = 0.0

        for asset_id, rel_kind in all_affected:
            node_data = bkg.graph.nodes.get(asset_id, {})
            props = node_data.get("properties", {})
            current_copy = props.get("content", "")
            asset_label = node_data.get("label", asset_id)
            asset_type = node_data.get("type", "ASSET")
            department = props.get("department", "Commercial Operations")
            reviewer_role = props.get("reviewer_role", "Department Lead")

            department_counts[department] = department_counts.get(department, 0) + 1

            # Workload calculation per asset type
            if asset_type in ["WEBSITE", "DOCUMENT"]:
                total_review_hours += 0.8
            elif asset_type == "ADVERTISEMENT":
                total_review_hours += 0.5
            else:
                total_review_hours += 0.4

            # Determine Campaign
            camp_id = "CMP-AUR-01" if "aurelle" in change.brand_id else "CMP-FLEET-01"
            camp_name = "Global Q1 Brand Flight"
            for u, v in bkg.graph.in_edges(asset_id):
                if bkg.graph.nodes[u].get("type") == NodeType.CAMPAIGN.value:
                    camp_id = u
                    camp_name = bkg.graph.nodes[u].get("label", u)
                    outdated_campaigns.add(camp_id)

            # Proposed minimal rewrite
            pattern = re.compile(re.escape(old_val), re.IGNORECASE)
            remediated_copy = pattern.sub(new_val, current_copy)

            # Severity
            if rel_kind == "DIRECT_GRAPH_DEPENDENCY":
                tier = SeverityLevel.CRITICAL if asset_type in ["ADVERTISEMENT", "WEBSITE"] else SeverityLevel.HIGH
            else:
                tier = SeverityLevel.MODERATE

            touchpoints.append(
                DependencyExposureDetail(
                    asset_id=asset_id,
                    asset_name=asset_label,
                    asset_type=asset_type,
                    campaign_id=camp_id,
                    campaign_name=camp_name,
                    relationship_kind=rel_kind,
                    exposure_tier=tier,
                    graph_path=[rec_id, camp_id, asset_id],
                    old_content_preview=current_copy[:120] + ("..." if len(current_copy) > 120 else ""),
                    remediated_content_preview=remediated_copy[:120] + ("..." if len(remediated_copy) > 120 else ""),
                    required_human_action=f"Route to {reviewer_role} for explicit sign-off; update {old_val} to {new_val}.",
                    is_simulated=True,
                    simulated_status="SIMULATED_PREVIEW_ONLY",
                    before_score=96.0,
                    after_score_unaddressed=42.0,
                    after_score_remediated=98.5
                )
            )

            # Generate Review Task
            task_id = f"TASK-SIM-{uuid.uuid4().hex[:6].upper()}"
            tasks.append(
                RevisionTask(
                    task_id=task_id,
                    brand_id=change.brand_id,
                    asset_id=asset_id,
                    asset_name=asset_label,
                    asset_type=asset_type,
                    campaign_id=camp_id,
                    campaign_name=camp_name,
                    department=department,
                    assigned_reviewer_role=reviewer_role,
                    priority=tier,
                    status="PENDING_REVIEW",
                    old_value=old_val,
                    new_value=new_val,
                    current_content=current_copy,
                    proposed_content=remediated_copy,
                    diff_summary=f"Replace '{old_val}' with '{new_val}' ({rel_kind}).",
                    created_at=t_now,
                    created_at_iso=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t_now))
                )
            )

        # Impact Risk Calculation
        direct_cnt = len(direct_asset_ids)
        inferred_cnt = len(inferred_asset_ids)
        total_exposed = direct_cnt + inferred_cnt
        conflict_penalty = len(conflicts) * 15.0
        risk_score = min(100.0, round((direct_cnt * 22.0) + (inferred_cnt * 10.0) + (len(outdated_campaigns) * 8.0) + conflict_penalty, 1))
        risk_tier = SeverityLevel.CRITICAL if risk_score >= 60 else (SeverityLevel.HIGH if risk_score >= 35 else SeverityLevel.MODERATE)

        # Workload and Decisions
        lead_time_days = round(max(0.5, total_review_hours / 3.0), 1)
        workload = WorkloadEstimate(
            estimated_review_hours=round(max(0.5, total_review_hours), 1),
            affected_departments=department_counts,
            required_human_decisions_count=len(touchpoints) + len(conflicts),
            estimated_lead_time_days=lead_time_days
        )

        before_after = BeforeAfterScore(
            baseline_compliance_score=95.0,
            simulated_score_if_unaddressed=max(10.0, round(95.0 - (total_exposed * 14.0) - conflict_penalty, 1)),
            simulated_score_if_remediated=98.5,
            projected_risk_delta=round(risk_score, 1)
        )

        report = SimulationReport(
            simulation_id=sim_id,
            brand_id=change.brand_id,
            target_record_id=rec_id,
            record_label=change.record_label,
            target_record_type=change.target_record_type,
            old_value=old_val,
            proposed_value=new_val,
            status="PROPOSED_PENDING_APPROVAL",
            overall_risk_score=risk_score,
            risk_tier=risk_tier,
            direct_dependencies_count=direct_cnt,
            indirect_dependencies_count=inferred_cnt,
            outdated_campaigns_count=len(outdated_campaigns),
            affected_touchpoints=touchpoints,
            policy_conflicts=conflicts,
            workload_estimate=workload,
            before_after_summary=before_after,
            generated_tasks=tasks,
            simulation_timestamp=t_now,
            is_production_active=False
        )

        self.active_simulations[sim_id] = report
        return report

    def commit_change(
        self,
        bkg: BrandKnowledgeGraph,
        simulation_id: str,
        decision: str, # "APPROVED" or "REJECTED"
        authorized_reviewer: str = "Authorized Brand Manager"
    ) -> Tuple[bool, str, Optional[SimulationReport]]:
        """
        Activates the proposed change in the Brand Knowledge Graph only after authorized human manager approval.
        """
        if simulation_id not in self.active_simulations:
            return False, f"Simulation {simulation_id} not found.", None

        sim = self.active_simulations[simulation_id]
        t_now = int(time.time())

        if decision == "APPROVED":
            sim.status = "APPROVED_ACTIVE"
            sim.is_production_active = True
            sim.approved_by = authorized_reviewer
            sim.approval_timestamp = t_now
            sim.audit_hash = f"BT-COMM-SEAL-{hash(simulation_id + authorized_reviewer + str(t_now)) % 100000000:08X}"

            # Update the underlying node property in BKG
            if sim.target_record_id in bkg.graph:
                bkg.graph.nodes[sim.target_record_id]["properties"]["current_value"] = sim.proposed_value

            return True, f"Change {simulation_id} approved by {authorized_reviewer}. Value '{sim.proposed_value}' is now live in truth-set.", sim
        else:
            sim.status = "REJECTED"
            sim.is_production_active = False
            sim.approved_by = authorized_reviewer
            sim.approval_timestamp = t_now
            return True, f"Change {simulation_id} rejected by {authorized_reviewer}.", sim

simulation_engine = ChangeImpactSimulationEngine()
