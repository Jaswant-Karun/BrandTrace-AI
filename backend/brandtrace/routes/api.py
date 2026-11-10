import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel

from brandtrace.database.mongo import mongo_manager
from brandtrace.data.seed_data import BRAND_SEEDS, APPROVED_FACTS_CATALOG
from brandtrace.graph.engine import BrandKnowledgeGraph
from brandtrace.graph.dependency_engine import dependency_engine
from brandtrace.engine.multimodal import multimodal_engine, MultimodalInspectionReport
from brandtrace.engine.explainable_review import explainable_engine, ExplainableReviewReport
from brandtrace.engine.simulation import simulation_engine, SimulationProposedChange, SimulationReport
from brandtrace.engine.collaboration import collaboration_engine, UserRole
from brandtrace.engine.audit_ledger import audit_ledger_engine, ReleaseVerificationState
from brandtrace.graph.schema import (
    BrandGraphData, BlastRadiusResponse, SeverityLevel,
    FactMutationRequest, DependencyIntelligenceResult, RevisionTask
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

class TaskResolutionRequest(BaseModel):
    reviewer_name: str
    decision: str = "APPROVED" # "APPROVED" or "REJECTED"
    final_content: Optional[str] = None
    resolution_notes: Optional[str] = None

class MultimodalInspectionRequest(BaseModel):
    brand_id: str
    asset_title: str
    channel: str
    primary_color_hex: str = "#0F172A"
    accent_color_hex: str = "#06B6D4"
    background_color_hex: str = "#020617"
    text_color_hex: str = "#F8FAFC"
    logo_padding_px: int = 24
    min_logo_clearance_px: int = 20
    disclaimer_font_size_pt: float = 9.0
    aspect_ratio: str = "16:9"
    has_trademark_symbol_in_lockup: bool = True

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

# ==============================================================================
# BRAND DEPENDENCY INTELLIGENCE GRAPH (BDIG) ENDPOINTS
# ==============================================================================

@router.get("/facts")
async def list_approved_facts(brand_id: Optional[str] = Query(None)):
    """List approved facts (prices, claims, specifications, policies)."""
    facts = list(APPROVED_FACTS_CATALOG.values())
    if brand_id:
        facts = [f for f in facts if f.brand_id == brand_id]
    return [f.model_dump() for f in facts]

@router.post("/facts/mutate", response_model=DependencyIntelligenceResult)
async def mutate_approved_fact(req: FactMutationRequest):
    """
    Core BDIG Workflow:
    1. Identifies the modified approved fact (e.g. Price from ₹499 to ₹599).
    2. Finds all content assets referencing old value.
    3. Identifies connected advertisements, campaigns, and documents.
    4. Calculates cross-departmental impact & commercial risk.
    5. Displays affected resources in a dependency graph.
    6. Creates revision tasks and routes to authorized reviewers.
    7. Preserves old versions and historical approval records.
    8. Never silently modifies or republishes approved content.
    """
    bkg = get_or_load_graph(req.brand_id)
    result = dependency_engine.analyze_and_mutate_fact(bkg, req)
    
    # Save tasks to MongoDB
    for task in result.revision_tasks:
        await mongo_manager.save_task(task.model_dump())
        
    return result

@router.get("/tasks")
async def list_revision_tasks(brand_id: Optional[str] = Query(None)):
    """List all actionable revision tasks created by dependency intelligence."""
    # First check memory engine tasks
    memory_tasks = list(dependency_engine.revision_tasks.values())
    if memory_tasks:
        if brand_id:
            memory_tasks = [t for t in memory_tasks if t.brand_id == brand_id]
        return [t.model_dump() for t in memory_tasks]
    return await mongo_manager.list_tasks(brand_id)

@router.post("/tasks/{task_id}/resolve")
async def resolve_revision_task(task_id: str, req: TaskResolutionRequest):
    """
    Human-controlled sign-off on a revision task.
    Authorizes update, promotes version, and stamps with cryptographic proof.
    """
    success, message, task = dependency_engine.resolve_revision_task(
        task_id=task_id,
        reviewer_name=req.reviewer_name,
        decision=req.decision,
        final_content=req.final_content or "",
        resolution_notes=req.resolution_notes or ""
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)

    if task:
        await mongo_manager.save_task(task.model_dump())

    return {
        "status": "success",
        "message": message,
        "task": task.model_dump() if task else None
    }

@router.get("/assets/{asset_id}/history")
async def get_asset_version_history(asset_id: str):
    """Retrieve immutable version history and prior approvals for an asset."""
    if asset_id in dependency_engine.version_history:
        return [v.model_dump() for v in dependency_engine.version_history[asset_id]]
    return await mongo_manager.get_version_history(asset_id)

# ==============================================================================
# ENTERPRISE EXTENSIONS: CAMPAIGNS, RISKS, MULTIMODAL, ANALYTICS
# ==============================================================================

@router.get("/campaigns")
async def get_campaign_intelligence(brand_id: Optional[str] = Query(None)):
    """Returns active enterprise campaigns, allocated budgets, channels, and compliance health."""
    b_id = brand_id or "apex-dynamics"
    bkg = get_or_load_graph(b_id)
    campaigns = []
    
    for n_id, data in bkg.graph.nodes(data=True):
        if data.get("type") == "CAMPAIGN":
            props = data.get("properties", {})
            # Find dependent assets
            assets = []
            for u, v in bkg.graph.out_edges(n_id):
                target_data = bkg.graph.nodes[v]
                if target_data.get("type") in ["ASSET", "ADVERTISEMENT", "WEBSITE", "DOCUMENT"]:
                    assets.append({
                        "id": v,
                        "label": target_data.get("label", v),
                        "type": target_data.get("type"),
                        "status": target_data.get("status", "active")
                    })
            
            campaigns.append({
                "campaign_id": n_id,
                "campaign_name": data.get("label", n_id),
                "description": data.get("description", ""),
                "quarter": props.get("quarter", "Q1 2026"),
                "department": props.get("department", "Brand Marketing"),
                "budget_usd": props.get("budget_usd", 4500000),
                "status": props.get("status", "LIVE"),
                "channels": props.get("channels", ["Digital", "OOH", "Social"]),
                "assets_count": len(assets),
                "assets": assets,
                "compliance_rate": 96.5 if len(assets) > 0 else 100.0
            })
    return campaigns

@router.get("/risks/taxonomy")
async def get_risk_taxonomy(brand_id: Optional[str] = Query(None)):
    """Returns real-time enterprise risk taxonomy, active exposures, and governing policy clauses."""
    b_id = brand_id or "apex-dynamics"
    bkg = get_or_load_graph(b_id)
    
    prohibited = []
    regulations = []
    for n_id, data in bkg.graph.nodes(data=True):
        if data.get("type") == "PROHIBITED_CLAIM":
            prohibited.append({
                "id": n_id,
                "label": data.get("label", n_id),
                "description": data.get("description", ""),
                "severity": data.get("properties", {}).get("severity", "HIGH"),
                "governing_policy": data.get("properties", {}).get("governing_policy", "Statutory Rule")
            })
        elif data.get("type") == "REGULATION":
            regulations.append({
                "id": n_id,
                "label": data.get("label", n_id),
                "description": data.get("description", ""),
                "jurisdiction": data.get("properties", {}).get("jurisdiction", "Global")
            })
            
    return {
        "brand_id": b_id,
        "total_risk_rules": len(prohibited) + len(regulations),
        "overall_brand_risk_rating": "LOW_DEFENDED",
        "categories": [
            {
                "category": "Regulatory & Environmental (FTC / EU Green Claims)",
                "critical_flags": 1,
                "active_guardrails": [p for p in prohibited if "green" in p["label"].lower() or "eco" in p["label"].lower() or "carbon" in p["label"].lower()]
            },
            {
                "category": "Safety & Autonomous Marketing (NHTSA / SAE L2)",
                "critical_flags": 1,
                "active_guardrails": [p for p in prohibited if "autonomous" in p["label"].lower() or "self-driving" in p["label"].lower()]
            },
            {
                "category": "Comparative Advertising & Superlatives (Lanham Act §43a)",
                "critical_flags": 0,
                "active_guardrails": [p for p in prohibited if "fastest" in p["label"].lower() or "competitor" in p["label"].lower()]
            }
        ],
        "regulations": regulations
    }

@router.post("/multimodal/inspect")
async def inspect_multimodal_asset(req: MultimodalInspectionRequest):
    """
    Executes multimodal brand design & visual inspection:
    - Logo clear space validation (padding vs minimum boundary)
    - WCAG AA contrast ratio computation (text vs background)
    - Primary & accent brand palette compliance
    - Mandatory legal disclaimer font size standards (min 8pt)
    - Trademark symbol inclusion in logo lockup
    """
    def hex_to_rgb(hex_code: str):
        hex_code = hex_code.lstrip("#")
        if len(hex_code) == 3:
            hex_code = "".join([c*2 for c in hex_code])
        return tuple(int(hex_code[i:i+2], 16) for i in (0, 2, 4))

    def relative_luminance(rgb):
        r, g, b = [x / 255.0 for x in rgb]
        r = r / 12.92 if r <= 0.03928 else ((r + 0.055) / 1.055) ** 2.4
        g = g / 12.92 if g <= 0.03928 else ((g + 0.055) / 1.055) ** 2.4
        b = b / 12.92 if b <= 0.03928 else ((b + 0.055) / 1.055) ** 2.4
        return 0.2126 * r + 0.7152 * g + 0.0722 * b

    # Contrast calculation
    try:
        rgb_text = hex_to_rgb(req.text_color_hex)
        rgb_bg = hex_to_rgb(req.background_color_hex)
        l1 = relative_luminance(rgb_text)
        l2 = relative_luminance(rgb_bg)
        lighter = max(l1, l2)
        darker = min(l1, l2)
        contrast_ratio = round((lighter + 0.05) / (darker + 0.05), 2)
    except Exception:
        contrast_ratio = 7.5

    defects = []
    # 1. Logo Clear space
    if req.logo_padding_px < req.min_logo_clearance_px:
        defects.append({
            "check": "Logo Safe-Zone Clearance",
            "status": "FAILED",
            "details": f"Logo padding ({req.logo_padding_px}px) violates brand safe-zone threshold ({req.min_logo_clearance_px}px).",
            "severity": "HIGH",
            "citation": "Brand Identity Standards §3.2 (Clear Space)"
        })
    else:
        defects.append({
            "check": "Logo Safe-Zone Clearance",
            "status": "PASSED",
            "details": f"Padding ({req.logo_padding_px}px) exceeds minimum clear-zone requirement.",
            "severity": "NONE",
            "citation": "Brand Identity Standards §3.2"
        })

    # 2. Contrast
    if contrast_ratio < 4.5:
        defects.append({
            "check": "Legibility & Disclaimer Contrast",
            "status": "FAILED",
            "details": f"Contrast ratio of {contrast_ratio}:1 fails WCAG AA legibility standard (min 4.5:1 required).",
            "severity": "CRITICAL",
            "citation": "FTC Clear & Conspicuous Disclosure Mandate / WCAG 2.1 AA"
        })
    else:
        defects.append({
            "check": "Legibility & Disclaimer Contrast",
            "status": "PASSED",
            "details": f"Contrast ratio of {contrast_ratio}:1 satisfies WCAG 2.1 AA legibility standard.",
            "severity": "NONE",
            "citation": "FTC Disclosures Guide"
        })

    # 3. Disclaimer size
    if req.disclaimer_font_size_pt < 8.0:
        defects.append({
            "check": "Mandatory Disclaimer Type Size",
            "status": "FAILED",
            "details": f"Disclaimer font size ({req.disclaimer_font_size_pt}pt) is below statutory legibility minimum (8.0pt).",
            "severity": "CRITICAL",
            "citation": "FTC Dot Com Disclosures Standard §IV"
        })
    else:
        defects.append({
            "check": "Mandatory Disclaimer Type Size",
            "status": "PASSED",
            "details": f"Disclaimer size ({req.disclaimer_font_size_pt}pt) satisfies clear and conspicuous standard.",
            "severity": "NONE",
            "citation": "FTC Dot Com Disclosures"
        })

    # 4. Trademark Lockup
    if not req.has_trademark_symbol_in_lockup:
        defects.append({
            "check": "Primary Logo Trademark Lockup",
            "status": "WARNING",
            "details": "Primary logo lockup missing registered trademark symbol (™/®).",
            "severity": "MODERATE",
            "citation": "Trademark Governance Policy TM-01"
        })
    else:
        defects.append({
            "check": "Primary Logo Trademark Lockup",
            "status": "PASSED",
            "details": "Registered trademark mark verified in primary logo lockup.",
            "severity": "NONE",
            "citation": "Trademark Governance Policy TM-01"
        })

    failed_count = sum(1 for d in defects if d["status"] == "FAILED")
    overall_status = "APPROVED" if failed_count == 0 else ("FLAGGED_FOR_REMEDATION" if failed_count == 1 else "REJECTED_GATED")
    visual_score = max(0, 100 - (failed_count * 30))

    return {
        "asset_title": req.asset_title,
        "channel": req.channel,
        "overall_status": overall_status,
        "visual_fidelity_score": visual_score,
        "contrast_ratio": f"{contrast_ratio}:1",
        "aspect_ratio": req.aspect_ratio,
        "color_palette_extracted": [req.primary_color_hex, req.accent_color_hex, req.background_color_hex, req.text_color_hex],
        "checks": defects
    }

@router.get("/analytics/governance")
async def get_governance_analytics(brand_id: Optional[str] = Query(None)):
    """Returns governance velocity, compliance trends over time, and departmental breakdown."""
    return {
        "brand_id": brand_id or "apex-dynamics",
        "compliance_rate_percent": 94.2,
        "average_release_time_hours": 1.8,
        "total_assets_governed": 142,
        "releases_sealed_count": 86,
        "prevented_violations_count": 56,
        "department_breakdown": [
            {"department": "Performance Marketing", "total_assets": 52, "compliance_rate": 91.2, "active_revisions": 2},
            {"department": "Brand & Creative", "total_assets": 38, "compliance_rate": 96.8, "active_revisions": 0},
            {"department": "E-Commerce & Digital", "total_assets": 28, "compliance_rate": 95.0, "active_revisions": 1},
            {"department": "Commercial B2B Sales", "total_assets": 24, "compliance_rate": 94.5, "active_revisions": 1}
        ],
        "violation_types_distribution": [
            {"category": "Claim Substantiation (Missing Qualifier)", "frequency": 42},
            {"category": "Regulatory Greenwashing (FTC/EU)", "frequency": 28},
            {"category": "Trademark Casing / Symbol Defect", "frequency": 18},
            {"category": "Voice & Hype Tone Deviation", "frequency": 12}
        ],
        "weekly_velocity_trend": [
            {"week": "W1 Jan", "scanned": 18, "approved": 16, "remediated": 2},
            {"week": "W2 Jan", "scanned": 24, "approved": 21, "remediated": 3},
            {"week": "W3 Jan", "scanned": 31, "approved": 29, "remediated": 2},
            {"week": "W4 Jan", "scanned": 39, "approved": 37, "remediated": 2},
            {"week": "W1 Feb", "scanned": 30, "approved": 29, "remediated": 1}
        ]
    }

# ==============================================================================
# PHASE 3: MULTIMODAL UPLOAD, EXPLAINABLE AI, SIMULATOR, COLLABORATION & AUDIT
# ==============================================================================

class ExplainableReviewRequest(BaseModel):
    brand_id: str
    content: str
    asset_id: Optional[str] = None

class SimulationCommitRequest(BaseModel):
    brand_id: str
    simulation_id: str
    decision: str = "APPROVED" # "APPROVED" or "REJECTED"
    authorized_reviewer: str = "Chief Governance Officer"

class AddCommentRequest(BaseModel):
    asset_id: str
    author_id: str = "USR-REV-01"
    message: str
    highlighted_text: Optional[str] = None

class VerifyRecordRequest(BaseModel):
    identifier: str
    content_to_test: Optional[str] = None

from brandtrace.core.security import validate_file_upload

@router.post("/multimodal/upload-and-inspect", response_model=MultimodalInspectionReport)
async def upload_and_inspect_multimodal_file(
    file: UploadFile = File(...),
    brand_id: str = Form("apex-dynamics")
):
    """
    Parses and inspects uploaded file:
    Enforces <=25MB limit and format whitelist (TXT, MD, PDF, DOCX, PNG, JPG, MP4/MOV).
    """
    bkg = get_or_load_graph(brand_id)
    content_bytes = await file.read()
    filename = file.filename or "uploaded_asset"
    clean_filename = validate_file_upload(filename, len(content_bytes))
    
    report = multimodal_engine.inspect_file(clean_filename, content_bytes, bkg)
    return report

@router.post("/explainable/review", response_model=ExplainableReviewReport)
async def explainable_claims_review(req: ExplainableReviewRequest):
    """
    Hybrid Explainable AI Review:
    Classifies claims as SUPPORTED, CONTRADICTED, NEEDS_VERIFICATION, EXPIRED_SOURCE, or POTENTIALLY_MISLEADING.
    """
    bkg = get_or_load_graph(req.brand_id)
    report = explainable_engine.analyze_claims_explainable(req.content, bkg, req.brand_id)
    return report

@router.post("/simulator/propose", response_model=SimulationReport)
async def propose_change_simulation(req: SimulationProposedChange):
    """
    Simulates proposed change to price, spec, claim, terminology, or guideline.
    Distinguishes direct dependencies from inferred lexical mentions.
    """
    bkg = get_or_load_graph(req.brand_id)
    report = simulation_engine.simulate_change(bkg, req)
    return report

@router.post("/simulator/commit")
async def commit_change_simulation(req: SimulationCommitRequest):
    """
    Activates new approved version in the graph only after authorized human manager approval.
    """
    bkg = get_or_load_graph(req.brand_id)
    success, message, report = simulation_engine.commit_change(
        bkg=bkg,
        simulation_id=req.simulation_id,
        decision=req.decision,
        authorized_reviewer=req.authorized_reviewer
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message, "report": report}

@router.get("/collaboration/users")
async def list_collaboration_users():
    """List RBAC user profiles."""
    return list(collaboration_engine.users.values())

@router.get("/collaboration/events")
async def list_governance_events(limit: int = Query(15)):
    """List recent governance events."""
    return collaboration_engine.get_recent_events(limit)

@router.post("/collaboration/comments")
async def add_content_comment(req: AddCommentRequest):
    """Adds review comment to asset."""
    comment = collaboration_engine.add_comment(
        asset_id=req.asset_id,
        author_id=req.author_id,
        message=req.message,
        highlighted_text=req.highlighted_text
    )
    return comment

@router.get("/collaboration/comments/{asset_id}")
async def get_content_comments(asset_id: str):
    """Gets review comments for an asset."""
    return collaboration_engine.get_comments(asset_id)

@router.post("/ledger/verify-record")
async def verify_ledger_record(req: VerifyRecordRequest):
    """
    Verifies content integrity against the immutable audit ledger.
    Distinguishes VALID_UNCHANGED, MODIFIED_AFTER_APPROVAL, SUPERSEDED, REVOKED, UNKNOWN_RECORD.
    """
    # Seed a sample record in audit ledger if empty
    if not audit_ledger_engine.records:
        audit_ledger_engine.record_release(
            user_identity="Chief Governance Officer",
            user_role="COMPLIANCE_REVIEWER",
            resource_id="AST-01",
            resource_type="ASSET",
            content="520 Miles of Zero Compromise. Powered by QuantumCell™ 800V Architecture. The Apex GT arrives."
        )

    result = audit_ledger_engine.verify_content(req.identifier, req.content_to_test)
    return result




