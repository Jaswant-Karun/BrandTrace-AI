# BRANDTRACE AI — Enterprise API Reference 📡

> **Control Plane API Version:** `2.0.0`  
> **Base URL:** `https://brandtrace-backend.onrender.com`  
> **Interactive Swagger UI:** `https://brandtrace-backend.onrender.com/docs`  
> **OpenAPI JSON:** `https://brandtrace-backend.onrender.com/openapi.json`

---

## 1. System Health & Infrastructure

### `GET /health`

Returns live system operational telemetry, MongoDB Atlas connection state, and active agents.

**Response (`200 OK`):**

```json
{
  "status": "operational",
  "service": "BRANDTRACE AI Governance Engine",
  "version": "2.0.0",
  "database": {
    "connected": true,
    "engine": "MongoDB Atlas (Async Motor Driver)",
    "database": "brandtrace_admin",
    "collections": { ... },
    "vector_search_ready": true
  },
  "active_agents": 4,
  "tenant_isolation": "ORGANIZATION_STRICT"
}
```

---

## 2. Authentication & Personas (`/api/auth`)

All authenticated endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <jwt_access_token>
```

### Supported Roles & Scopes

- `ADMIN`: Full organizational management, tenant configuration, and benchmark execution.
- `BRAND_MANAGER`: Brand guidelines, approved facts, and digital twin simulation commits.
- `CREATOR`: Submitting creative assets and remediating flagged copy.
- `REVIEWER`: Editorial review, annotations, and preliminary approvals.
- `COMPLIANCE_REVIEWER`: Regulatory sign-off, clinical validation, and cryptographic release authorization.

### `POST /api/auth/login`

Authenticates a user via email and password, returning an access JWT and user profile.

**Request Body:**

```json
{
  "email": "demo@brandtrace.ai",
  "password": "DemoAurelle2026!"
}
```

**Response (`200 OK`):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "USR-DEMO-01",
    "email": "demo@brandtrace.ai",
    "name": "Alex Mercer (Demo Governance Lead)",
    "role": "BRAND_MANAGER",
    "org_id": "ORG-AURELLE",
    "workspace_id": "aurelle-tech"
  }
}
```

### `GET /api/auth/me`

Returns current authenticated user details extracted from the JWT token. Requires `Authorization: Bearer <token>`.

### `GET /api/auth/personas`

Lists available demonstration personas across different RBAC roles (`ADMIN`, `BRAND_MANAGER`, `CREATOR`, `REVIEWER`, `COMPLIANCE_REVIEWER`).

---

## 3. Brand Knowledge Base & Facts (`/api/facts`)

### `GET /api/facts`

Lists approved brand facts. Filterable by query parameter `brand_id` (e.g. `?brand_id=aurelle-tech`).

### `POST /api/facts`

Registers a new approved fact with server-side validation and persistence into MongoDB Atlas and in-memory cache.

**Request Body:**

```json
{
  "brand_id": "aurelle-tech",
  "name": "Cloud Studio Pro Tier Annual Rate",
  "category": "PRICE",
  "current_value": "₹5,499/year",
  "source_citation": "Aurelle Commercial Price Sheet Rev 4.1",
  "department_owner": "Commercial Finance Committee",
  "evidence_reference": "DOC-FIN-2026-004",
  "source_date": "2026-01-15",
  "expiry_date": "2026-12-31"
}
```

### `GET /api/facts/{fact_id}`

Retrieves a specific approved fact by ID. Returns `404 Not Found` if the identifier does not exist.

### `PUT /api/facts/{fact_id}`

Updates an approved fact with server-side input validation and historical lineage tracking.

### `POST /api/facts/mutate`

Initiates a brand fact mutation, calculating cross-departmental impact, identifying affected content assets, and generating revision tasks. Enforces server-side RBAC (requires `BRAND_MANAGER` or `ADMIN`).

### `POST /api/knowledge-base/vector-search`

