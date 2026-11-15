import pytest
from starlette.testclient import TestClient
from brandtrace.main import app
from brandtrace.data.seed_data import APPROVED_FACTS_CATALOG

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_catalogs():
    """Ensure catalogs are pristine before each test."""
    if "FACT-AUR-PRC-01" in APPROVED_FACTS_CATALOG:
        APPROVED_FACTS_CATALOG["FACT-AUR-PRC-01"].current_value = "₹499"
    yield
    if "FACT-AUR-PRC-01" in APPROVED_FACTS_CATALOG:
        APPROVED_FACTS_CATALOG["FACT-AUR-PRC-01"].current_value = "₹499"

def test_demo_account_authentication_valid():
    """Verify demo@brandtrace.ai authenticates via standard JWT endpoint without bypass."""
    res = client.post("/api/auth/login", json={
        "email": "demo@brandtrace.ai",
        "password": "DemoAurelle2026!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@brandtrace.ai"
    assert data["user"]["role"] == "BRAND_MANAGER"
    assert data["user"]["workspace_id"] == "aurelle-tech"
    assert data["user"]["org_id"] == "ORG-AURELLE"

def test_demo_account_wrong_password_rejected():
    """Verify demo account rejects invalid passwords with 401 Unauthorized."""
    res = client.post("/api/auth/login", json={
        "email": "demo@brandtrace.ai",
        "password": "InvalidPassword2026!"
    })
    assert res.status_code == 401
    assert "Invalid credentials" in res.json()["detail"]

def test_demo_reset_role_authorization():
    """Verify RBAC: Creator role cannot reset workspace, while Brand Manager can."""
    # 1. Login as Creator
    res_creator = client.post("/api/auth/login", json={
        "email": "creator@aurelle.com",
        "password": "brandtrace2026"
    })
    assert res_creator.status_code == 200
    creator_token = res_creator.json()["access_token"]

    # Creator attempts reset -> 403 Forbidden
    res_creator_reset = client.post("/api/demo/reset", headers={
        "Authorization": f"Bearer {creator_token}"
    })
    assert res_creator_reset.status_code == 403
    assert "Creator role is not authorized" in res_creator_reset.json()["detail"]

    # 2. Login as Demo Brand Manager
    res_bm = client.post("/api/auth/login", json={
        "email": "demo@brandtrace.ai",
        "password": "DemoAurelle2026!"
    })
    assert res_bm.status_code == 200
    bm_token = res_bm.json()["access_token"]

    # Brand Manager executes reset -> 200 OK
    res_bm_reset = client.post("/api/demo/reset", headers={
        "Authorization": f"Bearer {bm_token}"
    })
    assert res_bm_reset.status_code == 200
    assert res_bm_reset.json()["current_price"] == "₹499"

def test_demo_workspace_tenant_isolation_on_reset():
    """Verify reset strictly isolates aurelle-tech and does not delete apex-dynamics data."""
    # Authenticate as Brand Manager
    res_bm = client.post("/api/auth/login", json={
        "email": "demo@brandtrace.ai",
        "password": "DemoAurelle2026!"
    })
    bm_token = res_bm.json()["access_token"]

    # Mutate price first to ₹599
    APPROVED_FACTS_CATALOG["FACT-AUR-PRC-01"].current_value = "₹599"
    assert APPROVED_FACTS_CATALOG["FACT-AUR-PRC-01"].current_value == "₹599"

    # Execute reset
    res = client.post("/api/demo/reset", headers={
        "Authorization": f"Bearer {bm_token}"
    })
    assert res.status_code == 200
    assert res.json()["workspace_id"] == "aurelle-tech"
    assert res.json()["current_price"] == "₹499"

    # Verify other workspace facts remain untouched
    if "FACT-APX-RNG-01" in APPROVED_FACTS_CATALOG:
        assert APPROVED_FACTS_CATALOG["FACT-APX-RNG-01"].current_value == "520 miles"

def test_demo_guided_scenario_endpoints():
    """Verify scenario status, 9 demonstration cases, and test case execution."""
    # 1. Scenario status
    status_res = client.get("/api/demo/scenario-status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert len(status_data["steps"]) == 12
    assert status_data["workspace_id"] == "aurelle-tech"

    # 2. 9 Demo cases
    cases_res = client.get("/api/demo/cases")
    assert cases_res.status_code == 200
    cases_data = cases_res.json()
    assert len(cases_data) == 9
    case_ids = [c["case_id"] for c in cases_data]
    assert "CASE-01" in case_ids # Unsupported claim
    assert "CASE-02" in case_ids # Expired fact
    assert "CASE-04" in case_ids # Statutory medical claim

    # 3. Run demonstration test case
    case1_res = client.post("/api/demo/run-case/CASE-01")
    assert case1_res.status_code == 200
    c1_out = case1_res.json()
    assert c1_out["case_id"] == "CASE-01"
    assert c1_out["governance_decision"] in ["REJECTED", "REJECTED_GATED", "REVISION_REQUIRED", "FLAGGED_FOR_REVIEW"]
    assert len(c1_out["risk_spans"]) > 0
    assert "ASTM" in c1_out["governing_policy"] or "FTC" in c1_out["governing_policy"]
