# BRANDTRACE AI — Known Limitations & Architectural Boundaries ⚖️

> **Philosophy:** *Absolute transparency. Zero exaggerated claims. Verifiable enterprise realities.*

---

## 1. Cloud Infrastructure & Hosting Boundaries

### 1.1 Render Free-Tier Container Spindown
- **Description:** The production backend is deployed on Render's managed container platform. On standard free tiers, instances automatically sleep after 15 minutes of zero inbound traffic.
- **Impact:** An evaluator accessing the service after a dormant period may observe an initial 30–45 second delay while the Uvicorn container spins up.
- **Mitigation:** Once awake, responses execute with sub-20ms latency. The frontend displays graceful loading indicators and retry mechanisms.

### 1.2 Multi-Tenant Logical Separation vs. Physical Sharding
- **Description:** Multi-tenancy is enforced logically at the software and database layer using strict `organisation_id` and `workspace_id` filtering on all MongoDB Atlas queries and API middleware.
- **Impact:** While compliant with standard enterprise SaaS tiering, hyper-regulated defense or banking clients requiring dedicated physical database clusters per tenant would require enterprise cluster provisioning.

---

## 2. Artificial Intelligence & Inspection Pipeline Boundaries

### 2.1 External LLM Quota & Deterministic Fallback
- **Description:** The system optionally leverages Google Gemini 2.5 for unstructured tone analysis and creative suggestions.
- **Boundary:** When external cloud LLM API quotas are exhausted, network connectivity is disrupted, or API keys are unconfigured, the system automatically falls back to deterministic rule engines (NetworkX DAG traversal, regex token-level extractors, and statutory compliance lookup tables).
- **Benefit:** Guarantees 100% system availability with zero hallucinations, ensuring critical compliance decisions are always grounded in verified facts.

### 2.2 Semantic Vector Search Offline Behavior
- **Description:** Atlas Vector Search (`$vectorSearch`) relies on an active MongoDB Atlas 7.0+ cluster with index `vector_index`.
- **Boundary:** During offline local testing or within environments lacking Atlas Vector Search index deployment, similarity queries gracefully degrade to token-based Jaccard similarity and exact lexical matching.

---

## 3. Multimodal & File Ingestion Boundaries

### 3.1 Supported File Ingestion Formats
- **Supported:** Plain text (`.txt`), Markdown (`.md`), HTML, Rich Text (`.rtf`), PDF (`.pdf`), and standard raster images (`.png`, `.jpg`, `.jpeg`, `.webp`).
- **Boundary:** Video files (`.mp4`, `.mov`) are analyzed via keyframe image sampling rather than full continuous video stream decoding.
- **File Size Ceiling:** Maximum supported upload size is capped at **10 MB** to prevent denial-of-service memory pressure on cloud workers.

---

## 4. Progressive Web App (PWA) & Offline Boundaries

### 4.1 Zero-Trust Offline Caching Architecture
- **Description:** To uphold strict enterprise compliance standards, the PWA Service Worker explicitly excludes private API responses, authentication tokens, and customer marketing drafts from local browser cache.
- **Boundary:** When an evaluator loses internet connectivity:
  - The application shell, navigation chrome, and offline fallback interface remain fully functional.
  - Active inspection jobs, change simulations, and release signing cannot be executed offline.
- **Rationale:** Allowing offline approvals would risk publishing content based on stale brand rules, directly violating the core governance promise of BRANDTRACE AI.
