import logging
import time
import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from brandtrace.modules.knowledge_base.models import (
    VectorSearchQuery, VectorSearchResult, AtlasIndexConfigResponse,
    CreateFactRequest, ApprovedFactResponse
)
from brandtrace.database.mongo import mongo_manager
from brandtrace.database.schemas import ApprovedFactDoc
from brandtrace.graph.schema import ApprovedFact, GraphNode
from brandtrace.engine.ai_provider import ai_provider
from brandtrace.data.seed_data import APPROVED_FACTS_CATALOG

logger = logging.getLogger("brandtrace.knowledge_base")
router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base & Vector Search"])

@router.post("/vector-search", response_model=List[VectorSearchResult])
async def execute_vector_search(query: VectorSearchQuery):
    """
    Executes MongoDB Atlas Vector Search ($vectorSearch).
    1. Computes 768-dim embedding for query_text.
    2. Runs $vectorSearch in MongoDB Atlas with tenant isolation (org_id, workspace_id).
    3. Returns top verified matching brand guidelines and approved facts.
    """
    # 1. Ensure embeddings exist for the tenant
    if len(mongo_manager._memory_embeddings) == 0:
        await seed_brand_vector_embeddings(query.org_id, query.workspace_id)

    # 2. Generate embedding
    query_vector = await ai_provider.get_embedding(query.query_text)

    # 3. Query MongoDB Atlas
    results = await mongo_manager.vector_search_knowledge(
        org_id=query.org_id,
        workspace_id=query.workspace_id,
        query_vector=query_vector,
        limit=query.limit,
        min_score=query.min_score
    )

    formatted = []
    for r in results:
        formatted.append(VectorSearchResult(
            node_id=r.get("node_id", "NODE-01"),
            label=r.get("label", ""),
            node_type=r.get("node_type", "APPROVED_FACT"),
            description=r.get("description", ""),
            score=r.get("score", 0.85),
            org_id=query.org_id,
            workspace_id=query.workspace_id
        ))
    return formatted

@router.get("/atlas-index-config", response_model=AtlasIndexConfigResponse)
async def get_atlas_vector_index_config():
    """
    Returns the exact MongoDB Atlas Search JSON index definition for Vector Search.
    Used for configuring or verifying the Atlas Cluster Vector Index.
    """
    atlas_def = {
        "fields": [
            {
                "type": "vector",
                "path": "embedding",
                "numDimensions": 768,
                "similarity": "cosine"
            },
            {
                "type": "filter",
                "path": "org_id"
            },
            {
                "type": "filter",
                "path": "workspace_id"
            }
        ]
    }
    return AtlasIndexConfigResponse(
        index_name="vector_index",
        collection_name="knowledge_nodes",
        dimensions=768,
        similarity_metric="cosine",
        atlas_json_definition=atlas_def,
        status="CONFIGURED_AND_INDEXED",
        is_live_atlas_connected=mongo_manager.is_connected
    )

@router.post("/seed-embeddings")
async def seed_brand_vector_embeddings(org_id: str = "ORG-APEX", workspace_id: str = "apex-dynamics"):
    """
    Pre-indexes vector embeddings for the approved brand truth-set into MongoDB Atlas.
    """
    from brandtrace.data.seed_data import BRAND_SEEDS
    count = 0

    # 1. Index approved facts
    for fact in APPROVED_FACTS_CATALOG.values():
        if fact.brand_id == workspace_id:
            text_to_embed = f"{fact.category}: {fact.name} {fact.current_value} - {fact.description} (Source: {fact.source_citation})"
            vec = await ai_provider.get_embedding(text_to_embed)
            record = {
                "node_id": fact.id,
                "org_id": org_id,
                "workspace_id": workspace_id,
                "label": f"{fact.name}: {fact.current_value}",
                "node_type": "APPROVED_FACT",
                "description": fact.description,
                "embedding": vec
            }
            await mongo_manager.save_embedding_record(record)
            count += 1

    # 2. Index brand graph nodes (claims, specs, guidelines)
    if workspace_id in BRAND_SEEDS:
        seed_data = BRAND_SEEDS[workspace_id]
        for node in seed_data.nodes:
            text_to_embed = f"{node.type}: {node.label} - {node.description or ''}"
            vec = await ai_provider.get_embedding(text_to_embed)
            record = {
                "node_id": node.id,
                "org_id": org_id,
                "workspace_id": workspace_id,
                "label": node.label,
                "node_type": node.type,
                "description": node.description or "",
                "embedding": vec
            }
            await mongo_manager.save_embedding_record(record)
            count += 1

    return {"status": "success", "indexed_nodes_count": count, "org_id": org_id, "workspace_id": workspace_id}

