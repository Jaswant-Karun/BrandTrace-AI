import os
from pydantic import BaseModel
from typing import Optional

class Settings(BaseModel):
    app_name: str = "BRANDTRACE AI"
    environment: str = os.getenv("ENVIRONMENT", "development")
    port: int = int(os.getenv("PORT", "8000"))
    host: str = os.getenv("HOST", "0.0.0.0")
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # LLM Settings
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock")
    gemini_api_key: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)

    # Graph & Ledger
    graph_storage_path: str = os.getenv("GRAPH_STORAGE_PATH", "./data/brand_knowledge_graph.json")
    audit_ledger_path: str = os.getenv("AUDIT_LEDGER_PATH", "./data/release_ledger.json")
    enable_cascading_blast_radius: bool = True

settings = Settings()
