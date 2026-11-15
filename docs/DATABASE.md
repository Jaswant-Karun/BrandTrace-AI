# BRANDTRACE AI — MongoDB Atlas Database Architecture 🗄️

> **Primary Application Database:** MongoDB Atlas 7.0+  
> **Driver:** Motor (Async Python Driver) + PyMongo  
> **Vector Engine:** MongoDB Atlas Vector Search (`$vectorSearch`)

---

## 1. Database Philosophy & Architectural Decisions

- **Single Primary Database:** MongoDB Atlas is the exclusive production database. No PostgreSQL, SQLite, or pgvector dependencies are used.
- **Tenant Isolation:** Every collection implements strict multi-tenant boundary partitioning using `organisation_id` (mandatory) and `workspace_id` (scoped).
- **Hybrid Data Model:** Rich polymorphic graph nodes and unstructured creative inspection findings live alongside strictly validated Pydantic schemas.

---

## 2. The 27 BSON Collections Schema

| # | Collection Name | Purpose & Primary Keys | Key Indexed Fields |
|---|---|---|---|
| 1 | `organisations` | Enterprise tenant root entities | `organisation_id` (unique), `slug` |
| 2 | `brand_workspaces` | Brand portfolios within an enterprise | `organisation_id`, `workspace_id` (unique compound) |
| 3 | `users` | User credentials, roles, profiles | `email` (unique), `organisation_id`, `role` |
| 4 | `workspace_memberships` | User-to-workspace mapping | `user_id`, `workspace_id`, `role` |
| 5 | `roles_permissions` | RBAC permission matrix | `role`, `permissions` |
| 6 | `brand_guidelines` | Canonical brand rules and policies | `guideline_id`, `organisation_id`, `workspace_id`, `category` |
| 7 | `guideline_versions` | Historical immutable guideline revisions | `guideline_id`, `version` |
| 8 | `approved_facts` | Approved commercial truth-set | `fact_id`, `workspace_id`, `category`, `status` |
| 9 | `fact_sources` | Evidentiary legal citations & lab reports | `source_id`, `fact_id`, `verification_hash` |
| 10 | `terminology` | Prohibited and mandatory brand terms | `term_id`, `workspace_id`, `term_type` |
| 11 | `brand_assets` | Logos, colour palettes, visual tokens | `asset_id`, `workspace_id`, `asset_type` |
| 12 | `campaigns` | Marketing campaigns & flight dates | `campaign_id`, `workspace_id`, `status` |
| 13 | `content_assets` | Marketing touchpoints (copy, ads, PDFs) | `asset_id`, `workspace_id`, `campaign_id` |
| 14 | `content_versions` | Content revision history & diffs | `asset_id`, `version_number` |
| 15 | `graph_nodes` | Ontological BDIG knowledge nodes | `node_id`, `workspace_id`, `node_type` |
| 16 | `graph_relationships` | Directed dependency edges | `source_id`, `target_id`, `relation_type` |
| 17 | `inspection_jobs` | Ingestion & multimodal processing tasks | `job_id`, `workspace_id`, `status` |
| 18 | `inspection_findings` | Granular token-level violation findings | `finding_id`, `job_id`, `severity` |
| 19 | `evidence_references` | Proof citations linking findings to facts | `reference_id`, `finding_id`, `fact_id` |
| 20 | `suggested_corrections` | Autonomous graph-preserving rewrites | `correction_id`, `finding_id` |
| 21 | `review_assignments` | Reviewer queues & sign-off tasks | `task_id`, `workspace_id`, `assigned_to`, `status` |
| 22 | `comments` | Threaded annotations on findings | `comment_id`, `task_id`, `author_id` |
| 23 | `approval_decisions` | Sign-off decisions with digital signatures | `decision_id`, `task_id`, `signer_id` |
| 24 | `change_simulations` | Digital Twin proposed policy mutations | `simulation_id`, `workspace_id`, `status` |
| 25 | `impact_reports` | Blast radius reports & workload estimates | `report_id`, `simulation_id` |
| 26 | `audit_events` | Immutable chronological governance log | `event_id`, `organisation_id`, `timestamp` |
| 27 | `notifications` | Alert dispatch queue for brand managers | `notification_id`, `recipient_id`, `is_read` |

---

## 3. MongoDB Atlas Indexing Strategy

To guarantee sub-10ms queries at enterprise scale, the following indexes are systematically ensured on startup:

```javascript
// Compound Tenant Indexes
db.brand_guidelines.createIndex({ organisation_id: 1, workspace_id: 1, category: 1 });
db.approved_facts.createIndex({ organisation_id: 1, workspace_id: 1, category: 1 });
db.content_assets.createIndex({ organisation_id: 1, workspace_id: 1, campaign_id: 1 });
db.graph_nodes.createIndex({ organisation_id: 1, workspace_id: 1, node_type: 1 });

// Graph Traversal Indexes
db.graph_relationships.createIndex({ source_id: 1, relation_type: 1 });
db.graph_relationships.createIndex({ target_id: 1, relation_type: 1 });

// Unique Constraints
db.organisations.createIndex({ organisation_id: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

// Time-Series & Audit Indexes
db.audit_events.createIndex({ organisation_id: 1, timestamp: -1 });
db.review_assignments.createIndex({ assigned_to: 1, status: 1 });
```

---

## 4. MongoDB Atlas Vector Search Configuration

Semantic similarity search across brand guidelines, approved facts, and legal disclosures is executed via MongoDB Atlas Vector Search (`$vectorSearch`).

### Atlas Search Index Definition (`vector_index` on `knowledge_nodes`):

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 768,
        "similarity": "cosine"
      },
      "org_id": {
        "type": "filter"
      },
      "workspace_id": {
        "type": "filter"
      }
    }
  }
}
```

### Aggregation Pipeline Example:

```javascript
db.knowledge_nodes.aggregate([
  {
    "$vectorSearch": {
      "index": "vector_index",
      "path": "embedding",
      "queryVector": [0.0142, -0.0481, ..., 0.0891],
      "numCandidates": 100,
      "limit": 5,
      "filter": {
        "org_id": "ORG-AURELLE",
        "workspace_id": "aurelle-tech"
      }
    }
  },
  {
    "$project": {
      "node_id": 1,
      "label": 1,
      "node_type": 1,
      "description": 1,
      "score": { "$meta": "vectorSearchScore" }
    }
  }
])
```
