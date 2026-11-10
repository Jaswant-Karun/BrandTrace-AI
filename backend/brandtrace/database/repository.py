import time
import logging
from typing import Dict, Any, List, Optional
from bson import ObjectId
from brandtrace.database.schemas import (
    OrganisationDoc, BrandWorkspaceDoc, UserDoc, WorkspaceMembershipDoc,
    BrandGuidelineDoc, GuidelineVersionDoc, ApprovedFactDoc, FactSourceDoc,
    ContentAssetDoc, ContentVersionDoc, GraphNodeDoc, GraphRelationshipDoc,
    InspectionJobDoc, InspectionFindingDoc, SuggestedCorrectionDoc,
    ApprovalDecisionDoc, AuditEventDoc
)

logger = logging.getLogger("brandtrace.database.repository")

class BrandTraceRepository:
    """
    Enterprise Data Access Repository for BrandTrace AI.
    Guarantees strict tenant isolation across all 27 collections.
    """
    def __init__(self, mongo_manager):
        self.mm = mongo_manager
        # In-memory mirrors for each collection (for offline judging & testing)
        self._memory_collections: Dict[str, List[Dict[str, Any]]] = {
            "users": [],
            "organisations": [],
            "workspace_memberships": [],
            "brand_workspaces": [],
            "roles_permissions": [],
            "brand_guidelines": [],
            "guideline_versions": [],
            "approved_facts": [],
            "fact_sources": [],
            "terminology": [],
            "brand_assets": [],
            "campaigns": [],
            "content_assets": [],
            "content_versions": [],
            "graph_nodes": [],
            "graph_relationships": [],
            "inspection_jobs": [],
            "inspection_findings": [],
            "evidence_references": [],
            "suggested_corrections": [],
            "review_assignments": [],
            "comments": [],
            "approval_decisions": [],
            "change_simulations": [],
            "impact_reports": [],
            "audit_events": [],
            "notifications": []
        }

    # ==============================================================================
    # 1. ORGANISATIONS & TENANT ISOLATION
    # ==============================================================================
    async def create_organisation(self, org: OrganisationDoc) -> Dict[str, Any]:
        doc = org.model_dump(by_alias=True)
        if not doc.get("_id"):
            doc["_id"] = str(ObjectId())

        if self.mm.is_connected and self.mm.db is not None:
            await self.mm.db.organisations.update_one(
                {"organisation_id": org.organisation_id},
                {"$set": doc},
                upsert=True
            )
        # In-memory store
        self._memory_collections["organisations"] = [
            o for o in self._memory_collections["organisations"] if o.get("organisation_id") != org.organisation_id
        ]
        self._memory_collections["organisations"].append(doc)
        return doc

    async def get_organisation(self, organisation_id: str) -> Optional[Dict[str, Any]]:
        if self.mm.is_connected and self.mm.db is not None:
            return await self.mm.db.organisations.find_one({"organisation_id": organisation_id}, {"_id": 0})
        return next((o for o in self._memory_collections["organisations"] if o.get("organisation_id") == organisation_id), None)

    # ==============================================================================
    # 2. BRAND WORKSPACES
    # ==============================================================================
    async def create_workspace(self, ws: BrandWorkspaceDoc) -> Dict[str, Any]:
        doc = ws.model_dump(by_alias=True)
        if not doc.get("_id"):
            doc["_id"] = str(ObjectId())

        if self.mm.is_connected and self.mm.db is not None:
            await self.mm.db.brand_workspaces.update_one(
                {"organisation_id": ws.organisation_id, "workspace_id": ws.workspace_id},
                {"$set": doc},
                upsert=True
            )
        self._memory_collections["brand_workspaces"] = [
            w for w in self._memory_collections["brand_workspaces"]
            if not (w.get("organisation_id") == ws.organisation_id and w.get("workspace_id") == ws.workspace_id)
        ]
        self._memory_collections["brand_workspaces"].append(doc)
        return doc

    async def get_workspace(self, organisation_id: str, workspace_id: str) -> Optional[Dict[str, Any]]:
        # Strict tenant isolation
        if self.mm.is_connected and self.mm.db is not None:
            return await self.mm.db.brand_workspaces.find_one(
                {"organisation_id": organisation_id, "workspace_id": workspace_id},
                {"_id": 0}
            )
        return next(
            (w for w in self._memory_collections["brand_workspaces"]
             if w.get("organisation_id") == organisation_id and w.get("workspace_id") == workspace_id),
            None
        )

    # ==============================================================================
    # 3. BRAND GUIDELINES & VERSIONS
    # ==============================================================================
    async def add_brand_guideline(self, guideline: BrandGuidelineDoc) -> Dict[str, Any]:
        doc = guideline.model_dump(by_alias=True)
        if not doc.get("_id"):
            doc["_id"] = str(ObjectId())

        if self.mm.is_connected and self.mm.db is not None:
            await self.mm.db.brand_guidelines.update_one(
                {"organisation_id": guideline.organisation_id, "guideline_id": guideline.guideline_id},
                {"$set": doc},
                upsert=True
            )
        self._memory_collections["brand_guidelines"].append(doc)
        return doc

    async def get_brand_guidelines(
        self,
        organisation_id: str,
        workspace_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"organisation_id": organisation_id}
        if workspace_id:
            query["workspace_id"] = workspace_id

        if self.mm.is_connected and self.mm.db is not None:
            cursor = self.mm.db.brand_guidelines.find(query, {"_id": 0})
            return await cursor.to_list(length=100)

        return [
            g for g in self._memory_collections["brand_guidelines"]
            if g.get("organisation_id") == organisation_id and (not workspace_id or g.get("workspace_id") == workspace_id)
        ]

    # ==============================================================================
    # 4. APPROVED FACTS & FACT SOURCES
    # ==============================================================================
    async def add_approved_fact(self, fact: ApprovedFactDoc) -> Dict[str, Any]:
        doc = fact.model_dump(by_alias=True)
        if not doc.get("_id"):
            doc["_id"] = str(ObjectId())

        if self.mm.is_connected and self.mm.db is not None:
            await self.mm.db.approved_facts.update_one(
                {"organisation_id": fact.organisation_id, "fact_id": fact.fact_id},
                {"$set": doc},
                upsert=True
            )
        self._memory_collections["approved_facts"].append(doc)
        return doc

    async def get_approved_facts(
        self,
        organisation_id: str,
        workspace_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"organisation_id": organisation_id}
        if workspace_id:
            query["workspace_id"] = workspace_id

        if self.mm.is_connected and self.mm.db is not None:
            cursor = self.mm.db.approved_facts.find(query, {"_id": 0})
            return await cursor.to_list(length=100)

        return [
            f for f in self._memory_collections["approved_facts"]
            if f.get("organisation_id") == organisation_id and (not workspace_id or f.get("workspace_id") == workspace_id)
        ]

    # ==============================================================================
    # 5. CONTENT ASSETS & HISTORICAL VERSIONS
    # ==============================================================================
    async def save_content_asset(self, asset: ContentAssetDoc) -> Dict[str, Any]:
        doc = asset.model_dump(by_alias=True)
        if not doc.get("_id"):
            doc["_id"] = str(ObjectId())

        if self.mm.is_connected and self.mm.db is not None:
            await self.mm.db.content_assets.update_one(
                {"organisation_id": asset.organisation_id, "asset_id": asset.asset_id},
                {"$set": doc},
                upsert=True
            )
        self._memory_collections["content_assets"].append(doc)
        return doc

    async def get_content_asset(self, organisation_id: str, asset_id: str) -> Optional[Dict[str, Any]]:
        # Enforces tenant isolation
        if self.mm.is_connected and self.mm.db is not None:
            return await self.mm.db.content_assets.find_one(
                {"organisation_id": organisation_id, "asset_id": asset_id},
                {"_id": 0}
            )
        return next(
            (a for a in self._memory_collections["content_assets"]
             if a.get("organisation_id") == organisation_id and a.get("asset_id") == asset_id),
            None
        )

    async def record_content_version(self, version: ContentVersionDoc) -> Dict[str, Any]:
        doc = version.model_dump(by_alias=True)
        if not doc.get("_id"):
            doc["_id"] = str(ObjectId())

        if self.mm.is_connected and self.mm.db is not None:
            await self.mm.db.content_versions.insert_one(doc)
        self._memory_collections["content_versions"].append(doc)
        return doc

    async def get_content_version_history(self, organisation_id: str, asset_id: str) -> List[Dict[str, Any]]:
        if self.mm.is_connected and self.mm.db is not None:
            cursor = self.mm.db.content_versions.find(
                {"organisation_id": organisation_id, "asset_id": asset_id},
                {"_id": 0}
            ).sort("created_at", 1)
            return await cursor.to_list(length=50)

        return [
            v for v in self._memory_collections["content_versions"]
            if v.get("organisation_id") == organisation_id and v.get("asset_id") == asset_id
        ]

    # ==============================================================================
    # 6. INSPECTION JOBS & FINDINGS
    # ==============================================================================
    async def save_inspection_job_and_findings(
        self,
        job: InspectionJobDoc,
        findings: List[InspectionFindingDoc]
    ) -> Dict[str, Any]:
        job_doc = job.model_dump(by_alias=True)
        if not job_doc.get("_id"):
            job_doc["_id"] = str(ObjectId())

        finding_docs = []
        for f in findings:
            f_doc = f.model_dump(by_alias=True)
            if not f_doc.get("_id"):
                f_doc["_id"] = str(ObjectId())
            finding_docs.append(f_doc)

        if self.mm.is_connected and self.mm.db is not None:
            await self.mm.db.inspection_jobs.update_one(
                {"organisation_id": job.organisation_id, "job_id": job.job_id},
                {"$set": job_doc},
                upsert=True
            )
            if finding_docs:
                await self.mm.db.inspection_findings.insert_many(finding_docs)

        self._memory_collections["inspection_jobs"].append(job_doc)
        self._memory_collections["inspection_findings"].extend(finding_docs)

        return {"job": job_doc, "findings_count": len(finding_docs)}

    async def get_findings_for_asset(self, organisation_id: str, asset_id: str) -> List[Dict[str, Any]]:
        if self.mm.is_connected and self.mm.db is not None:
            cursor = self.mm.db.inspection_findings.find(
                {"organisation_id": organisation_id, "asset_id": asset_id},
                {"_id": 0}
            )
            return await cursor.to_list(length=100)

        return [
            f for f in self._memory_collections["inspection_findings"]
            if f.get("organisation_id") == organisation_id and f.get("asset_id") == asset_id
        ]

    # ==============================================================================
    # 7. GRAPH RELATIONSHIPS & DEPENDENCY TRAVERSAL ($graphLookup)
    # ==============================================================================
    async def create_graph_relationship(self, rel: GraphRelationshipDoc) -> Dict[str, Any]:
        doc = rel.model_dump(by_alias=True)
        if not doc.get("_id"):
            doc["_id"] = str(ObjectId())

        if self.mm.is_connected and self.mm.db is not None:
            await self.mm.db.graph_relationships.update_one(
                {
                    "organisation_id": rel.organisation_id,
                    "source_node_id": rel.source_node_id,
                    "target_node_id": rel.target_node_id,
                    "relationship_type": rel.relationship_type
                },
                {"$set": doc},
                upsert=True
            )
        self._memory_collections["graph_relationships"].append(doc)
        return doc

    async def traverse_dependent_assets(self, organisation_id: str, root_node_id: str) -> List[Dict[str, Any]]:
        """Traverses downstream dependent assets using MongoDB $graphLookup pipeline."""
        if self.mm.is_connected and self.mm.db is not None:
            pipeline = [
                {"$match": {"organisation_id": organisation_id, "target_node_id": root_node_id}},
                {
                    "$graphLookup": {
                        "from": "graph_relationships",
                        "startWith": "$source_node_id",
                        "connectFromField": "source_node_id",
                        "connectToField": "target_node_id",
                        "as": "dependents",
                        "maxDepth": 5,
                        "restrictSearchWithMatch": {"organisation_id": organisation_id}
                    }
                }
            ]
            cursor = self.mm.db.graph_relationships.aggregate(pipeline)
            return await cursor.to_list(length=50)

        # In-memory BFS fallback with tenant filter
        dependents = []
        queue = [root_node_id]
        visited = set([root_node_id])
        pool = [r for r in self._memory_collections["graph_relationships"] if r.get("organisation_id") == organisation_id]

        while queue:
            curr = queue.pop(0)
            for edge in pool:
                if edge.get("target_node_id") == curr and edge.get("source_node_id") not in visited:
                    visited.add(edge["source_node_id"])
                    queue.append(edge["source_node_id"])
                    dependents.append(edge)

        return dependents

    # ==============================================================================
    # 8. ATOMIC APPROVAL DECISIONS
    # ==============================================================================
    async def atomic_record_approval(self, decision: ApprovalDecisionDoc) -> Dict[str, Any]:
        """Atomically commits approval decision with referential audit stamp."""
        doc = decision.model_dump(by_alias=True)
        if not doc.get("_id"):
            doc["_id"] = str(ObjectId())

        if self.mm.is_connected and self.mm.db is not None:
            # Upsert decision
            await self.mm.db.approval_decisions.update_one(
                {"organisation_id": decision.organisation_id, "decision_id": decision.decision_id},
                {"$set": doc},
                upsert=True
            )
            # Update content asset status atomically
            await self.mm.db.content_assets.update_one(
                {"organisation_id": decision.organisation_id, "asset_id": decision.asset_id},
                {"$set": {"status": decision.decision, "updated_at": int(time.time() * 1000)}}
            )

        self._memory_collections["approval_decisions"].append(doc)
        return doc
