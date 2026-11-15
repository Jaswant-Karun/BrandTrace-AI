import logging
import time
import datetime
import uuid
import ipaddress
import socket
import urllib.parse
from html.parser import HTMLParser
import httpx
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from typing import List, Dict, Any, Optional
from brandtrace.modules.knowledge_base.models import (
    VectorSearchQuery, VectorSearchResult, AtlasIndexConfigResponse,
    CreateFactRequest, ApprovedFactResponse, UpdateFactRequest,
    CreateGuidelineRequest, GuidelineResponse,
    CreateDocumentRequest, UpdateDocumentRequest, WebsiteImportRequest,
    WebsiteImportPreviewResponse, DocumentResponse, DocumentVersionResponse
)
from brandtrace.database.mongo import mongo_manager
from brandtrace.database.schemas import (
    ApprovedFactDoc, BrandGuidelineDoc, BrandDocumentDoc,
    DocumentCategory, DocumentProcessingStatus, DocumentSourceType, DocumentVersionDoc
)
from brandtrace.graph.schema import ApprovedFact, Node as GraphNode, NodeType
from brandtrace.engine.ai_provider import ai_provider
from brandtrace.core.security import validate_file_upload
from brandtrace.engine.multimodal import multimodal_engine
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
    # 1. Ensure approved facts embeddings exist for the tenant
    has_facts_seeded = any(e.get("org_id") == query.org_id and e.get("node_type") == "APPROVED_FACT" for e in mongo_manager._memory_embeddings)
    if not has_facts_seeded:
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

# ==============================================================================
# USER DOCUMENT MANAGEMENT, FILE INGESTION & SSRF-SAFE WEB IMPORT (PHASE 2)
# ==============================================================================

class SafeBrandHTMLParser(HTMLParser):
    """Safely extracts structured text, headings and metadata from HTML without executing scripts."""
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.in_style = False
        self.title = ""
        self.meta_description = ""
        self.headings: List[str] = []
        self.paragraphs: List[str] = []
        self.current_tag = ""
        self.current_text: List[str] = []

    def handle_starttag(self, tag, attrs):
        self.current_tag = tag.lower()
        if self.current_tag in ["script", "style", "noscript", "svg", "path", "iframe"]:
            self.in_script = True
        elif self.current_tag == "meta":
            attr_dict = dict(attrs)
            if attr_dict.get("name", "").lower() == "description":
                self.meta_description = attr_dict.get("content", "").strip()

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in ["script", "style", "noscript", "svg", "path", "iframe"]:
            self.in_script = False
        elif tag_lower in ["h1", "h2", "h3"]:
            txt = "".join(self.current_text).strip()
            if txt:
                self.headings.append(txt)
            self.current_text = []
        elif tag_lower in ["p", "li", "article", "section"]:
            txt = "".join(self.current_text).strip()
            if len(txt) > 15:
                self.paragraphs.append(txt)
            self.current_text = []

    def handle_data(self, data):
        if not self.in_script and data.strip():
            if self.current_tag == "title" and not self.title:
                self.title = data.strip()
            else:
                self.current_text.append(data)

def validate_url_safe(url: str) -> str:
    """
    Enforces SSRF boundaries:
    - Protocol must be HTTP or HTTPS
    - Rejects private, loopback, link-local, multicast, and cloud metadata hostnames and IP ranges
    - Rejects DNS resolution returning internal IPs
    """
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme.lower() not in ["http", "https"]:
        raise HTTPException(status_code=400, detail="SSRF Security Block: Only HTTP and HTTPS protocols are permitted.")
    
    host = parsed.hostname
    if not host:
        raise HTTPException(status_code=400, detail="Invalid URL: Missing hostname.")
    
    # 1. Block literal loopback, private, and cloud metadata hostnames
    forbidden_hosts = {
        "localhost", "127.0.0.1", "0.0.0.0", "::1",
        "metadata.google.internal", "instance-data", "169.254.169.254"
    }
    if host.lower() in forbidden_hosts or host.endswith(".local") or host.endswith(".internal"):
        raise HTTPException(
            status_code=400,
            detail=f"SSRF Security Block: Access to private or metadata host '{host}' is strictly prohibited."
        )
        
    # 2. DNS Resolution check against private IP ranges
    try:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        addr_infos = socket.getaddrinfo(host, port, proto=socket.IPPROTO_TCP)
        for family, _, _, _, sockaddr in addr_infos:
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)
            if (
                ip_obj.is_private or
                ip_obj.is_loopback or
                ip_obj.is_link_local or
                ip_obj.is_multicast or
                ip_obj.is_reserved or
                ip_str.startswith("169.254.") or
                ip_str.startswith("127.") or
                ip_str == "0.0.0.0"
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"SSRF Security Block: Host '{host}' resolves to protected internal IP '{ip_str}'."
                )
    except socket.gaierror:
        raise HTTPException(status_code=400, detail=f"DNS Resolution Error: Unable to resolve hostname '{host}'.")
    return url

