# BRANDTRACE AI — Round 3 Defect Register

**Project Identity:** BRANDTRACE AI — The Autonomous Brand Intelligence & Governance Control Plane  
**Team:** Storm Crackers (Jaswant Karun S A, Jaiwant Karrun S A)  
**Document Purpose:** Prioritized defect tracking, security validation, and remediation roadmap.  
**Audit Date:** November 14, 2026  

---

## 1. Classification Methodology

Defects and hardening items are prioritized into four standard enterprise tiers:

- **P0 (Critical):** Immediate security vulnerability, credential compromise, or irreversible data corruption/loss.
- **P1 (High):** Core governance workflow broken, cryptographic non-determinism, or permission bypass on sensitive actions.
- **P2 (Medium):** Usability friction, missing UI status disclosures, or deployment domain configuration discrepancies.
- **P3 (Low):** Minor cosmetic inconsistency, currency symbol formatting, or secondary UX polishing.

---

## 2. Re-Check of Previously Reported Phase 11 Defects

| Defect ID | Original Description | Re-check Audit Findings | Status |
| :--- | :--- | :--- | :---: |
| **DEF-01** | *Authentication must verify password hashes and reject unknown users with HTTP 401.* | In `backend/brandtrace/modules/auth/service.py:144-150`, `authenticate_user()` evaluates stored salted hashes using `verify_password(password, stored_hash)`. Unknown emails return `None`, causing `router.py:33` to raise `HTTP 401: Invalid credentials`. Verified by unit tests `test_auth_valid_registered_user_succeeds`, `test_auth_unknown_user_rejected_generic_401`, and `test_auth_valid_registered_user_incorrect_password_rejected`. | **VERIFIED FIXED & HARDENED** |
| **DEF-02** | *MongoDB update operations must not try to modify immutable `_id` fields.* | In `backend/brandtrace/database/repository.py:56-65`, `_split_doc_for_upsert()` separates mutable payload from immutable `_id`, passing `_id` exclusively inside `$setOnInsert`. Verified across all 4 repository upsert tests (`test_repo_add_approved_fact_immutable_id_preserved`, etc.) with zero `WriteError`. | **VERIFIED FIXED & HARDENED** |

---

## 3. Mandatory Governance & Architecture Verification Checks

| Check | Required Standard | Repository Implementation & Evidence | Audit Verdict |
| :--- | :--- | :--- | :---: |
| **1. In-Memory Fallback Guard** | Production must never silently fall back to in-memory storage. | In `backend/brandtrace/database/mongo.py:86-92`, if `settings.environment == "production"` and MongoDB Atlas connection fails, `connect()` raises a fatal `RuntimeError("Production startup failure: Unable to establish an authenticated connection to MongoDB Atlas...")` halting the process. | **COMPLIANT** |
| **2. Gemini Disclosures** | Gemini unavailability must be clearly disclosed. | When AI requests time out or fail, `safe_evaluate_with_fallback()` appends `[AI Timeout: Resilient Deterministic Engine engaged]` directly into the explanation report. | **COMPLIANT** |
| **3. Atlas Connection Honesty** | Remote Atlas connectivity must not be claimed unless actually tested. | In `backend/brandtrace/database/mongo.py:145-180`, `get_db_status()` returns `connected: true` only after executing live `list_collection_names()` and counting documents on the remote cluster. Returns `connected: false` if unreachable. | **COMPLIANT** |
| **4. Demo Credentials Integrity** | Demo credentials must use standard authentication pipeline. | Dedicated account `demo@brandtrace.ai` stores a standard salted hash `hash_password("DemoAurelle2026!")` in `PRESET_USERS`. Login requests verify this hash through the identical cryptographic path and issue a signed JWT. | **COMPLIANT** |
| **5. Server-Side RBAC Enforcement** | Protected actions must enforce server-side permissions. | Modular security router (`brandtrace/modules/security/router.py`) enforces strict RBAC dependencies (`require_role([UserRole.ADMIN])`, etc.). However, legacy route handlers in `routes/api.py` require hardening to bind directly to JWT `get_current_user`. | **PARTIAL (DEF-03 Logged)** |

---

## 4. Prioritized Active Defect Register

### P0: Critical Security & Data-Loss Issues

*No active P0 defects detected in the codebase.* All Phase 11 P0 defects (DEF-01, DEF-02) have been verified remediated and covered by automated regression tests.

---

### P1: Core Workflow & Integrity Hardening

#### DEF-03: Server-Side JWT & RBAC Binding on Legacy Approval & Commit Endpoints

- **Severity:** P1 (High)
- **Component:** `backend/brandtrace/routes/api.py` (`/releases/sign`, `/tasks/{task_id}/resolve`, `/simulator/commit`)
- **Issue:** These three endpoints receive `reviewer_name` or `authorized_reviewer` inside the request body without injecting the FastAPI dependency `user: UserProfile = Depends(get_current_user)`. While `modules/approvals/router.py` checks role strings and `modules/security/router.py` has role checks, an unauthenticated client could call `/api/tasks/{task_id}/resolve` directly.
- **Remediation:** Update route signatures in `api.py` to declare `current_user: UserProfile = Depends(get_current_user)` and reject non-reviewer roles with HTTP 403.
- **Risk / Effort:** Low / 1.5 hours.

#### DEF-04: Non-Deterministic Python `hash()` Used in Legacy `/api/releases/sign`

