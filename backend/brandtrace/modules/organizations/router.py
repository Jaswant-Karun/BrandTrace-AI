from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from brandtrace.database.mongo import mongo_manager

router = APIRouter(prefix="/organizations", tags=["Organizations & Multi-Tenancy"])

class OrganizationProfile(BaseModel):
    org_id: str
    name: str
    tier: str = "ENTERPRISE"
    active_workspaces_count: int
    data_isolation_level: str = "TENANT_STRICT"

PRESET_ORGANIZATIONS = [
    {
        "org_id": "ORG-APEX",
        "name": "Apex Mobility Group Global",
        "tier": "ENTERPRISE_GOVERNANCE",
        "active_workspaces_count": 2,
        "data_isolation_level": "TENANT_STRICT"
    },
    {
        "org_id": "ORG-NOVUS",
        "name": "Novus Life Sciences International",
        "tier": "HEALTHCARE_REGULATED",
        "active_workspaces_count": 1,
        "data_isolation_level": "TENANT_STRICT"
    }
]

@router.get("", response_model=List[OrganizationProfile])
async def list_organizations():
    """Lists enterprise organizations with tenant isolation."""
    return PRESET_ORGANIZATIONS

@router.get("/{org_id}")
async def get_organization(org_id: str):
    org = await mongo_manager.get_organization(org_id)
    if not org:
        match = next((o for o in PRESET_ORGANIZATIONS if o["org_id"] == org_id), None)
        if match:
            return match
        raise HTTPException(status_code=404, detail="Organization not found")
    return org
