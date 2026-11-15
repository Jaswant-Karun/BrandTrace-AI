import pytest
import time
from bson import ObjectId
from fastapi.testclient import TestClient
from brandtrace.main import app
from brandtrace.core.security import verify_password, hash_password, create_access_token
from brandtrace.modules.auth.service import auth_service, PRESET_USERS
from brandtrace.core.config import settings
from brandtrace.database.mongo import mongo_manager
from brandtrace.database.schemas import (
    ApprovedFactDoc, BrandGuidelineDoc, ContentAssetDoc,
    BrandWorkspaceDoc, UserDoc, GraphRelationshipDoc, ApprovalDecisionDoc
)

client = TestClient(app)

# ==============================================================================
# DEF-01: AUTHENTICATION SECURITY UNIT & API TESTS
# ==============================================================================

def test_auth_valid_registered_user_succeeds():
    """Valid registered user + correct password -> authentication succeeds (200 OK + JWT)."""
    res = client.post("/api/auth/login", json={
        "email": "admin@aurelle.com",
        "password": "brandtrace2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "Bearer"
    assert data["user"]["email"] == "admin@aurelle.com"
    assert data["user"]["role"] == "ADMIN"
    assert data["user"]["org_id"] == "ORG-AURELLE"


def test_auth_valid_registered_user_incorrect_password_rejected():
    """Valid registered user + incorrect password -> HTTP 401 Unauthorized."""
    res = client.post("/api/auth/login", json={
        "email": "admin@aurelle.com",
        "password": "wrong_password_999"
    })
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid credentials"


def test_auth_unknown_user_rejected_generic_401():
    """Unknown user -> HTTP 401 Unauthorized with generic message (no user enumeration)."""
    res = client.post("/api/auth/login", json={
        "email": "nonexistent_hacker@darkweb.io",
        "password": "brandtrace2026"
    })
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid credentials"


def test_auth_empty_password_rejected():
    """Empty or whitespace password -> rejected safely with 401."""
    res = client.post("/api/auth/login", json={
        "email": "admin@aurelle.com",
        "password": ""
    })
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid credentials"


def test_auth_missing_or_malformed_password_hash_safely_rejected():
    """Missing or non-string/malformed password hash in user store -> rejected safely."""
    # Temporarily insert corrupted test user into PRESET_USERS
    PRESET_USERS["corrupt_hash@test.com"] = {
        "user_id": "USR-CORRUPT",
        "email": "corrupt_hash@test.com",
        "name": "Corrupt User",
        "role": "ADMIN",
        "org_id": "ORG-TEST",
        "workspace_id": "ws-test",
        "password_hash": None # Corrupted
    }
    try:
        user = auth_service.authenticate_user("corrupt_hash@test.com", "brandtrace2026")
        assert user is None

        # Non-string hash
        PRESET_USERS["corrupt_hash@test.com"]["password_hash"] = 12345
        user2 = auth_service.authenticate_user("corrupt_hash@test.com", "brandtrace2026")
        assert user2 is None
    finally:
        PRESET_USERS.pop("corrupt_hash@test.com", None)


def test_auth_demo_persona_in_production_rejected():
    """Demo fallback persona is strictly forbidden when environment is production."""
    orig_env = settings.environment
    try:
        settings.environment = "production"
        user = auth_service.authenticate_user("random_unknown@corp.com", "any_password", allow_mock_fallback=True)
        assert user is None

        # Verify get_current_user also strictly rejects missing bearer in production
        unauth_res = client.get("/api/auth/me")
        assert unauth_res.status_code == 401
    finally:
        settings.environment = orig_env


def test_auth_demo_persona_mock_mode_opt_in():
    """Mock persona works only when non-production AND allow_mock_fallback is True."""
    orig_env = settings.environment
    try:
        settings.environment = "development"
        # Without explicit allow_mock_fallback -> rejected
        assert auth_service.authenticate_user("unknown@dev.com", "pass", allow_mock_fallback=False) is None

        # With explicit opt-in -> allowed in dev
        demo_user = auth_service.authenticate_user("unknown@dev.com", "pass", allow_mock_fallback=True)
        assert demo_user is not None
        assert demo_user.user_id == "USR-DEMO-01"
    finally:
        settings.environment = orig_env


def test_auth_existing_rbac_and_tenant_isolation_preserved():
    """Existing server-side RBAC and cross-tenant boundaries remain strictly enforced."""
    creator_token = create_access_token({
        "sub": "USR-AUR-CRT",
        "email": "creator@aurelle.com",
        "role": "CREATOR",
        "org_id": "ORG-AURELLE",
        "workspace_id": "aurelle-tech"
    })

    # RBAC Guard: Creator cannot access Admin endpoint (403)
    rbac_res = client.get("/api/security/admin-endpoint", headers={"Authorization": f"Bearer {creator_token}"})
    assert rbac_res.status_code == 403

    # Tenant Boundary: Cannot access foreign tenant (403)
    tenant_res = client.get("/api/security/tenant-boundary/ORG-APEX", headers={"Authorization": f"Bearer {creator_token}"})
    assert tenant_res.status_code == 403


# ==============================================================================
# DEF-02: MONGODB IMMUTABLE _ID REPOSITORY TESTS
# ==============================================================================

@pytest.mark.anyio
async def test_repo_add_approved_fact_immutable_id_preserved():
    """
    ApprovedFactDoc update test:
    1. Insert new document.
    2. Retrieve and record _id.
    3. Update the same document with new value.
    4. Confirm update succeeds without Mongo WriteError 66.
    5. Confirm original _id remains unchanged.
    6. Confirm updated fields contain new value.
    7. Confirm unrelated fields are preserved.
    8. Test repeated updates.
    """
    repo = mongo_manager.repo
    org_id = "ORG-DEF02-TEST"
    ws_id = "ws-def02"
    now_ts = int(time.time())

    fact_doc = ApprovedFactDoc(
        fact_id="FACT-DEF02-01",
        organisation_id=org_id,
        workspace_id=ws_id,
        name="Titanium Chassis Density",
        category="SPECIFICATION",
        current_value="4.5 g/cm³",
        unit="g/cm³",
        description="Initial aerospace material density",
        source_citation="ASTM B265 Standard Spec",
        department_owner="Materials Engineering",
        last_verified="2026-11-10",
        created_at=now_ts,
        updated_at=now_ts
    )

    # 1. Insert
    await repo.add_approved_fact(fact_doc)

    # 2. Retrieve & record _id
    if mongo_manager.is_connected and mongo_manager.db is not None:
        raw_doc = await mongo_manager.db.approved_facts.find_one(
            {"organisation_id": org_id, "fact_id": "FACT-DEF02-01"}
        )
        assert raw_doc is not None
        initial_id = raw_doc["_id"]
    else:
        initial_id = "in-memory-id"

    # 3. Update same document with mutated field
    fact_doc.current_value = "4.51 g/cm³"
    fact_doc.updated_at = now_ts + 60

    # 4. Confirm update succeeds
    updated_result = await repo.add_approved_fact(fact_doc)
    assert updated_result is not None

    # 5. Confirm original _id remains unchanged in database
    if mongo_manager.is_connected and mongo_manager.db is not None:
        retrieved_raw = await mongo_manager.db.approved_facts.find_one(
            {"organisation_id": org_id, "fact_id": "FACT-DEF02-01"}
        )
        assert retrieved_raw["_id"] == initial_id
        # 6. Confirm updated field
        assert retrieved_raw["current_value"] == "4.51 g/cm³"
        # 7. Confirm unrelated fields preserved
        assert retrieved_raw["department_owner"] == "Materials Engineering"
        assert retrieved_raw["source_citation"] == "ASTM B265 Standard Spec"

    # 8. Repeated updates
    for v in ["4.52 g/cm³", "4.53 g/cm³", "4.54 g/cm³"]:
        fact_doc.current_value = v
        await repo.add_approved_fact(fact_doc)

    if mongo_manager.is_connected and mongo_manager.db is not None:
        final_raw = await mongo_manager.db.approved_facts.find_one(
            {"organisation_id": org_id, "fact_id": "FACT-DEF02-01"}
        )
        assert final_raw["_id"] == initial_id
        assert final_raw["current_value"] == "4.54 g/cm³"


@pytest.mark.anyio
async def test_repo_add_brand_guideline_immutable_id_preserved():
    """
    BrandGuidelineDoc update test:
    1. Insert new guideline.
    2. Retrieve and record _id.
    3. Update severity and rule_statement.
    4. Confirm update succeeds.
    5. Confirm original _id preserved.
    """
    repo = mongo_manager.repo
    org_id = "ORG-DEF02-TEST"
    ws_id = "ws-def02"
    now_ts = int(time.time())

    gl_doc = BrandGuidelineDoc(
        guideline_id="GL-DEF02-01",
        organisation_id=org_id,
        workspace_id=ws_id,
        category="TYPOGRAPHY",
        title="Primary Headline Tracking",
        rule_statement="Tracking must be tight (-0.02em)",
        severity="MEDIUM",
        created_at=now_ts,
        updated_at=now_ts
    )

    # 1. Insert
    await repo.add_brand_guideline(gl_doc)

    if mongo_manager.is_connected and mongo_manager.db is not None:
        raw_doc = await mongo_manager.db.brand_guidelines.find_one(
            {"organisation_id": org_id, "guideline_id": "GL-DEF02-01"}
        )
        assert raw_doc is not None
        orig_id = raw_doc["_id"]

        # 3. Update
        gl_doc.severity = "CRITICAL"
        gl_doc.rule_statement = "Updated strict tracking rule"
        await repo.add_brand_guideline(gl_doc)

        # 5. Confirm _id preserved and fields updated
        updated_doc = await mongo_manager.db.brand_guidelines.find_one(
            {"organisation_id": org_id, "guideline_id": "GL-DEF02-01"}
        )
        assert updated_doc["_id"] == orig_id
        assert updated_doc["severity"] == "CRITICAL"
        assert updated_doc["rule_statement"] == "Updated strict tracking rule"
        assert updated_doc["title"] == "Primary Headline Tracking"


@pytest.mark.anyio
async def test_repo_save_content_asset_immutable_id_preserved():
    """
    ContentAssetDoc update test:
    1. Insert new asset.
    2. Retrieve and record _id.
    3. Update asset status and headline.
    4. Confirm update succeeds and _id preserved.
    """
    repo = mongo_manager.repo
    org_id = "ORG-DEF02-TEST"
    ws_id = "ws-def02"
    now_ts = int(time.time())

    asset_doc = ContentAssetDoc(
        asset_id="AST-DEF02-01",
        organisation_id=org_id,
        workspace_id=ws_id,
        title="Launch Keynote Teaser",
        channel="Social Media",
        raw_content="Discover precision engineering at its finest.",
        content_hash="hash_teaser_v1",
        status="DRAFT",
        created_at=now_ts,
        updated_at=now_ts
    )

    # 1. Insert
    await repo.save_content_asset(asset_doc)

    if mongo_manager.is_connected and mongo_manager.db is not None:
        raw_doc = await mongo_manager.db.content_assets.find_one(
            {"organisation_id": org_id, "asset_id": "AST-DEF02-01"}
        )
        assert raw_doc is not None
        orig_id = raw_doc["_id"]

        # 3. Update status to IN_REVIEW
        asset_doc.status = "IN_REVIEW"
        asset_doc.raw_content = "Updated: Discover titanium craftsmanship."
        await repo.save_content_asset(asset_doc)

        # 5. Confirm _id preserved
        updated_doc = await mongo_manager.db.content_assets.find_one(
            {"organisation_id": org_id, "asset_id": "AST-DEF02-01"}
        )
        assert updated_doc["_id"] == orig_id
        assert updated_doc["status"] == "IN_REVIEW"
        assert updated_doc["raw_content"] == "Updated: Discover titanium craftsmanship."
        assert updated_doc["title"] == "Launch Keynote Teaser"


@pytest.mark.anyio
async def test_repo_other_upserts_immutable_id_preserved():
    """Verify workspace, user, and graph_relationship upserts also preserve _id."""
    repo = mongo_manager.repo
    org_id = "ORG-DEF02-TEST"
    ws_id = "ws-def02-secondary"
    now_ts = int(time.time())

    # Workspace
    ws_doc = BrandWorkspaceDoc(
        organisation_id=org_id,
        workspace_id=ws_id,
        name="Secondary Staging Workspace",
        slug="secondary-staging",
        primary_color="#111827",
        accent_color="#38BDF8",
        created_at=now_ts,
        updated_at=now_ts
    )
    await repo.create_workspace(ws_doc)

    if mongo_manager.is_connected and mongo_manager.db is not None:
        raw_ws = await mongo_manager.db.brand_workspaces.find_one(
            {"organisation_id": org_id, "workspace_id": ws_id}
        )
        assert raw_ws is not None
        orig_ws_id = raw_ws["_id"]

        ws_doc.name = "Renamed Staging Workspace"
        await repo.create_workspace(ws_doc)

        updated_ws = await mongo_manager.db.brand_workspaces.find_one(
            {"organisation_id": org_id, "workspace_id": ws_id}
        )
        assert updated_ws["_id"] == orig_ws_id
        assert updated_ws["name"] == "Renamed Staging Workspace"
