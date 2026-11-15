import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from typing import List, Dict, Any, Optional
from brandtrace.core.security import validate_file_upload
from brandtrace.engine.storage_provider import storage_provider
from brandtrace.engine.multimodal import multimodal_engine
from brandtrace.database.mongo import mongo_manager
from brandtrace.graph.engine import BrandKnowledgeGraph
from brandtrace.data.seed_data import BRAND_SEEDS
from brandtrace.modules.auth.router import get_current_user
from brandtrace.modules.auth.models import UserProfile

router = APIRouter(prefix="/content", tags=["Content Management & Cloud File Processing"])

@router.post("/upload")
async def upload_and_process_multimodal_asset(
    file: UploadFile = File(...),
    org_id: Optional[str] = Form(None),
    workspace_id: Optional[str] = Form(None),
    uploaded_by: Optional[str] = Form(None),
    user: UserProfile = Depends(get_current_user),
):
    """
    1. Reads binary bytes from uploaded file.
    2. Enforces file size limit (<=25MB) and disallowed extensions.
    3. Stores binary in isolated cloud storage provider.
    4. Runs multimodal AST & media inspection (PDF, DOCX, TXT, MD, PNG, JPG, Video).
    5. Persists metadata, ownership, and references into MongoDB Atlas 'file_storage_meta' collection.
    """
    content_bytes = await file.read()
    filename = file.filename or "uploaded_content_asset"
    content_type = file.content_type or "application/octet-stream"

    # Enforce security validation (max 25MB, extension whitelist, path traversal check)
    clean_filename = validate_file_upload(filename, len(content_bytes), content_type)
    tenant_org_id = user.org_id
    tenant_workspace_id = user.workspace_id

    # Store binary in cloud storage abstraction & index in MongoDB Atlas
    file_meta = await storage_provider.store_file(
        filename=clean_filename,
        content_bytes=content_bytes,
        content_type=content_type,
        org_id=tenant_org_id,
        workspace_id=tenant_workspace_id,
        uploaded_by=user.name
    )

    # Perform multimodal AST / frame-level inspection
    seed_graph_data = BRAND_SEEDS.get(tenant_workspace_id) or BRAND_SEEDS.get("aurelle-tech")
    bkg = BrandKnowledgeGraph.from_graph_data(seed_graph_data) if seed_graph_data else BrandKnowledgeGraph(tenant_workspace_id, tenant_workspace_id)
    
    inspection_report = multimodal_engine.inspect_file(filename, content_bytes, bkg)

    return {
        "status": "PROCESSED_AND_INDEXED",
        "file_metadata": file_meta,
        "inspection_report": inspection_report
    }

@router.get("/files")
async def list_persisted_files(user: UserProfile = Depends(get_current_user)):
    """Lists persisted file metadata from MongoDB Atlas."""
    return await mongo_manager.list_files(user.org_id)

@router.get("/files/{file_id}")
async def get_file_metadata(file_id: str, user: UserProfile = Depends(get_current_user)):
    """Retrieves file metadata from MongoDB Atlas."""
    meta = await mongo_manager.get_file_meta(file_id)
    if not meta or meta.get("org_id") != user.org_id:
        raise HTTPException(status_code=404, detail="File metadata not found in database")
    return meta

@router.get("/files/{file_id}/download")
async def download_file(file_id: str, user: UserProfile = Depends(get_current_user)):
    """Downloads an uploaded asset after enforcing tenant ownership."""
    meta = await mongo_manager.get_file_meta(file_id)
    if not meta or meta.get("org_id") != user.org_id:
        raise HTTPException(status_code=404, detail="File not found")
    storage_path = meta.get("storage_path")
    if not storage_path or not os.path.isfile(storage_path):
        raise HTTPException(status_code=404, detail="Stored file is unavailable")
    return FileResponse(
        storage_path,
        media_type=meta.get("content_type") or "application/octet-stream",
        filename=meta.get("filename") or "download",
    )
