# BRANDTRACE AI — MongoDB Atlas Database Architecture & Schemas 🗄️

> **Primary Database:** MongoDB Atlas 7.0+ (M0 / Dedicated Cluster)  
> **Driver:** Motor (Async Python Driver) + PyMongo  
> **Vector Engine:** MongoDB Atlas Vector Search (`$vectorSearch`, 768 dimensions)  
> **Database Name:** `brandtrace_admin`

---

## 1. Architectural Principles

1. **MongoDB Atlas as the Sole Source of Truth:**
   - 100% of persistent data is modeled and stored in MongoDB Atlas collections.
   - Zero foreign database dependencies (no PostgreSQL, SQLite, or Redis).
2. **Multi-Tenant Organization Partitioning:**
   - Every collection strictly enforces tenant isolation using `organisation_id` (`ORG-AURELLE`, `ORG-APEX`) and `workspace_id`.
   - Cross-tenant queries are blocked at both database query and application middleware levels.
3. **Resilient Memory Fallback:**
   - The application boots seamlessly even if cloud database connectivity is temporarily interrupted or during offline development, providing deterministic mock caches while logging clear telemetry.

---

## 2. Complete Inventory of the 27 BSON Collections

| # | Collection Name | Domain Role | Primary Keys & References |
|---|---|---|---|
| 1 | `organisations` | Enterprise tenant root entities | `organisation_id` (PK), `slug` |
| 2 | `brand_workspaces` | Brand portfolios within an organization | `workspace_id` (PK), `organisation_id` (FK) |
| 3 | `users` | User credentials, roles, profile metadata | `user_id` (PK), `email` (unique), `organisation_id` |
| 4 | `workspace_memberships` | User-to-workspace authorization mappings | `user_id`, `workspace_id`, `role` |
| 5 | `roles_permissions` | RBAC permission matrix for roles | `role` (PK), `permissions` array |
| 6 | `brand_guidelines` | Canonical brand rules and policies | `guideline_id` (PK), `organisation_id`, `category` |
| 7 | `guideline_versions` | Historical immutable guideline revisions | `guideline_id`, `version_number` |
| 8 | `approved_facts` | Approved commercial truth-set (prices, specs) | `fact_id` (PK), `workspace_id`, `category` |
| 9 | `fact_sources` | Evidentiary legal citations, whitepapers, SLA docs | `source_id` (PK), `fact_id` (FK) |
| 10 | `terminology` | Prohibited, restricted, and required terms | `term_id` (PK), `workspace_id`, `term_type` |
| 11 | `brand_assets` | Logos, color palettes, visual brand tokens | `asset_id` (PK), `workspace_id`, `asset_type` |
| 12 | `campaigns` | Marketing campaigns & omnichannel flights | `campaign_id` (PK), `workspace_id`, `status` |
| 13 | `content_assets` | Ingested marketing copy, advertisements, collateral | `asset_id` (PK), `workspace_id`, `campaign_id` |
| 14 | `content_versions` | Content revision history and diff snapshots | `asset_id`, `version_number` |
| 15 | `graph_nodes` | Ontological BDIG knowledge nodes | `node_id` (PK), `workspace_id`, `node_type` |
| 16 | `graph_relationships` | Directed dependency edges connecting graph nodes | `source_id`, `target_id`, `relation_type` |
| 17 | `knowledge_nodes` | High-dimensional semantic knowledge chunks | `node_id` (PK), `embedding` (768-dim vector) |
| 18 | `inspection_jobs` | Ingestion & multimodal processing tasks | `job_id` (PK), `workspace_id`, `status` |
| 19 | `inspection_findings` | Granular token-level violation findings | `finding_id` (PK), `job_id`, `severity` |
| 20 | `evidence_references` | Proof citations linking findings to facts | `reference_id` (PK), `finding_id`, `fact_id` |
| 21 | `suggested_corrections` | Autonomous graph-preserving rewrites | `correction_id` (PK), `finding_id` |
| 22 | `revision_tasks` | Reviewer queues & sign-off tasks | `task_id` (PK), `workspace_id`, `status` |
| 23 | `comments` | Threaded annotations on findings & assets | `comment_id` (PK), `task_id`, `author_id` |
| 24 | `release_ledger` | Immutable release audit ledger with SHA-256 seals | `release_id` (PK), `asset_id`, `content_hash` |
| 25 | `change_simulations` | Digital Twin proposed policy mutations | `simulation_id` (PK), `workspace_id`, `status` |
| 26 | `impact_reports` | Blast radius reports & workload estimates | `report_id` (PK), `simulation_id` |
| 27 | `audit_events` | Immutable chronological governance log | `event_id` (PK), `organisation_id`, `timestamp` |

