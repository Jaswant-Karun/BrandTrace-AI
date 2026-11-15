# Implementation Plan — Plumbline-style Check-Post Results Redesign

**Scope:** Rewrite ONLY the JSX rendered when `hasChecked === true` (the `motion.div` wrapping the analysis results) in
`c:/Users/jaswant karun/BRANDTRACE AI/frontend/src/components/creator/CreatorCheckPost.tsx`.
Do NOT change imports, state declarations, handlers, logic, or anything above/outside that block. The file must still
type-check with `tsc --noEmit` (exit 0).

---

## A. Codebase findings (read before editing)

### A.1 Build / type-check commands (from `frontend/package.json` + `frontend/tsconfig.json`)
- Package manager: `pnpm@9.15.9` (root `package.json`). Frontend scripts: `dev` (`vite`), `build` (`tsc && vite build`), `preview`.
- **Type-check command (the verification gate):** from `c:/Users/jaswant karun/BRANDTRACE AI/frontend` run
  `npx tsc --noEmit` (equivalently `./node_modules/.bin/tsc --noEmit`). Must exit 0.
- `tsconfig.json` flags that bind this task: `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`,
  `"noEmit": true`, `"jsx": "react-jsx"`, `"include": ["src"]`.
  - **Consequence:** every existing `const` handler and `useState` value that is currently read ONLY inside the
    `hasChecked` block MUST remain referenced somewhere inside the rewritten block, or `tsc --noEmit` fails with
    `'X' is declared but its value is never read`. See A.8 for the full keep-using list. This drives several plan decisions.
- No test framework is configured for the frontend (no `test` script). Verification is the TypeScript compiler only.

### A.2 Existing imports (keep ALL; do NOT add packages or new import lines)
```ts
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Send, RefreshCw, Check, ArrowRight, X, ChevronDown, ChevronRight,
  AlertCircle, AlertTriangle, ShieldCheck, Eye, HelpCircle, Sparkles, Edit3,
  UploadCloud, Image as ImageIcon, Trash2
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
```
- The redesign must use ONLY these already-imported lucide icons (no `Lightbulb`/`Info` imports). Icon mapping decided below
  (A.9 / B.2) uses only the imported set.
- `SeverityType` and `FindingItem` are exported types declared in THIS file (already in scope inside the component).

### A.3 State variables (names + types) — DO NOT change any of these
Declared in the component body (do not add, remove, or retyped any):
- `activeWorkspaceId: string`, `activeBrandName: string`
- `draftContent: string`
- `channel: PostChannel`, `keyPhrases: string`, `callToAction: string`
- `isAccordionOpen: boolean`, `isChecking: boolean`, `hasChecked: boolean`
- `selectedFile: File | null`, `imagePreviewUrl: string | null`,
  `uploadedAsset: { file_id: string; filename: string; size_bytes: number } | null`,
  `inspectionReport: any`, `uploadProgress: number | null`
- `submissionStatus: string | null`, `analysisId: string | null`
- `isReviewModalOpen: boolean`, `reviewNote: string`, `privateVersionCount: number`, `selectedFindingId: string | null`
- `suggestedContent: string`, `isManualEditSuggested: boolean`, `suggestedRejected: boolean`
- `findings: FindingItem[]`

Derived (already computed in body, reuse as-is): `categoryCounts` (`{ blocking, major, minor, needsHuman, advisory }`,
each = count of NON-accepted findings of that severity), `verdict` (from `getVerdict()`).