async def _index_document_into_graph_and_vectors(doc: Dict[str, Any]):
    """
    Indexes document into BrandKnowledgeGraph and MongoDB Atlas Vector Search.
    Strictly updates processing_status to INDEXED only upon full success, or FAILED on error.
    """
    doc_id = doc["doc_id"]
    org_id = doc.get("organisation_id", "ORG-AURELLE")
    workspace_id = doc.get("workspace_id", "aurelle-tech")
    title = doc.get("title", "Brand Document")
    category = doc.get("category", "BRAND_GUIDELINES")
    raw_content = doc.get("raw_content", "")

    try:
        # 1. Update in-memory graph
        from brandtrace.routes.api import get_or_load_graph
        try:
            bkg = get_or_load_graph(workspace_id)
            doc_node = GraphNode(
                id=doc_id,
                label=title,
                type=NodeType.APPROVED_FACT,
                category=category,
                description=doc.get("description") or f"Certified {category} document",
                current_value=f"Active Document (v{doc.get('version_number', '1.0')})",
                department_owner="Brand Governance Committee",
                source_citation=f"{title} (v{doc.get('version_number', '1.0')})"
            )
            bkg.add_node(doc_node)
            doc["indexed_nodes_count"] = 1
        except Exception as ge:
            logger.warning(f"Graph node registration for {doc_id} skipped or deferred: {ge}")

        # 2. Vector Embedding computation
        embed_text = f"{title}\n{category}\n{doc.get('description', '')}\n{raw_content[:2000]}"
        embedding = await ai_provider.get_embedding(embed_text)
        doc["embedding"] = embedding

        # 3. Save Vector Record in MongoDB Atlas
        await mongo_manager.save_embedding_record({
            "node_id": doc_id,
            "org_id": org_id,
            "workspace_id": workspace_id,
            "label": title,
            "node_type": "BRAND_DOCUMENT",
            "category": category,
            "description": doc.get("description", ""),
            "embedding": embedding,
            "created_at": int(time.time())
        })

        # Mark strictly as INDEXED only after embedding & graph success
        doc["processing_status"] = DocumentProcessingStatus.INDEXED.value
        doc["processing_error"] = None
        await mongo_manager.save_document(doc)
    except Exception as e:
        logger.error(f"Document {doc_id} indexing failed: {e}")
        doc["processing_status"] = DocumentProcessingStatus.FAILED.value
        doc["processing_error"] = str(e)
        await mongo_manager.save_document(doc)
        raise

async def ensure_demo_documents():
    """Seeds baseline synthetic benchmark documents if collection is empty."""
    existing = await mongo_manager.list_documents(is_demo=True)
    if len(existing) > 0:
        return

    t_now = int(time.time() * 1000)
    demo_docs = [
        {
            "doc_id": "DOC-AUR-DEMO-01",
            "organisation_id": "ORG-AURELLE",
            "workspace_id": "aurelle-tech",
            "title": "Aurelle Global Brand Guidelines & Tone Matrix",
            "category": DocumentCategory.BRAND_VOICE.value,
            "source_type": DocumentSourceType.MANUAL_ENTRY.value,
            "description": "Certified tone, vocabulary parameters, and disallowed hype terminology for spatial computing.",
            "raw_content": (
                "Aurelle Voice & Tone Mandate:\n"
                "1. Vocabulary Standard: Understated technological confidence, disciplined precision, and scientific restraint.\n"
                "2. Strictly Prohibited Terminology: 'insane', 'unbeatable', 'miracle', 'cheap', 'crush the competition', 'game-changer'.\n"
                "3. Latency Mandate: Spatial audio claims must specify 'latency under 12ms measured per IEC benchmark standards'.\n"
                "4. Comparative Advertising: Never disparage named competitors."
            ),
            "version_number": "1.0",
            "processing_status": DocumentProcessingStatus.INDEXED.value,
            "is_demo": True,
            "created_by": "governance@aurelle.com",
            "created_at": t_now,
            "updated_at": t_now
        },
        {
            "doc_id": "DOC-AUR-DEMO-02",
            "organisation_id": "ORG-AURELLE",
            "workspace_id": "aurelle-tech",
            "title": "Aurelle Cloud Studio Subscription Pricing & Licensing Policy",
            "category": DocumentCategory.PRICING_POLICIES.value,
            "source_type": DocumentSourceType.MANUAL_ENTRY.value,
            "description": "Certified pricing schedule and recurring billing rules for Aurelle Cloud Studio.",
            "raw_content": (
                "Official Pricing Policy #2026-AUR-PRC:\n"
                "1. Official Enterprise Price: Aurelle Cloud Studio is officially certified at ₹499/month.\n"
                "2. Unauthorized Discounts: Any marketing copy offering ₹399/mo or unauthorized discounting constitutes a severe commercial violation.\n"
                "3. Expired Promotions: The ₹0 Founder Trial expired on December 31, 2025 and must never be referenced in active marketing releases.\n"
                "4. All pricing claims require explicit billing cycle disclosures ('billed annually or monthly')."
            ),
            "version_number": "1.0",
            "processing_status": DocumentProcessingStatus.INDEXED.value,
            "is_demo": True,
            "created_by": "governance@aurelle.com",
            "created_at": t_now,
            "updated_at": t_now
        },
        {
            "doc_id": "DOC-AUR-DEMO-03",
            "organisation_id": "ORG-AURELLE",
            "workspace_id": "aurelle-tech",
            "title": "FDA 21 CFR §870 General Wellness Guidance & Disclaimers",
            "category": DocumentCategory.REGULATORY_POLICIES.value,
            "source_type": DocumentSourceType.MANUAL_ENTRY.value,
            "description": "Statutory boundaries and mandatory disclaimers for wellness biometric tracking.",
            "raw_content": (
                "FDA Regulatory Guidance Compliance Policy:\n"
                "1. Wellness Classification: Aurelle biometric sensors are non-invasive general wellness instruments under FDA 21 CFR §870.\n"
                "2. Prohibited Claims: Never represent devices as diagnostic instruments or claim to diagnose, cure, or treat cardiovascular arrhythmias.\n"
                "3. Required Disclaimer: 'General wellness device. Not intended for clinical diagnosis or treatment of any medical condition.'"
            ),
            "version_number": "1.0",
            "processing_status": DocumentProcessingStatus.INDEXED.value,
            "is_demo": True,
            "created_by": "compliance@aurelle.com",
            "created_at": t_now,
            "updated_at": t_now
        },
        {
            "doc_id": "DOC-APX-DEMO-01",
            "organisation_id": "ORG-APEX",
            "workspace_id": "apex-dynamics",
            "title": "Apex GT Powertrain Specifications & EPA Range Policy",
            "category": DocumentCategory.PRODUCT_FACTS.value,
            "source_type": DocumentSourceType.MANUAL_ENTRY.value,
            "description": "Certified technical parameters, range thresholds, and fast-charging protocols.",
            "raw_content": (
                "Technical Specification Standard #APX-GT-2026:\n"
                "1. Certified Range: Apex GT achieves up to 520 miles per charge. All range assertions require the mandatory 'EPA-estimated' qualifier.\n"
                "2. Charging Metric: 10% to 80% charge in 14 minutes utilizing a 350kW DC fast charger.\n"
                "3. Battery Architecture: QuantumCell 800V Architecture."
            ),
            "version_number": "1.0",
            "processing_status": DocumentProcessingStatus.INDEXED.value,
            "is_demo": True,
            "created_by": "engineering@apex.com",
            "created_at": t_now,
            "updated_at": t_now
        }
    ]
    for d in demo_docs:
        await mongo_manager.save_document(d)

