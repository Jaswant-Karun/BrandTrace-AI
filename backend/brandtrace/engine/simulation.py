import time
import uuid
import re
import networkx as nx
from typing import Dict, List, Optional, Any, Set, Tuple
from pydantic import BaseModel, Field

from brandtrace.graph.engine import BrandKnowledgeGraph
from brandtrace.graph.schema import (
    NodeType, EdgeType, SeverityLevel, RevisionTask
)

class SimulationProposedChange(BaseModel):
    brand_id: str
    target_record_id: str # e.g. "FACT-PRC-01", "AC-01", "TM-01", "PIL-01"
    target_record_type: str # "PRICE", "SPECIFICATION", "CLAIM", "TERMINOLOGY", "GUIDELINE", "LOGO"
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

class SimulationReport(BaseModel):
    simulation_id: str
    brand_id: str
    target_record_id: str
    record_label: str
    old_value: str
    proposed_value: str
    status: str # "PROPOSED_PENDING_APPROVAL", "APPROVED_ACTIVE", "REJECTED"
    overall_risk_score: float # 0 to 100
    risk_tier: SeverityLevel
    direct_dependencies_count: int
    indirect_dependencies_count: int
    outdated_campaigns_count: int
    affected_touchpoints: List[DependencyExposureDetail]
    generated_tasks: List[RevisionTask]
    simulation_timestamp: int
    approved_by: Optional[str] = None
    approval_timestamp: Optional[int] = None
    audit_hash: Optional[str] = None

class ChangeImpactSimulationEngine:
    """
    Working Simulation Engine
    Distinguishes actual dependencies (explicit edges) from inferred relationships (lexical/semantic mentions).
    Allows managers to propose, evaluate, and approve or reject changes.
    """
    def __init__(self):
        self.active_simulations: Dict[str, SimulationReport] = {}

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

        # 3. Build Exposure Details
        touchpoints: List[DependencyExposureDetail] = []
        tasks: List[RevisionTask] = []

        all_affected = [(a_id, "DIRECT_GRAPH_DEPENDENCY") for a_id in direct_asset_ids] + \
                       [(a_id, "INFERRED_LEXICAL_MENTION") for a_id in inferred_asset_ids]

        for asset_id, rel_kind in all_affected:
            node_data = bkg.graph.nodes.get(asset_id, {})
            props = node_data.get("properties", {})
            current_copy = props.get("content", "")
            asset_label = node_data.get("label", asset_id)
            asset_type = node_data.get("type", "ASSET")
            department = props.get("department", "Commercial Operations")
            reviewer_role = props.get("reviewer_role", "Department Lead")

            # Determine Campaign
            camp_id = "CMP-FLEET-01"
            camp_name = "Connected Fleet 2026 Initiative"
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
                    required_human_action=f"Route to {reviewer_role} for explicit sign-off; update {old_val} to {new_val}."
                )
            )

            # Generate Review Task
            task_id = f"TASK-{uuid.uuid4().hex[:6].upper()}"
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
        risk_score = min(100.0, round((direct_cnt * 25.0) + (inferred_cnt * 12.0) + (len(outdated_campaigns) * 10.0), 1))
        risk_tier = SeverityLevel.CRITICAL if risk_score >= 60 else (SeverityLevel.HIGH if risk_score >= 35 else SeverityLevel.MODERATE)

        report = SimulationReport(
            simulation_id=sim_id,
            brand_id=change.brand_id,
            target_record_id=rec_id,
            record_label=change.record_label,
            old_value=old_val,
            proposed_value=new_val,
            status="PROPOSED_PENDING_APPROVAL",
            overall_risk_score=risk_score,
            risk_tier=risk_tier,
            direct_dependencies_count=direct_cnt,
            indirect_dependencies_count=inferred_cnt,
            outdated_campaigns_count=len(outdated_campaigns),
            affected_touchpoints=touchpoints,
            generated_tasks=tasks,
            simulation_timestamp=t_now
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
            sim.approved_by = authorized_reviewer
            sim.approval_timestamp = t_now
            sim.audit_hash = f"BT-COMM-SEAL-{hash(simulation_id + authorized_reviewer + str(t_now)) % 100000000:08X}"

            # Update the underlying node property in BKG
            if sim.target_record_id in bkg.graph:
                bkg.graph.nodes[sim.target_record_id]["properties"]["current_value"] = sim.proposed_value

            return True, f"Change {simulation_id} approved by {authorized_reviewer}. Value '{sim.proposed_value}' is now live in truth-set.", sim
        else:
            sim.status = "REJECTED"
            sim.approved_by = authorized_reviewer
            sim.approval_timestamp = t_now
            return True, f"Change {simulation_id} rejected by {authorized_reviewer}.", sim

simulation_engine = ChangeImpactSimulationEngine()
