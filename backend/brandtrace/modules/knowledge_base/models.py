from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class VectorSearchQuery(BaseModel):
    query_text: str
    org_id: str = "ORG-APEX"
    workspace_id: str = "apex-dynamics"
    limit: int = 5
    min_score: float = 0.10
    category_filter: Optional[str] = None

class VectorSearchResult(BaseModel):
    node_id: str
    label: str
    node_type: str
    description: str
    score: float
    org_id: str
    workspace_id: str

class AtlasIndexConfigResponse(BaseModel):
    index_name: str
    collection_name: str
    dimensions: int
    similarity_metric: str
    atlas_json_definition: Dict[str, Any]
    status: str
    is_live_atlas_connected: bool
