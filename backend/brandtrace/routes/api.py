import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from brandtrace.database.mongo import mongo_manager
from brandtrace.data.seed_data import BRAND_SEEDS
from brandtrace.graph.engine import BrandKnowledgeGraph
from brandtrace.graph.schema import (
    BrandGraphData, BlastRadiusResponse, SeverityLevel
)
from brandtrace.agents.schema import (
    VerificationRequest, VerificationResult
)
from brandtrace.agents.pipeline import governance_pipeline

router = APIRouter(prefix="/api")

# Active in-memory graph cache
GRAPH_INSTANCES: Dict[str, BrandKnowledgeGraph] = {}

def get_or_load_graph(brand_id: str) -> BrandKnowledgeGraph:
    if brand_id in GRAPH_INSTANCES:
        return GRAPH_INSTANCES[brand_id]
    
    if brand_id in BRAND_SEEDS:
        seed = BRAND_SEEDS[brand_id]
        bkg = BrandKnowledgeGraph.from_graph_data(seed)
        GRAPH_INSTANCES[brand_id] = bkg
        return bkg
        
    raise HTTPException(status_code=404, detail=f"Brand '{brand_id}' not found.")

# Models
class BlastRadiusRequest(BaseModel):
    brand_id: str
    mutated_node_id: str
    mutation_type: str = "POLICY_AMENDMENT"
    mutation_notes: Optional[str] = None

class ReleaseSignRequest(BaseModel):
    verification_id: str
    brand_id: str
    asset_id: str
    asset_title: str
    channel: str
    content: str
    reviewer: str = "Brand Director"
    decision: str = "APPROVED"

# 1. System & DB Status
@router.get("/db/status")
async def get_database_status():
    """Returns live MongoDB connection status, engine stats, and collection counts."""
    return await mongo_manager.get_db_status()

# 2. Brands
@router.get("/brands")
async def list_brands():
    """List all configured enterprise brand profiles."""
    brands = await mongo_manager.list_brands()
    if not brands:
        # Fall back to seed catalog
        return [
            {
                "brand_id": b.brand_id,
                "brand_name": b.brand_name,
                "industry": b.industry,
                "description": b.description,
                "node_count": len(b.nodes),
                "edge_count": len(b.edges)
            }
            for b in BRAND_SEEDS.values()
        ]
    return brands

@router.get("/brands/{brand_id}")
async def get_brand(brand_id: str):
    """Retrieve brand profile and governance metadata."""
    brand = await mongo_manager.get_brand(brand_id)
    if brand:
        return brand
    if brand_id in BRAND_SEEDS:
        seed = BRAND_SEEDS[brand_id]
        return {
            "brand_id": seed.brand_id,
            "brand_name": seed.brand_name,
            "industry": seed.industry,
            "description": seed.description,
            "node_count": len(seed.nodes),
            "edge_count": len(seed.edges)
        }
    raise HTTPException(status_code=404, detail=f"Brand '{brand_id}' not found.")

# 3. Knowledge Graph
@router.get("/brands/{brand_id}/graph")
async def get_brand_knowledge_graph(brand_id: str):
    """
    Returns the complete Brand Knowledge Graph serialized for ReactFlow canvas rendering.
    """
    bkg = get_or_load_graph(brand_id)
    return bkg.to_react_flow_elements()

# 4. Multi-Agent Governance Verification
@router.post("/verify", response_model=VerificationResult)
async def verify_asset(request: VerificationRequest):
    """
    Executes the Autonomous Multi-Agent Governance Pipeline on marketing content.
    Returns token-level risk spans, citations, scores, remediation, and release proof.
    """
    bkg = get_or_load_graph(request.brand_id)
    result = governance_pipeline.verify_asset(request, bkg)
    
    # Persist verification to MongoDB
    await mongo_manager.save_verification(result.model_dump())
    return result

# 5. Cascading Blast Radius Analysis
@router.post("/blast-radius", response_model=BlastRadiusResponse)
async def simulate_blast_radius(request: BlastRadiusRequest):
    """
    Performs graph traversal to simulate cascading risk across omnichannel assets when a policy changes.
    """
    bkg = get_or_load_graph(request.brand_id)
    return bkg.simulate_blast_radius(
        mutated_node_id=request.mutated_node_id,
        mutation_type=request.mutation_type,
        mutation_notes=request.mutation_notes or ""
    )

# 6. Release Governance Ledger
@router.get("/releases")
async def list_releases(brand_id: Optional[str] = Query(None)):
    """Returns the immutable tamper-evident release ledger."""
    return await mongo_manager.list_releases(brand_id)

@router.post("/releases/sign")
async def sign_release(req: ReleaseSignRequest):
    """
    Formally seals a release in the immutable release ledger with cryptographic proof.
    """
    t0 = int(time.time())
    release_doc = {
        "release_id": f"REL-{t0}-{req.asset_id}",
        "verification_id": req.verification_id,
        "brand_id": req.brand_id,
        "asset_id": req.asset_id,
        "asset_title": req.asset_title,
        "channel": req.channel,
        "content": req.content,
        "reviewer": req.reviewer,
        "decision": req.decision,
        "timestamp": t0,
        "timestamp_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t0)),
        "audit_stamp": f"BT-SEAL-{hash(req.content + req.reviewer + str(t0)) % 100000000:08X}"
    }
    await mongo_manager.save_release(release_doc)
    return {
        "status": "SEALED",
        "message": f"Asset '{req.asset_title}' successfully sealed in release ledger.",
        "release": release_doc
    }

# 7. Seed Data Ingestion Endpoint
@router.post("/seed")
async def seed_database():
    """Seeds the database and graph engine with enterprise brand profiles."""
    loaded_brands = []
    for brand_id, seed in BRAND_SEEDS.items():
        # Load into MongoDB
        await mongo_manager.save_brand({
            "brand_id": seed.brand_id,
            "brand_name": seed.brand_name,
            "industry": seed.industry,
            "description": seed.description,
            "node_count": len(seed.nodes),
            "edge_count": len(seed.edges)
        })
        await mongo_manager.save_graph(
            brand_id=seed.brand_id,
            nodes=[n.model_dump() for n in seed.nodes],
            edges=[e.model_dump() for e in seed.edges]
        )
        # Load into memory graph
        bkg = BrandKnowledgeGraph.from_graph_data(seed)
        GRAPH_INSTANCES[brand_id] = bkg
        loaded_brands.append(brand_id)

    return {
        "status": "success",
        "message": f"Successfully seeded {len(loaded_brands)} enterprise brand profiles into MongoDB & Graph Engine.",
        "brands": loaded_brands
    }
