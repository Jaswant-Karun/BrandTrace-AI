from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from brandtrace.core.config import settings
from brandtrace.database.mongo import mongo_manager
from brandtrace.routes.api import router as api_router, seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB & Auto-Seed
    await mongo_manager.connect()
    # Check if we should seed default data
    try:
        brands = await mongo_manager.list_brands()
        if not brands:
            await seed_database()
    except Exception as e:
        print(f"[BrandTrace] Auto-seed note: {e}")
    yield
    # Shutdown
    await mongo_manager.close()

app = FastAPI(
    title="BRANDTRACE AI — Governance Engine API",
    description="The Autonomous Brand Intelligence & Governance Control Plane API (with MongoDB Persistence & Graph Intelligence)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/health")
async def health_check():
    db_status = await mongo_manager.get_db_status()
    return {
        "status": "operational",
        "service": "BRANDTRACE AI Governance Engine",
        "version": "1.0.0",
        "database": db_status,
        "active_agents": 4,
        "graph_engine": "NetworkX-BKG-Active"
    }

@app.get("/")
def root():
    return {
        "name": "BRANDTRACE AI",
        "tagline": "Every brand decision connected. Every risk traceable. Every release accountable.",
        "api_docs": "/docs",
        "health": "/health",
        "endpoints": {
            "brands": "/api/brands",
            "graph": "/api/brands/{brand_id}/graph",
            "verify": "/api/verify",
            "blast_radius": "/api/blast-radius",
            "releases": "/api/releases",
            "db_status": "/api/db/status"
        }
    }
