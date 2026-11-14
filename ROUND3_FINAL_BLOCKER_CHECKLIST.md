# BRANDTRACE AI — Round 3 Final Blocker Checklist 📋

> **Audited Target:** [https://brand-trace-ai-dun.vercel.app/](https://brand-trace-ai-dun.vercel.app/)  
> **Backend Engine:** [https://brandtrace-backend.onrender.com](https://brandtrace-backend.onrender.com)  
> **Evaluation Mode:** Pre-judging release-readiness filter  
> **Status:** **ZERO CRITICAL (P0) BLOCKERS DETECTED**

---

## 1. Blocker Severity Matrix

| Severity Level | Definition | Active Count | Impact on Judging |
|:---:|---|:---:|---|
| **P0 (Critical)** | Application crash, broken login, disconnected database, failed workflow | **0** | None |
| **P1 (High)** | Core commitment failure, missing key route, unhandled exception | **0** | None |
| **P2 (Medium)** | Visual glitch, confusing UX text, delayed loading indicator | **0** | None |
| **P3 (Low / Operational)** | Cloud PaaS cold start latency, burst rate limit thresholds | **2** | Manageable via pre-judging warmup |

---

## 2. Active Operational Watchlist (P3 Items)

### Item 1: Render Cloud Container Cold-Start Latency
- **Technical Observation:** Render free-tier web services automatically enter sleep mode after 15 minutes of zero traffic. If an external judge opens the application after an idle window, the initial API call (`/api/auth/login` or `/api/brands`) may experience a 30–45 second delay while the Uvicorn container spins up.
- **Judge Impact:** A first-time evaluator might assume the service is non-responsive if they click during container boot.
- **Recommended Team Action:** Send a warm-up ping to `https://brandtrace-backend.onrender.com/health` 5–10 minutes prior to judge evaluation or presentation.

### Item 2: In-Memory Sliding Rate Limiter Quota (120 req/min)
- **Technical Observation:** The backend enforces a default sliding window rate limiter of 120 requests per minute per IP address.
- **Judge Impact:** Normal interactive judge walkthroughs generate 10–25 requests per minute (well within quota). However, an automated external testing script sending 150+ rapid calls without test headers will trigger an HTTP 429 `RATE_LIMITED` response.
- **Recommended Team Action:** Ensure evaluators test interactively via the UI or pass the custom header `X-Test-Rate-Limit: 10000` if running rapid headless benchmark scripts.

---

## 3. Pre-Judging Readiness Protocol

Prior to handing the application over to external evaluators:

1. [x] **Live Frontend Check:** Confirm `https://brand-trace-ai-dun.vercel.app/` returns HTTP 200 OK.
2. [x] **PWA Assets Check:** Confirm `https://brand-trace-ai-dun.vercel.app/sw.js` returns HTTP 200 OK (3,166 bytes).
3. [x] **Web Manifest Check:** Confirm `https://brand-trace-ai-dun.vercel.app/manifest.webmanifest` returns HTTP 200 OK.
4. [x] **Backend Health Check:** Confirm `https://brandtrace-backend.onrender.com/health` reports `status: "operational"`, 4 active agents, and MongoDB Atlas connected.
5. [x] **Demo Login Check:** Confirm `demo@brandtrace.ai` / `DemoAurelle2026!` signs in to `aurelle-tech` in under 1 second.
6. [x] **Multi-Agent Pipeline Check:** Confirm clean copy returns `APPROVED_FOR_RELEASE` and medical claim returns `REJECTED_GATED`.
7. [x] **Digital Twin Check:** Confirm ₹499 &rarr; ₹599 mutation preview projects 4 touchpoints and preserves original price before approval.
8. [x] **Audit Ledger Check:** Confirm release verification returns `VALID_UNCHANGED`.
9. [x] **Zero Code Changes:** Stop and preserve all working code, database records, and production deployments.

---

## 4. Final Sign-Off

The live deployment at **https://brand-trace-ai-dun.vercel.app/** meets all production quality, security, and usability criteria for Round 3 hackathon evaluation.

