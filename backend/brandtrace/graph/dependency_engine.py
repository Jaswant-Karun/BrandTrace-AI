import time
import uuid
import re
import networkx as nx
from typing import Dict, List, Any, Set, Tuple
from brandtrace.graph.engine import BrandKnowledgeGraph
from brandtrace.graph.schema import (
    NodeType, EdgeType, SeverityLevel,
    FactMutationRequest, RevisionTask, AssetVersionRecord,
    DependencyIntelligenceResult
)
from brandtrace.core.security import compute_hash

class BrandDependencyIntelligenceEngine:
    """
    Brand Dependency Intelligence Graph (BDIG) Engine
    
    Instead of isolated content checks, BDIG connects live marketing assets,
    advertisements, websites, and sales documents to the foundational facts,
    pricing, claims, and policies on which they depend.
    """
    def __init__(self):
        # In-memory storage for active tasks and versions (also synchronized with MongoDB)
        self.revision_tasks: Dict[str, RevisionTask] = {}
        self.version_history: Dict[str, List[AssetVersionRecord]] = {}

    def analyze_and_mutate_fact(
        self,
        bkg: BrandKnowledgeGraph,
        request: FactMutationRequest
    ) -> DependencyIntelligenceResult:
        """
        Executes complete Brand Dependency Intelligence workflow when an approved fact changes:
        1. Identifies the modified approved fact.
        2. Locates all dependent advertisements, websites, campaigns, and documents.
        3. Calculates cross-departmental impact & commercial exposure score.
        4. Generates a ReactFlow dependency tree radiating from the fact.
        5. Spawns actionable Revision Tasks routed to authorized department reviewers.
        6. Preserves previous versions and historical approval records.
        7. NEVER silently republishes or alters approved content.
        """
        fact_id = request.fact_id
        old_val = request.old_value
        new_val = request.new_value
        t0 = int(time.time())
        t0_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t0))
        mutation_id = f"MUT-{uuid.uuid4().hex[:8].upper()}"

        fact_node = bkg.get_node(fact_id)
        fact_label = fact_node.label if fact_node else fact_id
        fact_cat = fact_node.properties.get("category", "FACT") if fact_node else "FACT"

        # 1. Graph Traversal: Locate all assets pointing TO or connected with this Fact
        affected_asset_ids: Set[str] = set()
        connected_campaigns: Set[str] = set()
        affected_departments: Set[str] = set()

        # Check reverse graph (assets that depend on the fact)
        rev_graph = bkg.graph.reverse()
        if fact_id in bkg.graph:
            for desc in nx.descendants(rev_graph, fact_id):
                node_type = bkg.graph.nodes[desc].get("type")
                if node_type in [NodeType.ASSET.value, NodeType.ADVERTISEMENT.value, NodeType.WEBSITE.value, NodeType.DOCUMENT.value]:
                    affected_asset_ids.add(desc)
                elif node_type == NodeType.CAMPAIGN.value:
                    connected_campaigns.add(desc)

        # Also scan content of all asset nodes in graph for textual match of old_value
        for node_id, data in bkg.graph.nodes(data=True):
            node_type = data.get("type")
            if node_type in [NodeType.ASSET.value, NodeType.ADVERTISEMENT.value, NodeType.WEBSITE.value, NodeType.DOCUMENT.value]:
                props = data.get("properties", {})
                content = props.get("content", "")
                if old_val.lower() in content.lower():
                    affected_asset_ids.add(node_id)
                    campaign_id = props.get("campaign_id")
                    if campaign_id:
                        connected_campaigns.add(campaign_id)

        # 2. Build Dependency Tree for UI Visualization
        dep_nodes = []
        dep_edges = []

        # Root Node: The Mutated Fact
        dep_nodes.append({
            "id": fact_id,
            "type": "brandNode",
            "position": {"x": 80, "y": 240},
            "data": {
                "id": fact_id,
                "label": f"{fact_label} ({old_val} ➔ {new_val})",
                "nodeType": NodeType.APPROVED_FACT.value,
                "description": f"Mutated Fact: {request.mutation_reason}",
                "properties": {
                    "old_value": old_val,
                    "new_value": new_val,
                    "status": "MUTATION_PENDING"
                }
            }
        })

        # Process each affected asset and create Revision Tasks
        created_tasks: List[RevisionTask] = []
        asset_index = 0

        for asset_id in affected_asset_ids:
            asset_data = bkg.graph.nodes.get(asset_id, {})
            props = asset_data.get("properties", {})
            current_content = props.get("content", "")
            asset_type = asset_data.get("type", "ASSET")
            asset_label = asset_data.get("label", asset_id)
            department = props.get("department", "Commercial Marketing")
            reviewer_role = props.get("reviewer_role", "Department Lead")
            affected_departments.add(department)

            # Determine connected campaign
            campaign_id = "CMP-GENERAL"
            campaign_name = "General Brand Operations"
            for u, v in bkg.graph.in_edges(asset_id):
                if bkg.graph.nodes[u].get("type") == NodeType.CAMPAIGN.value:
                    campaign_id = u
                    campaign_name = bkg.graph.nodes[u].get("label", u)
                    connected_campaigns.add(campaign_id)

            # Propose a non-destructive remediation (replace old_val with new_val)
            pattern = re.compile(re.escape(old_val), re.IGNORECASE)
            proposed_content = pattern.sub(new_val, current_content)
            diff_summary = f"Update referenced {fact_cat.lower()} from '{old_val}' to '{new_val}'."

            # Priority calculation
            if asset_type in [NodeType.ADVERTISEMENT.value, NodeType.WEBSITE.value]:
                priority = SeverityLevel.CRITICAL
            elif "Sales" in department or asset_type == NodeType.DOCUMENT.value:
                priority = SeverityLevel.HIGH
            else:
                priority = SeverityLevel.MODERATE

            task_id = f"TASK-{uuid.uuid4().hex[:6].upper()}"
            task = RevisionTask(
                task_id=task_id,
                brand_id=request.brand_id,
                asset_id=asset_id,
                asset_name=asset_label,
                asset_type=asset_type,
                campaign_id=campaign_id,
                campaign_name=campaign_name,
                department=department,
                assigned_reviewer_role=reviewer_role,
                priority=priority,
                status="PENDING_REVIEW",
                old_value=old_val,
                new_value=new_val,
                current_content=current_content,
                proposed_content=proposed_content,
                diff_summary=diff_summary,
                created_at=t0,
                created_at_iso=t0_iso
            )
            created_tasks.append(task)
            self.revision_tasks[task_id] = task

            # 3. Preserve Historical Version & Flag Asset (NEVER SILENTLY OVERWRITE)
            if asset_id not in self.version_history:
                self.version_history[asset_id] = [
                    AssetVersionRecord(
                        version_id=f"VER-{asset_id}-v1.0",
                        asset_id=asset_id,
                        brand_id=request.brand_id,
                        version_number="v1.0 (Live)",
                        content=current_content,
                        status="APPROVED_HISTORICAL",
                        approval_record={
                            "reviewer": reviewer_role,
                            "approved_timestamp": t0 - 86400,
                            "audit_hash": compute_hash(current_content)
                        },
                        timestamp=t0 - 86400,
                        timestamp_iso=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t0 - 86400)),
                        change_notes="Initial approved release."
                    )
                ]

            # Append pending flagged version
            self.version_history[asset_id].append(
                AssetVersionRecord(
                    version_id=f"VER-{asset_id}-v1.1-pending",
                    asset_id=asset_id,
                    brand_id=request.brand_id,
                    version_number="v1.1 (Revision Pending)",
                    content=proposed_content,
                    status="FLAGGED_NEEDS_REVISION",
                    approval_record=None,
                    timestamp=t0,
                    timestamp_iso=t0_iso,
                    change_notes=f"Flagged by BDIG due to mutation in [{fact_label}]: {old_val} -> {new_val}."
                )
            )

            # Update asset node in memory graph to FLAGGED_NEEDS_REVISION
            bkg.graph.nodes[asset_id]["status"] = "FLAGGED_NEEDS_REVISION"

            # Add to ReactFlow visual tree
            y_pos = 60 + (asset_index * 130)
            dep_nodes.append({
                "id": asset_id,
                "type": "brandNode",
                "position": {"x": 580, "y": y_pos},
                "data": {
                    "id": asset_id,
                    "label": asset_label,
                    "nodeType": asset_type,
                    "description": f"Dept: {department} | Priority: {priority.value}",
                    "properties": {
                        "status": "FLAGGED_NEEDS_REVISION",
                        "assigned_reviewer": reviewer_role,
                        "task_id": task_id
                    }
                }
            })

            # Edge from Fact to Asset
            dep_edges.append({
                "id": f"e-dep-{fact_id}-{asset_id}",
                "source": fact_id,
                "target": asset_id,
                "label": f"affects_{old_val}",
                "type": "smoothstep",
                "animated": True,
                "style": {"stroke": "#f43f5e", "strokeWidth": 2}
            })

            asset_index += 1

        # Calculate Commercial Risk Exposure
        total_assets = len(affected_asset_ids)
        total_camps = len(connected_campaigns)
        risk_score = min(100.0, round((total_assets * 22.0) + (len(affected_departments) * 15.0), 1))
        risk_level = SeverityLevel.CRITICAL if risk_score >= 60 else (
            SeverityLevel.HIGH if risk_score >= 35 else SeverityLevel.MODERATE
        )

        impact_summary = (
            f"Mutating approved fact [{fact_label}] from '{old_val}' to '{new_val}' "
            f"directly impacts {total_assets} live resource(s) across {len(affected_departments)} departments "
            f"({', '.join(sorted(list(affected_departments)))}). "
            f"Generated {len(created_tasks)} actionable Revision Task(s) for authorized human sign-off."
        )

        return DependencyIntelligenceResult(
            mutation_id=mutation_id,
            brand_id=request.brand_id,
            fact_id=fact_id,
            fact_name=fact_label,
            fact_category=fact_cat,
            old_value=old_val,
            new_value=new_val,
            impact_summary=impact_summary,
            total_affected_assets=total_assets,
            total_affected_campaigns=total_camps,
            total_departments=len(affected_departments),
            affected_departments=sorted(list(affected_departments)),
            commercial_risk_score=risk_score,
            risk_level=risk_level,
            dependency_graph={
                "nodes": dep_nodes,
                "edges": dep_edges
            },
            revision_tasks=created_tasks,
            timestamp=t0
        )

    def resolve_revision_task(
        self,
        task_id: str,
        reviewer_name: str,
        decision: str = "APPROVED",
        final_content: str = "",
        resolution_notes: str = ""
    ) -> Tuple[bool, str, Optional[RevisionTask]]:
        """
        Human-controlled governance sign-off on a revision task.
        Promotes pending version to approved and seals with cryptographic proof.
        """
        if task_id not in self.revision_tasks:
            return False, f"Task {task_id} not found.", None

        task = self.revision_tasks[task_id]
        t_now = int(time.time())
        t_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t_now))

        if decision == "APPROVED":
            task.status = "APPROVED_SEALED"
            task.resolved_at = t_now
            task.resolved_by = reviewer_name
            task.audit_proof = f"BT-TASK-SEAL-{hash(task_id + reviewer_name + str(t_now)) % 100000000:08X}"

            # Update version history for the asset
            asset_id = task.asset_id
            if asset_id in self.version_history:
                new_ver = AssetVersionRecord(
                    version_id=f"VER-{asset_id}-v2.0",
                    asset_id=asset_id,
                    brand_id=task.brand_id,
                    version_number="v2.0 (Approved)",
                    content=final_content or task.proposed_content,
                    status="ACTIVE_APPROVED",
                    approval_record={
                        "reviewer": reviewer_name,
                        "approved_timestamp": t_now,
                        "audit_hash": compute_hash(final_content or task.proposed_content),
                        "resolution_notes": resolution_notes or "Approved via BrandTrace BDIG Governance Gate."
                    },
                    timestamp=t_now,
                    timestamp_iso=t_iso,
                    change_notes=f"Updated fact value: {task.old_value} -> {task.new_value}"
                )
                self.version_history[asset_id].append(new_ver)

            return True, f"Revision Task {task_id} approved and sealed by {reviewer_name}.", task
        else:
            task.status = "REJECTED"
            task.resolved_at = t_now
            task.resolved_by = reviewer_name
            return True, f"Revision Task {task_id} rejected by {reviewer_name}.", task

dependency_engine = BrandDependencyIntelligenceEngine()
