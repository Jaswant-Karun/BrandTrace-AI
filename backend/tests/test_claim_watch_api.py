import pytest
from httpx import ASGITransport, AsyncClient

from brandtrace.main import app


@pytest.mark.anyio
async def test_verification_persists_claim_for_claim_watch():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        verification = await client.post(
            "/api/verify",
            json={
                "brand_id": "aurelle-tech",
                "asset_title": "Claim Watch API test",
                "channel": "Social Media",
                "content": "This vehicle travels 600 miles.",
            },
        )
        assert verification.status_code == 200
        verification_id = verification.json()["verification_id"]

        response = await client.get("/api/claims?search=600%20miles")
        assert response.status_code == 200
        claim = next(item for item in response.json() if item["verification_id"] == verification_id)
        assert claim["status"] in {"CONTRADICTED", "UNSUPPORTED", "NEEDS_HUMAN_REVIEW"}
        assert claim["claim_text"] == "600 miles"


@pytest.mark.anyio
async def test_claim_watch_detail_returns_persisted_claim():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        verification = await client.post(
            "/api/verify",
            json={
                "brand_id": "aurelle-tech",
                "asset_title": "Claim Watch detail test",
                "channel": "Social Media",
                "content": "The product has completely indestructible materials.",
            },
        )
        assert verification.status_code == 200

        claims = (await client.get("/api/claims?search=indestructible")).json()
        claim = next(item for item in claims if item["verification_id"] == verification.json()["verification_id"])
        detail = await client.get(f"/api/claims/{claim['claim_id']}")
        assert detail.status_code == 200
        assert detail.json()["claim_id"] == claim["claim_id"]
