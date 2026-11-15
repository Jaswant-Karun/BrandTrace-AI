import networkx as nx
from typing import Dict, List, Optional, Any, Set
from brandtrace.graph.schema import (
    BrandGraphData, Node, Edge, NodeType, EdgeType,
    BlastRadiusResponse, BlastRadiusTarget, SeverityLevel
)

class BrandKnowledgeGraph:
    def __init__(self, brand_id: str, brand_name: str, industry: Optional[str] = None, description: Optional[str] = None):
        self.brand_id = brand_id
        self.brand_name = brand_name
        self.industry: Optional[str] = industry
        self.description: Optional[str] = description
        self.graph = nx.DiGraph()
        self.node_meta: Dict[str, Node] = {}
        self.edge_meta: List[Edge] = []

    @classmethod
    def from_graph_data(cls, data: BrandGraphData) -> "BrandKnowledgeGraph":
        bkg = cls(brand_id=data.brand_id, brand_name=data.brand_name)
        bkg.industry = data.industry
        bkg.description = data.description
        for node in data.nodes:
            bkg.add_node(node)
        for edge in data.edges:
            bkg.add_edge(edge)
        return bkg

    def add_node(self, node: Node):
        self.node_meta[node.id] = node
        self.graph.add_node(
            node.id,
            label=node.label,
            type=node.type.value,
            category=node.category,
            description=node.description,
            properties=node.properties,
            status=node.status
        )

    def add_edge(self, edge: Edge):
        self.edge_meta.append(edge)
        self.graph.add_edge(
            edge.source,
            edge.target,
            type=edge.type.value,
            label=edge.label or edge.type.value,
            properties=edge.properties
        )

    def get_node(self, node_id: str) -> Optional[Node]:
        return self.node_meta.get(node_id)

    def update_node_property(self, node_id: str, key: str, value: Any):
        if node_id in self.node_meta:
            self.node_meta[node_id].properties[key] = value
        if node_id in self.graph.nodes:
            if "properties" not in self.graph.nodes[node_id]:
                self.graph.nodes[node_id]["properties"] = {}
            self.graph.nodes[node_id]["properties"][key] = value

    def to_graph_data(self) -> BrandGraphData:
        return BrandGraphData(
            brand_id=self.brand_id,
            brand_name=self.brand_name,
            industry=getattr(self, "industry", "Enterprise Technology"),
            description=getattr(self, "description", "Enterprise Brand Profile"),
            nodes=list(self.node_meta.values()),
            edges=self.edge_meta
        )

    def to_react_flow_elements(self) -> Dict[str, Any]:
        """
        Serializes graph to ReactFlow canvas nodes and edges with coordinates and styling.
        """
        flow_nodes = []
        flow_edges = []
        
        # Grid layout positioning based on node type layers
        layer_x = {
            NodeType.REGULATION.value: 80,
            NodeType.PROHIBITED_CLAIM.value: 80,
            NodeType.BRAND.value: 380,
            NodeType.PILLAR.value: 680,
            NodeType.TRADEMARK.value: 680,
            NodeType.TONE_ATTRIBUTE.value: 980,
            NodeType.APPROVED_CLAIM.value: 980,
            NodeType.CAMPAIGN.value: 1280,
            NodeType.ASSET.value: 1600,
            NodeType.CHANNEL.value: 1900,
        }
        
        layer_counts: Dict[str, int] = {}
        
        for node_id, data in self.graph.nodes(data=True):
            ntype = data.get("type", "ASSET")
            count = layer_counts.get(ntype, 0)
            layer_counts[ntype] = count + 1
            
            x = layer_x.get(ntype, 500)
            y = 80 + count * 140

            flow_nodes.append({
                "id": node_id,
                "type": "brandNode",
                "position": {"x": x, "y": y},
                "data": {
                    "id": node_id,
                    "label": data.get("label", node_id),
                    "nodeType": ntype,
                    "description": data.get("description", ""),
                    "properties": data.get("properties", {}),
                    "status": data.get("status", "active")
                }
            })

        for u, v, data in self.graph.edges(data=True):
            edge_type = data.get("type", "DEPENDS_ON")
            flow_edges.append({
                "id": f"e-{u}-{v}-{edge_type}",
                "source": u,
                "target": v,
                "label": data.get("label", edge_type),
                "type": "smoothstep",
                "animated": edge_type in [EdgeType.CONSTRAINS.value, EdgeType.CONTAINS_CLAIM.value],
                "data": {"edgeType": edge_type}
            })

        return {
            "brand_id": self.brand_id,
            "brand_name": self.brand_name,
            "total_nodes": len(flow_nodes),
            "total_edges": len(flow_edges),
            "nodes": flow_nodes,
            "edges": flow_edges
        }

    def traverse_dependencies(
        self,
        start_node_id: str,
        direction: str = "BOTH" # "DOWNSTREAM", "UPSTREAM", "BOTH"
    ) -> Dict[str, Any]:
        """
        Intelligent graph traversal connecting guidelines, approved facts, marketing claims,
        campaigns, documents, visual assets, and content versions with evidence-backed relationships.
        """
        if start_node_id not in self.graph:
            return {
                "start_node_id": start_node_id,
                "found": False,
                "upstream_nodes": [],
                "downstream_nodes": [],
                "evidence_citations": [],
                "subgraph_node_ids": [],
                "subgraph_edge_ids": []
            }

        start_meta = self.get_node(start_node_id)
        upstream_nodes: List[Dict[str, Any]] = []
        downstream_nodes: List[Dict[str, Any]] = []
        evidence_citations: List[Dict[str, Any]] = []
        subgraph_nodes: Set[str] = {start_node_id}
        subgraph_edges: List[str] = []

        rev_graph = self.graph.reverse()

        # 1. Downstream Traversal (Assets, Campaigns, Documents that depend on or cite this node)
        if direction in ["DOWNSTREAM", "BOTH"]:
            for target in nx.descendants(rev_graph, start_node_id):
                subgraph_nodes.add(target)
                node_data = self.graph.nodes[target]
                downstream_nodes.append({
                    "id": target,
                    "label": node_data.get("label", target),
                    "type": node_data.get("type"),
                    "properties": node_data.get("properties", {})
                })

            for u, v, data in self.graph.edges(data=True):
                if u in subgraph_nodes and v in subgraph_nodes:
                    edge_id = f"{u}->{v}"
                    subgraph_edges.append(edge_id)
                    evidence = data.get("properties", {}).get("citation") or data.get("label") or data.get("type")
                    if evidence:
                        evidence_citations.append({
                            "source_node": u,
                            "target_node": v,
                            "relationship": data.get("type", "DEPENDS_ON"),
                            "evidence": evidence
                        })

        # 2. Upstream Traversal (Ground truth, Regulations, Pillars, Facts that govern this node)
        if direction in ["UPSTREAM", "BOTH"]:
            for source in nx.descendants(self.graph, start_node_id):
                subgraph_nodes.add(source)
                node_data = self.graph.nodes[source]
                upstream_nodes.append({
                    "id": source,
                    "label": node_data.get("label", source),
                    "type": node_data.get("type"),
                    "properties": node_data.get("properties", {})
                })

        return {
            "start_node_id": start_node_id,
            "start_node_label": start_meta.label if start_meta else start_node_id,
            "start_node_type": start_meta.type if start_meta else "UNKNOWN",
            "found": True,
            "total_connected_nodes": len(subgraph_nodes),
            "upstream_count": len(upstream_nodes),
            "downstream_count": len(downstream_nodes),
            "upstream_nodes": upstream_nodes,
            "downstream_nodes": downstream_nodes,
            "evidence_citations": evidence_citations,
            "subgraph_node_ids": list(subgraph_nodes),
            "subgraph_edge_ids": subgraph_edges
        }

    def simulate_blast_radius(
        self,
        mutated_node_id: str,
        mutation_type: str = "POLICY_AMENDMENT",
        mutation_notes: str = ""
    ) -> BlastRadiusResponse:
        """
        Calculates cascading blast radius when a policy, guideline, or claim is mutated.
        Traverses downstream dependencies using graph reachability.
        """
        if mutated_node_id not in self.graph:
            return BlastRadiusResponse(
                mutated_node_id=mutated_node_id,
                mutation_type=mutation_type,
                total_affected_assets=0,
                total_affected_campaigns=0,
                overall_risk_score=0.0,
                impact_tier=SeverityLevel.LOW,
                affected_targets=[],
                summary_rationale=f"Node {mutated_node_id} not found in knowledge graph."
            )

        mutated_meta = self.get_node(mutated_node_id)
        mutated_label = mutated_meta.label if mutated_meta else mutated_node_id

        # Bidirectional graph for dependency resolution:
        # Assets may point TO claims (AST -> AC), or Campaigns point TO Assets (CMP -> AST).
        # We find all connected components where target is an ASSET or CAMPAIGN.
        affected_assets: Set[str] = set()
        traversal_paths: Dict[str, List[str]] = {}

        # 1. Forward traversal
        for desc in nx.descendants(self.graph, mutated_node_id):
            if self.graph.nodes[desc].get("type") == NodeType.ASSET.value:
                affected_assets.add(desc)
                try:
                    path = nx.shortest_path(self.graph, mutated_node_id, desc)
                    traversal_paths[desc] = path
                except Exception:
                    traversal_paths[desc] = [mutated_node_id, desc]

        # 2. Reverse traversal (dependencies pointing into the mutated node)
        rev_graph = self.graph.reverse()
        for desc in nx.descendants(rev_graph, mutated_node_id):
            if self.graph.nodes[desc].get("type") == NodeType.ASSET.value:
                affected_assets.add(desc)
                try:
                    path = nx.shortest_path(rev_graph, mutated_node_id, desc)
                    traversal_paths[desc] = list(reversed(path))
                except Exception:
                    traversal_paths[desc] = [desc, mutated_node_id]

        targets: List[BlastRadiusTarget] = []
        affected_campaigns: Set[str] = set()
        critical_count = 0
        high_count = 0

        for asset_id in affected_assets:
            asset_data = self.graph.nodes[asset_id]
            props = asset_data.get("properties", {})
            campaign_id = props.get("campaign_id", "CMP-GENERAL")
            affected_campaigns.add(campaign_id)
            
            campaign_name = "Campaign"
            if campaign_id in self.graph:
                campaign_name = self.graph.nodes[campaign_id].get("label", campaign_id)
            
            asset_status = props.get("status", "ACTIVE")
            channel = props.get("channel", "Digital")
            
            # Severity calculation based on live exposure
            if asset_status in ["APPROVED", "LIVE"]:
                exposure = SeverityLevel.CRITICAL
                critical_count += 1
            elif "OOH" in channel or "Billboard" in channel:
                exposure = SeverityLevel.CRITICAL
                critical_count += 1
            else:
                exposure = SeverityLevel.HIGH
                high_count += 1

            targets.append(
                BlastRadiusTarget(
                    asset_id=asset_id,
                    asset_name=asset_data.get("label", asset_id),
                    campaign_id=campaign_id,
                    campaign_name=campaign_name,
                    channel=channel,
                    current_status=asset_status,
                    exposure_level=exposure,
                    traversal_path=traversal_paths.get(asset_id, [mutated_node_id, asset_id]),
                    citation_rule=f"Policy Clause: {mutated_label}",
                    remediation_required=f"Re-verify copy and replace/qualify claim impacted by [{mutated_label}]."
                )
            )

        # Calculate overall blast score
        total_targets = len(targets)
        if total_targets == 0:
            overall_score = 0.0
            overall_tier = SeverityLevel.LOW
        else:
            base_score = min(100.0, (critical_count * 30.0) + (high_count * 15.0) + (len(affected_campaigns) * 10.0))
            overall_score = round(base_score, 1)
            if overall_score >= 70:
                overall_tier = SeverityLevel.CRITICAL
            elif overall_score >= 40:
                overall_tier = SeverityLevel.HIGH
            elif overall_score >= 20:
                overall_tier = SeverityLevel.MODERATE
            else:
                overall_tier = SeverityLevel.LOW

        summary = (
            f"Mutating [{mutated_label}] exposes {total_targets} downstream touchpoint(s) "
            f"across {len(affected_campaigns)} active campaign(s). "
            f"Cascading Risk Score: {overall_score}/100 ({overall_tier.value})."
        )

        return BlastRadiusResponse(
            mutated_node_id=mutated_node_id,
            mutation_type=mutation_type,
            total_affected_assets=total_targets,
            total_affected_campaigns=len(affected_campaigns),
            overall_risk_score=overall_score,
            impact_tier=overall_tier,
            affected_targets=targets,
            summary_rationale=summary
        )

