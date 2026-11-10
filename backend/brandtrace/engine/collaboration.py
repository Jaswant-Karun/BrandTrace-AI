import time
import uuid
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from pydantic import BaseModel, Field

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    BRAND_MANAGER = "BRAND_MANAGER"
    CREATOR = "CREATOR"
    REVIEWER = "REVIEWER"
    COMPLIANCE_REVIEWER = "COMPLIANCE_REVIEWER"

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    role: UserRole
    department: str
    brand_workspace: str

class ContentComment(BaseModel):
    comment_id: str
    asset_id: str
    author_id: str
    author_name: str
    author_role: UserRole
    message: str
    highlighted_text: Optional[str] = None
    created_at: int
    created_at_iso: str

class GovernanceEvent(BaseModel):
    event_id: str
    event_type: str # "CONTENT_SUBMISSION", "REVISION_REQUESTED", "COMMENT_ADDED", "CONTENT_SEALED", "POLICY_AMENDMENT"
    actor_name: str
    actor_role: UserRole
    resource_id: str
    summary: str
    timestamp: int
    timestamp_iso: str

class CollaborationEngine:
    """
    Role-Based Access Control & Human Collaboration Engine
    Enforces that high-risk content cannot be approved by AI or non-compliance roles.
    """
    def __init__(self):
        self.users: Dict[str, UserProfile] = {
            "USR-ADM-01": UserProfile(
                user_id="USR-ADM-01",
                name="Elena Vance",
                email="elena.vance@apex.auto",
                role=UserRole.ADMIN,
                department="Executive Governance",
                brand_workspace="apex-dynamics"
            ),
            "USR-BM-01": UserProfile(
                user_id="USR-BM-01",
                name="Marcus Thorne",
                email="marcus.thorne@apex.auto",
                role=UserRole.BRAND_MANAGER,
                department="Global Brand Strategy",
                brand_workspace="apex-dynamics"
            ),
            "USR-REV-01": UserProfile(
                user_id="USR-REV-01",
                name="Siddharth Rao",
                email="siddharth.rao@apex.auto",
                role=UserRole.REVIEWER,
                department="Performance Marketing",
                brand_workspace="apex-dynamics"
            ),
            "USR-CMP-01": UserProfile(
                user_id="USR-CMP-01",
                name="Dr. Julian Foster",
                email="julian.foster@apex.auto",
                role=UserRole.COMPLIANCE_REVIEWER,
                department="Legal & Statutory Affairs",
                brand_workspace="apex-dynamics"
            ),
            "USR-CRT-01": UserProfile(
                user_id="USR-CRT-01",
                name="Anya Petrov",
                email="anya.petrov@apex.auto",
                role=UserRole.CREATOR,
                department="Creative Production Agency",
                brand_workspace="apex-dynamics"
            )
        }
        self.comments: Dict[str, List[ContentComment]] = {}
        self.events: List[GovernanceEvent] = [
            GovernanceEvent(
                event_id="EVT-001",
                event_type="POLICY_AMENDMENT",
                actor_name="Elena Vance",
                actor_role=UserRole.ADMIN,
                resource_id="REG-01",
                summary="Updated FTC Green Guides §260 rule weighting to Critical.",
                timestamp=int(time.time()) - 7200,
                timestamp_iso=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 7200))
            ),
            GovernanceEvent(
                event_id="EVT-002",
                event_type="REVISION_REQUESTED",
                actor_name="Dr. Julian Foster",
                actor_role=UserRole.COMPLIANCE_REVIEWER,
                resource_id="AST-04",
                summary="Blocked unverified '100% Eco-Friendly' draft; requested LCA citation.",
                timestamp=int(time.time()) - 3600,
                timestamp_iso=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 3600))
            )
        ]

    def check_permission(self, role: UserRole, action: str, is_high_risk: bool = False) -> Tuple[bool, str]:
        """
        Enforces strict RBAC:
        No AI or unauthorized creator can approve high-risk content.
        Only COMPLIANCE_REVIEWER or ADMIN can approve high-risk claims.
        """
        if action == "APPROVE_RELEASE":
            if is_high_risk and role not in [UserRole.COMPLIANCE_REVIEWER, UserRole.ADMIN]:
                return False, f"Role {role.value} is not authorized to approve High-Risk content. Compliance Reviewer required."
            if role == UserRole.CREATOR:
                return False, "Creators cannot self-approve marketing releases."
            return True, "Authorized"

        if action == "MUTATE_POLICY":
            if role not in [UserRole.ADMIN, UserRole.BRAND_MANAGER]:
                return False, f"Only Admins and Brand Managers can modify policy truth nodes."
            return True, "Authorized"

        return True, "Authorized"

    def add_comment(
        self,
        asset_id: str,
        author_id: str,
        message: str,
        highlighted_text: Optional[str] = None
    ) -> ContentComment:
        user = self.users.get(author_id, self.users["USR-REV-01"])
        t_now = int(time.time())
        c = ContentComment(
            comment_id=f"CMT-{uuid.uuid4().hex[:6].upper()}",
            asset_id=asset_id,
            author_id=author_id,
            author_name=user.name,
            author_role=user.role,
            message=message,
            highlighted_text=highlighted_text,
            created_at=t_now,
            created_at_iso=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t_now))
        )
        if asset_id not in self.comments:
            self.comments[asset_id] = []
        self.comments[asset_id].append(c)

        # Log governance event
        self.events.append(
            GovernanceEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:6].upper()}",
                event_type="COMMENT_ADDED",
                actor_name=user.name,
                actor_role=user.role,
                resource_id=asset_id,
                summary=f"Comment added: '{message[:50]}...'",
                timestamp=t_now,
                timestamp_iso=c.created_at_iso
            )
        )
        return c

    def get_comments(self, asset_id: str) -> List[ContentComment]:
        return self.comments.get(asset_id, [])

    def get_recent_events(self, limit: int = 15) -> List[GovernanceEvent]:
        return sorted(self.events, key=lambda e: e.timestamp, reverse=True)[:limit]

collaboration_engine = CollaborationEngine()
