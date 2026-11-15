# BRANDTRACE AI — Enterprise REST API Reference 📡

> **Control Plane API Version:** `2.0.0`  
> **Base Path:** `/api`  
> **Interactive Swagger UI:** `/docs`  
> **OpenAPI JSON Specification:** `/openapi.json`

---

## 🔐 Authentication & Security

All authenticated endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <jwt_access_token>
```

### Roles Supported:
- `ADMIN`: Full organizational management, tenant configuration, and benchmark execution.
- `BRAND_MANAGER`: Brand guidelines, approved facts, and digital twin simulation commits.
- `CONTENT_CREATOR`: Submitting creative assets and remediating flagged copy.
- `REVIEWER`: Peer reviews and editorial annotations.
- `COMPLIANCE_REVIEWER`: Final cryptographic release approvals, task resolution, and revocation.

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/token`
Generates a JWT access token for an authenticated user.

**Request Body:**
```json
{
  "email": "sarah.chen@aurelle.com",
  "password": "correct_horse_battery_staple_2026"
}
```

**Response (`200 OK`):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "user_id": "USR-SARAH-01",
    "name": "Sarah Chen",
    "email": "sarah.chen@aurelle.com",
    "role": "ADMIN",
    "org_id": "ORG-AURELLE",
    "workspace_id": "aurelle-tech"
  }
}
```

---

## 2. Knowledge Base & Vector Search (`/api/knowledge-base`)

### `POST /api/knowledge-base/vector-search`
Executes MongoDB Atlas Vector Search (`$vectorSearch`) across approved facts and guidelines.

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

**Response (`200 OK`):**
```json
[
  {
    "node_id": "FACT-AUR-MAT-01",
    "label": "Chassis Composition: Grade 5 Titanium",
    "node_type": "APPROVED_FACT",
    "description": "Certified aerospace titanium chassis composition.",
    "score": 0.94,
    "org_id": "ORG-AURELLE",
    "workspace_id": "aurelle-tech"
  }
]
```

### `POST /api/knowledge-base/facts`
Registers a new approved commercial fact or specification in MongoDB Atlas.

**Request Body:**
```json
{
  "workspace_id": "aurelle-tech",
  "name": "Horizon Watch Flagship Price",
  "category": "PRICE",
  "current_value": "₹499",
  "unit": "direct purchase",
  "source_citation": "Executive Pricing Resolution #2026-Q1",
  "department_owner": "Pricing Operations"
}
```

---

## 3. Brand Knowledge Graph (`/api/graph-intelligence` & `/api/graph`)

### `GET /api/brands/{brand_id}/graph`
Returns nodes and edges formatted for React Flow canvas rendering.

### `POST /api/graph/traverse`
Executes depth-bounded DAG traversal from a specific root fact or guideline node.

**Request Body:**
```json
{
  "brand_id": "aurelle-tech",
  "root_node_id": "FACT-AUR-PRC-01",
  "max_depth": 5
}
```

**Response (`200 OK`):**
```json
{
  "root_node_id": "FACT-AUR-PRC-01",
  "brand_id": "aurelle-tech",
  "upstream_nodes": ["GL-AUR-01"],
  "downstream_assets": ["AST-AUR-AD-01", "AST-AUR-AD-02", "AST-AUR-SPEC-01"],
  "connected_campaigns": ["CAMP-AUR-Q4-01"],
  "evidence_citations": ["Executive Pricing Committee Resolution #2026-Q1-PRC"],
  "subgraph_node_ids": ["FACT-AUR-PRC-01", "AST-AUR-AD-01", "AST-AUR-AD-02", "AST-AUR-SPEC-01", "CAMP-AUR-Q4-01"]
}
```

---

## 4. Multi-Agent Asset Inspection (`/api/verify`)

### `POST /api/verify`
Runs the autonomous multi-agent pipeline (Voice, Claim, Regulatory, Blast) against draft copy.

**Request Body:**
```json
{
  "brand_id": "aurelle-tech",
  "content": "Aurelle Horizon Watch is 100% unbreakable and priced at ₹499.",
  "channel": "INSTAGRAM",
  "asset_title": "Summer Campaign Post"
}
```

**Response (`200 OK`):**
```json
{
  "verification_id": "VRF-71A2BC89",
  "brand_id": "aurelle-tech",
  "composite_risk_score": 78.5,
  "governance_decision": "REJECTED_GATED",
  "all_risk_spans": [
    {
      "start": 26,
      "end": 42,
      "text": "100% unbreakable",
      "severity": "CRITICAL",
      "rule_or_fact_id": "RULE-FTC-SUBSTANTIATION",
      "explanation": "Unsubstantiated absolute durability claim violates FTC Claim Substantiation Doctrine."
    }
  ],
  "remediated_content": "Aurelle Horizon Watch is engineered with Grade 5 Titanium for extreme durability and priced at ₹499."
}
```

---

## 5. Governance Digital Twin (`/api/simulator`)

### `POST /api/simulator/propose`
Runs a non-destructive simulation of a proposed brand fact or guideline mutation.

**Request Body:**
```json
{
  "brand_id": "aurelle-tech",
  "target_record_id": "FACT-AUR-PRC-01",
  "target_record_type": "PRICE",
  "record_label": "Aurelle Cloud Studio Subscription",
  "old_value": "₹499",
  "proposed_value": "₹599",
  "change_rationale": "Commercial indexing",
  "proposed_by": "Julian Vance"
}
```

**Response (`200 OK`):**
```json
{
  "simulation_id": "SIM-AUR-001",
  "status": "PROPOSED_PENDING_APPROVAL",
  "is_production_active": false,
  "policy_conflicts": [],
  "workload_estimate": {
    "total_estimated_hours": 3.8,
    "departments_involved": ["Marketing", "Legal", "Brand Governance"],
    "review_lead_time_days": 1.5
  },
  "before_after_score": {
    "baseline_compliance_score": 95.0,
    "unmitigated_post_change_score": 42.0,
    "projected_remediated_score": 98.5
  },
  "affected_touchpoints": [
    {
      "asset_id": "AST-AUR-AD-01",
      "asset_title": "Social Carousel Ad",
      "channel": "INSTAGRAM",
      "severity": "CRITICAL",
      "is_simulated": true,
      "simulated_status": "SIMULATED_PREVIEW_ONLY"
    }
  ]
}
```

### `POST /api/simulator/commit`
Commits a simulated proposal to active production after authorized human approval.

---

## 6. Audit & Trust Center (`/api/ledger`)

### `POST /api/ledger/verify-record`
Verifies an asset against the cryptographic SHA-256 release trust ledger across all 5 states.

**Request Body:**
```json
{
  "resource_id": "AST-AUR-01",
  "content": "Aurelle Horizon Watch. Masterful precision crafted in Grade 5 Aerospace Titanium.",
  "channel": "INSTAGRAM"
}
```

**Response (`200 OK`):**
```json
{
  "resource_id": "AST-AUR-01",
  "computed_sha256": "4b2cf60759021665a...",
  "recorded_sha256": "4b2cf60759021665a...",
  "verification_state": "VALID_UNCHANGED",
  "is_authentic": true,
  "verified_at": "2026-11-10T14:45:00Z",
  "block_index": 1,
  "signer": "David Sterling, Chief Governance Officer"
}
```