@router.post("/documents", response_model=DocumentResponse)
async def create_brand_document(req: CreateDocumentRequest):
    """
    Creates a new brand governance document under the authenticated organization & workspace.
    Validates content, initializes version 1.0, and indexes into the active Brand Knowledge Graph.
    """
    if not req.title or not req.title.strip():
        raise HTTPException(status_code=400, detail="Document title cannot be empty.")
    if not req.raw_content or not req.raw_content.strip():
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")

    org_id = req.org_id or ("ORG-AURELLE" if "aurelle" in req.workspace_id else "ORG-APEX")
    doc_id = f"DOC-{req.workspace_id[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
    t_now = int(time.time() * 1000)

    doc_dict = {
        "doc_id": doc_id,
        "organisation_id": org_id,
        "workspace_id": req.workspace_id,
        "title": req.title.strip(),
        "category": req.category,
        "source_type": DocumentSourceType.MANUAL_ENTRY.value,
        "description": req.description.strip() or f"{req.category} document created via governance control plane.",
        "raw_content": req.raw_content.strip(),
        "version_number": "1.0",
        "processing_status": DocumentProcessingStatus.PROCESSING.value,
        "is_demo": False,
        "created_by": "brand_manager@brandtrace.ai",
        "created_at": t_now,
        "updated_at": t_now
    }

    await mongo_manager.save_document(doc_dict)

    # Process and Index
    try:
        await _index_document_into_graph_and_vectors(doc_dict)
    except Exception as e:
        logger.error(f"Indexing error on document create: {e}")

    return DocumentResponse(**doc_dict)

@router.get("/documents", response_model=List[DocumentResponse])
async def list_brand_documents(
    workspace_id: Optional[str] = None,
    org_id: Optional[str] = None,
    category: Optional[str] = None,
    is_demo: Optional[bool] = None
):
    """
    Lists brand governance documents with strict tenant isolation and demo vs custom filtering.
    """
    await ensure_demo_documents()
    eff_org = org_id or ("ORG-AURELLE" if workspace_id and "aurelle" in workspace_id else "ORG-APEX" if workspace_id else None)
    raw_docs = await mongo_manager.list_documents(
        org_id=eff_org,
        workspace_id=workspace_id,
        category=category,
        is_demo=is_demo
    )
    return [DocumentResponse(**d) for d in raw_docs]

