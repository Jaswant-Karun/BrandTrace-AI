import time
import uuid
import hashlib
from typing import Dict, Any, List, Optional
from brandtrace.database.mongo import mongo_manager
from brandtrace.graph.dependency_engine import dependency_engine
from brandtrace.graph.schema import SeverityLevel, RevisionTask
from brandtrace.core.security import generate_release_proof
from brandtrace.engine.audit_ledger import audit_ledger_engine
from brandtrace.modules.submissions.models import (
    DraftCreateRequest, DraftUpdateRequest, DraftResponse,
    DraftVersionResponse, SubmissionCreateRequest, SubmissionResponse,
    FindingModel, ApprovalStepModel, AuditEventResponse
)

# ------------------------------------------------------------------------------
# In-memory storage for resilient fallback (synchronized with MongoDB Atlas)
# ------------------------------------------------------------------------------
_DRAFTS_STORE: Dict[str, Dict[str, Any]] = {}
_DRAFT_VERSIONS_STORE: Dict[str, List[Dict[str, Any]]] = {}
_SUBMISSIONS_STORE: Dict[str, Dict[str, Any]] = {}
_AUDIT_EVENTS_STORE: List[Dict[str, Any]] = []
_NOTIFICATIONS_STORE: List[Dict[str, Any]] = []

def _now_str() -> str:
    return time.strftime("%d %b %Y, %I:%M %p", time.localtime())

