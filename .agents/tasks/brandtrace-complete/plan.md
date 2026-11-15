# BrandTrace AI — Complete Product Implementation Plan

> Goal: make the existing BrandTrace AI app a fully connected, production-quality brand content
> auditing & governance platform. **Order: ship working end-to-end connectivity first** ("do it fast").
> This plan preserves existing backend identity/roles, DB/collections/repository architecture,
> models/APIs, and the light-first BrandTrace visual identity. Small controlled changes; no full rewrites.
> No auto-commit / auto-push / auto-deploy. Work directly in the repo (no worktree). Leave changes uncommitted for `git diff` review.

---

## 0. Investigation summary (grounded in code actually read)

### What already works — PRESERVE
- **Backend**: FastAPI app `backend/brandtrace/main.py` mounts legacy `routes/api.py` + modular routers
  (`modules/auth`, `organizations`, `knowledge_base`, `graph_intelligence`, `content`, `approvals`,
  `demo`, `security`, `public_verification`, `submissions`). MongoDB Atlas via Motor with **in-memory fallback**
  (dev only; disabled in production). Indexes auto-build on connect (`mongo_manager.connect()` →
  `ensure_indexes()` + `build_phase5_indexes()`), so **no DB migration is required** (additive, non-destructive).
- **Auth/RBAC** (`modules/auth/models.py`, `service.py`): 5 roles `ADMIN/BRAND_MANAGER/CREATOR/REVIEWER/COMPLIANCE_REVIEWER`.
  **Agency = CREATOR with agency identity** (`sana@aurelle.com` "Agency Sana"; submission `creator_type="agency"`).
  Preset users with known passwords (`brandtrace2026`, demo `DemoAurelle2026!`). JWT HS256, PBKDF2 password hashing.
- **Submissions/workflow** (`modules/submissions/`): `/api/drafts` (+versions), `/api/submissions`,
  `/api/submissions/queue`, `/api/submissions/{id}/agency-review|review|compliance|final-approval`,
  `/api/audit/events`, `/api/audit/record`, `/api/notifications`. **Mandatory gating**: `record_final_approval`
  raises `ValueError` if Reviewer + Compliance stages aren't COMPLETED. Final approval computes real
  SHA-256 `release_digest`, stores `release_ledger` + `release_records`, calls `audit_ledger_engine.record_release`,
  persists audit events to `audit_logs`. `link_claims_to_submission` wires Claim Watch to submissions.
- **File storage** (`engine/storage_provider.py`): **EXISTS** — bytes to `./storage/assets/<org_id>/`,
  SHA-256 integrity, metadata in Mongo `file_storage_meta`; `/api/content/upload|files|files/{id}/download`.
  **Reuse; do not replace.**
- **Audit engine** (`agents/pipeline.py`, `routes/api.py` `/api/verify`): 3 agents (Voice/Claim/Regulatory) +
  `_analyze_aurelle_specifics` + dynamic user-document grounding + AI-provider grounding; builds
  `sentence_findings` (BLOCKING/MAJOR/MINOR/NEEDS_HUMAN/ADVISORY) with rule/Fact citations. Persists
  `verifications` + `claims` (status CONTRADICTED/UNSUPPORTED/NEEDS_HUMAN_REVIEW) with real Fact-ID extraction.
- **Multimodal** (`engine/multimodal.py`): PIL color/contrast + dimensions + WCAG alt-text finding for images.
- **Public verification** (`modules/public_verification`): zero-auth seal/text/image verify.
- **Frontend wiring (real, not mock)**: `CreatorCheckPost.tsx` → `/api/content/upload` (image bytes+preview+progress),
  `/api/verify` (parses `sentence_findings`+`all_risk_spans`), `/api/submissions` (submit with `attachment_ids`,
  `inspection_report`, `extracted_text`). `CreatorSubmissionsView.tsx` → `/api/submissions?creator_id=…`.
  `RoleDashboardStage.tsx` → `/api/submissions/queue?role=…` + per-role decision endpoints.
  `CreatorAuditLog`→`/api/audit/events`; `CreatorClaimWatch`→`/api/claims`; `CreatorFactsLedger`→`/api/facts`;
  `CreatorRulebook`/`CreatorGuidelineHealth`→`/api/guidelines`. Vite proxies `/api`→`localhost:8000`.
  Light-first UI (`bg-white`/dark navy/blue-cyan) — matches spec visual identity.