@router.post("/facts", response_model=ApprovedFactResponse)
async def create_approved_fact(req: CreateFactRequest):
    """
    Registers a new approved brand fact in MongoDB Atlas (approved_facts collection),
    updates the in-memory catalog, registers the graph node, and computes vector embeddings.
    """
    fact_id = req.fact_id or f"FACT-{req.workspace_id[:3].upper()}-{int(time.time() * 1000) % 100000:05d}"
    org_id = req.org_id or ("ORG-AURELLE" if "aurelle" in req.workspace_id else "ORG-APEX")
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # 1. Save to MongoDB Atlas Repository
    fact_doc = ApprovedFactDoc(
        fact_id=fact_id,
        organisation_id=org_id,
        workspace_id=req.workspace_id,
        fact_name=req.name,
        category=req.category,
        current_value=req.current_value,
        unit=req.unit or "",
        description=req.description,
        source_citation=req.source_citation,
        department_owner=req.department_owner,
        status="ACTIVE",
        created_at=now_iso,
        updated_at=now_iso
    )
    await mongo_manager.repo.add_approved_fact(fact_doc)
    
    # 2. Update Catalog & Knowledge Graph
    fact_obj = ApprovedFact(
        id=fact_id,
        brand_id=req.workspace_id,
        name=req.name,
        category=req.category,
        current_value=req.current_value,
        unit=req.unit or "",
        description=req.description,
        source_citation=req.source_citation,
        department_owner=req.department_owner,
        effective_from=now_iso
    )
    APPROVED_FACTS_CATALOG[fact_id] = fact_obj
    
    from brandtrace.data.seed_data import BRAND_SEEDS
    if req.workspace_id in BRAND_SEEDS:
        node = GraphNode(
            id=fact_id,
            label=f"{req.name}: {req.current_value}",
            type="APPROVED_FACT",
            description=req.description,
            properties={
                "current_value": req.current_value,
                "citation": req.source_citation,
                "department_owner": req.department_owner
            }
        )
        existing_idx = next((i for i, n in enumerate(BRAND_SEEDS[req.workspace_id].nodes) if n.id == fact_id), None)
        if existing_idx is not None:
            BRAND_SEEDS[req.workspace_id].nodes[existing_idx] = node
        else:
            BRAND_SEEDS[req.workspace_id].nodes.append(node)
            
    # 3. Vector embedding for semantic retrieval
    try:
        text_to_embed = f"{req.category}: {req.name} {req.current_value} - {req.description} (Source: {req.source_citation})"
        vec = await ai_provider.get_embedding(text_to_embed)
        await mongo_manager.save_embedding_record({
            "node_id": fact_id,
            "org_id": org_id,
            "workspace_id": req.workspace_id,
            "label": f"{req.name}: {req.current_value}",
            "node_type": "APPROVED_FACT",
            "description": req.description,
            "embedding": vec
        })
    except Exception as e:
        logger.warning(f"Vector embedding note: {e}")
        
    return ApprovedFactResponse(
        fact_id=fact_id,
        workspace_id=req.workspace_id,
        org_id=org_id,
        name=req.name,
        category=req.category,
        current_value=req.current_value,
        unit=req.unit or "",
        description=req.description,
        source_citation=req.source_citation,
        department_owner=req.department_owner,
        status="ACTIVE",
        created_at=now_iso
    )

@router.get("/facts", response_model=List[ApprovedFactResponse])
async def list_approved_facts(workspace_id: Optional[str] = None, org_id: Optional[str] = None):
    """
    Returns verified approved facts across MongoDB Atlas collections and the active brand catalog.
    """
    effective_org = org_id or ("ORG-AURELLE" if workspace_id and "aurelle" in workspace_id else "ORG-APEX")
    docs = await mongo_manager.repo.get_approved_facts(effective_org, workspace_id)
    results = []
    seen_ids = set()
    for d in docs:
        fid = d.get("fact_id", "")
        if fid and fid not in seen_ids:
            seen_ids.add(fid)
            results.append(ApprovedFactResponse(
                fact_id=fid,
                workspace_id=d.get("workspace_id", workspace_id or "aurelle-tech"),
                org_id=d.get("organisation_id", effective_org),
                name=d.get("fact_name", ""),
                category=d.get("category", "PRICE"),
                current_value=d.get("current_value", ""),
                unit=d.get("unit", ""),
                description=d.get("description", ""),
                source_citation=d.get("source_citation", ""),
                department_owner=d.get("department_owner", ""),
                status=d.get("status", "ACTIVE"),
                created_at=d.get("created_at", datetime.datetime.now(datetime.timezone.utc).isoformat())
            ))
            
    for fact in APPROVED_FACTS_CATALOG.values():
        if (not workspace_id or fact.brand_id == workspace_id) and fact.id not in seen_ids:
            seen_ids.add(fact.id)
            results.append(ApprovedFactResponse(
                fact_id=fact.id,
                workspace_id=fact.brand_id,
                org_id=effective_org,
                name=fact.name,
                category=fact.category,
                current_value=fact.current_value,
                unit=fact.unit,
                description=fact.description,
                source_citation=fact.source_citation,
                department_owner=fact.department_owner,
                status=getattr(fact, "status", "ACTIVE"),
                created_at=fact.effective_from or datetime.datetime.now(datetime.timezone.utc).isoformat()
            ))
    return results