---

## 3. Key Schema Definitions (Pydantic / BSON)

### `approved_facts`
```json
{
  "_id": "fact_FACT-AUR-PRC-01",
  "fact_id": "FACT-AUR-PRC-01",
  "organisation_id": "ORG-AURELLE",
  "workspace_id": "aurelle-tech",
  "name": "Aurelle Cloud Studio Subscription",
  "category": "PRICE",
  "current_value": "₹499",
  "unit": "per month",
  "description": "Standard monthly subscription tier for spatial audio production",
  "source_citation": "Aurelle Commercial Price Sheet Rev 4.1",
  "department_owner": "Commercial Finance Committee",
  "source_date": "2026-01-01",
  "expiry_date": "2026-12-31",
  "evidence_reference": "DOC-FIN-2026-004",
  "restricted_terms": ["free tier", "unlimited beta", "complimentary"],
  "required_phrases": ["starting at ₹499/month"],
  "last_verified": "2026-11-14T08:00:00Z",
  "created_at": 1763107200,
  "updated_at": 1763107200
}
```

### `release_ledger`
```json
{
  "_id": "rel_BT-REL-91823",
  "release_id": "BT-REL-91823",
  "verification_id": "VRF-AUR-TEST-01",
  "brand_id": "aurelle-tech",
  "asset_id": "AST-AUR-01",
  "asset_title": "Aurelle Spatial Audio Commercial",
  "channel": "Instagram / Meta Feed Ads",
  "content": "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month.",
  "content_hash": "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  "approved_version": "v2.0",
  "reviewer": "Alex Mercer (Brand Manager)",
  "reviewer_role": "BRAND_MANAGER",
  "decision": "APPROVED",
  "timestamp": 1763108400,
  "timestamp_iso": "2026-11-14T08:20:00Z",
  "audit_stamp": "BT-REL-91823-SEAL-OK",
  "tamper_evident_seal": "BT-REL-91823-SEAL-OK",
  "is_revoked": false
}
```

### `change_simulations`
```json
{
  "_id": "sim_SIM-2026-001",
  "simulation_id": "SIM-2026-001",
  "brand_id": "aurelle-tech",
  "target_record_id": "FACT-AUR-PRC-01",
  "target_record_type": "PRICE",
  "record_label": "Aurelle Cloud Studio Subscription",
  "old_value": "₹499",
  "proposed_value": "₹599",
  "overall_risk_score": 87.5,
  "affected_touchpoints": [
    {
      "node_id": "AST-AUR-01",
      "label": "Spatial Audio Ad - Meta",
      "type": "ASSET",
      "risk_level": "CRITICAL"
    }
  ],
  "policy_conflicts": [
    {
      "conflict_type": "DIRECT_CONTRADICTION",
      "description": "Public pricing on Meta Ads conflicts with proposed ₹599 master"
    }
  ],
  "estimated_review_hours": 14.5,
  "status": "PROPOSED",
  "proposed_by": "Alex Mercer (VP Brand Governance)",
  "created_at": 1763108000
}
```

---

## 4. MongoDB Atlas Indexing Strategy

Systematically ensured upon startup:

```javascript
// Compound Multi-Tenant Lookups
db.brand_guidelines.createIndex({ organisation_id: 1, workspace_id: 1, category: 1 });
db.approved_facts.createIndex({ organisation_id: 1, workspace_id: 1, category: 1 }, { unique: false });
db.content_assets.createIndex({ organisation_id: 1, workspace_id: 1, campaign_id: 1 });
db.graph_nodes.createIndex({ organisation_id: 1, workspace_id: 1, node_type: 1 });
db.graph_relationships.createIndex({ source_id: 1, target_id: 1 });
db.release_ledger.createIndex({ brand_id: 1, asset_id: 1, timestamp: -1 });
db.release_ledger.createIndex({ content_hash: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
```

---

## 5. MongoDB Atlas Vector Search Configuration

The `knowledge_nodes` collection stores 768-dimensional embeddings generated via Gemini embedding APIs:

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "dimensions": 768,
        "similarity": "cosine",
        "type": "knnVector"
      }
    }
  }
}
```

The application queries this vector index using the native MongoDB aggregation pipeline:
```python
pipeline = [
    {
        "$vectorSearch": {
            "index": "vector_index",
            "path": "embedding",
            "queryVector": query_vector,
            "numCandidates": 50,
            "limit": 5
        }
    }
]
```