### What is missing/broken — FIX (small, controlled)
- **A. Fake-queue leak**: `submissions/service.py` seeds in-memory `_SEED_SUBMISSION_*` and `list_submissions`
  falls back to them when the **connected** DB returns an empty list (`if docs: return docs` — empty is falsy).
  Result: demo seed submissions appear as if real when DB is connected but empty. **Fix: when connected,
  return the DB result even if empty; use in-memory seeds ONLY when disconnected.** Same for `get_submission`.
- **B. Dead localStorage service**: `frontend/src/services/submissionService.ts` stores submissions in
  `localStorage` (`brandtrace_content_submissions`) with `SEED_SUBMISSIONS`. **No component imports it**
  (verified) — it is dead code and a "localStorage is source of truth" hazard. **Remove it.**
- **C. Audit engine not driven by persisted truth**: `/api/verify` builds the BKG from `BRAND_SEEDS`
  (seed_data.py) + dynamic user-document grounding; it does **not** load the persisted `approved_facts` /
  `brand_guidelines` / `terminology` collections at verify time. So user-created facts/guidelines via the UI
  are not enforced, and findings rely on seed-configured brands. **Additive fix (not a rewrite):** add a
  persisted-truth grounding pass that loads `approved_facts` (restricted_terms/required_phrases/current_value/
  expiry), `brand_guidelines`, and `terminology` for the workspace from MongoDB and runs deterministic checks
  (prohibited/required phrases, value/price contradictions, expired facts, required disclaimers, terminology
  casing), emitting findings that cite the **real persisted Fact/guideline IDs**. Existing seed-based checks
  remain; nothing that works today breaks.
- **D. Image audit not merged into submission audit**: `/api/verify` is text-only; image findings from
  `/api/content/upload` (multimodal) are stored on the submission (`inspection_report`/`extracted_text`) but
  are not merged into the unified audit report shown alongside text findings, and the Stage 5 caption-vs-image
  contradiction check is absent. **Fix: when a submission has an image attachment, merge the multimodal
  `inspection_report.findings` into the submission's findings/audit view, and add a caption-vs-image
  contradiction check where image text is available.** **OCR is genuinely missing** (`pytesseract` not in
  `requirements.txt`; `multimodal.analyze_image_bytes` does color/contrast/alt-text only). **Safe default: do
  NOT fabricate OCR.** Image text extraction is honestly labeled "OCR not configured — visual checks only"
  where no text is extractable. Optional OCR upgrade (add `pytesseract`+Tesseract binary) is **proposed in the
  final report** for user approval (not built now; see Open Points).
- **E. Responsive/mobile**: prior report claims 320–1440 tested, but per the spec's honesty rule this must be
  **actually verified and fixed** across all five workspaces (nav/drawer, tables→cards, image preview,
  review/approval actions, dialogs/forms, no horizontal overflow). Targeted fixes only.
- **F. Final report**: `BRANDTRACE_COMPLETE_PRODUCT_IMPLEMENTATION_REPORT.md` with 24 sections + honest verdicts.

### Open Points — discovered state + safe default (do NOT silently assume; surfaced in final report)
1. **Agency stage configured/required + routing policy**: Agency is OPTIONAL, modeled as CREATOR with
   `creator_type="agency"`. `create_submission` always inserts an `AGENCY_APPROVAL` step; for a direct
   (non-agency) creator it is left ACTIVE but the reviewer queue returns `PENDING_REVIEW` submissions and
   `record_reviewer_decision` acts on any `PENDING_REVIEW` — so **direct creators route straight to Reviewer;
   Agency is an optional pre-gate**. Safe default: keep agency optional; do not force it for direct creators.
2. **Secure file storage**: **EXISTS** (`CloudStorageProvider`: local disk + Mongo `file_storage_meta`,
   env `STORAGE_LOCAL_DIR=./storage/assets`). **Reuse; no new storage integration needed; no pause.**
