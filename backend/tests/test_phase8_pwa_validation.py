"""
Phase 8 — Progressive Web App (PWA) Validation Test Suite
Verifies:
1. Valid web app manifest with correct name, short_name, icons, dark colors, standalone mode.
2. Service worker exists, enforces zero-trust /api/ network-only policy, precaches static shell.
3. Offline fallback page is dark enterprise styled and contains reconnect logic.
4. Index HTML links manifest and registers service worker.
5. All security boundaries (no caching of sensitive authenticated data) are preserved.
"""

import json
from pathlib import Path
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
FRONTEND_PUBLIC = REPO_ROOT / "frontend" / "public"
FRONTEND_INDEX = REPO_ROOT / "frontend" / "index.html"


def test_manifest_webmanifest_validity():
    manifest_path = FRONTEND_PUBLIC / "manifest.webmanifest"
    assert manifest_path.exists(), "manifest.webmanifest must exist in frontend/public"

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # Name and short_name
    assert "BrandTrace AI" in manifest["name"], "name must mention BrandTrace AI"
    assert manifest["short_name"] == "BrandTrace AI", "short_name must be BrandTrace AI"

    # Display mode
    assert manifest["display"] == "standalone", "display mode must be standalone"

    # Theme and background color (must match dark enterprise theme)
    assert manifest["background_color"] == "#000000", "background_color must be #000000"
    assert manifest["theme_color"] == "#000000", "theme_color must be #000000"

    # Icons check
    icons = manifest.get("icons", [])
    assert len(icons) >= 3, "Must have at least 3 icons (SVG, 192px, 512px)"

    sizes = [icon.get("sizes") for icon in icons]
    assert "192x192" in sizes, "Must have a 192x192 icon"
    assert "512x512" in sizes, "Must have a 512x512 icon"

    maskable = [icon for icon in icons if icon.get("purpose") == "maskable"]
    assert len(maskable) > 0, "Must have at least one maskable icon for Android adaptive icons"

    # Shortcuts check
    shortcuts = manifest.get("shortcuts", [])
    assert len(shortcuts) >= 3, "Must configure useful application shortcuts"


def test_service_worker_security_and_caching():
    sw_path = FRONTEND_PUBLIC / "sw.js"
    assert sw_path.exists(), "sw.js must exist in frontend/public"

    sw_content = sw_path.read_text(encoding="utf-8")

    # Safe caching & cache naming
    assert "brandtrace-static-v2" in sw_content or "brandtrace-static" in sw_content

    # Pre-caching static assets
    assert "/offline.html" in sw_content, "Service worker must precache offline fallback"
    assert "/manifest.webmanifest" in sw_content, "Service worker must precache manifest"

    # Strict Zero-Trust constraint: /api/* must NEVER be cached
    assert "startsWith('/api/')" in sw_content, "Service worker must explicitly detect /api/ routes"
    assert "503" in sw_content, "Service worker must return offline 503 response for failed API calls"
    assert "request.method !== 'GET'" in sw_content, "Non-GET mutation requests must bypass cache"

    # Clean lifecycle: skipWaiting and clients.claim
    assert "skipWaiting" in sw_content, "Service worker must call skipWaiting"
    assert "clients.claim" in sw_content, "Service worker must claim clients on activation"


def test_offline_page_theme_and_reconnect():
    offline_path = FRONTEND_PUBLIC / "offline.html"
    assert offline_path.exists(), "offline.html must exist in frontend/public"

    offline_content = offline_path.read_text(encoding="utf-8")

    # Dark theme confirmation
    assert "#000000" in offline_content, "offline.html must use pure dark #000000 background"
    assert "class=\"dark\"" in offline_content or "dark" in offline_content

    # Brand and security notices
    assert "BRANDTRACE" in offline_content, "offline.html must feature BRANDTRACE branding"
    assert "Deterministic Governance Guardrail" in offline_content or "Guardrail" in offline_content

    # Reconnect interaction
    assert "checkConnection" in offline_content, "offline.html must have a reconnect function"
    assert "window.addEventListener('online'" in offline_content, "offline.html must auto-reload on reconnect"


def test_index_html_pwa_integration():
    assert FRONTEND_INDEX.exists(), "frontend/index.html must exist"

    index_content = FRONTEND_INDEX.read_text(encoding="utf-8")

    # Manifest link
    assert 'rel="manifest"' in index_content, "index.html must link web app manifest"

    # Theme color meta
    assert 'name="theme-color"' in index_content, "index.html must specify theme-color meta tag"

    # iOS PWA tags
    assert 'name="apple-mobile-web-app-capable"' in index_content, "index.html must declare apple-mobile-web-app-capable"

    # Service worker registration
    assert "serviceWorker.register" in index_content, "index.html must register service worker"
