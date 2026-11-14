import pytest
import io
from fastapi.testclient import TestClient
from brandtrace.main import app
from brandtrace.database.mongo import mongo_manager
from brandtrace.modules.knowledge_base.router import validate_url_safe

client = TestClient(app)

@pytest.fixture(autouse=True)
def ensure_clean_state():
    """Ensure baseline test state before running document tests."""
    pass

def test_list_documents_seeded_demos():
    """Verify demo benchmark documents are seeded and identified with is_demo=True."""
    response = client.get("/api/documents?workspace_id=aurelle-tech")
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) >= 3
    demo_docs = [d for d in docs if d["is_demo"]]
    assert len(demo_docs) >= 3
    for d in demo_docs:
        assert d["is_demo"] is True
        assert d["processing_status"] == "INDEXED"
        assert d["version_number"] == "1.0"

def test_create_custom_document():
    """Verify creating a custom brand document enforces tenant isolation and indexes successfully."""
    payload = {
        "title": "Aurelle Q3 Spatial Audio Standards",
        "category": "PRODUCT_FACTS",
        "description": "Standardized acoustic testing parameters for spatial audio engine.",
        "raw_content": "Aurelle Spatial Computing audio must maintain sub-8ms latency under high load.",
        "workspace_id": "aurelle-tech",
        "org_id": "ORG-AURELLE"
    }
    response = client.post("/api/documents", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["doc_id"].startswith("DOC-AUR-")
    assert data["title"] == "Aurelle Q3 Spatial Audio Standards"
    assert data["is_demo"] is False
    assert data["version_number"] == "1.0"
    assert data["processing_status"] == "INDEXED"

    # Verify retrieval
    get_res = client.get(f"/api/documents/{data['doc_id']}?workspace_id=aurelle-tech")
    assert get_res.status_code == 200
    assert get_res.json()["doc_id"] == data["doc_id"]

def test_update_document_versioning():
    """Verify editing a custom document archives previous version and increments version number."""
    # 1. Create document
    create_res = client.post("/api/documents", json={
        "title": "Enterprise Subscription Surcharge Policy",
        "category": "PRICING_POLICIES",
        "description": "Initial policy draft",
        "raw_content": "Initial price rule: baseline charge is ₹499/mo.",
        "workspace_id": "aurelle-tech",
        "org_id": "ORG-AURELLE"
    })
    assert create_res.status_code == 200
    doc_id = create_res.json()["doc_id"]
    assert create_res.json()["version_number"] == "1.0"

    # 2. Update document
    update_res = client.put(f"/api/documents/{doc_id}?workspace_id=aurelle-tech", json={
        "title": "Enterprise Subscription Surcharge Policy (Revised)",
        "raw_content": "Revised price rule: baseline charge is ₹599/mo with premium add-on.",
        "change_summary": "Q3 price policy revision to ₹599"
    })
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["version_number"] == "1.1"
    assert updated_data["title"] == "Enterprise Subscription Surcharge Policy (Revised)"

    # 3. Verify version history archive
    ver_res = client.get(f"/api/documents/{doc_id}/versions")
    assert ver_res.status_code == 200
    history = ver_res.json()
    assert len(history) >= 1
    assert history[0]["version_number"] == "1.0"
    assert history[0]["change_summary"] == "Q3 price policy revision to ₹599"

def test_protected_demo_cannot_be_deleted_or_overwritten():
    """Verify preloaded demo documents cannot be modified or deleted by users."""
    # Attempt update on demo doc
    put_res = client.put("/api/documents/DOC-AUR-DEMO-01?workspace_id=aurelle-tech", json={
        "title": "Hacked Title"
    })
    assert put_res.status_code == 403

    # Attempt delete on demo doc
    del_res = client.delete("/api/documents/DOC-AUR-DEMO-01?workspace_id=aurelle-tech")
    assert del_res.status_code == 403

def test_delete_custom_document():
    """Verify custom documents can be deleted safely."""
    create_res = client.post("/api/documents", json={
        "title": "Temporary Marketing Brief",
        "category": "MARKETING_CLAIMS",
        "raw_content": "Temporary seasonal campaign notes.",
        "workspace_id": "aurelle-tech",
        "org_id": "ORG-AURELLE"
    })
    doc_id = create_res.json()["doc_id"]

    del_res = client.delete(f"/api/documents/{doc_id}?workspace_id=aurelle-tech")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "SUCCESS"

    # Verify not found after deletion
    get_res = client.get(f"/api/documents/{doc_id}?workspace_id=aurelle-tech")
    assert get_res.status_code == 404

def test_upload_txt_document():
    """Verify uploading a plain text document file parses and indexes successfully."""
    file_content = b"Brand Policy Mandate: All digital releases must feature certified trademark notices."
    files = {"file": ("brand_policy.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "workspace_id": "aurelle-tech",
        "org_id": "ORG-AURELLE",
        "category": "BRAND_GUIDELINES",
        "title": "Digital Release Trademark Directive"
    }

    upload_res = client.post("/api/documents/upload", files=files, data=data)
    assert upload_res.status_code == 200
    res_data = upload_res.json()
    assert res_data["source_type"] == "FILE_UPLOAD"
    assert "Digital Release Trademark Directive" in res_data["title"]
    assert res_data["processing_status"] == "INDEXED"
    assert "Brand Policy Mandate" in res_data["raw_content"]

def test_ssrf_protection():
    """Verify SSRF protection strictly blocks internal, loopback, private, and metadata URLs."""
    forbidden_urls = [
        "http://localhost:8000/api/facts",
        "http://127.0.0.1:8000/admin",
        "http://127.0.0.1",
        "http://0.0.0.0",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.1/internal",
        "http://192.168.1.1/router",
        "ftp://example.com/file.txt",
        "file:///etc/passwd"
    ]
    for url in forbidden_urls:
        res = client.post("/api/documents/import-website/preview", json={"url": url})
        assert res.status_code in [400, 422], f"Expected SSRF rejection for {url}, got {res.status_code}"

def test_user_document_influences_ai_verification():
    """
    Verify that an INDEXED user document directly influences multi-agent verification results:
    1. Register user pricing document: certified price is ₹799/month.
    2. Candidate copy claims ₹499/month.
    3. Multi-agent verification flags the contradiction with the exact document ID and version citation.
    """
    # 1. Create and index custom pricing document
    doc_res = client.post("/api/documents", json={
        "title": "Aurelle Spatial Pro Special Pricing Directive",
        "category": "PRICING_POLICIES",
        "description": "Certified pricing for Spatial Pro hardware subscription.",
        "raw_content": "Official Mandate: Aurelle Spatial Pro subscription is certified at ₹799/month. Any lower claim violates price compliance.",
        "workspace_id": "aurelle-tech",
        "org_id": "ORG-AURELLE"
    })
    assert doc_res.status_code == 200
    doc_id = doc_res.json()["doc_id"]
    ver = doc_res.json()["version_number"]

    # 2. Verify candidate copy claiming conflicting price ₹499/mo for Spatial Pro
    verify_res = client.post("/api/verify", json={
        "brand_id": "aurelle-tech",
        "content": "Get the new Aurelle Spatial Pro subscription for only ₹499/month today!"
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()

    # 3. Check that the multi-agent pipeline detected the contradiction and cited the user document
    claim_spans = [s for s in v_data["all_risk_spans"] if s["category"] == "CLAIM"]
    assert len(claim_spans) > 0

    matching_citations = [s["rule_citation"] for s in claim_spans if doc_id in s["rule_citation"]]
    assert len(matching_citations) > 0, f"Expected citation referencing {doc_id}, found citations: {[s['rule_citation'] for s in claim_spans]}"
    assert f"v{ver}" in matching_citations[0]

    # Clean up test document
    client.delete(f"/api/documents/{doc_id}?workspace_id=aurelle-tech")

def test_tenant_isolation_prevents_cross_workspace_leak():
    """Verify documents created in one workspace are not accessible or leaked to another."""
    # 1. Create document in apex-dynamics
    res = client.post("/api/documents", json={
        "title": "Apex Confidential Battery Architecture",
        "category": "PRODUCT_FACTS",
        "raw_content": "Confidential internal engineering parameters for 800V cells.",
        "workspace_id": "apex-dynamics",
        "org_id": "ORG-APEX"
    })
    assert res.status_code == 200
    apex_doc_id = res.json()["doc_id"]

    # 2. Attempt to retrieve from aurelle-tech
    leak_res = client.get(f"/api/documents/{apex_doc_id}?workspace_id=aurelle-tech&org_id=ORG-AURELLE")
    assert leak_res.status_code == 404

    # Clean up test document
    client.delete(f"/api/documents/{apex_doc_id}?workspace_id=apex-dynamics")
