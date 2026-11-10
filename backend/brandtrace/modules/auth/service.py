from typing import Optional, Dict
from brandtrace.core.security import create_access_token, decode_access_token, hash_password, verify_password
from brandtrace.modules.auth.models import UserProfile, UserRole

PRESET_USERS: Dict[str, Dict] = {
    "admin@apex.com": {
        "user_id": "USR-ADM-01",
        "email": "admin@apex.com",
        "name": "Sarah Chen, Chief Technology Officer",
        "role": UserRole.ADMIN,
        "org_id": "ORG-APEX",
        "workspace_id": "apex-dynamics",
        "password_hash": hash_password("brandtrace2026")
    },
    "governance@apex.com": {
        "user_id": "USR-CGO-01",
        "email": "governance@apex.com",
        "name": "David Sterling, Chief Governance Officer",
        "role": UserRole.COMPLIANCE_REVIEWER,
        "org_id": "ORG-APEX",
        "workspace_id": "apex-dynamics",
        "password_hash": hash_password("brandtrace2026")
    },
    "brandmanager@apex.com": {
        "user_id": "USR-BM-01",
        "email": "brandmanager@apex.com",
        "name": "Elena Rostova, VP Brand Governance",
        "role": UserRole.BRAND_MANAGER,
        "org_id": "ORG-APEX",
        "workspace_id": "apex-dynamics",
        "password_hash": hash_password("brandtrace2026")
    },
    "creator@apex.com": {
        "user_id": "USR-CRT-01",
        "email": "creator@apex.com",
        "name": "Marcus Vance, Lead Creative Producer",
        "role": UserRole.CREATOR,
        "org_id": "ORG-APEX",
        "workspace_id": "apex-dynamics",
        "password_hash": hash_password("brandtrace2026")
    },
    "compliance@novus.com": {
        "user_id": "USR-NOV-01",
        "email": "compliance@novus.com",
        "name": "Dr. Aris Thorne, Regulatory Affairs VP",
        "role": UserRole.COMPLIANCE_REVIEWER,
        "org_id": "ORG-NOVUS",
        "workspace_id": "novus-health",
        "password_hash": hash_password("brandtrace2026")
    },
    "camille@aurelle.com": {
        "user_id": "USR-AUR-01",
        "email": "camille@aurelle.com",
        "name": "Camille Laurent, Sustainability & Brand Integrity VP",
        "role": UserRole.ADMIN,
        "org_id": "ORG-AURELLE",
        "workspace_id": "aurelle-maison",
        "password_hash": hash_password("brandtrace2026")
    },
    # Phase 6 AURELLE Consumer Technology Enterprise Demo Users
    "admin@aurelle.com": {
        "user_id": "USR-AUR-ADM",
        "email": "admin@aurelle.com",
        "name": "Sarah Chen, Chief Technology Officer & System Administrator",
        "role": UserRole.ADMIN,
        "org_id": "ORG-AURELLE",
        "workspace_id": "aurelle-tech",
        "password_hash": hash_password("brandtrace2026")
    },
    "brandmanager@aurelle.com": {
        "user_id": "USR-AUR-BM",
        "email": "brandmanager@aurelle.com",
        "name": "Julian Vance, VP Global Brand Governance & Commercial Operations",
        "role": UserRole.BRAND_MANAGER,
        "org_id": "ORG-AURELLE",
        "workspace_id": "aurelle-tech",
        "password_hash": hash_password("brandtrace2026")
    },
    "creator@aurelle.com": {
        "user_id": "USR-AUR-CRT",
        "email": "creator@aurelle.com",
        "name": "Maya Lin, Senior Creative Director & Content Producer",
        "role": UserRole.CREATOR,
        "org_id": "ORG-AURELLE",
        "workspace_id": "aurelle-tech",
        "password_hash": hash_password("brandtrace2026")
    },
    "reviewer@aurelle.com": {
        "user_id": "USR-AUR-REV",
        "email": "reviewer@aurelle.com",
        "name": "Marcus Aurelius, Content Review Lead & Editorial Editor",
        "role": UserRole.REVIEWER,
        "org_id": "ORG-AURELLE",
        "workspace_id": "aurelle-tech",
        "password_hash": hash_password("brandtrace2026")
    },
    "compliance@aurelle.com": {
        "user_id": "USR-AUR-CMP",
        "email": "compliance@aurelle.com",
        "name": "David Sterling, Regulatory & Statutory Compliance Officer",
        "role": UserRole.COMPLIANCE_REVIEWER,
        "org_id": "ORG-AURELLE",
        "workspace_id": "aurelle-tech",
        "password_hash": hash_password("brandtrace2026")
    }
}

class AuthService:
    def authenticate_user(
        self,
        email: str,
        password: str,
        allow_mock_fallback: bool = False
    ) -> Optional[UserProfile]:
        from brandtrace.core.config import settings
        if not email or not password or not isinstance(email, str) or not isinstance(password, str):
            return None

        clean_email = email.lower().strip()
        user_record = PRESET_USERS.get(clean_email)
        if not user_record:
            # Mock persona strictly forbidden in production mode; only allowed if explicitly opted in during development/testing
            if allow_mock_fallback and settings.environment != "production":
                return UserProfile(
                    user_id="USR-DEMO-01",
                    email=clean_email,
                    name="Authorized Governance Officer",
                    role=UserRole.COMPLIANCE_REVIEWER,
                    org_id="ORG-APEX",
                    workspace_id="apex-dynamics"
                )
            return None
        
        # Verify stored password hash safely
        stored_hash = user_record.get("password_hash")
        if not stored_hash or not isinstance(stored_hash, str):
            return None

        if not verify_password(password, stored_hash):
            return None
        
        # Valid user found with verified credentials
        return UserProfile(
            user_id=user_record["user_id"],
            email=user_record["email"],
            name=user_record["name"],
            role=user_record["role"],
            org_id=user_record["org_id"],
            workspace_id=user_record["workspace_id"]
        )

    def create_user_token(self, user: UserProfile) -> str:
        token_data = {
            "sub": user.user_id,
            "email": user.email,
            "role": user.role.value,
            "org_id": user.org_id,
            "workspace_id": user.workspace_id,
            "name": user.name
        }
        return create_access_token(token_data)

    def get_user_from_token(self, token: str) -> Optional[UserProfile]:
        payload = decode_access_token(token)
        if not payload:
            return None
        return UserProfile(
            user_id=payload.get("sub", "USR-GUEST"),
            email=payload.get("email", "guest@brandtrace.ai"),
            name=payload.get("name", "Enterprise User"),
            role=UserRole(payload.get("role", "REVIEWER")),
            org_id=payload.get("org_id", "ORG-APEX"),
            workspace_id=payload.get("workspace_id", "apex-dynamics")
        )

auth_service = AuthService()