Executes MongoDB Atlas Vector Search (`$vectorSearch`) across approved facts and guidelines using 768-dimensional embeddings.

**Request Body:**

```json
{
  "query_text": "titanium durability warranty",
  "org_id": "ORG-AURELLE",
  "workspace_id": "aurelle-tech",
  "limit": 5,
  "min_score": 0.10
}
```

### `GET /api/brands/{brand_id}/graph`

Returns all graph nodes and semantic dependency edges formatted for interactive Directed Canvas visualization.

### `POST /api/graph/traverse`

Executes depth-bounded DAG traversal from a specific root fact or guideline node to trace upstream dependencies and downstream blast radius.

**Request Body:**

```json
{
  "brand_id": "aurelle-tech",
  "root_node_id": "FACT-AUR-PRC-01",
  "max_depth": 5
}
```

---

## 4. Multi-Agent Content Inspection (`/api/verify`)

### `POST /api/verify`

Executes the Autonomous Multi-Agent Governance Pipeline on marketing content. Evaluates Voice & Persona, Claim Substantiation, and Regulatory Compliance.

**Request Body:**

```json
{
  "brand_id": "aurelle-tech",
  "channel": "Instagram / Meta Feed Ads",
  "content": "Scale your creative workflows with Aurelle Cloud Studio. Spatial audio mastering starting at just ₹499/month.",
  "asset_title": "Q1 Promo Copy"
}
```

**Response (`200 OK`):**

```json
{
  "verification_id": "VRF-98234-A7B2",
  "brand_id": "aurelle-tech",
  "channel": "Instagram / Meta Feed Ads",
  "raw_content": "Scale your creative workflows...",
  "composite_risk_score": 0.0,
  "governance_decision": "APPROVED_FOR_RELEASE",
  "agent_reports": {
    "voice_persona": { "risk_score": 0.0, "status": "COMPLIANT" },
    "claim_substantiation": { "risk_score": 0.0, "status": "VERIFIED" },
    "regulatory_compliance": { "risk_score": 0.0, "status": "COMPLIANT" }
  },
  "all_risk_spans": [],
  "remediated_content": "Scale your creative workflows...",
  "remediation_rationale": "Content fully complies with approved commercial parameters.",
  "release_proof": {
    "proof_id": "PRF-18732-C4",
    "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "timestamp_iso": "2026-11-14T08:15:00Z"
  }
}
```

---

## 5. Change Impact Simulator & Digital Twin (`/api/simulator`)

### `POST /api/simulator/propose`

Non-destructive Digital Twin simulation. Evaluates blast radius, affected touchpoints, and policy contradictions before committing changes.

**Request Body:**

```json
{
  "brand_id": "aurelle-tech",
  "target_record_id": "FACT-AUR-PRC-01",
  "target_record_type": "PRICE",
  "record_label": "Aurelle Cloud Studio Subscription",
  "old_value": "₹499",
  "proposed_value": "₹599",
  "change_rationale": "Commercial tier revision Q1",
  "proposed_by": "Alex Mercer (VP Brand Governance)"
}
```

### `POST /api/simulator/commit`

Formally activates the proposed change in the live knowledge graph. Generates revision tasks and persists state. Requires `BRAND_MANAGER` or `ADMIN` role.

---

## 6. Human Approval Center (`/api/tasks`)

### `GET /api/tasks`

Lists pending and historical revision tasks. Filterable by `brand_id`.

### `POST /api/tasks/{task_id}/resolve`

Resolves or approves a revision task with human-in-the-loop sign-off.

**Request Body:**

```json
{
  "reviewer_name": "Alex Mercer (Brand Manager)",
  "decision": "APPROVED",
  "final_content": "Scale your creative workflows with Aurelle Cloud Studio starting at ₹599/month.",
  "resolution_notes": "Commercial master update to ₹599 verified and sealed."
}
```

---

## 7. Trust Ledger & Cryptographic Verification (`/api/ledger` & `/api/releases`)

### `GET /api/releases`

