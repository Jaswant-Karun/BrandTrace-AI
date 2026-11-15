import urllib.request
import json
import ssl
import time

ctx = ssl.create_default_context()
base = "https://brand-trace-ai-dun.vercel.app"

def request(path, method="GET", data=None, token=None):
    t0 = time.perf_counter()
    url = f"{base}{path}"
    req = urllib.request.Request(url, method=method)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if data is not None:
        req.data = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
            dur = time.perf_counter() - t0
            raw = resp.read().decode("utf-8")
            ct = resp.headers.get("Content-Type", "")
            hdrs = dict(resp.headers)
            try:
                body = json.loads(raw) if "application/json" in ct else raw
            except Exception:
                body = raw
            return resp.status, dur, body, hdrs
    except urllib.error.HTTPError as e:
        dur = time.perf_counter() - t0
        raw = e.read().decode("utf-8")
        try:
            body = json.loads(raw)
        except Exception:
            body = raw
        return e.code, dur, body, dict(e.headers)
    except Exception as e:
        dur = time.perf_counter() - t0
        return 0, dur, str(e), {}

print("=== 1. SECURITY HEADERS ON FRONTEND ROOT ===")
st, dur, body, hdrs = request("/")
print(f"Status: {st}, Latency: {dur:.3f}s")
sec_keys = ["x-content-type-options", "x-frame-options", "x-xss-protection", "strict-transport-security", "access-control-allow-origin"]
for k in sec_keys:
    print(f"  {k}: {hdrs.get(k, 'MISSING')}")

print("\n=== 2. PROXIED HEALTH ENDPOINT ===")
st, dur, body, hdrs = request("/health")
print(f"Status: {st}, Latency: {dur:.3f}s")
if isinstance(body, dict):
    print("  Service:", body.get("service"))
    print("  Status:", body.get("status"))
    print("  Database Connected:", body.get("database", {}).get("connected"))
    print("  Atlas Vector Search:", body.get("atlas_vector_search", {}).get("status"))
    print("  Active Agents:", body.get("active_agents"))

print("\n=== 3. DEMO LOGIN THROUGH PROXY ===")
st, dur, body, hdrs = request("/api/auth/login", "POST", {
    "email": "demo@brandtrace.ai",
    "password": "DemoAurelle2026!"
})
print(f"Status: {st}, Latency: {dur:.3f}s")
token = None
if isinstance(body, dict) and "access_token" in body:
    token = body["access_token"]
    print("  User:", body.get("user", {}).get("name"))
    print("  Role:", body.get("user", {}).get("role"))
    print("  Workspace:", body.get("user", {}).get("workspace_id"))
else:
    print("  Login failed:", body)

if token:
    print("\n=== 4. TESTING ALL CORE MODULE APIS THROUGH PROXY ===")
    endpoints = [
        ("GET", "/api/auth/me", None),
        ("GET", "/api/facts?brand_id=aurelle-tech", None),
        ("GET", "/api/guidelines?brand_id=aurelle-tech", None),
        ("GET", "/api/brands/aurelle-tech/graph", None),
        ("GET", "/api/campaigns?brand_id=aurelle-tech", None),
        ("GET", "/api/tasks?brand_id=aurelle-tech", None),
        ("GET", "/api/releases?brand_id=aurelle-tech", None),
        ("GET", "/api/analytics/governance?brand_id=aurelle-tech", None),
        ("GET", "/api/risks/taxonomy", None),
        ("GET", "/api/demo/scenario-status", None),
        ("POST", "/api/verify", {
            "brand_id": "aurelle-tech",
            "channel": "Instagram / Meta Feed Ads",
            "content": "Scale your creative workflows with Aurelle Cloud Studio. Spatial audio mastering starting at just ₹499/month."
        }),
        ("POST", "/api/simulator/propose", {
            "brand_id": "aurelle-tech",
            "target_record_id": "FACT-AUR-PRC-01",
            "target_record_type": "PRICE",
            "record_label": "Aurelle Cloud Studio Subscription",
            "old_value": "₹499",
            "proposed_value": "₹599",
            "change_rationale": "Commercial tier revision Q1",
            "proposed_by": "Alex Mercer (VP Brand Governance)"
        }),
        ("POST", "/api/ledger/verify-record", {
            "identifier": "AST-AUR-01",
            "content_to_test": "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included."
        })
    ]

    for m, p, d in endpoints:
        s, t, b, _ = request(p, m, d, token)
        summary = ""
        if isinstance(b, list):
            summary = f"[{len(b)} items]"
        elif isinstance(b, dict):
            if "status" in b: summary = f"status={b['status']}"
            elif "governance_decision" in b: summary = f"decision={b['governance_decision']}, risk={b.get('composite_risk_score')}"
            elif "overall_risk_score" in b: summary = f"risk={b['overall_risk_score']}, touchpoints={len(b.get('affected_touchpoints', []))}"
            elif "state" in b: summary = f"state={b['state']}, authentic={b.get('is_authentic')}"
            elif "email" in b: summary = f"email={b['email']}, role={b.get('role')}"
            else: summary = f"keys={list(b.keys())[:3]}"
        print(f"  {m:4s} {p:45s} -> Status: {s} ({t:.2f}s) {summary}")

