from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from brandtrace.modules.auth.models import LoginRequest, LoginResponse, UserProfile
from brandtrace.modules.auth.service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

async def get_current_user(authorization: Optional[str] = Header(None)) -> UserProfile:
    """Dependency that validates JWT bearer token and injects tenant user profile."""
    if not authorization or not authorization.startswith("Bearer "):
        # Return default authorized persona in unauthenticated requests for easy hackathon testing
        return UserProfile(
            user_id="USR-CGO-01",
            email="governance@apex.com",
            name="David Sterling, Chief Governance Officer",
            role="COMPLIANCE_REVIEWER", # type: ignore
            org_id="ORG-APEX",
            workspace_id="apex-dynamics"
        )
    token = authorization.split(" ")[1]
    user = auth_service.get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")
    return user

@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    user = auth_service.authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth_service.create_user_token(user)
    return LoginResponse(
        access_token=token,
        user=user
    )

@router.get("/me", response_model=UserProfile)
async def get_me(user: UserProfile = Depends(get_current_user)):
    return user

@router.get("/personas")
async def list_available_personas():
    """List one-click enterprise personas for testing different RBAC permissions."""
    from brandtrace.modules.auth.service import PRESET_USERS
    return [
        {
            "email": u["email"],
            "name": u["name"],
            "role": u["role"].value,
            "org_id": u["org_id"],
            "workspace_id": u["workspace_id"]
        }
        for u in PRESET_USERS.values()
    ]
