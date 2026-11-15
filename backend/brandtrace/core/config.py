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

    # CORS Configuration
    allowed_origins_raw: str = os.getenv(
        "ALLOWED_ORIGINS",
        "https://brand-trace-ai-dun.vercel.app,https://brandtrace-ai.vercel.app,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:8000"
    )

    def get_allowed_origins(self) -> list[str]:
        raw = os.getenv("ALLOWED_ORIGINS", self.allowed_origins_raw)
        origins = [o.strip() for o in raw.split(",") if o.strip()]
        if self.environment == "production":
            # Disallow wildcard in production when credentials are enabled
            filtered = [o for o in origins if o != "*"]
            if not filtered:
                raise RuntimeError(
                    "Production startup failure: ALLOWED_ORIGINS cannot be empty or solely wildcard ('*') when credentials are enabled. Please configure explicit domains."
                )
            return filtered
        
        # Development defaults include standard local development addresses
        dev_defaults = [
            "http://localhost:5173", "http://localhost:3000",
            "http://127.0.0.1:5173", "http://127.0.0.1:8000"
        ]
        for dev_origin in dev_defaults:
            if dev_origin not in origins:
                origins.append(dev_origin)
        return origins

settings = Settings()