3. **OCR/vision**: **GENUINELY MISSING** (no `pytesseract`; multimodal does color/contrast/alt-text only).
   Safe default: real visual checks + honest "OCR not configured" labeling; never fabricate OCR/evidence.
   Proposed upgrade (add `pytesseract` + Tesseract system binary; wire into `analyze_image_bytes`) documented
   in the final report for user approval. **No pause** — surfacing in the report is explicitly allowed and the
   safe default builds nothing new.
4. **Production DB migration/indexes**: **NOT required** — indexes auto-build on connect (additive,
   non-destructive). Do not reset DB / drop collections / insert fake production data.
5. **Isolated test accounts/data**: **AVAILABLE locally** via `PRESET_USERS` + in-memory fallback (dev mode)
   with known passwords. The TEST 1-6 journey runs locally in dev/in-memory mode. Production-Atlas live tests
   are **BLOCKED** without production DB creds (and we will not touch production data); mark those BLOCKED.

---

## 1. Ordered implementation plan (connectivity first)

Organized into 4 sequential features. Each leaves the repo buildable. Verification uses real commands:
- Backend tests: `cd backend; .\.venv\Scripts\python -m pytest tests/ -v` (in-memory fallback; no Mongo needed).
- Backend run: `cd backend; .\.venv\Scripts\python run.py` (port 8000; dev/in-memory works without `MONGODB_URI`).
- Frontend build: `cd frontend; pnpm install; pnpm build` (`tsc && vite build`).
- Frontend dev: `cd frontend; pnpm dev` (5173; proxies `/api`→`localhost:8000`).

### FEAT-001 — Backend audit & workflow correctness + connectivity fixes
- [ ] 1. **Fix fake-queue leak** in `backend/brandtrace/modules/submissions/service.py`.
      In `list_submissions` and `get_submission`: when `mongo_manager.is_connected`, return the MongoDB
      result (even if empty) and do **not** fall back to `_SUBMISSIONS_STORE`/seed data. In-memory
      `_SEED_SUBMISSION_*` remain available only when DB is **disconnected** (offline dev fallback).
      Files: `backend/brandtrace/modules/submissions/service.py`
      Verify: `pytest tests/test_phase2_five_role_workflow.py tests/test_phase5_reviewer_workflow.py tests/test_phase6_compliance_workflow.py tests/test_phase7_brand_owner_release.py -v` pass; with a connected empty DB the queue returns `[]` not seeds.
- [ ] 2. **Remove dead localStorage submission service**.
      Delete `frontend/src/services/submissionService.ts` (no imports exist). Confirm no TS compile breaks.
      Files: `frontend/src/services/submissionService.ts` (delete)
      Verify: `cd frontend; pnpm build` — 0 errors.
- [ ] 3. **Add persisted-truth grounding to the audit engine** (additive).
      In `agents/pipeline.py`, add a helper that loads persisted `approved_facts`, `brand_guidelines`,
      and `terminology` for the workspace/org from MongoDB (`mongo_manager`) and runs deterministic checks
      against `request.content`: prohibited/restricted terms, required phrases/disclaimers, value & price
      contradictions (match `₹/$/€<n>` / numeric claims against `approved_facts.current_value`), expired
      facts (claim cites a fact past `expiry_date`), terminology casing/symbols. Emit `RiskSpan`s citing
      the **real persisted** `fact_id`/`guideline_id`/`term_id`. Merge into `all_spans` (dedupe by char span).
      Preserve all existing seed-based + dynamic-document + AI-provider checks. Only add; do not remove.
      Files: `backend/brandtrace/agents/pipeline.py`; read `backend/brandtrace/database/mongo.py`
      (`list`/`find` patterns) + `data/seed_data.py` for field names.
      Verify: `pytest tests/test_commitment2_multi_agent_pipeline.py tests/test_phase3_intelligence_validation.py tests/test_governance.py -v` pass; new unit test asserts a user-created persisted fact produces a finding citing that fact_id.
