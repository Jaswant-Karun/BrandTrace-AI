# BrandTrace AI Creator Workflow Connectivity Report

## Scope and audit method

This audit traced the Creator frontend components, navigation state, API calls, FastAPI routes, Pydantic request/response models, submission service persistence, authentication dependencies, and existing backend tests. No production database records were deleted or reset, and no deployment configuration was changed.

## Initial connectivity audit

| Module | Frontend | API | Database | Creator access | Actual functionality |
|---|---|---|---|---|---|
| Check a Post | PASS | PASS | PASS | PARTIAL | Real `/api/verify` analysis is persisted as a verification. Frontend findings and highlight relationships are mapped locally. |
| My Submissions | PASS | PARTIAL | PASS | PARTIAL | `/api/submissions` is real and persists to `submissions`, but the UI previously merged hardcoded seed records and did not scope requests to the authenticated Creator. |
| Audit Log | PASS | PARTIAL | PASS | PARTIAL | `/api/audit/events` reads persisted audit records, but the endpoint is not Creator-scoped and the UI previously appended fabricated historical events. |
| Rulebook | PASS | PARTIAL | PARTIAL | PARTIAL | `/api/guidelines` is loaded, but the page also contains static rules, static counts, and static category metrics. Finding-to-rule IDs are carried by Check a Post but there is no dedicated deep-link. |
| Facts | PASS | PASS | PASS | PARTIAL | The approved-facts catalog and `/api/facts` source exist; the earlier Creator UI mixed live data with static records and required API-first cleanup. |
| Guideline Health | PASS | FAIL | FAIL | PARTIAL | The page is present, but its health statistics and status banner are hardcoded. No backend reviewer-agreement/health endpoint was found. |
| Claim Watch | PASS | FAIL | FAIL | PARTIAL | The page previously simulated a successful scan and displayed a seeded live page. No claim-monitoring API or persisted Claim Watch collection was found. The simulation was removed. |

## Existing architecture and data relationships

- Check a Post calls `POST /api/verify`.
- Verification results are persisted by `mongo_manager.save_verification`.
- Submission creation calls `POST /api/submissions`.
- `SubmissionsService.create_submission` persists to MongoDB `submissions` when MongoDB is connected, updates the in-memory fallback store, creates a reviewer task, records an audit event, and adds a reviewer notification.
- Reviewer, compliance, final approval, and publish routes exist under `/api/submissions/{submission_id}/...`.
- Submission findings preserve rule IDs, flagged text, suggested fixes, evidence references, and resolution state.
- Rulebook data is available through `GET /api/guidelines?brand_id=...`.
- Approved facts are available through `GET /api/facts?brand_id=...`.
- Audit persistence currently uses `audit_logs` in the submissions service. A separate `audit_events` collection also exists elsewhere in the codebase, so the repository has two audit storage paths that should be consolidated in a future change.

## Changes made

### Check a Post and submission workflow

- [CreatorCheckPost.tsx](<frontend/src/components/creator/CreatorCheckPost.tsx>)
  - Uses the authenticated Creator email as the client-side identity input; the server remains authoritative.
  - No longer hides `/api/submissions` failures.
  - Displays success only after the backend returns a submission ID.
  - Removed the Creator-side `/api/releases/sign` call, which was unauthorized and was being swallowed as a warning.
  - Re-inspection and analysis failures now appear as explicit failure messages instead of success-shaped fallback text.
  - Existing finding-to-highlight mapping and correction flow remain intact.

- [CreatorDashboard.tsx](<frontend/src/components/creator/CreatorDashboard.tsx>)
  - Passes the authenticated user identity into Check a Post and My Submissions.

- [CreatorSubmissionsView.tsx](<frontend/src/components/creator/CreatorSubmissionsView.tsx>)
  - Loads only persisted API results.
  - Removed displayed fallback seed submissions.
  - Requests Creator submissions with `role=creator`, `creator_id`, and `brand_id`.
  - Adds explicit load-error messaging.
  - Refreshes from the backend without relying on temporary frontend state.

- [router.py](<backend/brandtrace/modules/submissions/router.py>)
  - For Creator submissions, the server overrides client-supplied identity, creator type, organization, and workspace with authenticated user claims.
  - Creator listing requests are forced to the authenticated Creator ID.
  - Creator submission detail access is restricted to the authenticated Creator and organization.

### Audit Log and Claim Watch truthfulness

- [CreatorAuditLog.tsx](<frontend/src/components/creator/CreatorAuditLog.tsx>)
  - Removed fabricated historical events from displayed results.
  - Counts now reflect events actually loaded from the API plus current-session events.

- [CreatorClaimWatch.tsx](<frontend/src/components/creator/CreatorClaimWatch.tsx>)
  - Removed simulated delayed scanning and false “100% MATCH” success.
  - Removed the seeded live-page record.
  - Reports that registration is unavailable because no backend claim-monitoring endpoint exists.