### A.4 Handlers (signatures) — DO NOT change; reuse in the new buttons
- `handleAcceptFix(findingId: string): void` — applies one finding's `approvedText` into `draftContent`, sets `accepted: true`.
- `handleApplyFixesAndCheckAgain(): Promise<void>` — applies all open fixes, re-runs `/api/verify`.
- `handleAcceptSuggested(): void` — replaces draft with `suggestedContent`, marks all findings accepted.
- `handleSavePrivateVersion(): void` — saves a private version + audit event.
- `handleSubmitForReview(): Promise<void>` — POSTs to `/api/submissions` (used by the review modal's Confirm button).
- `handleHighlightClick(findingId: string): void` — sets `selectedFindingId` and scrolls element
  `id="finding-card-${findingId}"` into view (`scrollIntoView({ behavior:'smooth', block:'center' })`).
- `setIsReviewModalOpen(boolean)` — opens/closes the review modal (existing "Submit for Human Review" uses `true`).
- `setSuggestedContent`, `setIsManualEditSuggested`, `setSuggestedRejected`, `setSubmissionStatus` — existing setters.

### A.5 Findings data shape
```ts
export type SeverityType = 'BLOCKING' | 'MAJOR' | 'MINOR' | 'NEEDS_HUMAN' | 'ADVISORY';

export interface FindingItem {
  id: string;
  number: number;
  title: string;            // e.g. 'BLOCKS · VLM EVIDENCE'
  category: string;         // e.g. 'Clinical Evidence Substantiation · FACT-014'
  source: string;           // e.g. 'AI Agent: ClaimSubstantiationAgent', 'Rule Engine'
  ruleCitation: string;    // e.g. 'FACT-014 (Clinical Hydration & Barrier Benchmark)'
  rejectedText: string;     // the flagged phrase (the "bad" wording)
  approvedText: string;     // the suggested fix wording
  recommendation: string;   // the explanation
  severity: SeverityType;
  accepted?: boolean;      // true once the fix is applied
  startChar?: number; endChar?: number;  // only set for some backend findings
}
```
- Severity mapping to SPEC: `BLOCKING`→BLOCKING, `MAJOR`→MAJOR, `MINOR`→MINOR, `NEEDS_HUMAN`→NEEDS HUMAN EYES,
  `ADVISORY`→ADVISORY. **Exact 1:1 match** — no translation needed.
- Fields available per finding cover every SPEC card element except a true per-finding "dismiss"/"edit"/"remove" state
  (only `accepted` exists). See A.8/A.9 for how those buttons are wired.

### A.6 Exact boundaries of the block to replace (quote the coder's edit range)
The block is ONE JSX expression: `{hasChecked && ( <motion.div> ... </motion.div> )}`. Replace from the opening
conditional through its closing `)}`, and NOTHING else.

**First lines (opens at line 1049):**
```jsx
      {hasChecked && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 pt-4 border-t border-neutral-800"
        >
```
**Last lines (closes: `</motion.div>` at line 1516, `)}` at line 1517):**
```jsx
          </div>

        </motion.div>
      )}
```
**Immediately after the block (line 1518) — must remain untouched:**
```jsx
      {/* Submit for Review Modal */}
      {isReviewModalOpen && (
```
- Keep the `motion.div` wrapper and its `initial/animate/transition/className` props (the SPEC targets the inner layout;
  the entrance animation is fine to preserve). Everything INSIDE the `motion.div` is rewritten per Section B.

### A.7 Deriving counts from `findings` (reuse these exact expressions)
- Total blocking: `findings.filter((f) => f.severity === 'BLOCKING').length`
- Blocking handled (accepted): `findings.filter((f) => f.accepted && f.severity === 'BLOCKING').length`
- Per-severity OPEN counts: already in `categoryCounts` (`categoryCounts.blocking`, `.major`, `.minor`, `.needsHuman`, `.advisory`) —
  these count NON-accepted findings. Use these for the verdict heading, the summary line, the 5 stat cards, and the
  findings-sidebar section-header counts (so counts decrease as fixes are accepted — matches "N ISSUES BLOCK PUBLISHING").
- Verdict heading (when `categoryCounts.blocking > 0`):
  `` `${categoryCounts.blocking} ISSUE${categoryCounts.blocking === 1 ? '' : 'S'} BLOCK PUBLISHING` `` (rose-400).
  Otherwise use `verdict.title` (existing verdict object already returns the right title/color for the non-blocking cases).
- Verdict summary line (SPEC omits blocking because it is the heading):
  `` `${categoryCounts.major} major · ${categoryCounts.minor} minor · ${categoryCounts.needsHuman} needs human eyes · ${categoryCounts.advisory} advisory` ``
- "BLOCKING ISSUES HANDLED X/Y": `X` = blocking handled, `Y` = total blocking. Progress bar width:
  `totalBlocking ? (handledBlocking / totalBlocking) * 100 : 0`.
- "N MARKED" count (draft panel, top-right): use `findings.length` (total findings flagged). Flagged phrase underlines are
  rendered only for non-accepted, in-text findings (see B.3); the count is the stable total.
- "Submit for review (N blocking left)": `N = categoryCounts.blocking` (open blocking).

### A.8 Existing action-button wiring (the new buttons MUST reuse these — `noUnusedLocals` forces it)
The following are read ONLY inside the `hasChecked` block today, so the rewrite MUST keep referencing each of them
(or `tsc --noEmit` fails):
- `verdict`, `categoryCounts` → verdict card + stat cards.
- `findings`, `selectedFindingId`, `handleHighlightClick` → draft highlights + finding cards.
- `handleAcceptFix` → per-finding "Accept fix".
- `suggestedRejected` (value) → gate the suggested-version panel with `{!suggestedRejected && suggestedContent && (...)}`.
- `suggestedContent`, `isManualEditSuggested`, `setSuggestedContent`, `setIsManualEditSuggested` → suggested-version row
  (editable textarea when `isManualEditSuggested`) — keep the Edit Manually / Lock Edits toggle.
- `setSuggestedRejected` → "Reject Changes" button in the suggested panel.
- `handleAcceptSuggested` → "Accept Suggested Changes" button in the suggested panel.
- `handleSavePrivateVersion` → "Save Version (Private)" button in the bottom bar.
- `handleApplyFixesAndCheckAgain`, `isChecking` → "Apply my fixes and check again" button.
- `setIsReviewModalOpen` → "Submit for review" / per-finding "Ask a reviewer".
- `draftContent` → shown in the draft panel and in the suggested-panel original column.

### A.9 Decisions & gaps (SPEC vs. code) — the implementer follows these, no "or" left open
1. **Do NOT touch imports.** Use only already-imported icons. SPEC's "Advisory = lightbulb" and "Minor = blue info"
   are not imported → use the closest already-imported icons: Advisory → `HelpCircle` (gray), Minor → `ShieldCheck` (blue),
   Blocking → `AlertCircle` (red), Major → `AlertTriangle` (amber), Needs human eyes → `Eye` (purple). No new packages.
2. **Per-finding "Edit" has no real handler.** Closest faithful (no new state): an inline self-contained handler that
   focuses the draft `<textarea>` and selects the flagged phrase so the user can edit it manually:
   `const ta = document.querySelector<HTMLTextAreaElement>('textarea'); if (ta) { ta.focus(); const s = draftContent.indexOf(f.rejectedText); if (s !== -1 && !f.rejectedText.startsWith('[')) ta.setSelectionRange(s, s + f.rejectedText.length); }`.
   `document.querySelector('textarea')` returns the draft textarea first in DOM order (the review-modal textarea is added
   later in JSX). Reuses `draftContent`/`f.rejectedText`; adds no state. This mirrors the SPEC's allowance of a small
   self-contained inline handler for scroll/focus behaviors.
3. **Per-finding "Dismiss" has no real handler/state** (only `accepted` exists; adding a `dismissed` field would change the
   `FindingItem` interface, which is above the block — disallowed). Closest faithful: an inline handler calling the existing
   `setSubmissionStatus(...)` to acknowledge, e.g. `` setSubmissionStatus(`"${f.rejectedText}" dismissed — it will not be auto-fixed. Re-run Check to refresh.`) ``.
   This reuses an existing setter (the existing "Reject Changes" button already calls `setSubmissionStatus`), adds no state.
   Flag to reviewer: dismiss is acknowledged only, not persisted.
4. **"Remove this sentence." (in the SUGGESTED FIX box) has no handler.** Closest faithful: the same focus+select inline
   handler as "Edit" (selects the flagged phrase in the draft textarea, ready to delete). Flag: no destructive remove handler.
5. **"Ask a reviewer" (per-finding) → `setIsReviewModalOpen(true)`** (same as the existing "Submit for Human Review" button —
   opens the existing review modal; `handleSubmitForReview` runs from the modal's Confirm button).
6. **"Accept fix" → `handleAcceptFix(f.id)`** (unchanged).
7. **Suggested-version panel keeps its existing action buttons** (Accept Suggested Changes / Edit Manually / Reject Changes),
   restyled to the SPEC's dark + green-checklist aesthetic and placed below the left column (col-span-5). The SPEC describes
   this panel as informational only (checklist + suggested row); the buttons are RETAINED because `isManualEditSuggested`,
   `setIsManualEditSuggested`, `handleAcceptSuggested`, `setSuggestedRejected`, `suggestedRejected` are read only here and
   `tsc` (`noUnusedLocals`) would otherwise fail. This is a deliberate, tsc-driven deviation; flag it.
8. **Bottom action bar keeps "Save Version (Private)"** as a tertiary outline button (left of "Apply my fixes") for the same
   `noUnusedLocals` reason (`handleSavePrivateVersion` is read only here) and to preserve the existing save-private feature.
   SPEC's two primary buttons ("Apply my fixes and check again" outline-dark left, "Submit for review (N blocking left)"
   dark-filled right) are the prominent pair; "Save Version (Private)" is the extra tertiary outline button.
9. **Page background:** the outer page `bg` is set outside the block and must not be touched. The SPEC's dark/cream aesthetic
   is delivered inside the block via card backgrounds: verdict card `bg-[#17171a]`, finding cards `bg-[#18181b]`, suggested
   panel `bg-[#121214]`, draft panel cream `bg-[#f5f2eb]`. Flag: page-level dark bg is unchanged (already dark-themed).
10. **Severity colors (Tailwind) — single source of truth used everywhere (badges, underlines, dots, pills, text):**
    - BLOCKING → `rose-500` (badge `bg-rose-500`, underline `decoration-rose-500`, dot `bg-rose-500`, text `text-rose-500`)
    - MAJOR → `amber-500`
    - NEEDS_HUMAN → `purple-500`
    - MINOR → `blue-500`
    - ADVISORY → `neutral-400`
11. **Underlines are SOLID, not dotted** (SPEC). Use `underline decoration-solid decoration-2 underline-offset-2` plus the
    severity `decoration-*` color. (The existing code used `decoration-dotted` — change to solid.)
12. **Multiple adjacent badges before one phrase:** group matches that share the same `start` index (e.g. the same phrase
    flagged by two rules) and render ALL their number badges, then ONE underlined phrase. Distinct phrases render
    sequentially. See B.3.
13. **Sidebar shows only OPEN (non-accepted) findings**, grouped by severity; accepted/resolved findings drop out of the
    action list (their resolution is reflected in the "handled X/Y" progress and the updated draft). Section header counts
    use `categoryCounts` (open). Flag: the existing code showed accepted cards dimmed; we omit them for a clean action list.
14. **Findings sidebar grouping order:** `['BLOCKING','MAJOR','NEEDS_HUMAN','MINOR','ADVISORY']`; render a section only when
    its open count > 0. Section header: colored dot + label ("BLOCKING" / "MAJOR" / "NEEDS HUMAN EYES" / "MINOR" /
    "ADVISORY") + open count. Full-width separator (`border-t border-neutral-800`) between groups.

---

## B. Ordered implementation steps

> The `hasChecked` block is a single JSX expression. Steps 1–5 below are the sections of the replacement, implemented in
> ONE editing pass that replaces lines 1049–1517 (the `{hasChecked && ( ... )}` block). The project compiles only after the
> full block is structurally closed (i.e. after step 5). Step 6 is the verification gate. No file other than
> `CreatorCheckPost.tsx` is touched.

- [ ] 1. **Replace the `hasChecked` block — verdict card + 5 stat cards (top).**
      Inside the kept `motion.div` (keep its `initial/animate/transition/className`), render:
      (a) **THE VERDICT card** `rounded-2xl border border-neutral-800 bg-[#17171a]`: left side = "THE VERDICT" mono label,
      large heading colored rose-400 when `categoryCounts.blocking > 0` (text:
      `` `${categoryCounts.blocking} ISSUE${categoryCounts.blocking === 1 ? '' : 'S'} BLOCK PUBLISHING` ``) else `verdict.title`
      with `verdict`-derived color; summary line per A.7. Right side = "BLOCKING ISSUES HANDLED X/Y" (X/Y per A.7) with a rose
      progress bar (`bg-rose-500`) and helper text "Accept a fix, edit the words, or ask a reviewer about each one." A 1px
      bottom accent bar colored by `verdict.type` (rose/amber/emerald) as in the existing card.
      (b) **5 stat cards** `grid grid-cols-2 sm:grid-cols-5 gap-3`: Blocking (AlertCircle, rose), Major (AlertTriangle, amber),
      Minor (ShieldCheck, blue), Needs human eyes (Eye, purple), Advisory (HelpCircle, neutral). Each: icon + label, big
      number = `categoryCounts.<sev>`, sub-label per A.9.10/A.7. (Reuse existing per-card inline-class pattern; no new helpers.)
      Files: `c:/Users/jaswant karun/BRANDTRACE AI/frontend/src/components/creator/CreatorCheckPost.tsx`
      Verify: (after the whole block is closed in step 5) `npx tsc --noEmit` from the frontend dir → exit 0.

- [ ] 2. **Two-column grid — `grid grid-cols-1 lg:grid-cols-12 gap-6`.**
      Files: same file. Verify: `npx tsc --noEmit` → exit 0 (after block closed).

- [ ] 3. **LEFT column (`lg:col-span-5`): "YOUR DRAFT · AS CHECKED" panel.**
      Cream panel `rounded-2xl bg-[#f5f2eb] border border-neutral-300 p-5 text-neutral-900`. Header row: label
      "YOUR DRAFT · AS CHECKED" (left, mono uppercase) and "N MARKED" (right, `findings.length`) per A.7. Body: an IIFE
      (follow the existing draft-rendering IIFE pattern) that:
      - If `findings.length === 0` → render `<p>{draftContent}</p>`.
      - Else compute `activeFindings = findings.filter(f => !f.accepted && !f.rejectedText.startsWith('['Missing') && draftContent.includes(f.rejectedText))`.
      - If none active → `<p className="text-emerald-700 font-mono text-xs">All in-line findings resolved.</p>`.
      - Else build `matches = activeFindings.map(f => ({ start: draftContent.indexOf(f.rejectedText), end: start + len, finding: f }))`,
        sort by `start`, then **group consecutive matches with the same `start`** into one underlined span. For each group render
        ALL member number badges first (each a small circle `inline-flex h-5 min-w-5 rounded-full text-white font-mono text-[10px] font-bold`
        with `bg-<sev-500>` per A.9.10), then ONE underlined phrase span:
        `underline decoration-solid decoration-2 underline-offset-2 decoration-<sev-500> cursor-pointer text-neutral-900`
        (SOLID underline, severity-colored). Wire `onClick={() => handleHighlightClick(group[0].finding.id)}` and add the
        selected ring when `selectedFindingId === finding.id`. Plain (non-flagged) text slices render as plain black spans.
      Files: same file. Verify: `npx tsc --noEmit` → exit 0 (after block closed).

- [ ] 4. **RIGHT column (`lg:col-span-7`, with `lg:row-span-2` so it spans both grid rows on the right): findings sidebar.**
      Scroll container `space-y-4 max-h-[640px] overflow-y-auto pr-1`. Use an IIFE that defines a local severity config:
      `const SEV: Record<SeverityType, {label:string; dot:string; badge:string; underline:string; text:string; sub:string}>`
      and `const ORDER: SeverityType[] = ['BLOCKING','MAJOR','NEEDS_HUMAN','MINOR','ADVISORY']` (per A.9.10/A.9.14). Then:
      - `ORDER.map(sev => { const group = findings.filter(f => !f.accepted && f.severity === sev); if (!group.length) return null; ... })`
      - Section header: colored dot (`bg-<sev-500> w-2.5 h-2.5 rounded-full`) + label (BLOCKING / MAJOR / NEEDS HUMAN EYES /
        MINOR / ADVISORY) + `categoryCounts.<sev>` count. Full-width separator `border-t border-neutral-800` after the group.
      - Each finding card (`id={`finding-card-${f.id}`}` MUST stay for `handleHighlightClick` scroll): large number badge
        (severity `bg-<sev-500>`, white text) top-left; severity pill (`bg-<sev-600> text-white` uppercase) e.g. "BLOCKING";
        a right-aligned line `{f.category} | Checked by {f.source}` and a rule-citation chip `{f.ruleCitation}`
        (closest faithful to SPEC's "Mandatory claim | Checked by rule" + "CL-03 · FACT-009"); a light box
        `rounded-lg bg-neutral-100 text-neutral-900` showing `"${f.rejectedText}"`; explanation `f.recommendation` (small);
        an optional SOURCE block ("SOURCE" label + `f.source`) when `f.source` is present; an optional SUGGESTED FIX block
        ("SUGGESTED FIX" label + `f.approvedText`) with a "Remove this sentence." text action wired to the focus+select inline
        handler (A.9.4); an action row of 4 small outline buttons spaced: **Accept fix** → `handleAcceptFix(f.id)`,
        **Edit** → focus+select inline handler (A.9.2), **Dismiss** → `setSubmissionStatus(...)` inline handler (A.9.3),
        **Ask a reviewer** → `setIsReviewModalOpen(true)` (A.9.5). When `f.accepted`, render the card dimmed with a
        "Fix Applied to Draft" note (CheckCircle2) — though per A.9.13 accepted findings are filtered out of the sidebar, so
        this branch is effectively unused; keep a minimal guard so the card typechecks.
      Files: same file. Verify: `npx tsc --noEmit` → exit 0 (after block closed).

- [ ] 5. **Suggested-version panel (below left column, `lg:col-span-5`) + bottom action bar.**
      (a) **"DOES THE SUGGESTED VERSION KEEP YOUR MESSAGE?" panel** — wrap in `{!suggestedRejected && suggestedContent && ( ... )}`
      (keep this gate — `suggestedRejected` is read only here, A.8). Dark panel `rounded-2xl bg-[#121214] border border-neutral-800 p-6`.
      Header with `Sparkles` icon. A checklist of 5 green checkmarks (`Check` icon, `text-emerald-400`):
      "Call to action kept", "Pinned phrases kept", "No claim dropped silently", "Within the channel's length limit",
      "Edits stay inside flagged sentences". Then a "Suggested version (intent kept, no invented claims)" row showing
      `suggestedContent` (editable via the existing `isManualEditSuggested` toggle: when true, render the existing
      `<textarea value={suggestedContent} onChange={e=>setSuggestedContent(e.target.value)}>`; when false, the read-only
      suggested text). KEEP the existing action buttons restyled small: "Reject Changes" → `setSuggestedRejected(true)` +
      `setSubmissionStatus('Suggested changes discarded.')`; "Edit Manually / Lock Edits" → `setIsManualEditSuggested(!isManualEditSuggested)`;
      "Accept Suggested Changes" → `handleAcceptSuggested` (A.9.7).
      (b) **Bottom action bar** (full-width, after the grid, inside the `motion.div`): `pt-4 border-t border-neutral-800 flex ...`.
      Left group: "Save Version (Private)" (outline, `handleSavePrivateVersion`) + "Apply my fixes and check again"
      (outline dark, `handleApplyFixesAndCheckAgain`, disabled when `isChecking`, `RefreshCw` spinner). Right: "Submit for review
      (`${categoryCounts.blocking}` blocking left)" (dark filled, `Send` icon, `setIsReviewModalOpen(true)`) per A.9.8/A.7.
      Files: same file. Verify: `npx tsc --noEmit` → exit 0 (after block closed).

- [ ] 6. **Type-check gate — run the compiler and fix every error.**
      From `c:/Users/jaswant karun/BRANDTRACE AI/frontend` run `npx tsc --noEmit` (or `./node_modules/.bin/tsc --noEmit`).
      Expected: exit code 0, no output. Any `'X' is declared but its value is never read` error means a handler/state from A.8
      was dropped — re-wire it per A.8/A.9 (do NOT delete the declaration). Any other TS error (missing prop, wrong icon name,
      unclosed JSX) — fix in the block only. Do NOT change imports, state, handlers, or anything outside lines 1049–1517.
      Files: `c:/Users/jaswant karun/BRANDTRACE AI/frontend/src/components/creator/CreatorCheckPost.tsx`
      Verify: `npx tsc --noEmit` from `c:/Users/jaswant karun/BRANDTRACE AI/frontend` → exit code 0. (Optional smoke:
      `pnpm build` succeeds; `pnpm dev` renders the page without console errors.)

---

## C. Quick reference — severity → Tailwind classes (use everywhere)

| Severity | Badge/dot bg | Underline | Pill bg | Stat icon | Stat sub-label | Sidebar label |
|---|---|---|---|---|---|---|
| BLOCKING | `bg-rose-500` | `decoration-rose-500` | `bg-rose-600` | `AlertCircle` | Must be fixed before publishing | BLOCKING |
| MAJOR | `bg-amber-500` | `decoration-amber-500` | `bg-amber-600` | `AlertTriangle` | Should be fixed | MAJOR |
| NEEDS_HUMAN | `bg-purple-500` | `decoration-purple-500` | `bg-purple-600` | `Eye` | A person should decide | NEEDS HUMAN EYES |
| MINOR | `bg-blue-500` | `decoration-blue-500` | `bg-blue-600` | `ShieldCheck` | Worth fixing | MINOR |
| ADVISORY | `bg-neutral-400` | `decoration-neutral-400` | `bg-neutral-700` | `HelpCircle` | Suggestions; never block | ADVISORY |

Underline base classes (all severities): `underline decoration-solid decoration-2 underline-offset-2` + the severity `decoration-*`.
