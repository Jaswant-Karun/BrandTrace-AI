import logging
import time
import math
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.errors import PyMongoError
from bson import ObjectId
from brandtrace.core.config import settings

logger = logging.getLogger("brandtrace.database")

class MongoManager:
    """
    Enterprise MongoDB Atlas Persistence Manager
    The single primary application database for BrandTrace AI.
    Provides:
      - Motor Async connection pooling
      - Multi-tenant data isolation (org_id, workspace_id)
      - Compound & unique indexes
      - Graph dependency traversal via $graphLookup aggregation
      - MongoDB Atlas Vector Search ($vectorSearch) with tenant pre-filtering
      - Atomic task resolution (find_one_and_update)
      - File metadata persistence
      - Graceful in-memory fallback for offline/isolated judging
    """
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_connected: bool = False
    
    # In-memory fallback stores if MongoDB is unreachable
    _memory_brands: Dict[str, Dict[str, Any]] = {}
    _memory_nodes: Dict[str, List[Dict[str, Any]]] = {}
    _memory_edges: Dict[str, List[Dict[str, Any]]] = {}
    _memory_verifications: List[Dict[str, Any]] = []
    _memory_releases: List[Dict[str, Any]] = []
    _memory_tasks: Dict[str, Dict[str, Any]] = {}
    _memory_versions: Dict[str, List[Dict[str, Any]]] = {}
    _memory_files: Dict[str, Dict[str, Any]] = {}
    _memory_orgs: Dict[str, Dict[str, Any]] = {}
    _memory_embeddings: List[Dict[str, Any]] = []

    def __init__(self):
        from brandtrace.database.repository import BrandTraceRepository
        self.repo = BrandTraceRepository(self)

    async def connect(self):
        """Attempts connection to MongoDB Atlas with connection pooling and timeouts."""
        is_production = settings.environment.lower() in ["production", "prod"]
        
        # In production, placeholder credentials must fail immediately with clear error
        if is_production and "ENTER_SECURE_PASSWORD" in settings.mongodb_uri:
            raise RuntimeError(
                "Production startup failure: Placeholder credentials detected in MONGODB_URI. "
                "Please configure an authenticated MongoDB Atlas connection string in your production environment variables."
            )

        try:
            masked_uri = settings.mongodb_uri.split("@")[-1] if "@" in settings.mongodb_uri else settings.mongodb_uri
            logger.info(f"Connecting to MongoDB Atlas at {masked_uri} (db: {settings.mongodb_db_name})...")
            
            self.client = AsyncIOMotorClient(
                settings.mongodb_uri,
                maxPoolSize=50,
                minPoolSize=5,
                serverSelectionTimeoutMS=2500,
                connectTimeoutMS=2500,
                retryWrites=True
            )
            # Ping database
            await self.client.admin.command('ping')
            self.db = self.client[settings.mongodb_db_name]
            self.is_connected = True
            logger.info("Successfully connected to MongoDB Atlas.")

            # Initialize indexes
            await self.ensure_indexes()
            
            # Build Phase 5 Collections Indexes
            from brandtrace.database.indexes import build_phase5_indexes
            await build_phase5_indexes(self.db)
        except Exception as e:
            self.is_connected = False
            self.client = None
            self.db = None
            if is_production:
                logger.error("CRITICAL: MongoDB Atlas connection failed in production environment.")
                raise RuntimeError(
                    "Production startup failure: Unable to establish an authenticated connection to MongoDB Atlas. "
                    "In-memory fallback is strictly disabled in production to guarantee data persistence. "
                    "Verify your MONGODB_URI and Atlas Network Access whitelist."
                ) from None
            logger.warning(f"MongoDB Atlas not reachable ({e}). Operating in resilient memory-fallback mode (development/testing only).")

    async def close(self):
        """Closes MongoDB connection."""
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("MongoDB Atlas connection closed.")

    async def ensure_indexes(self):
        """Creates compound, unique, and vector indexes across MongoDB Atlas collections."""
        if not self.is_connected or self.db is None:
            return
        
        try:
            # 1. Organizations
            await self.db.organizations.create_index([("org_id", ASCENDING)], unique=True)
            
            # 2. Workspaces
            await self.db.workspaces.create_index([("org_id", ASCENDING), ("workspace_id", ASCENDING)], unique=True)

            # 3. Knowledge Nodes (Guidelines, Approved Facts, Claims)
            await self.db.knowledge_nodes.create_index([("org_id", ASCENDING), ("workspace_id", ASCENDING), ("node_id", ASCENDING)], unique=True)
            await self.db.knowledge_nodes.create_index([("node_type", ASCENDING)])
            await self.db.knowledge_nodes.create_index([("status", ASCENDING)])

            # 4. Graph Relationships (DAG Edges)
            await self.db.graph_relationships.create_index([("org_id", ASCENDING), ("source_node_id", ASCENDING)])
            await self.db.graph_relationships.create_index([("org_id", ASCENDING), ("target_node_id", ASCENDING)])
            await self.db.graph_relationships.create_index([("relationship_type", ASCENDING)])

            # 5. Content Assets
            await self.db.content_assets.create_index([("org_id", ASCENDING), ("workspace_id", ASCENDING), ("asset_id", ASCENDING)], unique=True)
            await self.db.content_assets.create_index([("status", ASCENDING)])

            # 6. Revision Tasks
            await self.db.revision_tasks.create_index([("org_id", ASCENDING), ("task_id", ASCENDING)], unique=True)
            await self.db.revision_tasks.create_index([("status", ASCENDING), ("created_at", DESCENDING)])

            # 7. File Storage Metadata
            await self.db.file_storage_meta.create_index([("file_id", ASCENDING)], unique=True)
            await self.db.file_storage_meta.create_index([("org_id", ASCENDING), ("workspace_id", ASCENDING)])

            # 8. Release Ledger (Tamper-Evident Blocks)
            await self.db.release_ledger.create_index([("org_id", ASCENDING), ("release_id", ASCENDING)], unique=True)
            await self.db.release_ledger.create_index([("timestamp", DESCENDING)])
            await self.db.release_ledger.create_index([("audit_stamp", ASCENDING)])

            logger.info("MongoDB Atlas indexes ensured across all collections.")
        except Exception as e:
            logger.warning(f"Could not build all MongoDB indexes: {e}")

    async def get_db_status(self) -> Dict[str, Any]:
        """Returns connection status and collection stats."""
        if self.is_connected and self.db is not None:
            try:
                collections = await self.db.list_collection_names()
                counts = {}
                for col in collections:
                    counts[col] = await self.db[col].count_documents({})
                return {
                    "connected": True,
                    "engine": "MongoDB Atlas (Async Motor Driver)",
                    "database": settings.mongodb_db_name,
                    "uri": settings.mongodb_uri.split("@")[-1],
                    "collections": counts,
                    "vector_search_ready": "knowledge_nodes" in collections or "embeddings" in collections
                }
            except Exception as e:
                return {
                    "connected": False,
                    "error": str(e),
                    "engine": "In-Memory Fallback"
                }
        return {
            "connected": False,
            "engine": "In-Memory Fallback (Offline/Judging Mode)",
            "database": "brandtrace-inmemory",
            "collections": {
                "brands": len(self._memory_brands),
                "verifications": len(self._memory_verifications),
                "release_ledger": len(self._memory_releases),
                "revision_tasks": len(self._memory_tasks),
                "files": len(self._memory_files)
            },
            "vector_search_ready": True
        }

    # ==============================================================================
    # MULTI-TENANT ORGANIZATIONS & WORKSPACES
    # ==============================================================================
    async def get_organization(self, org_id: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            return await self.db.organizations.find_one({"org_id": org_id}, {"_id": 0})
        return self._memory_orgs.get(org_id)

    async def save_organization(self, org_doc: Dict[str, Any]):
        org_id = org_doc["org_id"]
        if self.is_connected and self.db is not None:
            update_data = {k: v for k, v in org_doc.items() if k != "_id"}
            set_on_insert = {"_id": org_doc["_id"]} if "_id" in org_doc else {"_id": str(ObjectId())}
            await self.db.organizations.update_one(
                {"org_id": org_id},
                {"$set": update_data, "$setOnInsert": set_on_insert},
                upsert=True
            )
        self._memory_orgs[org_id] = org_doc

    # ==============================================================================
    # BRAND PROFILES & WORKSPACES
    # ==============================================================================
    async def get_brand(self, brand_id: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            brand = await self.db.brands.find_one({"brand_id": brand_id}, {"_id": 0})
            return brand
        return self._memory_brands.get(brand_id)

    async def list_brands(self) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            cursor = self.db.brands.find({}, {"_id": 0})
            return await cursor.to_list(length=100)
        return list(self._memory_brands.values())

    async def save_brand(self, brand_data: Dict[str, Any]):
        brand_id = brand_data["brand_id"]
        if self.is_connected and self.db is not None:
            update_data = {k: v for k, v in brand_data.items() if k != "_id"}
            set_on_insert = {"_id": brand_data["_id"]} if "_id" in brand_data else {"_id": str(ObjectId())}
            await self.db.brands.update_one(
                {"brand_id": brand_id},
                {"$set": update_data, "$setOnInsert": set_on_insert},
                upsert=True
            )
        self._memory_brands[brand_id] = brand_data

    # ==============================================================================
    # KNOWLEDGE GRAPH & RELATIONSHIP TRAVERSAL ($graphLookup)
    # ==============================================================================
    async def save_graph(self, brand_id: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]):
        org_id = f"ORG-{brand_id.upper()}"
        if self.is_connected and self.db is not None:
            for node in nodes:
                node_copy = dict(node)
                node_copy["brand_id"] = brand_id
                node_copy["org_id"] = org_id
                node_copy["workspace_id"] = brand_id
                node_copy["node_id"] = node.get("id")
                node_update = {k: v for k, v in node_copy.items() if k != "_id"}
                node_set_on_insert = {"_id": node_copy["_id"]} if "_id" in node_copy else {"_id": str(ObjectId())}
                await self.db.knowledge_nodes.update_one(
                    {"org_id": org_id, "node_id": node["id"]},
                    {"$set": node_update, "$setOnInsert": node_set_on_insert},
                    upsert=True
                )
            for edge in edges:
                edge_copy = dict(edge)
                edge_copy["brand_id"] = brand_id
                edge_copy["org_id"] = org_id
                edge_copy["workspace_id"] = brand_id
                edge_copy["source_node_id"] = edge.get("source")
                edge_copy["target_node_id"] = edge.get("target")
                edge_copy["relationship_type"] = edge.get("type", "DEPENDS_ON")
                edge_key = f"{edge['source']}->{edge['target']}:{edge.get('type')}"
                edge_copy["edge_key"] = edge_key
                edge_update = {k: v for k, v in edge_copy.items() if k != "_id"}
                edge_set_on_insert = {"_id": edge_copy["_id"]} if "_id" in edge_copy else {"_id": str(ObjectId())}
                await self.db.graph_relationships.update_one(
                    {"org_id": org_id, "edge_key": edge_key},
                    {"$set": edge_update, "$setOnInsert": edge_set_on_insert},
                    upsert=True
                )
        self._memory_nodes[brand_id] = nodes
        self._memory_edges[brand_id] = edges

    async def get_graph(self, brand_id: str) -> Dict[str, Any]:
        org_id = f"ORG-{brand_id.upper()}"
        if self.is_connected and self.db is not None:
            nodes_cursor = self.db.knowledge_nodes.find({"org_id": org_id}, {"_id": 0})
            edges_cursor = self.db.graph_relationships.find({"org_id": org_id}, {"_id": 0})
            nodes = await nodes_cursor.to_list(length=500)
            edges = await edges_cursor.to_list(length=1000)
            if nodes or edges:
                return {"nodes": nodes, "edges": edges}
        return {
            "nodes": self._memory_nodes.get(brand_id, []),
            "edges": self._memory_edges.get(brand_id, [])
        }

    async def traverse_graph_dependencies(
        self,
        org_id: str,
        root_node_id: str,
        max_depth: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Uses MongoDB $graphLookup aggregation pipeline to recursively traverse
        downstream relationships starting from root_node_id.
        """
        if self.is_connected and self.db is not None:
            pipeline = [
                {"$match": {"org_id": org_id, "target_node_id": root_node_id}},
                {
                    "$graphLookup": {
                        "from": "graph_relationships",
                        "startWith": "$source_node_id",
                        "connectFromField": "source_node_id",
                        "connectToField": "target_node_id",
                        "as": "cascading_dependents",
                        "maxDepth": max_depth,
                        "restrictSearchWithMatch": {"org_id": org_id}
                    }
                }
            ]
            cursor = self.db.graph_relationships.aggregate(pipeline)
            results = await cursor.to_list(length=100)
            return results
        
        # Memory fallback BFS
        dependents = []
        edges = []
        for e_list in self._memory_edges.values():
            edges.extend(e_list)
        
        queue = [root_node_id]
        visited = set([root_node_id])
        while queue:
            curr = queue.pop(0)
            for edge in edges:
                if edge.get("target") == curr and edge.get("source") not in visited:
                    visited.add(edge["source"])
                    queue.append(edge["source"])
                    dependents.append(edge)
        return dependents

    # ==============================================================================
    # MONGODB ATLAS VECTOR SEARCH
    # ==============================================================================
    async def vector_search_knowledge(
        self,
        org_id: str,
        workspace_id: str,
        query_vector: List[float],
        limit: int = 5,
        min_score: float = 0.10
    ) -> List[Dict[str, Any]]:
        """
        Executes MongoDB Atlas $vectorSearch pipeline with strict tenant pre-filtering.
        Falls back to in-memory cosine similarity if Atlas Vector Index is not yet activated.
        """
        if self.is_connected and self.db is not None:
            try:
                pipeline = [
                    {
                        "$vectorSearch": {
                            "index": "vector_index",
                            "path": "embedding",
                            "queryVector": query_vector,
                            "numCandidates": 50,
                            "limit": limit,
                            "filter": {
                                "org_id": org_id,
                                "workspace_id": workspace_id
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 0,
                            "node_id": 1,
                            "label": 1,
                            "node_type": 1,
                            "description": 1,
                            "score": {"$meta": "vectorSearchScore"}
                        }
                    }
                ]
                cursor = self.db.knowledge_nodes.aggregate(pipeline)
                results = await cursor.to_list(length=limit)
                if results:
                    return results
            except Exception as e:
                logger.info(f"Atlas $vectorSearch fallback note: {e}")

        # In-memory cosine similarity calculation
        results = []
        pool = self._memory_embeddings
        for item in pool:
            if item.get("org_id") == org_id and item.get("workspace_id") == workspace_id:
                vec = item.get("embedding", [])
                if len(vec) == len(query_vector):
                    dot = sum(a * b for a, b in zip(vec, query_vector))
                    norm_a = math.sqrt(sum(a * a for a in vec))
                    norm_b = math.sqrt(sum(b * b for b in query_vector))
                    sim = dot / (norm_a * norm_b) if norm_a and norm_b else 0.0
                    if sim >= min_score:
                        results.append({
                            "node_id": item.get("node_id"),
                            "label": item.get("label"),
                            "node_type": item.get("node_type"),
                            "description": item.get("description"),
                            "score": round(sim, 4)
                        })
        return sorted(results, key=lambda x: x["score"], reverse=True)[:limit]

    async def save_embedding_record(self, record: Dict[str, Any]):
        """Persists a vector embedding record associated with a knowledge node."""
        if self.is_connected and self.db is not None:
            await self.db.knowledge_nodes.update_one(
                {"org_id": record["org_id"], "node_id": record["node_id"]},
                {"$set": {"embedding": record["embedding"], "label": record.get("label"), "description": record.get("description")}},
                upsert=True
            )
        self._memory_embeddings.append(record)

    # ==============================================================================
    # ATOMIC APPROVAL OPERATIONS
    # ==============================================================================
    async def atomic_resolve_task(
        self,
        task_id: str,
        decision: str,
        reviewer_name: str,
        audit_proof: str,
        final_content: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Atomically updates a revision task only if current status is 'PENDING_REVIEW',
        guaranteeing no duplicate approvals or race conditions.
        """
        update_doc = {
            "status": "APPROVED" if decision == "APPROVED" else "REJECTED",
            "reviewed_by": reviewer_name,
            "resolved_at": int(time.time()),
            "audit_proof": audit_proof
        }
        if final_content:
            update_doc["proposed_content"] = final_content

        if self.is_connected and self.db is not None:
            updated = await self.db.revision_tasks.find_one_and_update(
                {"task_id": task_id, "status": "PENDING_REVIEW"},
                {"$set": update_doc},
                return_document=True
            )
            if updated:
                updated.pop("_id", None)
                self._memory_tasks[task_id] = updated
                return updated
            return None

        # Memory store fallback
        task = self._memory_tasks.get(task_id)
        if task and task.get("status") == "PENDING_REVIEW":
            task.update(update_doc)
            self._memory_tasks[task_id] = task
            return task
        return None

    # ==============================================================================
    # FILE STORAGE METADATA
    # ==============================================================================
    async def save_file_meta(self, file_meta: Dict[str, Any]):
        file_id = file_meta["file_id"]
        if self.is_connected and self.db is not None:
            update_data = {k: v for k, v in file_meta.items() if k != "_id"}
            set_on_insert = {"_id": file_meta["_id"]} if "_id" in file_meta else {"_id": str(ObjectId())}
            await self.db.file_storage_meta.update_one(
                {"file_id": file_id},
                {"$set": update_data, "$setOnInsert": set_on_insert},
                upsert=True
            )
        self._memory_files[file_id] = file_meta

    async def get_file_meta(self, file_id: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            return await self.db.file_storage_meta.find_one({"file_id": file_id}, {"_id": 0})
        return self._memory_files.get(file_id)

    async def list_files(self, org_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            query = {"org_id": org_id} if org_id else {}
            cursor = self.db.file_storage_meta.find(query, {"_id": 0}).sort("uploaded_at", -1)
            return await cursor.to_list(length=100)
        items = list(self._memory_files.values())
        if org_id:
            items = [f for f in items if f.get("org_id") == org_id]
        return sorted(items, key=lambda x: x.get("uploaded_at", 0), reverse=True)

    # ==============================================================================
    # VERIFICATIONS & RELEASES
    # ==============================================================================
    async def save_verification(self, verification_doc: Dict[str, Any]):
        if self.is_connected and self.db is not None:
            await self.db.verifications.insert_one(dict(verification_doc))
        self._memory_verifications.append(verification_doc)

    async def list_verifications(self, brand_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            query = {"brand_id": brand_id} if brand_id else {}
            cursor = self.db.verifications.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit)
            return await cursor.to_list(length=limit)
        items = self._memory_verifications
        if brand_id:
            items = [v for v in items if v.get("brand_id") == brand_id]
        return sorted(items, key=lambda x: x.get("timestamp", 0), reverse=True)[:limit]

    async def save_release(self, release_doc: Dict[str, Any]):
        if self.is_connected and self.db is not None:
            await self.db.release_ledger.insert_one(dict(release_doc))
        self._memory_releases.append(release_doc)

    async def list_releases(self, brand_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            query = {"brand_id": brand_id} if brand_id else {}
            cursor = self.db.release_ledger.find(query, {"_id": 0}).sort("timestamp", -1)
            return await cursor.to_list(length=100)
        items = self._memory_releases
        if brand_id:
            items = [v for v in items if v.get("brand_id") == brand_id]
        return sorted(items, key=lambda x: x.get("timestamp", 0), reverse=True)

    async def save_task(self, task_doc: Dict[str, Any]):
        task_id = task_doc["task_id"]
        if self.is_connected and self.db is not None:
            update_data = {k: v for k, v in task_doc.items() if k != "_id"}
            set_on_insert = {"_id": task_doc["_id"]} if "_id" in task_doc else {"_id": str(ObjectId())}
            await self.db.revision_tasks.update_one(
                {"task_id": task_id},
                {"$set": update_data, "$setOnInsert": set_on_insert},
                upsert=True
            )
        self._memory_tasks[task_id] = task_doc

    async def list_tasks(self, brand_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            query = {"brand_id": brand_id} if brand_id else {}
            cursor = self.db.revision_tasks.find(query, {"_id": 0}).sort("created_at", -1)
            return await cursor.to_list(length=100)
        items = list(self._memory_tasks.values())
        if brand_id:
            items = [t for t in items if t.get("brand_id") == brand_id]
        return sorted(items, key=lambda x: x.get("created_at", 0), reverse=True)

    async def save_version(self, asset_id: str, version_doc: Dict[str, Any]):
        if self.is_connected and self.db is not None:
            await self.db.asset_versions.insert_one(dict(version_doc))
        if asset_id not in self._memory_versions:
            self._memory_versions[asset_id] = []
        self._memory_versions[asset_id].append(version_doc)

    async def get_version_history(self, asset_id: str) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            cursor = self.db.asset_versions.find({"asset_id": asset_id}, {"_id": 0}).sort("timestamp", 1)
            return await cursor.to_list(length=50)
        return self._memory_versions.get(asset_id, [])

mongo_manager = MongoManager()
