import os
from pydantic import BaseModel
from typing import Optional

def _detect_environment() -> str:
    env = os.getenv("ENVIRONMENT", "").strip().lower()
    if env:
        return env
    if os.getenv("RENDER") or os.getenv("VERCEL") or os.getenv("NODE_ENV", "").lower() == "production":
        return "production"
    return "development"

class Settings(BaseModel):
    app_name: str = "BRANDTRACE AI"
    environment: str = _detect_environment()
    port: int = int(os.getenv("PORT", "8000"))
    host: str = os.getenv("HOST", "0.0.0.0")
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # MongoDB Configuration
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME", "brandtrace")
    
    # AI Provider Configuration (falls back to deterministic neural engine)
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock")
    gemini_api_key: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)

    # Graph & Ledger
    graph_storage_path: str = os.getenv("GRAPH_STORAGE_PATH", "./data/brand_knowledge_graph.json")
    audit_ledger_path: str = os.getenv("AUDIT_LEDGER_PATH", "./data/release_ledger.json")
    enable_cascading_blast_radius: bool = True

settings = Settings()
