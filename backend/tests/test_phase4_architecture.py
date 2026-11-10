import pytest
from fastapi.testclient import TestClient
from brandtrace.main import app

client = TestClient(app)

def test_health_check_atlas_status():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "operational"
    assert data["database_type"] == "MongoDB Atlas"
    assert data["atlas_vector_search"]["status"] == "CONFIGURED"
    assert data["atlas_vector_search"]["dimensions"] == 768
    assert data["tenant_isolation"] == "ORGANIZATION_STRICT"

def test_jwt_auth_login_and_me():
    # 1. Login with preset enterprise credentials
    login_resp = client.post("/api/auth/login", json={
        "email": "governance@apex.com",
        "password": "brandtrace2026"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    token = login_data["access_token"]
    assert login_data["user"]["role"] == "COMPLIANCE_REVIEWER"
    assert login_data["user"]["org_id"] == "ORG-APEX"

    # 2. Query /me with JWT header
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "governance@apex.com"
    assert me_data["org_id"] == "ORG-APEX"

def test_organizations_isolation():
    resp = client.get("/api/organizations")
    assert resp.status_code == 200
    orgs = resp.json()
    assert len(orgs) >= 2
    org_ids = [o["org_id"] for o in orgs]
    assert "ORG-APEX" in org_ids
    assert "ORG-NOVUS" in org_ids

def test_atlas_vector_search():
    # 1. Check index definition configuration
    cfg_resp = client.get("/api/knowledge-base/atlas-index-config")
    assert cfg_resp.status_code == 200
    cfg = cfg_resp.json()
    assert cfg["index_name"] == "vector_index"
    assert cfg["collection_name"] == "knowledge_nodes"
    assert cfg["dimensions"] == 768

    # 2. Execute semantic vector search query
    query_payload = {
        "query_text": "EPA certified battery range and charging capacity",
        "org_id": "ORG-APEX",
        "workspace_id": "apex-dynamics",
        "limit": 3
    }
    search_resp = client.post("/api/knowledge-base/vector-search", json=query_payload)
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) > 0
    # Top result should be related to EPA range
    top = results[0]
    assert "score" in top
    assert top["org_id"] == "ORG-APEX"

def test_graph_intelligence_relationships_and_lookup():
    # 1. Fetch persistent relationship documents
    rel_resp = client.get("/api/graph-intelligence/relationships?org_id=ORG-APEX&brand_id=apex-dynamics")
    assert rel_resp.status_code == 200
    rels = rel_resp.json()
    assert len(rels) > 0
    first = rels[0]
    assert "source_node_id" in first
    assert "target_node_id" in first
    assert "relationship_type" in first
    assert first["relationship_status"] == "ACTIVE_VERIFIED"

    # 2. Execute graph lookup traversal
    trav_resp = client.post("/api/graph-intelligence/traverse-dependencies", json={
        "org_id": "ORG-APEX",
        "root_node_id": "PC-01",
        "max_depth": 3
    })
    assert trav_resp.status_code == 200
    trav_data = trav_resp.json()
    assert trav_data["traversal_engine"] == "MongoDB Atlas $graphLookup"
    assert "downstream_dependents_count" in trav_data

def test_content_upload_storage_and_metadata():
    test_content = b"Apex GT 520 Miles EPA range whitepaper with QuantumCell technology."
    files = {"file": ("apex_range_whitepaper.txt", test_content, "text/plain")}
    data = {
        "org_id": "ORG-APEX",
        "workspace_id": "apex-dynamics",
        "uploaded_by": "Senior Brand Lead"
    }
    resp = client.post("/api/content/upload", files=files, data=data)
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["status"] == "PROCESSED_AND_INDEXED"
    assert "file_metadata" in res_data
    assert res_data["file_metadata"]["sha256"] != ""
    assert res_data["file_metadata"]["storage_provider"] == "CLOUD_OBJECT_STORAGE_OR_LOCAL"

def test_atomic_approval_task_resolution():
    # 1. Seed a revision task
    from brandtrace.database.mongo import mongo_manager
    import asyncio
    
    test_task_id = "TASK-TEST-ATOMIC-01"
    asyncio.run(mongo_manager.save_task({
        "task_id": test_task_id,
        "org_id": "ORG-APEX",
        "brand_id": "apex-dynamics",
        "status": "PENDING_REVIEW",
        "proposed_content": "Updated telematics copy for ₹599"
    }))

    # 2. Perform atomic approval
    resolve_payload = {
        "task_id": test_task_id,
        "decision": "APPROVED",
        "reviewer_name": "Chief Governance Officer",
        "reviewer_role": "COMPLIANCE_REVIEWER",
        "final_content": "Approved: ₹599 monthly telematics"
    }
    resolve_resp = client.post("/api/approvals/resolve-atomic", json=resolve_payload)
    assert resolve_resp.status_code == 200
    resolve_data = resolve_resp.json()
    assert resolve_data["status"] == "ATOMIC_APPROVAL_COMMITTED"
    assert resolve_data["task"]["status"] == "APPROVED"
    assert "BT-REL-" in resolve_data["cryptographic_proof"]["release_hash"]

    # 3. Duplicate resolution attempt should be rejected (Atomic lock)
    duplicate_resp = client.post("/api/approvals/resolve-atomic", json=resolve_payload)
    assert duplicate_resp.status_code == 409
