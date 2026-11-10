import pytest
from brandtrace.modules.auth.service import auth_service
from brandtrace.modules.auth.models import RegisterRequest, UserRole
from brandtrace.core.security import decode_access_token

def test_demo_account_valid_authentication():
    """Verify demo@brandtrace.ai authenticates successfully with designated credentials."""
    user = auth_service.authenticate_user("demo@brandtrace.ai", "DemoAurelle2026!")
    assert user is not None, "demo@brandtrace.ai should authenticate successfully"
    assert user.email == "demo@brandtrace.ai"
    assert user.role == UserRole.BRAND_MANAGER
    assert user.org_id == "ORG-AURELLE"
    assert user.workspace_id == "aurelle-tech"

def test_demo_account_invalid_password_rejected():
    """Verify wrong password returns None (which leads to HTTP 401 in route)."""
    user = auth_service.authenticate_user("demo@brandtrace.ai", "wrong-password-2026")
    assert user is None, "Invalid password must be rejected"

def test_demo_account_token_generation_and_claims():
    """Verify JWT token created for demo user contains correct tenant and role claims."""
    user = auth_service.authenticate_user("demo@brandtrace.ai", "DemoAurelle2026!")
    assert user is not None
    token = auth_service.create_user_token(user)
    assert token is not None

    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("email") == "demo@brandtrace.ai"
    assert payload.get("role") == "BRAND_MANAGER"
    assert payload.get("org_id") == "ORG-AURELLE"
    assert payload.get("workspace_id") == "aurelle-tech"

@pytest.mark.anyio
async def test_register_account_and_login():
    """Verify new user registration registers the user and creates valid JWT token."""
    reg_req = RegisterRequest(
        name="Julian Vance",
        email="julian.vance@aurelle.com",
        password="SecureAurellePassword2026!",
        role=UserRole.BRAND_MANAGER,
        workspace_id="aurelle-tech"
    )
    user = await auth_service.register_user(reg_req)
    assert user is not None
    assert user.email == "julian.vance@aurelle.com"
    assert user.name == "Julian Vance"
    assert user.org_id == "ORG-AURELLE"
    assert user.workspace_id == "aurelle-tech"

    # Now verify login with these newly registered credentials
    logged_in = auth_service.authenticate_user("julian.vance@aurelle.com", "SecureAurellePassword2026!")
    assert logged_in is not None
    assert logged_in.user_id == user.user_id