Lists immutable releases from MongoDB Atlas release ledger.

### `POST /api/releases/sign`

Signs an approved asset into the cryptographic release ledger with a deterministic SHA-256 seal. Enforces RBAC.

### `POST /api/ledger/verify-record`

Validates content authenticity against the immutable audit ledger.

**Request Body:**

```json
{
  "identifier": "AST-AUR-01",
  "content_to_test": "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included."
}
```

**Response (`200 OK`):**

```json
{
  "state": "VALID_UNCHANGED",
  "is_authentic": true,
  "record_id": "REL-AUR-9812",
  "content_id": "AST-AUR-01",
  "approved_version": "v2.0",
  "sealed_by": "Alex Mercer (Brand Manager)",
  "sealed_timestamp": "2026-11-14T08:20:00Z"
}
```

---

## 8. Demo Lifecycle & Reset (`/api/demo`)

### `GET /api/demo/scenario-status`

Returns current step in the 12-step enterprise lifecycle demonstration.

### `POST /api/demo/execute-step`

Executes a discrete step in the demonstration sequence (1 to 12).

### `POST /api/demo/reset`

Restores the AURELLE demonstration workspace to pristine factory state without affecting production settings. Requires `BRAND_MANAGER` or `ADMIN` role.

---

## 9. Creator Submissions & 5-Stage Governance Workflow (`/api/submissions`)

### `GET /api/submissions`

Retrieves workspace submissions filtered by current workflow status (`stage`), brand ID, or assigned reviewer.

- Query parameters: `brand_id`, `stage` (e.g. `PENDING_AGENCY`, `PENDING_REVIEW`, `PENDING_COMPLIANCE`, `PENDING_FINAL_APPROVAL`, `APPROVED_RELEASED`, `REVISION_REQUESTED`), `assigned_to`.

### `POST /api/submissions`

Persists a new content submission with full audit findings, image references, and version snapshot.

**Request Body:**

```json
{
  "brand_id": "aurelle-tech",
  "title": "Diwali Festive Glow Campaign",
  "content": "Subject: Your Diwali glow, sorted...",
  "channel": "email",
  "content_version": 1,
  "audit_report": { ... },
  "risk_findings": [ ... ],
  "image_file_id": "img-014-sha256",
  "requires_agency": false
}
```

### `POST /api/submissions/{submission_id}/decision`

Records an authenticated, role-verified decision across Agency, Reviewer, Compliance Reviewer, or Brand Owner.

**Request Body:**

```json
{
  "decision": "APPROVE",
  "stage": "REVIEWER",
  "comments": "Claim facts verified against FACT-014. Editorial compliance confirmed.",
  "requested_evidence": null
}
```

### `POST /api/submissions/{submission_id}/revisions`

Submits a corrected content revision following feedback or re-audit. Increments version counter, logs word diff, and re-triggers validation checks.

---

## 10. Content & Multimodal Asset Ingestion (`/api/content`)

### `POST /api/content/upload`

Uploads and processes image assets (PNG, JPEG, WebP) up to 25 MB. Performs magic byte signature validation, EXIF stripping, OCR text extraction, visual claim detection, and packaging disclaimer inspection.

- Multipart Form: `file` (image binary), `caption` (optional marketing text), `workspace_id`.
- Returns: `file_metadata` (file_id, dimensions, sha256_hash, storage_path) and `inspection_report` (extracted_text_preview, packaging_claims, findings).

---

## 11. Public Trust & Verification Portal (`/api/public`)

### `POST /api/public/verify-seal`

Unauthenticated public portal endpoint for consumers, journalists, and compliance bodies to cryptographically verify live marketing assets against the immutable audit ledger.

- Verifies SHA-256 release hash, detects post-approval tampering, and returns release certificate status (`VALID_UNCHANGED`, `MODIFIED_AFTER_APPROVAL`, `SUPERSEDED`, `REVOKED`, `UNKNOWN_RECORD`).

