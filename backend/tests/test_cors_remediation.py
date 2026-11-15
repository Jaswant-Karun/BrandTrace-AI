import os
import pytest
from fastapi.testclient import TestClient
from brandtrace.core.config import Settings
from brandtrace.main import app

client = TestClient(app)

def test_cors_allowed_origin_header():
    """Verify that a request from an allowed origin receives Access-Control-Allow-Origin matching the origin."""
    origin = "http://localhost:5173"
    response = client.get("/health", headers={"Origin": origin})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"

def test_cors_disallowed_origin_rejected():
    """Verify that an unauthorized origin does NOT receive Access-Control-Allow-Origin header."""
    unauthorized_origin = "https://malicious-attacker-domain.com"
    response = client.get("/health", headers={"Origin": unauthorized_origin})
    assert response.status_code == 200
    # Starlette CORSMiddleware omits access-control-allow-origin when origin is not in allowed_origins
    assert response.headers.get("access-control-allow-origin") is None

def test_cors_preflight_options_request():
    """Verify preflight OPTIONS requests return correct CORS approval headers for allowed origins."""
    origin = "http://localhost:5173"
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Authorization, Content-Type",
    }
    response = client.options("/api/verify", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"
    assert "POST" in response.headers.get("access-control-allow-methods", "")

def test_cors_origins_parsing_whitespace_and_commas():
    """Verify safe parsing and trimming of comma-separated origins with whitespace."""
    s = Settings(
        environment="development",
        allowed_origins_raw="  https://app1.vercel.app  ,  https://app2.vercel.app , "
    )
    parsed = s.get_allowed_origins()
    assert "https://app1.vercel.app" in parsed
    assert "https://app2.vercel.app" in parsed
    assert "" not in parsed
    # In development, localhost is preserved
    assert "http://localhost:5173" in parsed

def test_cors_production_rejects_wildcard():
    """Verify that in production mode, wildcard '*' origin is strictly prohibited when credentials are true."""
    s = Settings(
        environment="production",
        allowed_origins_raw="*"
    )
    with pytest.raises(RuntimeError) as exc_info:
        s.get_allowed_origins()
    assert "ALLOWED_ORIGINS cannot be empty or solely wildcard" in str(exc_info.value)

def test_cors_production_rejects_empty():
    """Verify that in production mode, empty ALLOWED_ORIGINS raises a startup exception."""
    s = Settings(
        environment="production",
        allowed_origins_raw="   ,  "
    )
    with pytest.raises(RuntimeError) as exc_info:
        s.get_allowed_origins()
    assert "ALLOWED_ORIGINS cannot be empty" in str(exc_info.value)

def test_cors_production_valid_explicit_origins():
    """Verify that in production mode, explicit origins are parsed and returned without wildcard."""
    s = Settings(
        environment="production",
        allowed_origins_raw="https://brand-trace-ai-dun.vercel.app, https://brandtrace-ai.vercel.app"
    )
    parsed = s.get_allowed_origins()
    assert parsed == ["https://brand-trace-ai-dun.vercel.app", "https://brandtrace-ai.vercel.app"]
    assert "*" not in parsed
