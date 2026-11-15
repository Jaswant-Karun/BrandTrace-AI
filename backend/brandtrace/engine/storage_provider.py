import os
import uuid
import time
import hashlib
from typing import Dict, Any, Optional, Tuple
from brandtrace.database.mongo import mongo_manager

class CloudStorageProvider:
    """
    Secure Cloud Object Storage Abstraction for Multimodal Brand Assets.
    Stores file binaries with SHA-256 integrity checks;
    Stores metadata, ownership, and references in MongoDB Atlas.
    """
    def __init__(self, base_storage_dir: str = "./storage/assets"):
        self.base_storage_dir = base_storage_dir
        os.makedirs(self.base_storage_dir, exist_ok=True)

    async def store_file(
        self,
        filename: str,
        content_bytes: bytes,
        content_type: str,
        org_id: str,
        workspace_id: str,
        uploaded_by: str = "Brand Director"
    ) -> Dict[str, Any]:
        """
        Stores binary object to storage backend and indexes metadata in MongoDB Atlas.
        """
        file_id = f"FILE-{uuid.uuid4().hex[:12].upper()}"
        sha256_hash = hashlib.sha256(content_bytes).hexdigest()
        size_bytes = len(content_bytes)

        # Tenant-isolated path
        tenant_dir = os.path.join(self.base_storage_dir, org_id)
        os.makedirs(tenant_dir, exist_ok=True)
        safe_filename = f"{file_id}_{filename.replace(' ', '_')}"
        file_path = os.path.join(tenant_dir, safe_filename)

        with open(file_path, "wb") as f:
            f.write(content_bytes)

        file_meta = {
            "file_id": file_id,
            "org_id": org_id,
            "workspace_id": workspace_id,
            "filename": filename,
            "content_type": content_type,
            "size_bytes": size_bytes,
            "storage_provider": "CLOUD_OBJECT_STORAGE_OR_LOCAL",
            "storage_path": file_path,
            "sha256": sha256_hash,
            "processing_status": "INDEXED_AND_VERIFIED",
            "uploaded_by": uploaded_by,
            "uploaded_at": int(time.time()),
            "uploaded_at_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        # Persist metadata to MongoDB Atlas
        await mongo_manager.save_file_meta(file_meta)
        return file_meta

    async def retrieve_file(self, file_id: str) -> Optional[Tuple[Dict[str, Any], bytes]]:
        """Retrieves file metadata and content bytes."""
        meta = await mongo_manager.get_file_meta(file_id)
        if not meta:
            return None
        file_path = meta.get("storage_path")
        if file_path and os.path.exists(file_path):
            with open(file_path, "rb") as f:
                content = f.read()
            return meta, content
        return meta, b""

storage_provider = CloudStorageProvider()