- **Severity:** P1 (High)
- **Component:** `backend/brandtrace/routes/api.py:182`
- **Issue:** In `sign_release`, the audit stamp is calculated as:  
  `BT-SEAL-{hash(req.content + req.reviewer + str(t0)) % 100000000:08X}`  
  Python's built-in `hash()` function is salted per-process (`PYTHONHASHSEED`), meaning the hash is non-deterministic across server restarts. In contrast, `audit_ledger_engine.record_release()` in `backend/brandtrace/engine/audit_ledger.py` computes true cryptographic SHA-256 chained digests.
- **Remediation:** Refactor `/api/releases/sign` to delegate directly to `audit_ledger_engine.record_release()`, ensuring all releases are stamped with immutable SHA-256 Merkle-style block digests.
- **Risk / Effort:** Low / 1.0 hour.

#### DEF-05: Simulation Commit Task Persistence to MongoDB Atlas

- **Severity:** P1 (High)
- **Component:** `backend/brandtrace/routes/api.py:607-621`
- **Issue:** When a brand manager commits a simulation via `POST /api/simulator/commit`, the engine creates `RevisionTask` objects in memory. If the backend process restarts before tasks are fetched, the tasks must persist in the MongoDB Atlas collection `revision_tasks`.
- **Remediation:** In `commit_change_simulation`, iterate over `report.generated_tasks` and call `await mongo_manager.save_task(t.model_dump())` to guarantee persistence in Atlas.
- **Risk / Effort:** Low / 1.0 hour.

---

### P2: Important Usability & Integration Issues

#### DEF-06: Production Frontend Domain Deployment Verification

- **Severity:** P2 (Medium)
- **Component:** Vercel Hosting / `vercel.json`
- **Issue:** The designated production domain `https://brandtrace-ai.vercel.app` returns `404 Not Found DEPLOYMENT_NOT_FOUND` because the Vercel project needs to be triggered from the team's Vercel account. The Render backend is 100% live and operational at `https://brandtrace-backend.onrender.com/health`.
- **Remediation:** Trigger deployment in Vercel dashboard or via Vercel CLI linking to the repository root with `pnpm build`.
- **Risk / Effort:** Low / 0.5 hours.

#### DEF-07: Telemetry Badge for AI Provider State in UI Header

- **Severity:** P2 (Medium)
- **Component:** `frontend/src/components/AuthHeader.tsx`
- **Issue:** When the platform runs in deterministic offline/fallback mode (if `GEMINI_API_KEY` is not present), the inspection engine functions perfectly and notes the fallback in the text, but the top header does not display an active "AI Mode: Gemini 1.5" vs "AI Mode: Deterministic Engine" status badge.
- **Remediation:** Query `/health` on load and display an informative green/amber pill in `AuthHeader.tsx`.
- **Risk / Effort:** Low / 1.0 hour.

#### DEF-08: Workspace Switching Context Synchronization

- **Severity:** P2 (Medium)
- **Component:** `frontend/src/App.tsx` & `AuthContext.tsx`
- **Issue:** When switching brand workspaces between Aurelle, Apex, and Novus via the header dropdown, the UI updates local state, but does not update the JWT token claims if the user is registered under a different organization.
- **Remediation:** Add a workspace-switch endpoint `/api/auth/switch-workspace` that re-issues a scoped JWT token for the selected workspace.
- **Risk / Effort:** Medium / 1.5 hours.

---

### P3: Cosmetic & Minor Issues

#### DEF-09: Financial Liability Currency Symbol Localization

- **Severity:** P3 (Low)
- **Component:** `frontend/src/components/BlastRadiusSimulator.tsx`
- **Issue:** The Digital Twin displays subscription prices in Indian Rupees (`₹499` / `₹599`) while projecting liability in US Dollars (`$320,000`).
- **Remediation:** Provide a simple currency toggle (`₹` / `$`) or display both (`$320,000 / ₹2.65 Cr`).
- **Risk / Effort:** Low / 0.5 hours.

#### DEF-10: Cold-Start User Notification for Render Free Tier

- **Severity:** P3 (Low)
- **Component:** `frontend/src/components/LoginPage.tsx`
- **Issue:** If the Render free tier backend has spun down due to 15 minutes of inactivity, the very first login request takes ~30 seconds to wake the service.
- **Remediation:** Add a gentle UI helper text on the login button: *"Waking cloud instance from standby... (takes ~25s on first request)"* if a request exceeds 3 seconds.
- **Risk / Effort:** Low / 0.5 hours.

---

## 5. Defect Summary & Resolution Schedule

| Defect ID | Priority | Description | Target Phase |
| :--- | :---: | :--- | :--- |
| **DEF-03** | **P1** | Server-side JWT & RBAC binding on `/releases/sign` and `/tasks/{task_id}/resolve` | Roadmap Phase 2 |
| **DEF-04** | **P1** | Replace non-deterministic Python `hash()` with SHA-256 Merkle ledger | Roadmap Phase 1 (Commitment 3) |
| **DEF-05** | **P1** | Systematic MongoDB Atlas persistence for simulation revision tasks | Roadmap Phase 1 (Commitment 1) |
| **DEF-06** | **P2** | Vercel production frontend deployment trigger | Roadmap Phase 3 |
| **DEF-07** | **P2** | AI provider status badge in UI header | Roadmap Phase 3 |
| **DEF-08** | **P2** | Workspace switching JWT token refresh | Roadmap Phase 2 |
| **DEF-09** | **P3** | Currency symbol toggle in Blast Radius Simulator | Roadmap Phase 4 |
| **DEF-10** | **P3** | Cold-start UI notification in Login screen | Roadmap Phase 4 |
