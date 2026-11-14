import os
import json
import pytest
from PIL import Image

def test_pwa_manifest_validity():
    """Verify web app manifest exists, is valid JSON, and meets PWA installability requirements."""
    manifest_path = os.path.join("frontend", "public", "manifest.webmanifest")
    assert os.path.exists(manifest_path), "manifest.webmanifest must exist in frontend/public"

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    assert manifest["name"] == "BrandTrace AI — Autonomous Brand Intelligence & Governance Control Plane"
    assert manifest["short_name"] == "BrandTrace AI"
    assert manifest["display"] == "standalone"
    assert manifest["start_url"].startswith("/")
    assert manifest["background_color"] == "#FFFFFF"
    assert manifest["theme_color"] == "#0F172A"
    assert len(manifest["icons"]) >= 3

    # Check icon purposes
    purposes = [i.get("purpose", "any") for i in manifest["icons"]]
    assert "maskable" in purposes
    assert "any" in purposes

def test_pwa_icons_dimensions():
    """Verify icon images exist with exact dimensions matching manifest."""
    icon_192 = os.path.join("frontend", "public", "icon-192.png")
    icon_512 = os.path.join("frontend", "public", "icon-512.png")
    icon_maskable = os.path.join("frontend", "public", "icon-maskable-512.png")
    favicon_svg = os.path.join("frontend", "public", "favicon.svg")

    assert os.path.exists(icon_192)
    assert os.path.exists(icon_512)
    assert os.path.exists(icon_maskable)
    assert os.path.exists(favicon_svg)

    with Image.open(icon_192) as img:
        assert img.size == (192, 192)
    with Image.open(icon_512) as img:
        assert img.size == (512, 512)
    with Image.open(icon_maskable) as img:
        assert img.size == (512, 512)

def test_service_worker_safe_caching_policy():
    """Verify service worker adheres strictly to zero-trust private data caching policy."""
    sw_path = os.path.join("frontend", "public", "sw.js")
    assert os.path.exists(sw_path), "sw.js must exist in frontend/public"

    with open(sw_path, "r", encoding="utf-8") as f:
        sw_code = f.read()

    # 1. Zero caching of mutations / non-GET
    assert "request.method !== 'GET'" in sw_code
    # 2. Strict Network-Only bypass for /api/* endpoints
    assert "url.pathname.startsWith('/api/')" in sw_code
    assert "503" in sw_code
    # 3. Offline fallback page
    assert "/offline.html" in sw_code
    # 4. Skip waiting and clients claim for clean lifecycle
    assert "self.skipWaiting()" in sw_code
    assert "self.clients.claim()" in sw_code

def test_offline_page_integrity():
    """Verify offline.html contains user-facing explanation and security disclosures."""
    offline_path = os.path.join("frontend", "public", "offline.html")
    assert os.path.exists(offline_path), "offline.html must exist in frontend/public"

    with open(offline_path, "r", encoding="utf-8") as f:
        html = f.read()

    assert "BRANDTRACE AI" in html
    assert "System Connectivity Required" in html
    assert "Deterministic Governance Guardrail" in html
    assert "checkConnection" in html

def test_vercel_pwa_headers():
    """Verify vercel.json configures correct caching headers for PWA assets."""
    vercel_path = "vercel.json"
    assert os.path.exists(vercel_path)

    with open(vercel_path, "r", encoding="utf-8") as f:
        v_config = json.load(f)

    assert "headers" in v_config
    sources = [h["source"] for h in v_config["headers"]]
    assert "/sw.js" in sources
    assert "/manifest.webmanifest" in sources