- [ ] 4. **Wire image inspection into the submission audit + honest OCR labeling**.
      In `modules/submissions/router.py`/`service.py` `create_submission`: when `attachment_ids` present,
      fetch each file's `inspection_report` (from `file_storage_meta`/stored report) and merge its
      `findings` into the submission's audit view (category `Visual/Multimodal`), and store `extracted_text`.
      Add a caption-vs-image contradiction check only where image text is extractable; where OCR is not
      configured, emit an honest `ADVISORY` finding: "Image text extraction (OCR) not configured — visual
      checks only; image text not verified." Never fabricate OCR text or evidence.
      Files: `backend/brandtrace/modules/submissions/service.py`, `modules/submissions/router.py`
      Verify: `pytest tests/test_phase4_all_features_connectivity.py tests/test_e2e_workflow_connectivity.py -v` pass; new test creates a submission with an image attachment and asserts merged findings + honest OCR advisory present.
- [ ] 5. **Add backend tests** for the new behavior (persisted-truth grounding, image-in-submission, connected-empty-queue).
      Files: `backend/tests/test_persisted_truth_and_image_audit.py` (new)
      Verify: `pytest tests/test_persisted_truth_and_image_audit.py -v` passes; full `pytest tests/ -v` still green.

### FEAT-002 — Frontend end-to-end connectivity & five-role workspaces (verify + fix against real backend)
- [ ] 6. **Verify/fix Creator "Check a Post"** (`components/creator/CreatorCheckPost.tsx`): image upload
      (bytes→`/api/content/upload`, preview/size/progress/remove/replace, PNG/JPG/JPEG/WebP ≤25MB), audit
      (`/api/verify` → `sentence_findings`+`all_risk_spans`), fix flow (highlight/reject/accept/manual
      edit/re-audit/before-after), submit (`/api/submissions` with `attachment_ids`+`inspection_report`+
      `extracted_text`). Remove the hardcoded `"by 60% in just 2 weeks"` fallback findings block (keep only
      real backend findings). Ensure combined caption+image audit shows merged findings.
      Files: `frontend/src/components/creator/CreatorCheckPost.tsx`
      Verify: `pnpm build` 0 errors; manual run against local backend — upload image+caption, audit shows
      real findings, fix + re-audit works, submit creates a persisted submission.
- [ ] 7. **Verify/fix "My Submissions"** (`components/creator/CreatorSubmissionsView.tsx`): loads real
      `/api/submissions?creator_id=…` (already does); confirm filters (All/Drafts/Submitted/Under review/
      Changes requested/Approved/Rejected/Released), search, sort, pagination, image preview, detail nav,
      refresh keeps data. Map backend statuses (`PENDING_REVIEW/REVIEW_APPROVED/COMPLIANCE_APPROVED/
      CHANGES_REQUESTED/RETURNED_TO_CREATOR/RETURNED_TO_AGENCY/RELEASED/REJECTED`) to the UI filters.
      Files: `frontend/src/components/creator/CreatorSubmissionsView.tsx`, `ReviewDetailView.tsx`
      Verify: `pnpm build`; manual — create a submission, see it immediately, refresh keeps it.
- [ ] 8. **Verify/fix Reviewer / Compliance / Brand-Owner / Agency workspaces**
      (`components/creator/RoleDashboardStage.tsx`): real queues (`/api/submissions/queue?role=…`),
      submission detail (original+revised content, image preview, extracted text, findings+evidence,
      approval history, prior comments), decisions (`/review|compliance|final-approval|agency-review`),
      finding-level uphold/overrule with reasons, comments. **Remove any fake queue records** (none in
      `RoleDashboardStage`; ensure it never falls back to local mock data). Confirm Brand Owner cannot
      approve before Reviewer+Compliance (backend already enforces; surface the backend error clearly).
      Files: `frontend/src/components/creator/RoleDashboardStage.tsx`
      Verify: `pnpm build`; manual — login as meera@aurelle.com (reviewer), approve → arjun (compliance)
      approve → kabir (brand owner) release; verify SHA-256 digest + seal appear; verify release in
      `/api/releases`.
- [ ] 9. **Verify/fix the 7 Creator modules** connect to real backend data:
      Audit Log (`/api/audit/events`), Rulebook (`/api/guidelines`), Fact (`/api/facts` — keep name "Fact"),
      Guideline Health (`/api/guidelines`+findings), Claim Watch (`/api/claims` with evidence-backed status).
      Confirm no static/mock fallbacks render when the backend is reachable.
      Files: `components/creator/CreatorAuditLog.tsx`, `CreatorRulebook.tsx`, `CreatorFactsLedger.tsx`,
      `CreatorGuidelineHealth.tsx`, `CreatorClaimWatch.tsx`
      Verify: `pnpm build`; manual — each module loads persisted records after running an audit/submit.

