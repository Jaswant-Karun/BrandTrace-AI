import logging
import time
import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from brandtrace.modules.knowledge_base.models import (
    VectorSearchQuery, VectorSearchResult, AtlasIndexConfigResponse,
    CreateFactRequest, ApprovedFactResponse, UpdateFactRequest,
    CreateGuidelineRequest, GuidelineResponse
)
from brandtrace.database.mongo import mongo_manager
from brandtrace.database.schemas import ApprovedFactDoc, BrandGuidelineDoc
from brandtrace.graph.schema import ApprovedFact, Node as GraphNode, NodeType
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
    now_int = int(time.time())
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # 1. Save to MongoDB Atlas Repository
    fact_doc = ApprovedFactDoc(
        fact_id=fact_id,
        organisation_id=org_id,
        workspace_id=req.workspace_id,
        name=req.name,
        category=req.category,
        current_value=req.current_value,
        unit=req.unit or "",
        description=req.description,
        source_citation=req.source_citation,
        department_owner=req.department_owner,
        last_verified=now_iso,
        source_date=req.source_date,
        expiry_date=req.expiry_date,
        evidence_reference=req.evidence_reference,
        restricted_terms=req.restricted_terms,
        required_phrases=req.required_phrases,
        created_at=now_int,
        updated_at=now_int
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
        last_verified=now_iso
    )
    APPROVED_FACTS_CATALOG[fact_id] = fact_obj
    
    from brandtrace.data.seed_data import BRAND_SEEDS
    if req.workspace_id in BRAND_SEEDS:
        node = GraphNode(
            id=fact_id,
            label=f"{req.name}: {req.current_value}",
            type=NodeType.APPROVED_FACT,
            description=req.description,
            properties={
                "current_value": req.current_value,
                "citation": req.source_citation,
                "department_owner": req.department_owner,
                "source_date": req.source_date,
                "expiry_date": req.expiry_date,
                "evidence_reference": req.evidence_reference
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
        source_date=req.source_date,
        expiry_date=req.expiry_date,
        evidence_reference=req.evidence_reference,
        restricted_terms=req.restricted_terms,
        required_phrases=req.required_phrases,
        status="ACTIVE",
        created_at=now_iso
    )

@router.put("/facts/{fact_id}", response_model=ApprovedFactResponse)
async def update_approved_fact(
    fact_id: str,
    req: UpdateFactRequest,
    workspace_id: str = "aurelle-tech",
    org_id: Optional[str] = None
):
    """
    Updates an approved brand fact in MongoDB Atlas and the active in-memory catalog/graph.
    Maintains historical lineage and logs an audit event.
    """
    effective_org = org_id or ("ORG-AURELLE" if "aurelle" in workspace_id else "ORG-APEX")
    now_int = int(time.time())
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # Check existing fact
    existing_fact = APPROVED_FACTS_CATALOG.get(fact_id)
    if not existing_fact:
        facts_list = await mongo_manager.repo.get_approved_facts(effective_org, workspace_id)
        match = next((f for f in facts_list if f.get("fact_id") == fact_id), None)
        if not match:
            raise HTTPException(status_code=404, detail=f"Fact '{fact_id}' not found.")
        existing_name = match.get("name") or match.get("fact_name", "")
        existing_val = match.get("current_value", "")
        existing_cat = match.get("category", "PRICE")
        existing_unit = match.get("unit", "")
        existing_desc = match.get("description", "")
        existing_cite = match.get("source_citation", "")
        existing_dept = match.get("department_owner", "Brand Governance Committee")
    else:
        existing_name = existing_fact.name
        existing_val = existing_fact.current_value
        existing_cat = existing_fact.category
        existing_unit = existing_fact.unit
        existing_desc = existing_fact.description
        existing_cite = existing_fact.source_citation
        existing_dept = existing_fact.department_owner

    if req.current_value is not None and not req.current_value.strip():
        raise HTTPException(status_code=400, detail="Fact value cannot be empty or whitespace.")
    if req.name is not None and not req.name.strip():
        raise HTTPException(status_code=400, detail="Fact name cannot be empty or whitespace.")

    def _validate_date(d_str: Optional[str], label: str):
        if not d_str:
            return
        try:
            cleaned = d_str.strip()
            if len(cleaned) == 10:
                datetime.date.fromisoformat(cleaned)
            else:
                datetime.datetime.fromisoformat(cleaned)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid format for '{label}': '{d_str}'. Expected YYYY-MM-DD format.")

    if req.source_date:
        _validate_date(req.source_date, "source_date")
    if req.expiry_date:
        _validate_date(req.expiry_date, "expiry_date")
    if req.source_date and req.expiry_date and req.expiry_date < req.source_date:
        raise HTTPException(status_code=400, detail="Expiry date cannot be prior to source date.")

    updated_name = req.name if req.name is not None else existing_name
    updated_val = req.current_value if req.current_value is not None else existing_val
    updated_cat = req.category if req.category is not None else existing_cat
    updated_unit = req.unit if req.unit is not None else existing_unit
    updated_desc = req.description if req.description is not None else existing_desc
    updated_cite = req.source_citation if req.source_citation is not None else existing_cite
    updated_dept = req.department_owner if req.department_owner is not None else existing_dept

    # 1. Update in MongoDB
    fact_doc = ApprovedFactDoc(
        fact_id=fact_id,
        organisation_id=effective_org,
        workspace_id=workspace_id,
        name=updated_name,
        category=updated_cat,
        current_value=updated_val,
        unit=updated_unit or "",
        description=updated_desc,
        source_citation=updated_cite,
        department_owner=updated_dept,
        last_verified=now_iso,
        source_date=req.source_date,
        expiry_date=req.expiry_date,
        evidence_reference=req.evidence_reference,
        restricted_terms=req.restricted_terms,
        required_phrases=req.required_phrases,
        created_at=now_int,
        updated_at=now_int
    )
    await mongo_manager.repo.add_approved_fact(fact_doc)

    # 2. Update In-Memory Catalog
    updated_fact_obj = ApprovedFact(
        id=fact_id,
        brand_id=workspace_id,
        name=updated_name,
        category=updated_cat,
        current_value=updated_val,
        unit=updated_unit or "",
        description=updated_desc,
        source_citation=updated_cite,
        department_owner=updated_dept,
        last_verified=now_iso
    )
    APPROVED_FACTS_CATALOG[fact_id] = updated_fact_obj

    # 3. Update Knowledge Graph Node
    from brandtrace.data.seed_data import BRAND_SEEDS
    if workspace_id in BRAND_SEEDS:
        node = GraphNode(
            id=fact_id,
            label=f"{updated_name}: {updated_val}",
            type=NodeType.APPROVED_FACT,
            description=updated_desc,
            properties={
                "current_value": updated_val,
                "citation": updated_cite,
                "department_owner": updated_dept,
                "source_date": req.source_date,
                "expiry_date": req.expiry_date,
                "evidence_reference": req.evidence_reference
            }
        )
        existing_idx = next((i for i, n in enumerate(BRAND_SEEDS[workspace_id].nodes) if n.id == fact_id), None)
        if existing_idx is not None:
            BRAND_SEEDS[workspace_id].nodes[existing_idx] = node
        else:
            BRAND_SEEDS[workspace_id].nodes.append(node)

    # 4. Record Audit Event
    if mongo_manager.is_connected and mongo_manager.db is not None:
        try:
            await mongo_manager.db.audit_events.insert_one({
                "event_id": f"EVT-FACT-UPD-{int(time.time()*1000)%100000}",
                "action_type": "FACT_UPDATED",
                "resource_id": fact_id,
                "user_identity": "Chief Governance Officer",
                "old_value": existing_val,
                "new_value": updated_val,
                "timestamp": now_int
            })
        except Exception:
            pass

    return ApprovedFactResponse(
        fact_id=fact_id,
        workspace_id=workspace_id,
        org_id=effective_org,
        name=updated_name,
        category=updated_cat,
        current_value=updated_val,
        unit=updated_unit or "",
        description=updated_desc,
        source_citation=updated_cite,
        department_owner=updated_dept,
        source_date=req.source_date,
        expiry_date=req.expiry_date,
        evidence_reference=req.evidence_reference,
        restricted_terms=req.restricted_terms,
        required_phrases=req.required_phrases,
        status="ACTIVE",
        created_at=now_iso
    )

@router.post("/guidelines", response_model=GuidelineResponse)
async def create_brand_guideline(req: CreateGuidelineRequest):
    """
    Registers a new brand guideline, restricted terminology, or required phrase into MongoDB Atlas.
    """
    if not req.title or not req.title.strip():
        raise HTTPException(status_code=400, detail="Guideline title cannot be empty or whitespace.")
    if not req.rule_statement or not req.rule_statement.strip():
        raise HTTPException(status_code=400, detail="Rule statement cannot be empty or whitespace.")

    def _validate_date(d_str: Optional[str], label: str):
        if not d_str:
            return
        try:
            cleaned = d_str.strip()
            if len(cleaned) == 10:
                datetime.date.fromisoformat(cleaned)
            else:
                datetime.datetime.fromisoformat(cleaned)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid format for '{label}': '{d_str}'. Expected YYYY-MM-DD format.")

    _validate_date(req.effective_date, "effective_date")
    _validate_date(req.expiry_date, "expiry_date")
    if req.effective_date and req.expiry_date and req.expiry_date < req.effective_date:
        raise HTTPException(status_code=400, detail="Expiry date cannot be prior to effective date.")

    from brandtrace.data.seed_data import BRAND_SEEDS
    org_id = req.org_id or ("ORG-AURELLE" if "aurelle" in req.workspace_id else "ORG-APEX")
    now_int = int(time.time())
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Idempotent duplicate check
    if req.workspace_id in BRAND_SEEDS:
        for node in BRAND_SEEDS[req.workspace_id].nodes:
            if node.label.strip().lower() == req.title.strip().lower() and node.type == NodeType.GUIDELINE:
                if (node.description or "").strip() == req.rule_statement.strip():
                    return GuidelineResponse(
                        guideline_id=node.id,
                        workspace_id=req.workspace_id,
                        org_id=org_id,
                        title=node.label,
                        category=node.properties.get("category", req.category),
                        rule_statement=node.description or "",
                        severity=node.properties.get("severity", req.severity),
                        effective_date=str(req.effective_date or now_iso),
                        expiry_date=req.expiry_date,
                        restricted_terms=node.properties.get("restricted_terms", []),
                        required_phrases=node.properties.get("required_phrases", []),
                        source_citation=node.properties.get("citation", ""),
                        status="ACTIVE"
                    )
                raise HTTPException(status_code=409, detail=f"A guideline with title '{req.title}' already exists in workspace '{req.workspace_id}'.")

    guideline_id = req.guideline_id or f"GL-{req.workspace_id[:3].upper()}-{int(time.time() * 1000) % 100000:05d}"
    
    # 1. Save to MongoDB Atlas Repository
    guideline_doc = BrandGuidelineDoc(
        guideline_id=guideline_id,
        organisation_id=org_id,
        workspace_id=req.workspace_id,
        title=req.title,
        category=req.category,
        rule_statement=req.rule_statement,
        severity=req.severity,
        effective_date=now_int,
        expiry_date=None,
        restricted_terms=req.restricted_terms or [],
        required_phrases=req.required_phrases or [],
        source_citation=req.source_citation or "Corporate Brand Governance Directive",
        created_at=now_int,
        updated_at=now_int
    )
    await mongo_manager.repo.add_brand_guideline(guideline_doc)

    # 2. If restricted terminology exists, persist into terminology collection
    if req.restricted_terms and mongo_manager.is_connected and mongo_manager.db is not None:
        for term in req.restricted_terms:
            try:
                await mongo_manager.db.terminology.insert_one({
                    "term_id": f"TRM-{int(time.time()*1000)%100000}",
                    "organisation_id": org_id,
                    "workspace_id": req.workspace_id,
                    "term_text": term,
                    "classification": "RESTRICTED_TERM",
                    "guidance": req.rule_statement,
                    "created_at": now_int
                })
            except Exception:
                pass

    # 3. Add to Graph
    from brandtrace.data.seed_data import BRAND_SEEDS
    if req.workspace_id in BRAND_SEEDS:
        node = GraphNode(
            id=guideline_id,
            label=f"{req.title}",
            type=NodeType.GUIDELINE,
            description=req.rule_statement,
            properties={
                "category": req.category,
                "severity": req.severity,
                "restricted_terms": req.restricted_terms,
                "required_phrases": req.required_phrases,
                "citation": req.source_citation
            }
        )
        BRAND_SEEDS[req.workspace_id].nodes.append(node)

    return GuidelineResponse(
        guideline_id=guideline_id,
        workspace_id=req.workspace_id,
        org_id=org_id,
        title=req.title,
        category=req.category,
        rule_statement=req.rule_statement,
        severity=req.severity,
        effective_date=req.effective_date or now_iso,
        expiry_date=req.expiry_date,
        restricted_terms=req.restricted_terms or [],
        required_phrases=req.required_phrases or [],
        source_citation=req.source_citation,
        status="ACTIVE"
    )

@router.get("/guidelines", response_model=List[GuidelineResponse])
async def list_brand_guidelines(workspace_id: Optional[str] = None, org_id: Optional[str] = None):
    """
    Lists registered brand guidelines and policy guardrails from MongoDB Atlas and graph seeds.
    """
    effective_org = org_id or ("ORG-AURELLE" if workspace_id and "aurelle" in workspace_id else "ORG-APEX")
    docs = await mongo_manager.repo.get_brand_guidelines(effective_org, workspace_id)
    results = []
    seen_ids = set()
    for d in docs:
        gid = d.get("guideline_id", "")
        if gid and gid not in seen_ids:
            seen_ids.add(gid)
            results.append(GuidelineResponse(
                guideline_id=gid,
                workspace_id=d.get("workspace_id", workspace_id or "aurelle-tech"),
                org_id=d.get("organisation_id", effective_org),
                title=d.get("title", ""),
                category=d.get("category", "VOICE"),
                rule_statement=d.get("rule_statement", ""),
                severity=d.get("severity", "HIGH"),
                effective_date=str(d.get("effective_date", "")),
                expiry_date=d.get("expiry_date"),
                restricted_terms=d.get("restricted_terms") or [],
                required_phrases=d.get("required_phrases") or [],
                source_citation=d.get("source_citation"),
                status=d.get("status", "ACTIVE")
            ))

    from brandtrace.data.seed_data import BRAND_SEEDS
    if workspace_id and workspace_id in BRAND_SEEDS:
        for node in BRAND_SEEDS[workspace_id].nodes:
            if node.type in [NodeType.GUIDELINE, NodeType.REGULATION, NodeType.PROHIBITED_CLAIM] and node.id not in seen_ids:
                seen_ids.add(node.id)
                results.append(GuidelineResponse(
                    guideline_id=node.id,
                    workspace_id=workspace_id,
                    org_id=effective_org,
                    title=node.label,
                    category="REGULATORY" if node.type == NodeType.REGULATION else "VOICE",
                    rule_statement=node.description or "",
                    severity=node.properties.get("severity", "HIGH"),
                    effective_date=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    expiry_date=None,
                    restricted_terms=node.properties.get("restricted_terms", []),
                    required_phrases=node.properties.get("required_phrases", []),
                    source_citation=node.properties.get("citation") or node.properties.get("governing_policy"),
                    status="ACTIVE"
                ))
    return results

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
                name=d.get("name") or d.get("fact_name", ""),
                category=d.get("category", "PRICE"),
                current_value=d.get("current_value", ""),
                unit=d.get("unit", ""),
                description=d.get("description", ""),
                source_citation=d.get("source_citation", ""),
                department_owner=d.get("department_owner", ""),
                status="ACTIVE",
                created_at=str(d.get("created_at", datetime.datetime.now(datetime.timezone.utc).isoformat()))
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
                created_at=getattr(fact, "last_verified", getattr(fact, "effective_from", datetime.datetime.now(datetime.timezone.utc).isoformat()))
            ))
    return results