def _hash_str(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

_RELEASE_COUNTER = 1

def _generate_release_id() -> str:
    global _RELEASE_COUNTER
    rel_id = f"BT-REL-2026-{_RELEASE_COUNTER:06d}"
    _RELEASE_COUNTER += 1
    return rel_id

# Seed default audit events matching reference screenshots
_AUDIT_EVENTS_STORE.extend([
    {
        "id": "evt-seed-1",
        "when": "8 Nov 2026, 4:51 pm",
        "who": "Agency Sana",
        "what": "saved version 3 (private)",
        "reason": "",
        "hash": "9d16a7e41b0d87a2b9f3e4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    },
    {
        "id": "evt-seed-2",
        "when": "8 Nov 2026, 4:51 pm",
        "who": "Agency Sana",
        "what": "accepted the fix for a finding",
        "reason": "",
        "hash": "db06d4a10f8b76c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1",
    },
    {
        "id": "evt-seed-3",
        "when": "8 Nov 2026, 4:51 pm",
        "who": "Agency Sana",
        "what": "saved version 2 (private)",
        "reason": "",
        "hash": "c8cf380d795d1234567890abcdef1234567890abcdef1234567890abcdef1234",
    },
    {
        "id": "evt-seed-4",
        "when": "8 Nov 2026, 4:51 pm",
        "who": "Agency Sana",
        "what": "edited a finding",
        "reason": "",
        "hash": "6f93ce6d4f87543210fedcba9876543210fedcba9876543210fedcba98765432",
    },
    {
        "id": "evt-seed-5",
        "when": "8 Nov 2026, 4:50 pm",
        "who": "Agency Sana",
        "what": "saved version 1 (private)",
        "reason": "",
        "hash": "e88c27a88418abcdef1234567890abcdef1234567890abcdef1234567890abcd",
    },
])

# Seed realistic pending submissions matching reference screenshots
_SEED_SUBMISSION_1 = {
    "submission_id": "SUB-SEED-001",
    "task_id": "REV-SEED-01",
    "brand_id": "aurelle-tech",
    "brand_name": "Aurelle Skin",
    "title": "Meet the NEW Aurelle Vitamin-C serum! 100% natural, eco-friendly and clinically proven to fade dark spot...",
    "channel": "instagram",
    "creator_id": "asha@aurelle.com",
    "creator_name": "Creator Asha",
    "creator_type": "creator",
    "org_id": "ORG-AURELLE",
    "analysis_id": "VRF-F10B6DE0FB",
    "version": 2,
    "original_content": "Meet the NEW Aurelle Vitamin-C serum! 100% natural, completely eco-friendly and clinically proven to fade dark spots by 60% in just 2 weeks. Doctor approved with zero side effects. Shop today!",
    "current_content": "Meet the NEW Aurelle Vitamin-C serum! Formulated with 94% naturally derived ingredients and clinically shown to fade dark spots by 32% in 8 weeks (FACT-014). Dermatologist tested with clean ingredients. Shop now!",
    "status": "APPROVED",
    "submitted_at": "12 Nov 2026, 9:01 am",
    "updated_at": "12 Nov 2026, 11:30 am",
    "findings": [
        {
            "id": "f-1",
            "number": 1,
            "sentence_text": "100% natural, completely eco-friendly and clinically proven to fade dark spots by 60% in just 2 weeks.",
            "flagged_text": "by 60% in just 2 weeks",
            "category": "Approved Brand Claims",
            "severity": "BLOCKING",
            "rule_id": "FACT-014",
            "rule_title": "Approved Clinical Trial Benchmark",
            "explanation": "Clinical evidence confirms 32% reduction in 8 weeks under protocol AUR-LAB-014, not 60% in 2 weeks.",
            "suggested_fix": "by 32% in 8 weeks (FACT-014)",
            "suggested_sentence": "Formulated with 94% naturally derived ingredients and clinically shown to fade dark spots by 32% in 8 weeks (FACT-014).",
            "evidence_ref": "FACT-014 (Clinical Hydration & Barrier Benchmark)",
            "needs_human_review": False,
            "decision": "UPHELD",
            "resolved": True,
        },
        {
            "id": "f-2",
            "number": 2,
            "sentence_text": "100% natural, completely eco-friendly and clinically proven to fade dark spots by 60% in just 2 weeks.",
            "flagged_text": "100% natural, completely eco-friendly",
            "category": "Regulatory Greenwashing",
            "severity": "BLOCKING",
            "rule_id": "REG-01",
            "rule_title": "FTC Green Guides §260.4 & ASCI Guidelines",
            "explanation": "Absolute unquantified '100% natural' and 'eco-friendly' claims are prohibited without lifecycle analysis documentation.",
            "suggested_fix": "Formulated with 94% naturally derived ingredients",
            "suggested_sentence": "Formulated with 94% naturally derived ingredients and clinically shown to fade dark spots by 32% in 8 weeks (FACT-014).",
            "evidence_ref": "REG-01 / FTC Green Guides 16 CFR §260.4",
            "needs_human_review": False,
            "decision": "UPHELD",
            "resolved": True,
        }
    ],
    "approval_history": [
        {
            "stage": "CREATOR_SUBMISSION",
            "label": "Creator Submission",
            "user": "Creator Asha",
            "role": "Creator",
            "status": "COMPLETED",
            "timestamp": "12 Nov 2026, 9:01 am",
            "comments": "Initial draft submitted with fixes applied."
        },
        {
            "stage": "REVIEWER_APPROVAL",
            "label": "Reviewer Approval",
            "user": "Reviewer Meera",
            "role": "Reviewer",
            "status": "COMPLETED",
            "timestamp": "12 Nov 2026, 10:15 am",
            "comments": "Verified clinical benchmark reference. Approved for compliance sign-off."
        },
        {
            "stage": "COMPLIANCE_APPROVAL",
            "label": "Compliance Approval",
            "user": "Compliance Arjun",
            "role": "Compliance Officer",
            "status": "COMPLETED",
            "timestamp": "12 Nov 2026, 11:30 am",
            "comments": "Statutory claims aligned with ASCI & FTC Green Guides."
        },
        {
            "stage": "FINAL_RELEASE",
            "label": "Final Release Seal",
            "user": "Brand Owner Kabir",
            "role": "Brand Owner",
            "status": "COMPLETED",
            "timestamp": "12 Nov 2026, 11:32 am",
            "comments": "Cryptographic release seal issued: BT-SEAL-78FA91"
        }
    ],
    "release_seal": "BT-SEAL-78FA91-9D16A7E4"
}

_SEED_SUBMISSION_2 = {
    "submission_id": "SUB-SEED-002",
    "task_id": "REV-SEED-02",
    "brand_id": "aurelle-tech",
    "brand_name": "Aurelle Skin",
    "title": "Ceramide Barrier Cream is the treatment for eczema and dry, itchy skin. Doctor approved and guaranteed r...",
    "channel": "web",
    "creator_id": "asha@aurelle.com",
    "creator_name": "Creator Asha",
    "creator_type": "creator",
    "org_id": "ORG-AURELLE",
    "analysis_id": "VRF-SEED-02",
    "version": 1,
    "original_content": "Ceramide Barrier Cream is the treatment for eczema and dry, itchy skin. Doctor approved and guaranteed results in 48 hours. Buy now at ₹499!",
    "current_content": "Ceramide Barrier Cream is the treatment for eczema and dry, itchy skin. Doctor approved and guaranteed results in 48 hours. Buy now at ₹499!",
    "status": "PENDING_REVIEW",
    "submitted_at": "Today, 10:14 am",
    "updated_at": "Today, 10:14 am",
    "findings": [
        {
            "id": "f-201",
            "number": 1,
            "sentence_text": "Ceramide Barrier Cream is the treatment for eczema and dry, itchy skin.",
            "flagged_text": "treatment for eczema",
            "category": "Medical / Disease Treatment",
            "severity": "BLOCKING",
            "rule_id": "FDA-21CFR-202",
            "rule_title": "Cosmetics vs Drug Classification",
            "explanation": "Claiming cosmetic product is a 'treatment for eczema' classifies the product as an unapproved new drug under CDSCO and FDA regulations.",
            "suggested_fix": "suitable for eczema-prone, dry skin",
            "suggested_sentence": "Ceramide Barrier Cream is suitable for eczema-prone, dry skin.",
            "evidence_ref": "Brand Guideline GL-AUR-03 / CDSCO Drugs & Cosmetics Act",
            "needs_human_review": True,
            "decision": "UNDECIDED",
            "resolved": False,
        },
        {
            "id": "f-202",
            "number": 2,
            "sentence_text": "Buy now at ₹499!",
            "flagged_text": "₹499",
            "category": "Approved Facts (Pricing)",
            "severity": "BLOCKING",
            "rule_id": "FACT-006",
            "rule_title": "Master Product Pricing",
            "explanation": "Ceramide Barrier Cream price is ₹899 for 50g, not ₹499.",
            "suggested_fix": "₹899",
            "suggested_sentence": "Buy now at ₹899!",
            "evidence_ref": "FACT-006 (Aurelle Skin Pricing Master Schedule)",
            "needs_human_review": False,
            "decision": "UNDECIDED",
            "resolved": False,
        }
    ],
    "approval_history": [
        {
            "stage": "CREATOR_SUBMISSION",
            "label": "Creator Submission",
            "user": "Creator Asha",
            "role": "Creator",
            "status": "COMPLETED",
            "timestamp": "Today, 10:14 am",
            "comments": "Draft submitted for copy review."
        },
        {
            "stage": "REVIEWER_APPROVAL",
            "label": "Reviewer Approval",
            "user": "Reviewer Meera",
            "role": "Reviewer",
            "status": "ACTIVE",
            "timestamp": None,
            "comments": None
        },
        {
            "stage": "COMPLIANCE_APPROVAL",
            "label": "Compliance Approval",
            "user": "Compliance Arjun",
            "role": "Compliance Officer",
            "status": "PENDING",
            "timestamp": None,
            "comments": None
        },
        {
            "stage": "FINAL_RELEASE",
            "label": "Final Release Seal",
            "user": "Brand Owner Kabir",
            "role": "Brand Owner",
            "status": "PENDING",
            "timestamp": None,
            "comments": None
        }
    ]
}

_SEED_SUBMISSION_AGENCY_1 = {
    "submission_id": "SUB-AGENCY-001",
    "task_id": "REV-AGENCY-01",
    "brand_id": "aurelle-tech",
    "brand_name": "Aurelle Skin",
    "title": "Agency Teaser: Aurelle Next-Gen Environmental Defense Formulation",
    "channel": "instagram",
    "creator_id": "USR-AGENCY-001",
    "creator_name": "Agency Sana",
    "creator_type": "agency",
    "org_id": "ORG-AGENCY-PULSE",
    "analysis_id": "VRF-AGY-9021",
    "version": 1,
    "original_content": "Something game-changing is dropping this Friday. Aurelle Skin is launching the ultimate defense against environmental pollution and premature aging. 100% natural, zero toxins, guaranteed glass skin in 7 days.",
    "current_content": "Something game-changing is dropping this Friday. Aurelle Skin is launching the ultimate defense against environmental pollution and premature aging. 100% natural, zero toxins, guaranteed glass skin in 7 days.",
    "status": "CHANGES_REQUESTED",
    "submitted_at": "Today, 11:20 am",
    "updated_at": "Today, 11:45 am",
    "reviewer_feedback": "Reviewer Meera: '100% natural, zero toxins' violates REG-01 (Greenwashing). Please replace with approved 94% naturally derived ingredients and remove 'guaranteed in 7 days'.",
    "findings": [
        {
            "id": "f-301",
            "number": 1,
            "sentence_text": "100% natural, zero toxins, guaranteed glass skin in 7 days.",
            "flagged_text": "100% natural, zero toxins",
            "category": "Regulatory Greenwashing",
            "severity": "BLOCKING",
            "rule_id": "REG-01",
            "rule_title": "ASCI Greenwashing Directive",
            "explanation": "Absolute unquantified '100% natural' and 'zero toxins' claims are prohibited without certified lifecycle analysis documentation.",
            "suggested_fix": "formulated with 94% naturally derived ingredients",
            "suggested_sentence": "Formulated with 94% naturally derived ingredients for clinical barrier protection.",
            "evidence_ref": "REG-01 / ASCI Guidelines 2024",
            "needs_human_review": True,
            "decision": "UPHELD",
            "resolved": False,
        },
        {
            "id": "f-302",
            "number": 2,
            "sentence_text": "guaranteed glass skin in 7 days.",
            "flagged_text": "guaranteed glass skin in 7 days",
            "category": "Approved Brand Claims",
            "severity": "BLOCKING",
            "rule_id": "GL-AUR-03",
            "rule_title": "Prohibited Absolute Guarantees",
            "explanation": "Time-bound cosmetic outcome guarantees ('guaranteed in 7 days') are prohibited by Aurelle Brand Book v1.3 §7.2.",
            "suggested_fix": "visibly brighter skin over time",
            "suggested_sentence": "visibly brighter skin with consistent daily use.",
            "evidence_ref": "Aurelle Brand Book §7.2 Disclaimers",
            "needs_human_review": False,
            "decision": "UPHELD",
            "resolved": False,
        }
    ],
    "approval_history": [
        {
            "stage": "CREATOR_SUBMISSION",
            "label": "Agency Submission",
            "user": "Agency Sana",
            "role": "Agency Partner",
            "status": "COMPLETED",
            "timestamp": "Today, 11:20 am",
            "comments": "Teaser post submitted on behalf of Aurelle Skin client account."
        },
        {
            "stage": "REVIEWER_APPROVAL",
            "label": "Reviewer Feedback",
            "user": "Reviewer Meera",
            "role": "Reviewer",
            "status": "REJECTED",
            "timestamp": "Today, 11:45 am",
            "comments": "Changes requested on environmental and 7-day guarantee claims. Please edit and resubmit."
        }
    ]
}

_SUBMISSIONS_STORE[_SEED_SUBMISSION_1["submission_id"]] = _SEED_SUBMISSION_1
_SUBMISSIONS_STORE[_SEED_SUBMISSION_2["submission_id"]] = _SEED_SUBMISSION_2
_SUBMISSIONS_STORE[_SEED_SUBMISSION_AGENCY_1["submission_id"]] = _SEED_SUBMISSION_AGENCY_1

class SubmissionsService:
    """Centralized service managing Creator drafts, content verification, submissions, and review lifecycle."""

    # ==========================================================================
    # 1. DRAFT MANAGEMENT
    # ==========================================================================
    async def create_or_save_draft(self, user_id: str, author_name: str, req: DraftCreateRequest) -> Dict[str, Any]:
        draft_id = f"draft-{uuid.uuid4().hex[:8]}"
        t = int(time.time() * 1000)
        draft = {
            "draft_id": draft_id,
            "user_id": user_id,
            "author_name": author_name,
            "brand_id": req.brand_id,
            "title": req.title or "Untitled Draft",
            "content": req.content,
            "channel": req.channel or "instagram",
            "key_phrases": req.key_phrases or "",
            "call_to_action": req.call_to_action or "",
            "version": 1,
            "created_at": t,
            "updated_at": t,
            "is_submitted": False
        }

        # Persist to MongoDB if connected
        if mongo_manager.is_connected and mongo_manager.db is not None:
            await mongo_manager.db.drafts.update_one(
                {"draft_id": draft_id},
                {"$set": draft},
                upsert=True
            )
        _DRAFTS_STORE[draft_id] = draft
        return draft

    async def update_draft(self, draft_id: str, req: DraftUpdateRequest) -> Optional[Dict[str, Any]]:
        draft = await self.get_draft(draft_id)
        if not draft:
            return None

        update_fields = req.model_dump(exclude_unset=True)
        update_fields["updated_at"] = int(time.time() * 1000)
        draft.update(update_fields)

        if mongo_manager.is_connected and mongo_manager.db is not None:
            await mongo_manager.db.drafts.update_one(
                {"draft_id": draft_id},
                {"$set": draft}
            )
        _DRAFTS_STORE[draft_id] = draft
        return draft

    async def get_draft(self, draft_id: str) -> Optional[Dict[str, Any]]:
        if mongo_manager.is_connected and mongo_manager.db is not None:
            doc = await mongo_manager.db.drafts.find_one({"draft_id": draft_id}, {"_id": 0})
            if doc:
                return doc
        return _DRAFTS_STORE.get(draft_id)

    async def list_drafts(self, user_id: Optional[str] = None, brand_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {}
        if user_id:
            query["user_id"] = user_id
        if brand_id:
            query["brand_id"] = brand_id

        if mongo_manager.is_connected and mongo_manager.db is not None:
            cursor = mongo_manager.db.drafts.find(query, {"_id": 0}).sort("updated_at", -1)
            docs = await cursor.to_list(length=100)
            if docs:
                return docs

        return [
            d for d in _DRAFTS_STORE.values()
            if (not user_id or d.get("user_id") == user_id) and (not brand_id or d.get("brand_id") == brand_id)
        ]

    async def save_draft_version(self, draft_id: str, content: str, reason: str, saved_by: str, custom_hash: Optional[str] = None) -> Dict[str, Any]:
        h = custom_hash or _hash_str(content + str(time.time()))
        v_id = f"ver-{uuid.uuid4().hex[:6]}"
        t = int(time.time() * 1000)
        
        # Count existing versions
        existing = await self.get_draft_versions(draft_id)
        ver_num = len(existing) + 1

        version_record = {
            "version_id": v_id,
            "draft_id": draft_id,
            "version_number": ver_num,
            "content": content,
            "saved_by": saved_by,
            "reason": reason or f"Saved version {ver_num} (private)",
            "content_hash": h,
            "created_at": t
        }

        if mongo_manager.is_connected and mongo_manager.db is not None:
            await mongo_manager.db.draft_versions.insert_one(version_record)

        if draft_id not in _DRAFT_VERSIONS_STORE:
            _DRAFT_VERSIONS_STORE[draft_id] = []
        _DRAFT_VERSIONS_STORE[draft_id].append(version_record)

        # Also append to audit events
        await self.record_audit_event(
            what=f"saved version {ver_num} (private)",
            reason=reason,
            actor_name=saved_by,
            event_hash=h
        )

        return version_record

    async def get_draft_versions(self, draft_id: str) -> List[Dict[str, Any]]:
        if mongo_manager.is_connected and mongo_manager.db is not None:
            cursor = mongo_manager.db.draft_versions.find({"draft_id": draft_id}, {"_id": 0}).sort("version_number", 1)
            docs = await cursor.to_list(length=50)
            if docs:
                return docs
        return _DRAFT_VERSIONS_STORE.get(draft_id, [])

    # ==========================================================================
    # 2. SUBMISSION MANAGEMENT
    # ==========================================================================
    async def create_submission(self, req: SubmissionCreateRequest) -> Dict[str, Any]:
        sub_id = f"SUB-{uuid.uuid4().hex[:6].upper()}"
        task_id = f"REV-TSK-{uuid.uuid4().hex[:6].upper()}"
        now_time = _now_str()

        # Build initial approval history
        approval_history = [
            {
                "stage": "CREATOR_SUBMISSION",
                "label": "Creator Submission",
                "user": req.creator_name,
                "role": "Creator",
                "status": "COMPLETED",
                "timestamp": now_time,
                "comments": "Draft submitted for copy review."
            },
            {
                "stage": "REVIEWER_APPROVAL",
                "label": "Reviewer Approval",
                "user": "Reviewer Meera",
                "role": "Reviewer",
                "status": "ACTIVE",
                "timestamp": None,
                "comments": None
            },
            {
                "stage": "COMPLIANCE_APPROVAL",
                "label": "Compliance Approval",
                "user": "Compliance Arjun",
                "role": "Compliance Officer",
                "status": "PENDING",
                "timestamp": None,
                "comments": None
            },
            {
                "stage": "FINAL_RELEASE",
                "label": "Final Release Seal",
                "user": "Brand Owner Kabir",
                "role": "Brand Owner",
                "status": "PENDING",
                "timestamp": None,
                "comments": None
            }
        ]

        # Convert findings to dictionaries
        findings_data = [f.model_dump() for f in req.findings]

        submission_doc = {
            "id": sub_id,
            "submission_id": sub_id,
            "task_id": task_id,
            "brand_id": req.brand_id,
            "brand_name": req.brand_name,
            "title": req.title,
            "channel": req.channel,
            "creator_id": req.creator_id,
            "creator_name": req.creator_name,
            "creator_type": req.creator_type,
            "org_id": req.org_id,
            "analysis_id": req.analysis_id or f"VRF-{uuid.uuid4().hex[:8].upper()}",
            "version": req.version or 1,
            "original_content": req.original_content,
            "current_content": req.current_content,
            "findings": findings_data,
            "status": "PENDING_REVIEW",
            "submission_notes": req.submission_notes or "",
            "submitted_at": now_time,
            "updated_at": now_time,
            "approval_history": approval_history,
            "release_seal": None
        }

        # 1. Persist to MongoDB
        if mongo_manager.is_connected and mongo_manager.db is not None:
            await mongo_manager.db.submissions.update_one(
                {"submission_id": sub_id},
                {"$set": submission_doc},
                upsert=True
            )
        _SUBMISSIONS_STORE[sub_id] = submission_doc

        # 2. Register task in dependency_engine & revision_tasks
        try:
            rev_task = RevisionTask(
                task_id=task_id,
                brand_id=req.brand_id,
                asset_id=sub_id,
                asset_name=req.title,
                asset_type="MARKETING_COPY",
                campaign_id="CAMP-AGENCY" if req.creator_type == "agency" else "CAMP-CREATOR",
                campaign_name="Agency Partner Submissions" if req.creator_type == "agency" else "Creator Content Submissions",
                department="Agency Partner" if req.creator_type == "agency" else "Creator Marketing",
                assigned_reviewer_role="REVIEWER",
                priority=SeverityLevel.HIGH,
                old_value=req.original_content[:100],
                new_value=req.current_content[:100],
                current_content=req.original_content,
                proposed_content=req.current_content,
                diff_summary=f"{'Agency' if req.creator_type == 'agency' else 'Creator'} submission by {req.creator_name} ({req.org_id}) across {req.channel} (v{req.version or 1})",
                status="PENDING_REVIEW",
                created_at=int(time.time()),
                created_at_iso=now_time
            )
            dependency_engine.revision_tasks[task_id] = rev_task
            await mongo_manager.save_revision_task(rev_task.model_dump())
        except Exception as e:
            print(f"[SubmissionsService] Task sync note: {e}")

        # 3. Add to Audit Log
        event_hash = _hash_str(f"{sub_id}:{req.title}:{req.current_content}")
        await self.record_audit_event(
            what=f"submitted draft for review: {req.title[:40]}...",
            reason="Submitted to Reviewer Queue",
            actor_name=req.creator_name,
            event_hash=event_hash
        )

        # 4. Notify Reviewer Meera
        self.add_notification(
            recipient_role="REVIEWER",
            title=f"New submission from {req.creator_name}",
            message=f"Post '{req.title[:50]}' submitted for review on channel '{req.channel}'.",
            submission_id=sub_id
        )

        return submission_doc

    async def get_submission(self, submission_id: str) -> Optional[Dict[str, Any]]:
        if mongo_manager.is_connected and mongo_manager.db is not None:
            doc = await mongo_manager.db.submissions.find_one({"submission_id": submission_id}, {"_id": 0})
            if doc:
                return doc
        return _SUBMISSIONS_STORE.get(submission_id)

    async def list_submissions(
        self,
        creator_id: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        brand_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {}
        if creator_id and role == "creator":
            query["creator_id"] = creator_id
        if status:
            if status == "CHANGES_REQUESTED":
                query["status"] = {"$in": ["CHANGES_REQUESTED", "RETURNED_TO_CREATOR", "RETURNED_TO_AGENCY"]}
            else:
                query["status"] = status
        elif role == "compliance":
            query["status"] = {"$in": ["REVIEW_APPROVED", "COMPLIANCE_APPROVED", "EVIDENCE_REQUESTED"]}
        elif role == "reviewer":
            query["status"] = {"$in": ["PENDING_REVIEW", "SUBMITTED", "REVIEW_APPROVED", "CHANGES_REQUESTED", "RETURNED_TO_CREATOR", "RETURNED_TO_AGENCY"]}
        elif role in ["brand-owner", "brand_owner"]:
            query["status"] = {"$in": ["COMPLIANCE_APPROVED", "RELEASED", "APPROVED"]}
        if brand_id:
            query["brand_id"] = brand_id

        if mongo_manager.is_connected and mongo_manager.db is not None:
            cursor = mongo_manager.db.submissions.find(query, {"_id": 0}).sort("updated_at", -1)
            docs = await cursor.to_list(length=100)
            if docs:
                return docs

        subs = list(_SUBMISSIONS_STORE.values())
        if creator_id and role == "creator":
            subs = [s for s in subs if s.get("creator_id") == creator_id]
        if status:
            if status == "CHANGES_REQUESTED":
                subs = [s for s in subs if s.get("status") in ["CHANGES_REQUESTED", "RETURNED_TO_CREATOR", "RETURNED_TO_AGENCY"]]
            else:
                subs = [s for s in subs if s.get("status") == status]
        elif role == "compliance":
            subs = [s for s in subs if s.get("status") in ["REVIEW_APPROVED", "COMPLIANCE_APPROVED", "EVIDENCE_REQUESTED"]]
        elif role == "reviewer":
            subs = [s for s in subs if s.get("status") in ["PENDING_REVIEW", "SUBMITTED", "REVIEW_APPROVED", "CHANGES_REQUESTED", "RETURNED_TO_CREATOR", "RETURNED_TO_AGENCY"]]
        elif role in ["brand-owner", "brand_owner"]:
            subs = [s for s in subs if s.get("status") in ["COMPLIANCE_APPROVED", "RELEASED", "APPROVED"]]
        if brand_id:
            subs = [s for s in subs if s.get("brand_id") == brand_id]
        return subs

    # ==========================================================================
    # 3. REVIEW WORKFLOW (Reviewer Meera)
    # ==========================================================================
    async def record_reviewer_decision(
        self,
        submission_id: str,
        decision: str,
        reviewer_name: str,
        feedback: Optional[str] = None,
        finding_decisions: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        sub = await self.get_submission(submission_id)
        if not sub:
            return None

        now_time = _now_str()

        # Update finding decisions if provided (supporting both ID and Number lookups)
        if finding_decisions and "findings" in sub:
            for f in sub["findings"]:
                f_id = f.get("id")
                f_num_str = str(f.get("number", ""))
                lookup_key = None
                if f_id and f_id in finding_decisions:
                    lookup_key = f_id
                elif f_num_str and f_num_str in finding_decisions:
                    lookup_key = f_num_str

                if lookup_key:
                    d_info = finding_decisions[lookup_key]
                    if isinstance(d_info, dict):
                        f["decision"] = d_info.get("decision", f.get("decision", "UNDECIDED"))
                        if "overrule_reason" in d_info:
                            f["overrule_reason"] = d_info["overrule_reason"]
                        elif "reason" in d_info:
                            f["overrule_reason"] = d_info["reason"]
                        if "comment" in d_info:
                            f["reviewer_comment"] = d_info["comment"]
                    elif isinstance(d_info, str):
                        f["decision"] = d_info
                    if f["decision"] in ["UPHELD", "OVERRULED"]:
                        f["resolved"] = True

        history = sub.get("approval_history", [])
        is_agency = sub.get("creator_type") == "agency"
        
        if decision in ["APPROVE", "APPROVE_REVIEW"]:
            # Advance to Compliance queue
            sub["status"] = "REVIEW_APPROVED"
            sub["reviewer_feedback"] = feedback or f"Reviewer approved by {reviewer_name}. Ready for compliance sign-off."
            for step in history:
                if step.get("stage") == "REVIEWER_APPROVAL":
                    step["status"] = "COMPLETED"
                    step["timestamp"] = now_time
                    step["comments"] = feedback or f"Reviewer approved by {reviewer_name}. Ready for compliance sign-off."
                elif step.get("stage") == "COMPLIANCE_APPROVAL":
                    step["status"] = "ACTIVE"

            self.add_notification(
                recipient_role="COMPLIANCE",
                title=f"New submission awaiting compliance: {sub.get('title', '')[:40]}",
                message=f"Reviewed and approved by {reviewer_name}.",
                submission_id=submission_id
            )

        elif decision in ["REQUEST_CHANGES", "SEND_BACK", "RETURN_FOR_REVISION"]:
            new_status = "RETURNED_TO_AGENCY" if is_agency else "RETURNED_TO_CREATOR"
            sub["status"] = new_status
            sub["reviewer_feedback"] = feedback or "Corrections requested by reviewer."
            for step in history:
                if step.get("stage") == "REVIEWER_APPROVAL":
                    step["status"] = "REJECTED"
                    step["timestamp"] = now_time
                    step["comments"] = f"Returned for revision: {feedback}"

            self.add_notification(
                recipient_role="AGENCY" if is_agency else "CREATOR",
                title=f"Submission returned for revision by {reviewer_name}",
                message=feedback or "Reviewer requested changes on your submission.",
                submission_id=submission_id
            )

        elif decision == "REJECT":
            sub["status"] = "REJECTED"
            sub["rejection_reason"] = feedback or "Rejected by reviewer."
            for step in history:
                if step.get("stage") == "REVIEWER_APPROVAL":
                    step["status"] = "REJECTED"
                    step["timestamp"] = now_time
                    step["comments"] = feedback or "Rejected."

            self.add_notification(
                recipient_role="AGENCY" if is_agency else "CREATOR",
                title=f"Submission rejected by {reviewer_name}",
                message=feedback or "Submission did not pass review criteria.",
                submission_id=submission_id
            )

        sub["updated_at"] = now_time
        sub["approval_history"] = history

        # Update in database & memory
        if mongo_manager.is_connected and mongo_manager.db is not None:
            await mongo_manager.db.submissions.update_one(
                {"submission_id": submission_id},
                {"$set": sub}
            )
        _SUBMISSIONS_STORE[submission_id] = sub

        # Sync with revision_tasks
        task_id = sub.get("task_id")
        if task_id:
            try:
                task_decision = "APPROVED" if decision in ["APPROVE", "APPROVE_REVIEW"] else ("CHANGES_REQUESTED" if decision in ["REQUEST_CHANGES", "SEND_BACK"] else "REJECTED")
                dependency_engine.resolve_revision_task(
                    task_id=task_id,
                    reviewer_name=reviewer_name,
                    decision=task_decision,
                    resolution_notes=feedback or ""
                )
            except Exception as e:
                print(f"[SubmissionsService] Task resolve note: {e}")

        # Add to Audit Trail
        evt_hash = _hash_str(f"review:{submission_id}:{decision}:{now_time}")
        await self.record_audit_event(
            what=f"reviewer decision ({decision.lower()}): {sub.get('title', '')[:30]}",
            reason=feedback or f"Decision: {decision}",
            actor_name=reviewer_name,
            event_hash=evt_hash
        )

        return sub

    # ==========================================================================
    # 4. COMPLIANCE WORKFLOW (Compliance Arjun)
    # ==========================================================================
    async def record_compliance_decision(
        self,
        submission_id: str,
        decision: str,
        compliance_name: str,
        notes: Optional[str] = None,
        finding_decisions: Optional[Dict[str, Any]] = None,
        requested_evidence: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        sub = await self.get_submission(submission_id)
        if not sub:
            return None

        now_time = _now_str()
        is_agency = sub.get("creator_type") == "agency"

        # Update finding decisions if provided
        if finding_decisions and "findings" in sub:
            for f in sub["findings"]:
                f_id = f.get("id")
                f_num_str = str(f.get("number", ""))
                lookup_key = None
                if f_id and f_id in finding_decisions:
                    lookup_key = f_id
                elif f_num_str and f_num_str in finding_decisions:
                    lookup_key = f_num_str

                if lookup_key:
                    d_info = finding_decisions[lookup_key]
                    if isinstance(d_info, dict):
                        f["decision"] = d_info.get("decision", f.get("decision", "UNDECIDED"))
                        if "overrule_reason" in d_info:
                            f["overrule_reason"] = d_info["overrule_reason"]
                        elif "reason" in d_info:
                            f["overrule_reason"] = d_info["reason"]
                        if "comment" in d_info:
                            f["compliance_comment"] = d_info["comment"]
                    elif isinstance(d_info, str):
                        f["decision"] = d_info
                    if f["decision"] in ["UPHELD", "OVERRULED"]:
                        f["resolved"] = True

        history = sub.get("approval_history", [])

        if decision in ["APPROVE", "APPROVE_COMPLIANCE"]:
            sub["status"] = "COMPLIANCE_APPROVED"
            for step in history:
                if step.get("stage") == "COMPLIANCE_APPROVAL":
                    step["status"] = "COMPLETED"
                    step["timestamp"] = now_time
                    step["comments"] = notes or "Statutory compliance verified."
                elif step.get("stage") == "FINAL_RELEASE":
                    step["status"] = "ACTIVE"
                    step["comments"] = "Awaiting final Brand Owner release sign-off."

            # Generate Cryptographic Release Seal
            seal_code = f"BT-SEAL-{uuid.uuid4().hex[:6].upper()}-{_hash_str(sub['current_content'])[:8].upper()}"
            sub["release_seal"] = seal_code

            # Save in release ledger
            try:
                audit_ledger_engine.record_release(
                    asset_id=submission_id,
                    asset_title=sub.get("title", ""),
                    channel=sub.get("channel", "digital"),
                    content=sub["current_content"],
                    reviewer=compliance_name,
                    brand_id=sub.get("brand_id", "aurelle-tech")
                )
            except Exception as e:
                print(f"[SubmissionsService] Audit ledger seal note: {e}")

            self.add_notification(
                recipient_role="BRAND_OWNER",
                title=f"Compliance Approved: {sub.get('title', '')[:35]}",
                message=f"Signed off by {compliance_name}. Ready for final Brand Owner release.",
                submission_id=submission_id
            )

        elif decision in ["REQUEST_EVIDENCE"]:
            sub["status"] = "EVIDENCE_REQUESTED"
            ev_note = requested_evidence or notes or "Additional clinical trial or regulatory substantiation required."
            sub["evidence_requested_notes"] = ev_note
            for step in history:
                if step.get("stage") == "COMPLIANCE_APPROVAL":
                    step["status"] = "ACTIVE"
                    step["comments"] = f"Compliance requested evidence: {ev_note}"

            self.add_notification(
                recipient_role="AGENCY" if is_agency else "CREATOR",
                title=f"Evidence Requested: {sub.get('title', '')[:35]}",
                message=f"Compliance officer {compliance_name} requested additional evidence: {ev_note}",
                submission_id=submission_id
            )
            self.add_notification(
                recipient_role="REVIEWER",
                title=f"Evidence Requested: {sub.get('title', '')[:35]}",
                message=f"Compliance officer {compliance_name} requested additional evidence.",
                submission_id=submission_id
            )

        elif decision in ["REQUEST_CHANGES", "RETURN_FOR_REVISION", "SEND_BACK"]:
            sub["status"] = "RETURNED_TO_AGENCY" if is_agency else "RETURNED_TO_CREATOR"
            sub["compliance_notes"] = notes or "Compliance corrections requested."
            for step in history:
                if step.get("stage") == "COMPLIANCE_APPROVAL":
                    step["status"] = "ACTIVE"
                    step["comments"] = f"Compliance requested changes: {notes}"

            self.add_notification(
                recipient_role="AGENCY" if is_agency else "CREATOR",
                title=f"Revision Requested by Compliance: {sub.get('title', '')[:35]}",
                message=f"Compliance officer {compliance_name} returned submission for revision: {notes}",
                submission_id=submission_id
            )

        elif decision == "REJECT":
            sub["status"] = "REJECTED"
            sub["rejection_reason"] = notes or "Rejected by compliance officer due to statutory non-compliance."
            for step in history:
                if step.get("stage") == "COMPLIANCE_APPROVAL":
                    step["status"] = "REJECTED"
                    step["timestamp"] = now_time
                    step["comments"] = notes or "Statutory non-compliance rejection."

            self.add_notification(
                recipient_role="AGENCY" if is_agency else "CREATOR",
                title=f"Submission Rejected by Compliance: {sub.get('title', '')[:35]}",
                message=f"Compliance rejection: {notes}",
                submission_id=submission_id
            )
            self.add_notification(
                recipient_role="REVIEWER",
                title=f"Submission Rejected by Compliance: {sub.get('title', '')[:35]}",
                message=f"Compliance rejection: {notes}",
                submission_id=submission_id
            )

        sub["updated_at"] = now_time
        sub["approval_history"] = history

        if mongo_manager.is_connected and mongo_manager.db is not None:
            await mongo_manager.db.submissions.update_one(
                {"submission_id": submission_id},
                {"$set": sub}
            )
        _SUBMISSIONS_STORE[submission_id] = sub

        h = _hash_str(f"compliance:{submission_id}:{decision}:{now_time}")
        await self.record_audit_event(
            what=f"compliance sign-off ({decision.lower()}): {sub.get('title', '')[:30]}",
            reason=notes or requested_evidence or f"Compliance decision: {decision}",
            actor_name=compliance_name,
            event_hash=h
        )

        return sub

    # ==========================================================================
    # 5. BRAND OWNER FINAL APPROVAL & RELEASE (Brand Owner Kabir)
    # ==========================================================================
    async def record_final_approval(
        self,
        submission_id: str,
        decision: str,
        approver_name: str,
        notes: Optional[str] = None,
        reason: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        sub = await self.get_submission(submission_id)
        if not sub:
            return None

        # MANDATORY WORKFLOW CHECK:
        # A submission must not receive final approval without successful Reviewer and Compliance approval!
        history = sub.get("approval_history", [])
        has_reviewer_approval = any(
            step.get("stage") == "REVIEWER_APPROVAL" and step.get("status") == "COMPLETED"
            for step in history
        )
        has_compliance_approval = any(
            step.get("stage") == "COMPLIANCE_APPROVAL" and step.get("status") == "COMPLETED"
            for step in history
        ) or sub.get("status") in ["COMPLIANCE_APPROVED", "RELEASED", "APPROVED"]

        if decision in ["APPROVE", "FINAL_APPROVE"]:
            if not has_reviewer_approval or not has_compliance_approval:
                raise ValueError("Cannot grant final approval: submission must first successfully complete Reviewer approval and Compliance approval.")

        now_time = _now_str()
        is_agency = sub.get("creator_type") == "agency"

        if decision in ["APPROVE", "FINAL_APPROVE"]:
            content = sub.get("current_content") or sub.get("original_content") or ""
            release_id = _generate_release_id()
            release_digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
            
            sub["status"] = "RELEASED"
            sub["release_id"] = release_id
            sub["release_digest"] = release_digest
            sub["released_at"] = now_time
            sub["brand_owner_notes"] = notes or f"Final release approved by {approver_name}."

            for step in history:
                if step.get("stage") == "FINAL_RELEASE":
                    step["status"] = "COMPLETED"
                    step["timestamp"] = now_time
                    step["comments"] = f"Final release approved by {approver_name}. Release ID: {release_id} (SHA-256: {release_digest[:16]}...)"

            # Save in release ledger / audit ledger engine
            try:
                audit_ledger_engine.record_release(
                    user_identity=approver_name,
                    user_role="BRAND_OWNER",
                    resource_id=release_id,
                    resource_type="ASSET",
                    content=content,
                    approved_version=f"v{sub.get('version', 1)}.0",
                    relevant_sources=[f.get("rule_id", "FACT-014") for f in sub.get("findings", []) if f.get("rule_id")]
                )
            except Exception as e:
                print(f"[SubmissionsService] Audit ledger release record: {e}")

            # Store in MongoDB release records / release ledger and memory releases
            release_record = {
                "release_id": release_id,
                "submission_id": submission_id,
                "asset_id": submission_id,
                "asset_title": sub.get("title", ""),
                "content": content,
                "content_hash": release_digest,
                "approved_version": f"v{sub.get('version', 1)}.0",
                "brand_id": sub.get("brand_id", "aurelle-tech"),
                "brand_name": sub.get("brand_name", "Aurelle Skin"),
                "channel": sub.get("channel", "instagram"),
                "creator_name": sub.get("creator_name", ""),
                "approver_name": approver_name,
                "timestamp_iso": now_time,
                "seal_code": sub.get("release_seal") or release_id,
                "is_superseded": False,
                "is_revoked": False
            }
            mongo_manager._memory_releases.append(release_record)
            if mongo_manager.is_connected and mongo_manager.db is not None:
                try:
                    await mongo_manager.db.release_ledger.insert_one(release_record)
                    await mongo_manager.db.release_records.insert_one(release_record)
                except Exception as ex:
                    print(f"[SubmissionsService] Mongo release insert: {ex}")

            # Dispatch release notifications
            self.add_notification(
                recipient_role="AGENCY" if is_agency else "CREATOR",
                title=f"Content Released: {sub.get('title', '')[:35]}",
                message=f"Final release approved by {approver_name}. Release ID: {release_id}",
                submission_id=submission_id
            )
            self.add_notification(
                recipient_role="REVIEWER",
                title=f"Content Released: {sub.get('title', '')[:35]}",
                message=f"Release ID: {release_id} generated for {sub.get('title', '')[:30]}.",
                submission_id=submission_id
            )
            self.add_notification(
                recipient_role="COMPLIANCE",
                title=f"Content Released: {sub.get('title', '')[:35]}",
                message=f"Release ID: {release_id} signed off by {approver_name}.",
                submission_id=submission_id
            )

        elif decision == "REQUEST_CHANGES":
            effective_reason = notes or reason
            if not effective_reason or not effective_reason.strip():
                raise ValueError("A reason is required when requesting changes.")
            
            sub["status"] = "RETURNED_TO_AGENCY" if is_agency else "RETURNED_TO_CREATOR"
            sub["brand_owner_notes"] = effective_reason
            for step in history:
                if step.get("stage") == "FINAL_RELEASE":
                    step["status"] = "ACTIVE"
                    step["comments"] = f"Brand Owner requested changes: {effective_reason}"

            self.add_notification(
                recipient_role="AGENCY" if is_agency else "CREATOR",
                title=f"Changes Requested by Brand Owner: {sub.get('title', '')[:35]}",
                message=f"Brand Owner {approver_name} requested revisions: {effective_reason}",
                submission_id=submission_id
            )

        elif decision == "REJECT":
            effective_reason = notes or reason
            if not effective_reason or not effective_reason.strip():
                raise ValueError("A reason is required when rejecting a submission.")

            sub["status"] = "REJECTED"
            sub["rejection_reason"] = effective_reason
            for step in history:
                if step.get("stage") == "FINAL_RELEASE":
                    step["status"] = "REJECTED"
                    step["timestamp"] = now_time
                    step["comments"] = effective_reason

            self.add_notification(
                recipient_role="AGENCY" if is_agency else "CREATOR",
                title=f"Submission Rejected by Brand Owner: {sub.get('title', '')[:35]}",
                message=f"Brand Owner rejection: {effective_reason}",
                submission_id=submission_id
            )
            self.add_notification(
                recipient_role="REVIEWER",
                title=f"Submission Rejected by Brand Owner: {sub.get('title', '')[:35]}",
                message=f"Brand Owner rejection: {effective_reason}",
                submission_id=submission_id
            )
            self.add_notification(
                recipient_role="COMPLIANCE",
                title=f"Submission Rejected by Brand Owner: {sub.get('title', '')[:35]}",
                message=f"Brand Owner rejection: {effective_reason}",
                submission_id=submission_id
            )

        sub["updated_at"] = now_time
        sub["approval_history"] = history

        if mongo_manager.is_connected and mongo_manager.db is not None:
            await mongo_manager.db.submissions.update_one(
                {"submission_id": submission_id},
                {"$set": sub}
            )
        _SUBMISSIONS_STORE[submission_id] = sub

        h = _hash_str(f"brand_owner:{submission_id}:{decision}:{now_time}")
        await self.record_audit_event(
            what=f"brand owner final approval ({decision.lower()}): {sub.get('title', '')[:30]}",
            reason=notes or reason or f"Brand owner decision: {decision}",
            actor_name=approver_name,
            event_hash=h
        )

        return sub

    # ==========================================================================
    # 6. PUBLISHING RESTRICTION
    # ==========================================================================
    async def publish_submission(
        self,
        submission_id: str,
        platform: str,
        destination_account: str,
        authorized_integration: bool = False,
        oauth_token: Optional[str] = None
    ) -> Dict[str, Any]:
        sub = await self.get_submission(submission_id)
        if not sub:
            raise ValueError(f"Submission {submission_id} not found.")

        if sub.get("status") not in ["RELEASED", "APPROVED"]:
            raise ValueError("Publishing restricted: Content must receive successful Final Approval and Release generation before publication.")

        if not authorized_integration or not oauth_token:
            return {
                "status": "RESTRICTED",
                "message": "Publishing restricted: Automatic publishing to external platforms is prohibited. Content can only be published through an explicitly configured and authorized integration after final approval.",
                "release_id": sub.get("release_id", ""),
                "published_url": None
            }

        now_time = _now_str()
        published_url = f"https://{platform}.com/{destination_account}/p/{sub.get('release_id', 'post')}"
        sub["published_url"] = published_url
        sub["published_at"] = now_time

        await self.record_audit_event(
            what=f"published to {platform}: {sub.get('title', '')[:30]}",
            reason=f"Authorized integration deployment to @{destination_account}",
            actor_name="Authorized System Integration",
            event_hash=_hash_str(f"publish:{submission_id}:{platform}:{now_time}")
        )

        return {
            "status": "PUBLISHED",
            "message": f"Successfully published via authorized integration to {platform} (@{destination_account}).",
            "release_id": sub.get("release_id", ""),
            "published_url": published_url
        }

    # ==========================================================================
    # 7. AUDIT LOGGING
    # ==========================================================================
    async def record_audit_event(self, what: str, reason: Optional[str], actor_name: str, event_hash: str) -> Dict[str, Any]:
        evt_id = f"evt-{uuid.uuid4().hex[:8]}"
        when_str = _now_str()

        event_record = {
            "id": evt_id,
            "when": when_str,
            "who": actor_name,
            "what": what,
            "reason": reason or "",
            "hash": event_hash
        }

        if mongo_manager.is_connected and mongo_manager.db is not None:
            await mongo_manager.db.audit_logs.insert_one(event_record)

        _AUDIT_EVENTS_STORE.insert(0, event_record)
        return event_record

    async def list_audit_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        if mongo_manager.is_connected and mongo_manager.db is not None:
            cursor = mongo_manager.db.audit_logs.find({}, {"_id": 0}).sort("when", -1)
            docs = await cursor.to_list(length=limit)
            if docs:
                return docs
        return _AUDIT_EVENTS_STORE[:limit]

    # ==========================================================================
    # 6. NOTIFICATIONS
    # ==========================================================================
    def add_notification(self, recipient_role: str, title: str, message: str, submission_id: Optional[str] = None):
        notif = {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "role": recipient_role,
            "title": title,
            "message": message,
            "submission_id": submission_id,
            "is_read": False,
            "created_at": int(time.time() * 1000)
        }
        _NOTIFICATIONS_STORE.insert(0, notif)

    def list_notifications(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        if not role:
            return _NOTIFICATIONS_STORE
        return [n for n in _NOTIFICATIONS_STORE if n.get("role") == role or n.get("role") == "ALL"]

submissions_service = SubmissionsService()