### FEAT-003 — Responsive/mobile (320–1440) + security hardening
- [ ] 10. **Responsive pass across all five workspaces** at 320/360/375/390/430/768/1024/1280/1440:
      mobile nav/drawer, single-column card layouts, responsive tables→cards, full-width buttons,
      touch targets ≥44px, scrollable review queues, responsive image preview + audit findings,
      no horizontal overflow (`overflow-x-hidden`), no clipped dialogs/forms, accessible labels.
      Files: `frontend/src/components/creator/*`, `components/ui/*`, `tailwind.config.js` (breakpoints)
      Verify: `pnpm build`; manual browser DevTools at each breakpoint across Creator + the 4 role dashboards.
- [ ] 11. **Security hardening (verify, fix gaps)**: all mutations go through `apiClient` (JWT Bearer),
      server-side RBAC on every decision endpoint (already in routers — verify none were loosened),
      tenant isolation (404 cross-tenant), upload validation (`validate_file_upload`: ≤25MB, extension
      whitelist, magic bytes), no frontend-only role checks for mutations, 401 session-expiry handling.
      Files: `backend/brandtrace/modules/submissions/router.py`, `modules/content/router.py`,
      `core/security.py`; `frontend/src/services/apiClient.ts`
      Verify: `pytest tests/test_phase7_security_reliability.py tests/test_phase9_comprehensive_security_reliability.py tests/test_round3_reliability_security.py -v` pass.

### FEAT-004 — Verification journey + final report
- [ ] 12. **Run TEST 1–6 journey locally** (Creator create/upload/audit/fix/submit → Reviewer → Compliance
      → Brand Owner release+seal → public verify) using preset users in dev/in-memory mode. If production
      Atlas creds are unavailable, run against local/in-memory and mark production-live checks **BLOCKED**
      with the reason. Do not insert fake production data or touch production DB.
      Verify: end-to-end succeeds locally; record actual results (never invent).
- [ ] 13. **Produce the final report** `BRANDTRACE_COMPLETE_PRODUCT_IMPLEMENTATION_REPORT.md` at repo root
      with the 24 sections from the spec. Use ONLY verdicts **PASS** (tested+verified) / **FAIL** (tested,
      failed) / **BLOCKED** (could not test — dependency/access) / **NOT TESTED**. Never invent results,
      metrics, accuracy, or deployment status. Surface all Open Points with discovered state + safe default
      + the proposed OCR upgrade for approval.
      Files: `BRANDTRACE_COMPLETE_PRODUCT_IMPLEMENTATION_REPORT.md` (new, repo root)
      Verify: report exists, 24 sections present, every item has an honest verdict, Open Points surfaced.

---

## 2. Requirements coverage (each requirement mapped to a step)
- Req 1 (Creator create text+image, upload UI): steps 6, 10.
- Req 2 (real 6-stage audit engine): steps 3 (Stage 2/3 persisted truth), 4 (Stage 1/5 image+OCR labeling),
  existing pipeline (Stages 1/4/6). Findings link to real rule/Fact IDs; uncertain→labeled not confirmed.
- Req 3 (fix in-workspace): step 6 (CreatorCheckPost fix/re-audit/before-after, save original+revised).
- Req 4 (My Submissions, filters/search/sort/pagination): step 7.
- Req 5 (end-to-end approval workflow, one persisted lifecycle, backend-validated transitions, audit
  events, release+seal): already implemented in `submissions/service.py`; verified steps 8, 12.
