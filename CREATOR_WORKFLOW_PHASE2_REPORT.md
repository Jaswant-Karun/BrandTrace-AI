# Creator Workflow Phase 2 Report

## Scope and safety boundary

This phase preserved the working Check a Post, My Submissions, Creator authentication, and review workflow implementations. No production data was deleted, no database reset was performed, and no deployment configuration was changed.

Repository state at validation: `main...origin/main`, with uncommitted Phase 2 changes. No commit, push, or deployment was performed.

## Before-and-after connectivity matrix

| Module | Before | Changes made | After | Evidence |
|---|---|---|---|---|
| Check a Post | PASS | Preserved | PASS | Existing Phase 1 targeted verification tests |
| My Submissions | PASS | Preserved | PASS | Existing Phase 1 creator workflow tests |
| Audit Log | PARTIAL | Added authenticated Creator filtering by `actor_id` and `org_id`; added action/resource/timestamp fields for new events; removed historical UI seed records | PARTIAL | Route and service inspection; targeted workflow tests pass. Legacy audit records without tenant metadata are intentionally not exposed to Creators |
| Rulebook | PARTIAL | Removed static rule merge and hardcoded metrics; loads persisted `/api/guidelines` records through the authenticated API client | PARTIAL | Frontend build passes; endpoint and response model inspected |
| Facts | NOT TESTED | No implementation added in Phase 2 | PARTIAL | Existing approved-facts source was identified but still required Phase 3 API/UI completion |
| Guideline Health | FAIL | Replaced hardcoded reviewer-health scores with persisted guideline counts and an explicit unavailable state for unsupported decision metrics | PARTIAL | Frontend build passes; `/api/guidelines` is the available source |
| Claim Watch | PARTIAL | Preserved honest unavailable state; no simulated scanner or fake findings added | BLOCKED | No Claim Watch collection, endpoint, evidence service, or persisted monitoring capability exists |
| Creator authentication | PASS | Preserved | PASS | Existing Phase 1 authentication and role tests |
| Review workflow | PASS | Preserved | PASS | Existing reviewer workflow regression tests |

## Files modified in Phase 2

- `backend/brandtrace/modules/submissions/models.py`
- `backend/brandtrace/modules/submissions/router.py`
- `backend/brandtrace/modules/submissions/service.py`
- `frontend/src/components/creator/CreatorAuditLog.tsx`
- `frontend/src/components/creator/CreatorRulebook.tsx`
- `frontend/src/components/creator/CreatorGuidelineHealth.tsx`

## Verified APIs and data sources

- `GET /api/audit/events` now requires the existing authenticated-user dependency. Creator requests are filtered by the authenticated `user_id` and `org_id`; non-Creator reviewer/admin workflows retain the existing organization-wide behavior.
- New submission audit events use the existing `audit_logs` store and include `actor_id`, `org_id`, `resource_id` (submission ID), `action_type`, and a millisecond timestamp.
- `GET /api/guidelines?brand_id=aurelle-tech` is the existing Rulebook and Guideline Health source.
- No separate FAQ source was found; the authoritative Creator knowledge source is the approved-facts catalog.
- No Claim Watch persistence or evidence-monitoring API was found. `/api/verify` provides content-analysis findings, but it is not a Claim Watch service and was not misrepresented as one.

## Fact and Claim Watch approval blockers

Completing the Fact interface required reusing the existing approved-facts source. Completing Claim Watch required persisted claim records/evidence relationships and a verification integration. Those changes were deferred to and authorized for Phase 3.

## Six backend test failure investigation

The full backend suite collected 288 tests and currently reports 282 passed and 6 failed:

1. `backend/tests/test_e2e_user_journey.py::test_e2e_complete_user_journey[trio]`
   - Task resolution returned HTTP 400 instead of 200.
   - The test selects the first existing task from shared in-memory/persistent state. The selected task is not resolvable by the supplied approval payload.
   - Classification: **PARTIAL / pre-existing test-state or fixture defect**. No Phase 2 code path is involved.

2. `backend/tests/test_phase5_e2e_verification.py::test_phase5_workflow_a_brand_knowledge_management[asyncio]`
3. `backend/tests/test_phase5_e2e_verification.py::test_phase5_security_tenant_isolation_and_rate_limits[asyncio]`
4. `backend/tests/test_phase5_e2e_verification.py::test_phase5_workflow_a_brand_knowledge_management[trio]`
5. `backend/tests/test_phase5_e2e_verification.py::test_phase5_security_tenant_isolation_and_rate_limits[trio]`
   - Requests returned HTTP 429 before the asserted document operations completed.
   - The failures are caused by shared rate-limit state across the full suite, including both AnyIO backends; the security test itself is intentionally exercising rate limiting.
   - Classification: **PARTIAL / test isolation and rate-limit fixture issue**. Assertions were not weakened.

6. `backend/tests/test_round3_end_to_end_workflow.py::test_round3_end_to_end_aurelle_workflow[trio]`
   - Creating the named warranty fact returned HTTP 409 Conflict because that fact already exists in the persistent test/application data.
   - Classification: **PARTIAL / persistent test-data collision**.

The reproduced subset after Phase 2 changes produced 12 passing and 2 failing tests, matching the task-resolution and duplicate-fact failures in that subset. The full suite remains 282 passed and 6 failed. No test was deleted or rewritten.

## Validation results

- Frontend production build: **PASS**
- `backend/tests/test_e2e_workflow_connectivity.py`: **PASS** (3 tests)
- `backend/tests/test_phase2_five_role_workflow.py`: **PASS** in the targeted run
- `python -m pytest backend/tests -q`: **PARTIAL** (282 passed, 6 failed)
- `git diff --check`: **PASS**
- Authenticated browser/database end-to-end Creator validation: **NOT TESTED**; no isolated test account/database environment was available in this session.

## Remaining issues

- Add isolated fixtures or resettable test state for the six existing full-suite failures; do not alter production data.
- Add backend-level tests for Creator audit tenant isolation and legacy audit records.
- Validate the authorized Fact and Claim Watch implementation in Phase 3.
- Reviewer decision-level data is not exposed by the current API, so Guideline Health cannot honestly calculate agreement, conflict, or Wilson-bound metrics.

## Final status

The core Creator submission and review workflow remains **PASS**. Phase 2 documented the Fact and Claim Watch gaps that Phase 3 was authorized to address; the full backend suite retained six pre-existing state/rate-limit/data-collision failures.
