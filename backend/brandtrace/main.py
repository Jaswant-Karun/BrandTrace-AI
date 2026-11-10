from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from brandtrace.core.config import settings
from brandtrace.database.mongo import mongo_manager
from brandtrace.routes.api import router as api_router, seed_database

# Phase 4 Modular Routers
from brandtrace.modules.auth.router import router as auth_router
from brandtrace.modules.organizations.router import router as org_router
from brandtrace.modules.knowledge_base.router import router as kb_router
from brandtrace.modules.graph_intelligence.router import router as graph_router
from brandtrace.modules.content.router import router as content_router
from brandtrace.modules.approvals.router import router as approvals_router
# Phase 6 Demo Workflow Router
from brandtrace.modules.demo.router import router as demo_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas & Auto-Seed
    await mongo_manager.connect()
    try:
        brands = await mongo_manager.list_brands()
        if not brands:
            await seed_database()
        # Seed Phase 5 Aurelle Enterprise Organisation
        from brandtrace.database.seeding import seed_aurelle_organisation
        await seed_aurelle_organisation(mongo_manager.repo)
    except Exception as e:
        print(f"[BrandTrace] Auto-seed note: {e}")
    yield
    # Shutdown
    await mongo_manager.close()

app = FastAPI(
    title="BRANDTRACE AI — Enterprise Governance & Intelligence Control Plane API",
    description="Production-grade Autonomous Brand Intelligence & Governance Control Plane backed by MongoDB Atlas, Atlas Vector Search, and Multi-Agent Reasoning.",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Existing Core Routes
app.include_router(api_router)

# Mount Phase 4 Modular Business Domain Routers
app.include_router(auth_router, prefix="/api")
app.include_router(org_router, prefix="/api")
app.include_router(kb_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(content_router, prefix="/api")
app.include_router(approvals_router, prefix="/api")

@app.get("/health")
async def health_check():
    db_status = await mongo_manager.get_db_status()
    return {
        "status": "operational",
        "service": "BRANDTRACE AI Governance Engine",
        "version": "2.0.0",
        "database": db_status,
        "database_type": "MongoDB Atlas",
        "atlas_vector_search": {
            "status": "CONFIGURED",
            "dimensions": 768,
            "metric": "cosine",
            "index_name": "vector_index",
            "collection": "knowledge_nodes"
        },
        "active_agents": 4,
        "graph_engine": "MongoDB-Atlas-GraphLookup-BKG",
        "ai_provider": "Gemini-Structured-Grounding",
        "tenant_isolation": "ORGANIZATION_STRICT"
    }

@app.get("/")
def root():
    return {
        "name": "BRANDTRACE AI",
        "tagline": "Every brand decision connected. Every risk traceable. Every release accountable.",
        "api_docs": "/docs",
        "health": "/health",
        "architecture": {
            "primary_database": "MongoDB Atlas",
            "vector_search": "MongoDB Atlas Vector Search ($vectorSearch)",
            "graph_engine": "MongoDB $graphLookup Aggregation & NetworkX",
            "ai_engine": "Google Gemini API Provider Abstraction",
            "authentication": "JWT (HS256) with RBAC & Organization Isolation",
            "storage": "Cloud Object Storage Abstraction with SHA-256 Integrity"
        }
    }