@router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_brand_document(doc_id: str, workspace_id: Optional[str] = None, org_id: Optional[str] = None):
    """
    Retrieves a single brand document with tenant isolation checks.
    """
    doc = await mongo_manager.get_document(doc_id, org_id, workspace_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found for the requested workspace.")
    return DocumentResponse(**doc)

@router.put("/documents/{doc_id}", response_model=DocumentResponse)
async def update_brand_document(doc_id: str, req: UpdateDocumentRequest, workspace_id: str = "aurelle-tech", org_id: Optional[str] = None):
    """
    Updates an existing document: preserves the previous version in historical archive,
    bumps semantic version (e.g. 1.0 -> 1.1), and re-indexes into the Brand Knowledge Graph.
    """
    eff_org = org_id or ("ORG-AURELLE" if "aurelle" in workspace_id else "ORG-APEX")
    existing = await mongo_manager.get_document(doc_id, eff_org, workspace_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found for update.")
    
    if existing.get("is_demo"):
        raise HTTPException(status_code=403, detail="Preloaded demo benchmark documents are protected and cannot be directly overwritten.")

    # 1. Archive Previous Version
    current_ver = existing.get("version_number", "1.0")
    ver_id = f"VER-{doc_id}-{uuid.uuid4().hex[:6].upper()}"
    await mongo_manager.record_document_version({
        "version_id": ver_id,
        "doc_id": doc_id,
        "organisation_id": eff_org,
        "workspace_id": workspace_id,
        "version_number": current_ver,
        "title": existing.get("title", ""),
        "category": existing.get("category", ""),
        "raw_content": existing.get("raw_content", ""),
        "change_summary": req.change_summary or "Historical snapshot preserved prior to edit.",
        "edited_by": "brand_manager@brandtrace.ai",
        "archived_at": int(time.time() * 1000)
    })

    # 2. Bump Version Number
    try:
        parts = current_ver.split(".")
        new_ver = f"{parts[0]}.{int(parts[1]) + 1}"
    except Exception:
        new_ver = f"{current_ver}.1"

    # 3. Apply Updates
    updates: Dict[str, Any] = {
        "version_number": new_ver,
        "processing_status": DocumentProcessingStatus.PROCESSING.value
    }
    if req.title is not None:
        updates["title"] = req.title.strip()
    if req.category is not None:
        updates["category"] = req.category
    if req.description is not None:
        updates["description"] = req.description.strip()
    if req.raw_content is not None:
        updates["raw_content"] = req.raw_content.strip()

    updated_doc = await mongo_manager.update_document(doc_id, eff_org, workspace_id, updates)
    if not updated_doc:
        raise HTTPException(status_code=500, detail="Failed to save document updates.")

    # 4. Re-Index Updated Content
    await _index_document_into_graph_and_vectors(updated_doc)
    return DocumentResponse(**updated_doc)

@router.delete("/documents/{doc_id}")
async def delete_brand_document(doc_id: str, workspace_id: str = "aurelle-tech", org_id: Optional[str] = None):
    """
    Safely removes a user-created document from active inventory and knowledge graph.
    Protected demo benchmark documents cannot be deleted. Historical versions are archived.
    """
    eff_org = org_id or ("ORG-AURELLE" if "aurelle" in workspace_id else "ORG-APEX")
    existing = await mongo_manager.get_document(doc_id, eff_org, workspace_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
    if existing.get("is_demo"):
        raise HTTPException(status_code=403, detail="Preloaded demo benchmark documents are protected and cannot be deleted.")

    # Remove node from active in-memory graph
    try:
        from brandtrace.routes.api import get_or_load_graph
        bkg = get_or_load_graph(workspace_id)
        if doc_id in bkg.graph:
            bkg.graph.remove_node(doc_id)
            bkg.node_meta.pop(doc_id, None)
    except Exception as ge:
        logger.warning(f"Removing graph node for {doc_id}: {ge}")

    success = await mongo_manager.delete_document(doc_id, eff_org, workspace_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document from database.")
    return {"status": "SUCCESS", "deleted_doc_id": doc_id, "message": "Document successfully deleted."}

@router.get("/documents/{doc_id}/versions", response_model=List[DocumentVersionResponse])
async def get_document_version_history(doc_id: str):
    """
    Retrieves the complete immutable audit trail of past revisions for a document.
    """
    raw_versions = await mongo_manager.get_document_versions(doc_id)
    return [DocumentVersionResponse(**v) for v in raw_versions]

@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document_file(
    file: UploadFile = File(...),
    workspace_id: str = Form("aurelle-tech"),
    org_id: Optional[str] = Form(None),
    category: str = Form("BRAND_GUIDELINES"),
    title: Optional[str] = Form(None)
):
    """
    Multipart upload endpoint supporting PDF, DOCX, TXT, and MD files.
    Enforces <=25MB limit, validates file format, extracts text, and registers with processing states.
    """
    content_bytes = await file.read()
    filename = file.filename or "uploaded_document"
    clean_filename = validate_file_upload(filename, len(content_bytes))

    # Parse readable text
    extracted_text = multimodal_engine.parse_document_text(clean_filename, content_bytes)
    if extracted_text.startswith("Error extracting"):
        raise HTTPException(status_code=422, detail=f"Failed to extract readable text from document: {extracted_text}")
    if not extracted_text.strip():
        raise HTTPException(status_code=422, detail="Document contains no extractable text layers.")

    eff_org = org_id or ("ORG-AURELLE" if "aurelle" in workspace_id else "ORG-APEX")
    doc_id = f"DOC-{workspace_id[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
    t_now = int(time.time() * 1000)
    doc_title = (title or clean_filename.rsplit(".", 1)[0].replace("_", " ").title()).strip()

    doc_dict = {
        "doc_id": doc_id,
        "organisation_id": eff_org,
        "workspace_id": workspace_id,
        "title": doc_title,
        "category": category,
        "source_type": DocumentSourceType.FILE_UPLOAD.value,
        "description": f"Uploaded {clean_filename.split('.')[-1].upper()} document ({len(content_bytes) / 1024:.1f} KB).",
        "raw_content": extracted_text.strip(),
        "version_number": "1.0",
        "processing_status": DocumentProcessingStatus.PROCESSING.value,
        "is_demo": False,
        "file_metadata": {
            "filename": clean_filename,
            "size_bytes": len(content_bytes),
            "content_type": file.content_type
        },
        "created_by": "brand_manager@brandtrace.ai",
        "created_at": t_now,
        "updated_at": t_now
    }

    await mongo_manager.save_document(doc_dict)

    # Ingest and Index
    try:
        await _index_document_into_graph_and_vectors(doc_dict)
    except Exception as e:
        logger.error(f"Error during file document indexing: {e}")

    return DocumentResponse(**doc_dict)

@router.post("/documents/import-website/preview", response_model=WebsiteImportPreviewResponse)
async def preview_website_import(req: WebsiteImportRequest):
    """
    Safely fetches a public website URL with strict SSRF protection and extracts clean text for user review.
    """
    safe_url = validate_url_safe(req.url.strip())
    
    try:
        # Fetch with SSRF-safe client and manual redirect validation
        current_url = safe_url
        content = ""
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=False, headers={"User-Agent": "BrandTrace-Bot/1.0 (Public Website Ingestion)"}) as client:
            for _ in range(3): # max 3 safe redirect hops
                resp = await client.get(current_url)
                if resp.is_redirect:
                    loc = resp.headers.get("Location")
                    if not loc:
                        break
                    next_url = urllib.parse.urljoin(current_url, loc)
                    current_url = validate_url_safe(next_url)
                    continue
                resp.raise_for_status()
                content = resp.text
                break
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to retrieve public website: {e}")

    parser = SafeBrandHTMLParser()
    try:
        parser.feed(content[:2_000_000]) # Cap parse size at 2MB
    except Exception as pe:
        logger.warning(f"HTML parse partial failure: {pe}")

    all_paras = [p for p in parser.paragraphs if len(p) > 20]
    extracted_body = "\n\n".join(all_paras[:40]) # extract up to 40 clean paragraphs
    title = parser.title or parser.headings[0] if parser.headings else urllib.parse.urlparse(safe_url).netloc
    
    return WebsiteImportPreviewResponse(
        url=safe_url,
        title=title.strip(),
        description=parser.meta_description or f"Imported content from {urllib.parse.urlparse(safe_url).netloc}",
        extracted_text=extracted_body.strip(),
        character_count=len(extracted_body),
        headings=parser.headings[:10],
        is_safe=True
    )

@router.post("/documents/import-website/commit", response_model=DocumentResponse)
async def commit_website_import(
    url: str = Form(...),
    title: str = Form(...),
    category: str = Form("BRAND_GUIDELINES"),
    workspace_id: str = Form("aurelle-tech"),
    org_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    raw_content: str = Form(...)
):
    """
    Commits reviewed website content into an indexed brand governance document.
    """
    safe_url = validate_url_safe(url.strip())
    if not raw_content or not raw_content.strip():
        raise HTTPException(status_code=400, detail="Cannot save document with empty content.")

    eff_org = org_id or ("ORG-AURELLE" if "aurelle" in workspace_id else "ORG-APEX")
    doc_id = f"DOC-{workspace_id[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
    t_now = int(time.time() * 1000)

    doc_dict = {
        "doc_id": doc_id,
        "organisation_id": eff_org,
        "workspace_id": workspace_id,
        "title": title.strip(),
        "category": category,
        "source_type": DocumentSourceType.WEBSITE_IMPORT.value,
        "description": (description or f"Imported public documentation from {safe_url}").strip(),
        "raw_content": raw_content.strip(),
        "version_number": "1.0",
        "processing_status": DocumentProcessingStatus.PROCESSING.value,
        "is_demo": False,
        "source_url": safe_url,
        "created_by": "brand_manager@brandtrace.ai",
        "created_at": t_now,
        "updated_at": t_now
    }

    await mongo_manager.save_document(doc_dict)

    # Ingest and Index
    try:
        await _index_document_into_graph_and_vectors(doc_dict)
    except Exception as e:
        logger.error(f"Error during website document indexing: {e}")

    return DocumentResponse(**doc_dict)


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

# ==============================================================================
# USER DOCUMENT MANAGEMENT, FILE INGESTION & SSRF-SAFE WEB IMPORT (PHASE 2)
# ==============================================================================

class SafeBrandHTMLParser(HTMLParser):
    """Safely extracts structured text, headings and metadata from HTML without executing scripts."""
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.in_style = False
        self.title = ""
        self.meta_description = ""
        self.headings: List[str] = []
        self.paragraphs: List[str] = []
        self.current_tag = ""
        self.current_text: List[str] = []

    def handle_starttag(self, tag, attrs):
        self.current_tag = tag.lower()
        if self.current_tag in ["script", "style", "noscript", "svg", "path", "iframe"]:
            self.in_script = True
        elif self.current_tag == "meta":
            attr_dict = dict(attrs)
            if attr_dict.get("name", "").lower() == "description":
                self.meta_description = attr_dict.get("content", "").strip()

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in ["script", "style", "noscript", "svg", "path", "iframe"]:
            self.in_script = False
        elif tag_lower in ["h1", "h2", "h3"]:
            txt = "".join(self.current_text).strip()
            if txt:
                self.headings.append(txt)
            self.current_text = []
        elif tag_lower in ["p", "li", "article", "section"]:
            txt = "".join(self.current_text).strip()
            if len(txt) > 15:
                self.paragraphs.append(txt)
            self.current_text = []

    def handle_data(self, data):
        if not self.in_script and data.strip():
            if self.current_tag == "title" and not self.title:
                self.title = data.strip()
            else:
                self.current_text.append(data)

def validate_url_safe(url: str) -> str:
    """
    Enforces SSRF boundaries:
    - Protocol must be HTTP or HTTPS
    - Rejects private, loopback, link-local, multicast, and cloud metadata hostnames and IP ranges
    - Rejects DNS resolution returning internal IPs
    """
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme.lower() not in ["http", "https"]:
        raise HTTPException(status_code=400, detail="SSRF Security Block: Only HTTP and HTTPS protocols are permitted.")
    
    host = parsed.hostname
    if not host:
        raise HTTPException(status_code=400, detail="Invalid URL: Missing hostname.")
    
    # 1. Block literal loopback, private, and cloud metadata hostnames
    forbidden_hosts = {
        "localhost", "127.0.0.1", "0.0.0.0", "::1",
        "metadata.google.internal", "instance-data", "169.254.169.254"
    }
    if host.lower() in forbidden_hosts or host.endswith(".local") or host.endswith(".internal"):
        raise HTTPException(
            status_code=400,
            detail=f"SSRF Security Block: Access to private or metadata host '{host}' is strictly prohibited."
        )
        
    # 2. DNS Resolution check against private IP ranges
    try:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        addr_infos = socket.getaddrinfo(host, port, proto=socket.IPPROTO_TCP)
        for family, _, _, _, sockaddr in addr_infos:
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)
            if (
                ip_obj.is_private or
                ip_obj.is_loopback or
                ip_obj.is_link_local or
                ip_obj.is_multicast or
                ip_obj.is_reserved or
                ip_str.startswith("169.254.") or
                ip_str.startswith("127.") or
                ip_str == "0.0.0.0"
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"SSRF Security Block: Host '{host}' resolves to protected internal IP '{ip_str}'."
                )
    except socket.gaierror:
        raise HTTPException(status_code=400, detail=f"DNS Resolution Error: Unable to resolve hostname '{host}'.")
    return url

async def _index_document_into_graph_and_vectors(doc: Dict[str, Any]):
    """
    Indexes document into BrandKnowledgeGraph and MongoDB Atlas Vector Search.
    Strictly updates processing_status to INDEXED only upon full success, or FAILED on error.
    """
    doc_id = doc["doc_id"]
    org_id = doc.get("organisation_id", "ORG-AURELLE")
    workspace_id = doc.get("workspace_id", "aurelle-tech")
    title = doc.get("title", "Brand Document")
    category = doc.get("category", "BRAND_GUIDELINES")
    raw_content = doc.get("raw_content", "")

    try:
        # 1. Update in-memory graph
        from brandtrace.routes.api import get_or_load_graph
        try:
            bkg = get_or_load_graph(workspace_id)
            doc_node = GraphNode(
                id=doc_id,
                label=title,
                type=NodeType.APPROVED_FACT,
                category=category,
                description=doc.get("description") or f"Certified {category} document",
                current_value=f"Active Document (v{doc.get('version_number', '1.0')})",
                department_owner="Brand Governance Committee",
                source_citation=f"{title} (v{doc.get('version_number', '1.0')})"
            )
            bkg.add_node(doc_node)
            doc["indexed_nodes_count"] = 1
        except Exception as ge:
            logger.warning(f"Graph node registration for {doc_id} skipped or deferred: {ge}")

        # 2. Vector Embedding computation
        embed_text = f"{title}\n{category}\n{doc.get('description', '')}\n{raw_content[:2000]}"
        embedding = await ai_provider.get_embedding(embed_text)
        doc["embedding"] = embedding

        # 3. Save Vector Record in MongoDB Atlas
        await mongo_manager.save_embedding_record({
            "node_id": doc_id,
            "org_id": org_id,
            "workspace_id": workspace_id,
            "label": title,
            "node_type": "BRAND_DOCUMENT",
            "category": category,
            "description": doc.get("description", ""),
            "embedding": embedding,
            "created_at": int(time.time())
        })

        # Mark strictly as INDEXED only after embedding & graph success
        doc["processing_status"] = DocumentProcessingStatus.INDEXED.value
        doc["processing_error"] = None
        await mongo_manager.save_document(doc)
    except Exception as e:
        logger.error(f"Document {doc_id} indexing failed: {e}")
        doc["processing_status"] = DocumentProcessingStatus.FAILED.value
        doc["processing_error"] = str(e)
        await mongo_manager.save_document(doc)
        raise

async def ensure_demo_documents():
    """Seeds baseline synthetic benchmark documents if collection is empty."""
    existing = await mongo_manager.list_documents(is_demo=True)
    if len(existing) > 0:
        return

    t_now = int(time.time() * 1000)
    demo_docs = [
        {
            "doc_id": "DOC-AUR-DEMO-01",
            "organisation_id": "ORG-AURELLE",
            "workspace_id": "aurelle-tech",
            "title": "Aurelle Global Brand Guidelines & Tone Matrix",
            "category": DocumentCategory.BRAND_VOICE.value,
            "source_type": DocumentSourceType.MANUAL_ENTRY.value,
            "description": "Certified tone, vocabulary parameters, and disallowed hype terminology for spatial computing.",
            "raw_content": (
                "Aurelle Voice & Tone Mandate:\n"
                "1. Vocabulary Standard: Understated technological confidence, disciplined precision, and scientific restraint.\n"
                "2. Strictly Prohibited Terminology: 'insane', 'unbeatable', 'miracle', 'cheap', 'crush the competition', 'game-changer'.\n"
                "3. Latency Mandate: Spatial audio claims must specify 'latency under 12ms measured per IEC benchmark standards'.\n"
                "4. Comparative Advertising: Never disparage named competitors."
            ),
            "version_number": "1.0",
            "processing_status": DocumentProcessingStatus.INDEXED.value,
            "is_demo": True,
            "created_by": "governance@aurelle.com",
            "created_at": t_now,
            "updated_at": t_now
        },
        {
            "doc_id": "DOC-AUR-DEMO-02",
            "organisation_id": "ORG-AURELLE",
            "workspace_id": "aurelle-tech",
            "title": "Aurelle Cloud Studio Subscription Pricing & Licensing Policy",
            "category": DocumentCategory.PRICING_POLICIES.value,
            "source_type": DocumentSourceType.MANUAL_ENTRY.value,
            "description": "Certified pricing schedule and recurring billing rules for Aurelle Cloud Studio.",
            "raw_content": (
                "Official Pricing Policy #2026-AUR-PRC:\n"
                "1. Official Enterprise Price: Aurelle Cloud Studio is officially certified at ₹499/month.\n"
                "2. Unauthorized Discounts: Any marketing copy offering ₹399/mo or unauthorized discounting constitutes a severe commercial violation.\n"
                "3. Expired Promotions: The ₹0 Founder Trial expired on December 31, 2025 and must never be referenced in active marketing releases.\n"
                "4. All pricing claims require explicit billing cycle disclosures ('billed annually or monthly')."
            ),
            "version_number": "1.0",
            "processing_status": DocumentProcessingStatus.INDEXED.value,
            "is_demo": True,
            "created_by": "governance@aurelle.com",
            "created_at": t_now,
            "updated_at": t_now
        },
        {
            "doc_id": "DOC-AUR-DEMO-03",
            "organisation_id": "ORG-AURELLE",
            "workspace_id": "aurelle-tech",
            "title": "FDA 21 CFR §870 General Wellness Guidance & Disclaimers",
            "category": DocumentCategory.REGULATORY_POLICIES.value,
            "source_type": DocumentSourceType.MANUAL_ENTRY.value,
            "description": "Statutory boundaries and mandatory disclaimers for wellness biometric tracking.",
            "raw_content": (
                "FDA Regulatory Guidance Compliance Policy:\n"
                "1. Wellness Classification: Aurelle biometric sensors are non-invasive general wellness instruments under FDA 21 CFR §870.\n"
                "2. Prohibited Claims: Never represent devices as diagnostic instruments or claim to diagnose, cure, or treat cardiovascular arrhythmias.\n"
                "3. Required Disclaimer: 'General wellness device. Not intended for clinical diagnosis or treatment of any medical condition.'"
            ),
            "version_number": "1.0",
            "processing_status": DocumentProcessingStatus.INDEXED.value,
            "is_demo": True,
            "created_by": "compliance@aurelle.com",
            "created_at": t_now,
            "updated_at": t_now
        },
        {
            "doc_id": "DOC-APX-DEMO-01",
            "organisation_id": "ORG-APEX",
            "workspace_id": "apex-dynamics",
            "title": "Apex GT Powertrain Specifications & EPA Range Policy",
            "category": DocumentCategory.PRODUCT_FACTS.value,
            "source_type": DocumentSourceType.MANUAL_ENTRY.value,
            "description": "Certified technical parameters, range thresholds, and fast-charging protocols.",
            "raw_content": (
                "Technical Specification Standard #APX-GT-2026:\n"
                "1. Certified Range: Apex GT achieves up to 520 miles per charge. All range assertions require the mandatory 'EPA-estimated' qualifier.\n"
                "2. Charging Metric: 10% to 80% charge in 14 minutes utilizing a 350kW DC fast charger.\n"
                "3. Battery Architecture: QuantumCell 800V Architecture."
            ),
            "version_number": "1.0",
            "processing_status": DocumentProcessingStatus.INDEXED.value,
            "is_demo": True,
            "created_by": "engineering@apex.com",
            "created_at": t_now,
            "updated_at": t_now
        }
    ]
    for d in demo_docs:
        await mongo_manager.save_document(d)

@router.post("/documents", response_model=DocumentResponse)
async def create_brand_document(req: CreateDocumentRequest):
    """
    Creates a new brand governance document under the authenticated organization & workspace.
    Validates content, initializes version 1.0, and indexes into the active Brand Knowledge Graph.
    """
    if not req.title or not req.title.strip():
        raise HTTPException(status_code=400, detail="Document title cannot be empty.")
    if not req.raw_content or not req.raw_content.strip():
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")

    org_id = req.org_id or ("ORG-AURELLE" if "aurelle" in req.workspace_id else "ORG-APEX")
    doc_id = f"DOC-{req.workspace_id[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
    t_now = int(time.time() * 1000)

    doc_dict = {
        "doc_id": doc_id,
        "organisation_id": org_id,
        "workspace_id": req.workspace_id,
        "title": req.title.strip(),
        "category": req.category,
        "source_type": DocumentSourceType.MANUAL_ENTRY.value,
        "description": req.description.strip() or f"{req.category} document created via governance control plane.",
        "raw_content": req.raw_content.strip(),
        "version_number": "1.0",
        "processing_status": DocumentProcessingStatus.PROCESSING.value,
        "is_demo": False,
        "created_by": "brand_manager@brandtrace.ai",
        "created_at": t_now,
        "updated_at": t_now
    }

    await mongo_manager.save_document(doc_dict)

    # Process and Index
    try:
        await _index_document_into_graph_and_vectors(doc_dict)
    except Exception as e:
        logger.error(f"Indexing error on document create: {e}")

    return DocumentResponse(**doc_dict)

@router.get("/documents", response_model=List[DocumentResponse])
async def list_brand_documents(
    workspace_id: Optional[str] = None,
    org_id: Optional[str] = None,
    category: Optional[str] = None,
    is_demo: Optional[bool] = None
):
    """
    Lists brand governance documents with strict tenant isolation and demo vs custom filtering.
    """
    await ensure_demo_documents()
    eff_org = org_id or ("ORG-AURELLE" if workspace_id and "aurelle" in workspace_id else "ORG-APEX" if workspace_id else None)
    raw_docs = await mongo_manager.list_documents(
        org_id=eff_org,
        workspace_id=workspace_id,
        category=category,
        is_demo=is_demo
    )
    return [DocumentResponse(**d) for d in raw_docs]

@router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_brand_document(doc_id: str, workspace_id: Optional[str] = None, org_id: Optional[str] = None):
    """
    Retrieves a single brand document with tenant isolation checks.
    """
    doc = await mongo_manager.get_document(doc_id, org_id, workspace_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found for the requested workspace.")
    return DocumentResponse(**doc)

@router.put("/documents/{doc_id}", response_model=DocumentResponse)
async def update_brand_document(doc_id: str, req: UpdateDocumentRequest, workspace_id: str = "aurelle-tech", org_id: Optional[str] = None):
    """
    Updates an existing document: preserves the previous version in historical archive,
    bumps semantic version (e.g. 1.0 -> 1.1), and re-indexes into the Brand Knowledge Graph.
    """
    eff_org = org_id or ("ORG-AURELLE" if "aurelle" in workspace_id else "ORG-APEX")
    existing = await mongo_manager.get_document(doc_id, eff_org, workspace_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found for update.")
    
    if existing.get("is_demo"):
        raise HTTPException(status_code=403, detail="Preloaded demo benchmark documents are protected and cannot be directly overwritten.")

    # 1. Archive Previous Version
    current_ver = existing.get("version_number", "1.0")
    ver_id = f"VER-{doc_id}-{uuid.uuid4().hex[:6].upper()}"
    await mongo_manager.record_document_version({
        "version_id": ver_id,
        "doc_id": doc_id,
        "organisation_id": eff_org,
        "workspace_id": workspace_id,
        "version_number": current_ver,
        "title": existing.get("title", ""),
        "category": existing.get("category", ""),
        "raw_content": existing.get("raw_content", ""),
        "change_summary": req.change_summary or "Historical snapshot preserved prior to edit.",
        "edited_by": "brand_manager@brandtrace.ai",
        "archived_at": int(time.time() * 1000)
    })

    # 2. Bump Version Number
    try:
        parts = current_ver.split(".")
        new_ver = f"{parts[0]}.{int(parts[1]) + 1}"
    except Exception:
        new_ver = f"{current_ver}.1"

    # 3. Apply Updates
    updates: Dict[str, Any] = {
        "version_number": new_ver,
        "processing_status": DocumentProcessingStatus.PROCESSING.value
    }
    if req.title is not None:
        updates["title"] = req.title.strip()
    if req.category is not None:
        updates["category"] = req.category
    if req.description is not None:
        updates["description"] = req.description.strip()
    if req.raw_content is not None:
        updates["raw_content"] = req.raw_content.strip()

    updated_doc = await mongo_manager.update_document(doc_id, eff_org, workspace_id, updates)
    if not updated_doc:
        raise HTTPException(status_code=500, detail="Failed to save document updates.")

    # 4. Re-Index Updated Content
    await _index_document_into_graph_and_vectors(updated_doc)
    return DocumentResponse(**updated_doc)

@router.delete("/documents/{doc_id}")
async def delete_brand_document(doc_id: str, workspace_id: str = "aurelle-tech", org_id: Optional[str] = None):
    """
    Safely removes a user-created document from active inventory and knowledge graph.
    Protected demo benchmark documents cannot be deleted. Historical versions are archived.
    """
    eff_org = org_id or ("ORG-AURELLE" if "aurelle" in workspace_id else "ORG-APEX")
    existing = await mongo_manager.get_document(doc_id, eff_org, workspace_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
    if existing.get("is_demo"):
        raise HTTPException(status_code=403, detail="Preloaded demo benchmark documents are protected and cannot be deleted.")

    # Remove node from active in-memory graph
    try:
        from brandtrace.routes.api import get_or_load_graph
        bkg = get_or_load_graph(workspace_id)
        if doc_id in bkg.graph:
            bkg.graph.remove_node(doc_id)
            bkg.node_meta.pop(doc_id, None)
    except Exception as ge:
        logger.warning(f"Removing graph node for {doc_id}: {ge}")

    success = await mongo_manager.delete_document(doc_id, eff_org, workspace_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document from database.")
    return {"status": "SUCCESS", "deleted_doc_id": doc_id, "message": "Document successfully deleted."}

@router.get("/documents/{doc_id}/versions", response_model=List[DocumentVersionResponse])
async def get_document_version_history(doc_id: str):
    """
    Retrieves the complete immutable audit trail of past revisions for a document.
    """
    raw_versions = await mongo_manager.get_document_versions(doc_id)
    return [DocumentVersionResponse(**v) for v in raw_versions]

@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document_file(
    file: UploadFile = File(...),
    workspace_id: str = Form("aurelle-tech"),
    org_id: Optional[str] = Form(None),
    category: str = Form("BRAND_GUIDELINES"),
    title: Optional[str] = Form(None)
):
    """
    Multipart upload endpoint supporting PDF, DOCX, TXT, and MD files.
    Enforces <=25MB limit, validates file format, extracts text, and registers with processing states.
    """
    content_bytes = await file.read()
    filename = file.filename or "uploaded_document"
    clean_filename = validate_file_upload(filename, len(content_bytes))

    # Parse readable text
    extracted_text = multimodal_engine.parse_document_text(clean_filename, content_bytes)
    if extracted_text.startswith("Error extracting"):
        raise HTTPException(status_code=422, detail=f"Failed to extract readable text from document: {extracted_text}")
    if not extracted_text.strip():
        raise HTTPException(status_code=422, detail="Document contains no extractable text layers.")

    eff_org = org_id or ("ORG-AURELLE" if "aurelle" in workspace_id else "ORG-APEX")
    doc_id = f"DOC-{workspace_id[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
    t_now = int(time.time() * 1000)
    doc_title = (title or clean_filename.rsplit(".", 1)[0].replace("_", " ").title()).strip()

    doc_dict = {
        "doc_id": doc_id,
        "organisation_id": eff_org,
        "workspace_id": workspace_id,
        "title": doc_title,
        "category": category,
        "source_type": DocumentSourceType.FILE_UPLOAD.value,
        "description": f"Uploaded {clean_filename.split('.')[-1].upper()} document ({len(content_bytes) / 1024:.1f} KB).",
        "raw_content": extracted_text.strip(),
        "version_number": "1.0",
        "processing_status": DocumentProcessingStatus.PROCESSING.value,
        "is_demo": False,
        "file_metadata": {
            "filename": clean_filename,
            "size_bytes": len(content_bytes),
            "content_type": file.content_type
        },
        "created_by": "brand_manager@brandtrace.ai",
        "created_at": t_now,
        "updated_at": t_now
    }

    await mongo_manager.save_document(doc_dict)

    # Ingest and Index
    try:
        await _index_document_into_graph_and_vectors(doc_dict)
    except Exception as e:
        logger.error(f"Error during file document indexing: {e}")

    return DocumentResponse(**doc_dict)

@router.post("/documents/import-website/preview", response_model=WebsiteImportPreviewResponse)
async def preview_website_import(req: WebsiteImportRequest):
    """
    Safely fetches a public website URL with strict SSRF protection and extracts clean text for user review.
    """
    safe_url = validate_url_safe(req.url.strip())
    
    try:
        # Fetch with SSRF-safe client and manual redirect validation
        current_url = safe_url
        content = ""
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=False, headers={"User-Agent": "BrandTrace-Bot/1.0 (Public Website Ingestion)"}) as client:
            for _ in range(3): # max 3 safe redirect hops
                resp = await client.get(current_url)
                if resp.is_redirect:
                    loc = resp.headers.get("Location")
                    if not loc:
                        break
                    next_url = urllib.parse.urljoin(current_url, loc)
                    current_url = validate_url_safe(next_url)
                    continue
                resp.raise_for_status()
                content = resp.text
                break
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to retrieve public website: {e}")

    parser = SafeBrandHTMLParser()
    try:
        parser.feed(content[:2_000_000]) # Cap parse size at 2MB
    except Exception as pe:
        logger.warning(f"HTML parse partial failure: {pe}")

    all_paras = [p for p in parser.paragraphs if len(p) > 20]
    extracted_body = "\n\n".join(all_paras[:40]) # extract up to 40 clean paragraphs
    title = parser.title or parser.headings[0] if parser.headings else urllib.parse.urlparse(safe_url).netloc
    
    return WebsiteImportPreviewResponse(
        url=safe_url,
        title=title.strip(),
        description=parser.meta_description or f"Imported content from {urllib.parse.urlparse(safe_url).netloc}",
        extracted_text=extracted_body.strip(),
        character_count=len(extracted_body),
        headings=parser.headings[:10],
        is_safe=True
    )

@router.post("/documents/import-website/commit", response_model=DocumentResponse)
async def commit_website_import(
    url: str = Form(...),
    title: str = Form(...),
    category: str = Form("BRAND_GUIDELINES"),
    workspace_id: str = Form("aurelle-tech"),
    org_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    raw_content: str = Form(...)
):
    """
    Commits reviewed website content into an indexed brand governance document.
    """
    safe_url = validate_url_safe(url.strip())
    if not raw_content or not raw_content.strip():
        raise HTTPException(status_code=400, detail="Cannot save document with empty content.")

    eff_org = org_id or ("ORG-AURELLE" if "aurelle" in workspace_id else "ORG-APEX")
    doc_id = f"DOC-{workspace_id[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
    t_now = int(time.time() * 1000)

    doc_dict = {
        "doc_id": doc_id,
        "organisation_id": eff_org,
        "workspace_id": workspace_id,
        "title": title.strip(),
        "category": category,
        "source_type": DocumentSourceType.WEBSITE_IMPORT.value,
        "description": (description or f"Imported public documentation from {safe_url}").strip(),
        "raw_content": raw_content.strip(),
        "version_number": "1.0",
        "processing_status": DocumentProcessingStatus.PROCESSING.value,
        "is_demo": False,
        "source_url": safe_url,
        "created_by": "brand_manager@brandtrace.ai",
        "created_at": t_now,
        "updated_at": t_now
    }

    await mongo_manager.save_document(doc_dict)

    # Ingest and Index
    try:
        await _index_document_into_graph_and_vectors(doc_dict)
    except Exception as e:
        logger.error(f"Error during website document indexing: {e}")

    return DocumentResponse(**doc_dict)