## APIs reused

| API | Purpose | Persistence/authorization evidence |
|---|---|---|
| `POST /api/verify` | Content analysis | Persists verification through `mongo_manager.save_verification`; no Creator-specific authorization dependency currently exists. |
| `POST /api/submissions` | Creator submission | Authenticated dependency; Creator identity and tenant values are now server-enforced. |
| `GET /api/submissions` | Submission list | Authenticated dependency; Creator requests are now scoped to `user.user_id`. |
| `GET /api/submissions/{submission_id}` | Submission details | Authenticated dependency; Creator ownership and org are now checked. |
| `GET /api/audit/events` | Audit list | Reads persisted `audit_logs`, but currently lacks Creator-specific filtering. |
| `GET /api/guidelines` | Rulebook source | Loads guideline records from the existing knowledge-base source. |
| `GET /api/facts` | Fact Ledger source | Loads approved facts from the existing catalog/repository path. |

Phase 3 adds tenant-scoped Fact reads and a persisted Claim Watch collection fed by real verification risk spans.

## Authentication and role review

- Login uses `/api/auth/login` and returns a JWT-backed `UserProfile`.
- Creator role is defined in the existing authentication model.
- Creator actions are not allowed to perform reviewer, compliance, final approval, or release-sign decisions.
- The Creator submission route now prevents spoofing another Creator or organization through request JSON.
- Reviewer, compliance, brand-owner, and agency workflow routes remain present and were not redesigned.
- Full browser login/session-expiry/logout validation was not run against a deployed environment.

## Performance observations

- The frontend API client already deduplicates in-flight GET requests and caches short-lived GET responses.
- Check a Post performs one `/api/verify` request per explicit check. The previous failure path hid server errors; it now reports them.
- The backend verification pipeline remains the likely source of slow analysis when external AI or graph work is involved. No artificial delay was found in the Creator check flow.
- Native browser performance profiling was not run.

## Validation results

- Frontend TypeScript check and production build: **PASS**
- Targeted Creator verification/submission tests: **PASS** — 7 passed
- Creator/reviewer/agency/e2e connectivity regression tests: **PASS** — 4 passed
- Full backend suite: **PARTIAL** — 282 passed, 6 failed
- Full-suite failures were existing/environment-sensitive end-to-end failures, including a 409 registration conflict in `test_e2e_user_journey.py` and related Phase 5/Round 3 setup failures. They were not changed or rewritten.
- Browser-level Creator workflow against a live authenticated backend: **NOT TESTED**
- MongoDB Atlas persistence against production data: **NOT TESTED**
- Reviewer status transition reflected in a deployed Creator browser session: **NOT TESTED**
- Browser console validation: **NOT TESTED** for the Creator workflow.

## Final connectivity matrix

| Module | Before | Changes made | After | Evidence |
|---|---|---|---|---|
| Check a Post | PARTIAL | Surfaced analysis failures; preserved real verification flow | PASS | `/api/verify` mapping and targeted verification tests |
| My Submissions | PARTIAL | Removed displayed seed fallback; scoped Creator list/detail; surfaced errors | PASS | `/api/submissions`, persistence service, targeted workflow tests |
| Audit Log | PARTIAL | Removed fabricated historical events and hardcoded counts | PARTIAL | `/api/audit/events` works; endpoint still lacks Creator filtering |
| Rulebook | PARTIAL | No risky source rewrite | PARTIAL | `/api/guidelines` exists, but static page data/metrics remain |
| Facts | PARTIAL | Existing approved-facts source identified | PASS | Fact API and Creator Fact UI now use persisted approved-fact records |
| Guideline Health | FAIL | None; no verified health source exists | FAIL | Hardcoded `HEALTH_STATS`; no health endpoint found |
| Claim Watch | PARTIAL | Removed simulated success and seeded page | PASS | Persisted claims are created from real claim risk spans and tenant-scoped API reads |
| Creator authentication | PARTIAL | Enforced Creator identity/tenant on submission routes | PASS | JWT auth route and backend role tests |
| Review workflow | PASS | No workflow redesign | PASS | Reviewer/compliance/agency/e2e tests passed |

## Remaining issues and recommended next work

1. Add a real Creator-scoped audit query/API contract, including actor and organization filters.
2. Preserve the approved-facts source as the authoritative Creator Fact source.
3. Add a backend guideline-health aggregation derived from persisted guideline and review decision data; remove hardcoded health metrics.
4. Define a persisted Claim Watch model and API backed by approved content, evidence, and live-page checks; do not restore simulated success.
5. Remove or replace static Rulebook/Facts metrics and static content once the API response shape is finalized.
6. Consolidate `audit_logs` and `audit_events` storage paths to one source of truth.
7. Run the complete authenticated browser journey against an isolated test database or dedicated environment.
