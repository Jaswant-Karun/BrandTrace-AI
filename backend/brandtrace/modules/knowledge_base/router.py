import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from brandtrace.modules.knowledge_base.models import (
    VectorSearchQuery, VectorSearchResult, AtlasIndexConfigResponse
)
from brandtrace.database.mongo import mongo_manager
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
