import pytest
from brandtrace.core.security import (
    validate_jwt_secret_for_environment,
    DEFAULT_INSECURE_SECRETS,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password
)

def test_production_rejects_missing_secret():
    """Verify that in production mode, a missing or empty JWT_SECRET_KEY raises RuntimeError."""
    with pytest.raises(RuntimeError) as exc_info:
        validate_jwt_secret_for_environment("production", secret="")
    assert "Missing or empty JWT_SECRET_KEY" in str(exc_info.value)

    with pytest.raises(RuntimeError) as exc_info:
        validate_jwt_secret_for_environment("production", secret="   ")
    assert "Missing or empty JWT_SECRET_KEY" in str(exc_info.value)

def test_production_rejects_default_audit_secret():
    """Verify that in production mode, the default development secret is rejected."""
    for insecure in DEFAULT_INSECURE_SECRETS:
        with pytest.raises(RuntimeError) as exc_info:
            validate_jwt_secret_for_environment("production", secret=insecure)
        assert "Insecure or default JWT_SECRET_KEY detected" in str(exc_info.value)

def test_production_rejects_short_secret():
    """Verify that in production mode, secrets under 32 characters are rejected for entropy."""
    with pytest.raises(RuntimeError) as exc_info:
        validate_jwt_secret_for_environment("production", secret="short-secret-under-32-chars!")
    assert "at least 32 characters" in str(exc_info.value)

def test_production_accepts_valid_high_entropy_secret():
    """Verify that in production mode, a high-entropy secret passes validation without error."""
    valid_secret = "a" * 32 + "secure-entropy-key-2026-enterprise!"
    # Should complete cleanly without raising
    validate_jwt_secret_for_environment("production", secret=valid_secret)

def test_development_mode_permits_default_secret():
    """Verify that in development mode, the default secret does not raise an exception."""
    validate_jwt_secret_for_environment("development", secret="brandtrace-enterprise-governance-secret-key-2026-audit")

def test_validation_error_message_does_not_leak_secret():
    """Verify that error messages never print or expose the secret value."""
    test_secret = "secret"
    with pytest.raises(RuntimeError) as exc_info:
        validate_jwt_secret_for_environment("production", secret=test_secret)
    msg = str(exc_info.value)
    # The actual secret string should not appear in the error message
    assert "secret=" not in msg
    assert "Insecure or default JWT_SECRET_KEY detected" in msg

def test_jwt_auth_functions_unaffected():
    """Verify existing JWT creation, decoding, and password hashing logic remain 100% operational."""
    # Password hashing
    hashed = hash_password("DemoAurelle2026!")
    assert verify_password("DemoAurelle2026!", hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

    # JWT generation & decoding
    token = create_access_token({"sub": "USR-TEST-001", "role": "BRAND_MANAGER", "org_id": "ORG-AURELLE"})
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded.get("sub") == "USR-TEST-001"
    assert decoded.get("role") == "BRAND_MANAGER"
    assert decoded.get("org_id") == "ORG-AURELLE"
