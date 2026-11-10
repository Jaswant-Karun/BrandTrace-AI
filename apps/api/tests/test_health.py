from fastapi.testclient import TestClient
from brandtrace.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["service"] == "BRANDTRACE AI Governance Engine"
    assert data["active_agents"] == 4

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "BRANDTRACE AI" in data["name"]

