from typing import Optional, Dict, Any
from brandtrace.core.security import create_access_token, decode_access_token, hash_password, verify_password
from brandtrace.modules.auth.models import UserProfile, UserRole, RegisterRequest

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
    # Phase 7 & 8 Dedicated Demo User for AURELLE Hackathon Evaluation
    "demo@brandtrace.ai": {
        "user_id": "USR-DEMO-AURELLE",
        "email": "demo@brandtrace.ai",
        "name": "Alex Mercer, VP Global Brand Governance",
        "role": UserRole.BRAND_MANAGER,
        "org_id": "ORG-AURELLE",
        "workspace_id": "aurelle-tech",
        "password_hash": hash_password("DemoAurelle2026!")
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
            from brandtrace.database.mongo import mongo_manager
            if mongo_manager.repo and "users" in mongo_manager.repo._memory_collections:
                found_user = next((u for u in mongo_manager.repo._memory_collections["users"] if u.get("email") == clean_email), None)
                if found_user and found_user.get("password_hash"):
                    user_record = found_user

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

    async def register_user(self, req: RegisterRequest) -> UserProfile:
        import uuid
        clean_email = req.email.lower().strip()
        if not clean_email or "@" not in clean_email:
            raise ValueError("A valid email address is required.")
        if not req.name or len(req.name.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        if not req.password or len(req.password) < 6:
            raise ValueError("Password must be at least 6 characters.")
            
        role = req.role if req.role else UserRole.BRAND_MANAGER
        workspace_id = req.workspace_id or "aurelle-tech"
        if "novus" in workspace_id:
            org_id = "ORG-NOVUS"
        elif "aurelle" in workspace_id:
            org_id = "ORG-AURELLE"
        else:
            org_id = "ORG-APEX"
            
        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        pwd_hash = hash_password(req.password)
        
        # Store in memory registry for immediate authentication
        user_dict = {
            "user_id": user_id,
            "email": clean_email,
            "name": req.name.strip(),
            "role": role,
            "org_id": org_id,
            "workspace_id": workspace_id,
            "password_hash": pwd_hash
        }
        PRESET_USERS[clean_email] = user_dict
        
        # Persist to MongoDB if connected
        try:
            from brandtrace.database.mongo import mongo_manager
            from brandtrace.database.schemas import UserDoc, WorkspaceMembershipDoc
            if mongo_manager.repo and mongo_manager.repo.mm.is_connected:
                u_doc = UserDoc(
                    user_id=user_id,
                    organisation_id=org_id,
                    workspace_id=workspace_id,
                    email=clean_email,
                    name=req.name.strip(),
                    role=role.value,
                    password_hash=pwd_hash
                )
                await mongo_manager.repo.create_user(u_doc)
                m_doc = WorkspaceMembershipDoc(
                    organisation_id=org_id,
                    workspace_id=workspace_id,
                    user_id=user_id,
                    role_name=role.value
                )
                await mongo_manager.repo.add_workspace_membership(m_doc)
        except Exception as e:
            print(f"[Auth] MongoDB user persistence note: {e}")
            
        return UserProfile(
            user_id=user_id,
            email=clean_email,
            name=req.name.strip(),
            role=role,
            org_id=org_id,
            workspace_id=workspace_id
        )

auth_service = AuthService()