- Req 6 (Agency workspace): step 8 (RoleDashboardStage role=agency + `/agency-review`).
- Req 7 (Reviewer workspace, remove fake queues): steps 1, 8.
- Req 8 (Compliance workspace): step 8.
- Req 9 (Brand Owner workspace, no autonomous high-risk approval): steps 8, 12 (human-gated final approval).
- Req 10 (7 Creator modules connected): step 9.
- Req 11 (DB/backend persistence, reuse storage): reuse existing (storage, collections); step 1 fixes leak.
- Req 12 (API integration): existing endpoints reused; steps 3–4 enhance verify/submission; no fake responses.
- Req 13 (audit evidence + trust, SHA-256, no false crypto claims): existing `audit_ledger` +
  `release_digest` (SHA-256); honest "tamper-evident digest" labeling preserved; OCR→no authenticity claim.
- Req 14 (professional responsive UI incl. mobile): step 10.
- Req 15 (security/reliability): step 11.

## 3. Deliverable + verdict vocabulary
- Working, connected code in the existing repo (uncommitted); new/modified tests passing.
- `BRANDTRACE_COMPLETE_PRODUCT_IMPLEMENTATION_REPORT.md` at repo root, 24 sections, verdicts
  PASS / FAIL / BLOCKED / NOT TESTED only. No invented results.
- No auto-commit / auto-push / auto-deploy; no DB reset; no fake production data; tenant isolation intact.

## Digest (per file the plan touches)
- `backend/brandtrace/modules/submissions/service.py`
  - `list_submissions()` (~L620-700): change connected-empty fallback to return `[]`; seeds only when disconnected.
  - `get_submission()` (~L600-620): same connected-vs-disconnected rule.
  - `create_submission()` (~L560-600): merge image `inspection_report.findings` + `extracted_text` into submission; honest OCR advisory when no OCR.
  - Tests covering: `test_phase2_five_role_workflow.py`, `test_phase5_reviewer_workflow.py`, `test_phase6_compliance_workflow.py`, `test_phase7_brand_owner_release.py`; new `test_persisted_truth_and_image_audit.py`.
  - Verified today: workflow decision logic + mandatory gating + SHA-256 release + audit events present (read in full).
- `backend/brandtrace/agents/pipeline.py`
  - `AutonomousGovernancePipeline.verify_asset()` (~L780-900): add persisted-truth grounding pass before scoring; dedupe spans.
  - New `_load_persisted_truth(content, org_id, workspace_id)` helper.
  - Tests: `test_commitment2_multi_agent_pipeline.py`, `test_phase3_intelligence_validation.py`, `test_governance.py`; new persisted-truth test.
  - Verified today: 3 agents + `_analyze_aurelle_specifics` + dynamic doc grounding + `sentence_findings` builder present (read in full).
- `backend/brandtrace/modules/submissions/router.py` — no signature changes; ensure `create_submission` passes `attachment_ids`/`inspection_report`/`extracted_text` through (already in `SubmissionCreateRequest`). Verify tenant ownership of attachments (already checked).
- `frontend/src/services/submissionService.ts` — DELETE (no imports; verified).
- `frontend/src/components/creator/CreatorCheckPost.tsx`
  - `executeAnalysis()` (~L346-470): remove hardcoded `"by 60% in just 2 weeks"` fallback findings; keep real backend findings only.
  - `uploadAsset()` (~L325-344): already posts bytes to `/api/content/upload`.
  - submit (~L600-650): already posts `/api/submissions` with attachment+inspection+extracted_text.
  - Responsive: image preview + findings layout for mobile (step 10).
- `frontend/src/components/creator/CreatorSubmissionsView.tsx` — confirm status→filter mapping; image preview; pagination. Already calls `/api/submissions`.
- `frontend/src/components/creator/RoleDashboardStage.tsx` — already calls real queue+decision endpoints; verify image preview/evidence display + mobile (steps 8, 10).
- `frontend/src/components/creator/{CreatorAuditLog,CreatorRulebook,CreatorFactsLedger,CreatorGuidelineHealth,CreatorClaimWatch}.tsx` — already call real endpoints; verify no mock fallback (step 9).
- `frontend/src/components/ui/*` + `tailwind.config.js` — responsive breakpoints/touch targets (step 10).
- Build/test commands (verified from `TESTING.md`, `package.json`, `vite.config.ts`): backend `.\.venv\Scripts\python -m pytest tests/ -v`; frontend `pnpm build`; local e2e via `python run.py` (:8000) + `pnpm dev` (:5173, proxy `/api`).
