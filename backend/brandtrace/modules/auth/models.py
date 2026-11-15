from typing import Optional
from enum import Enum
from pydantic import BaseModel, EmailStr

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    BRAND_MANAGER = "BRAND_MANAGER"
    CREATOR = "CREATOR"
    REVIEWER = "REVIEWER"
    COMPLIANCE_REVIEWER = "COMPLIANCE_REVIEWER"

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    organisation_name: Optional[str] = "Aurelle Technologies Inc."
    role: Optional[UserRole] = UserRole.BRAND_MANAGER
    workspace_id: Optional[str] = "aurelle-tech"

class UserProfile(BaseModel):
    user_id: str
    email: str
    name: str
    role: UserRole
    org_id: str
    workspace_id: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in_hours: int = 24
    user: UserProfile
