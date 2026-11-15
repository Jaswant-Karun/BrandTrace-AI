from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(
    title="BRANDTRACE AI — Governance Engine API",
    description="The Autonomous Brand Intelligence & Governance Control Plane API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthStatus(BaseModel):
    status: str
    service: str
    version: str
    graph_engine: str
    active_agents: int

@app.get("/health", response_model=HealthStatus)
def health_check() -> Dict[str, Any]:
    return {
        "status": "operational",
        "service": "BRANDTRACE AI Governance Engine",
        "version": "1.0.0",
        "graph_engine": "NetworkX-BKG-Active",
        "active_agents": 4
    }

@app.get("/")
def root():
    return {
        "name": "BRANDTRACE AI",
        "tagline": "Every brand decision connected. Every risk traceable. Every release accountable.",
        "docs_url": "/docs"
    }

