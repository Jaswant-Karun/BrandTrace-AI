import time
import asyncio
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from brandtrace.modules.auth.service import auth_service
from brandtrace.modules.auth.models import LoginRequest
from fastapi.testclient import TestClient
from brandtrace.main import app

def run_benchmarks():
    client = TestClient(app)

    print("=== BACKEND AUTH BENCHMARK ===")
    
    # 1. Warm-up
    res = client.post("/api/auth/login", json={"email": "demo@brandtrace.ai", "password": "DemoAurelle2026!"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"

    # 2. Benchmark 5 roles login
    roles_test = [
        ("demo@brandtrace.ai", "DemoAurelle2026!", "Brand Manager / Demo"),
        ("creator@aurelle.com", "brandtrace2026", "Creator"),
        ("sana@aurelle.com", "brandtrace2026", "Agency (Creator)"),
        ("reviewer@aurelle.com", "brandtrace2026", "Reviewer"),
        ("compliance@aurelle.com", "brandtrace2026", "Compliance Reviewer"),
        ("kabir@aurelle.com", "brandtrace2026", "Brand Owner"),
    ]

    for email, pwd, role_desc in roles_test:
        durations = []
        for _ in range(10):
            t0 = time.perf_counter()
            r = client.post("/api/auth/login", json={"email": email, "password": pwd})
            t1 = time.perf_counter()
            assert r.status_code == 200
            durations.append((t1 - t0) * 1000)
        avg = sum(durations) / len(durations)
        min_d = min(durations)
        max_d = max(durations)
        print(f"[{role_desc:25s}] Avg: {avg:.2f}ms | Min: {min_d:.2f}ms | Max: {max_d:.2f}ms")

    # 3. Benchmark Invalid Credentials (401 response time)
    invalid_durations = []
    for _ in range(10):
        t0 = time.perf_counter()
        r = client.post("/api/auth/login", json={"email": "nonexistent@brandtrace.ai", "password": "wrongpassword"})
        t1 = time.perf_counter()
        assert r.status_code == 401
        invalid_durations.append((t1 - t0) * 1000)
    print(f"[{'Invalid 401 Credentials':25s}] Avg: {sum(invalid_durations)/len(invalid_durations):.2f}ms")

    # 4. Benchmark Token Validation (/api/auth/me)
    token = res.json()["access_token"]
    me_durations = []
    for _ in range(10):
        t0 = time.perf_counter()
        r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        t1 = time.perf_counter()
        assert r.status_code == 200
        me_durations.append((t1 - t0) * 1000)
    print(f"[{'/api/auth/me token check':25s}] Avg: {sum(me_durations)/len(me_durations):.2f}ms")

if __name__ == "__main__":
    run_benchmarks()
