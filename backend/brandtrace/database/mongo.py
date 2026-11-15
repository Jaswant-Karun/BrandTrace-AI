import logging
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from brandtrace.core.config import settings

logger = logging.getLogger("brandtrace.database")

class MongoManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_connected: bool = False
    
    # In-memory fallback stores if MongoDB is unreachable
    _memory_brands: Dict[str, Dict[str, Any]] = {}
    _memory_nodes: Dict[str, List[Dict[str, Any]]] = {}
    _memory_edges: Dict[str, List[Dict[str, Any]]] = {}
    _memory_verifications: List[Dict[str, Any]] = []
    _memory_releases: List[Dict[str, Any]] = []

    async def connect(self):
        """Attempts connection to MongoDB. Falls back gracefully to memory store if unavailable."""
        try:
            logger.info(f"Connecting to MongoDB at {settings.mongodb_uri} (db: {settings.mongodb_db_name})...")
            self.client = AsyncIOMotorClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000
            )
            # Test ping
            await self.client.admin.command('ping')
            self.db = self.client[settings.mongodb_db_name]
            self.is_connected = True
            logger.info("Successfully connected to MongoDB.")
        except Exception as e:
            self.is_connected = False
            self.client = None
            self.db = None
            logger.warning(f"MongoDB not reachable ({e}). Operating in memory-fallback mode.")

    async def close(self):
        """Closes MongoDB connection."""
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("MongoDB connection closed.")

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
                    "engine": "MongoDB (Motor Async)",
                    "database": settings.mongodb_db_name,
                    "uri": settings.mongodb_uri.split("@")[-1], # Mask credentials if present
                    "collections": counts
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
                "release_ledger": len(self._memory_releases)
            }
        }

    # Data Access Methods (Mongo with memory fallback)
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
            await self.db.brands.update_one(
                {"brand_id": brand_id},
                {"$set": brand_data},
                upsert=True
            )
        self._memory_brands[brand_id] = brand_data

    async def save_graph(self, brand_id: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]):
        if self.is_connected and self.db is not None:
            # Upsert nodes
            for node in nodes:
                node_copy = dict(node)
                node_copy["brand_id"] = brand_id
                await self.db.nodes.update_one(
                    {"brand_id": brand_id, "id": node["id"]},
                    {"$set": node_copy},
                    upsert=True
                )
            # Upsert edges
            for edge in edges:
                edge_copy = dict(edge)
                edge_copy["brand_id"] = brand_id
                edge_key = f"{edge['source']}->{edge['target']}:{edge['type']}"
                edge_copy["edge_key"] = edge_key
                await self.db.edges.update_one(
                    {"brand_id": brand_id, "edge_key": edge_key},
                    {"$set": edge_copy},
                    upsert=True
                )
        self._memory_nodes[brand_id] = nodes
        self._memory_edges[brand_id] = edges

    async def get_graph(self, brand_id: str) -> Dict[str, Any]:
        if self.is_connected and self.db is not None:
            nodes_cursor = self.db.nodes.find({"brand_id": brand_id}, {"_id": 0})
            edges_cursor = self.db.edges.find({"brand_id": brand_id}, {"_id": 0})
            nodes = await nodes_cursor.to_list(length=500)
            edges = await edges_cursor.to_list(length=1000)
            return {"nodes": nodes, "edges": edges}
        return {
            "nodes": self._memory_nodes.get(brand_id, []),
            "edges": self._memory_edges.get(brand_id, [])
        }

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

mongo_manager = MongoManager()

