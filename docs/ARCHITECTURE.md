# BRANDTRACE AI — Enterprise System Architecture 🏛️

> **The Autonomous Brand Intelligence & Governance Control Plane**  
> *Every brand decision connected. Every risk traceable. Every release accountable.*

---

## 1. Executive Architectural Overview

BRANDTRACE AI is an autonomous enterprise brand intelligence and governance control plane. It unifies marketing operations, compliance teams, legal counsel, and creative directors into a single connected workspace.

Instead of evaluating marketing and commercial copy as disconnected text fragments, BRANDTRACE AI connects every marketing asset, campaign, document, and claim to an immutable truth-set: the **Brand Dependency Intelligence Graph (BDIG)**.

```mermaid
flowchart TB
    subgraph PresentationLayer ["1. Presentation Layer (React 19 + TypeScript + Vite + PWA)"]
        UI_Nav["Responsive App Shell & Navigation (Desktop / Tablet / Mobile Drawer)"]
        UI_CC["Executive Command Center (Real-Time Governance Telemetry)"]
        UI_Canvas["Interactive BDIG Canvas (@xyflow/react Directed Graph)"]
        UI_Sim["Governance Digital Twin (Change Impact Simulator)"]
        UI_Inspect["Multi-Agent Content Inspector & Multimodal Studio"]
        UI_Trust["Cryptographic Trust & Audit Center (5-State Ledger Verifier)"]
        UI_PWA["Zero-Trust Service Worker (PWA Offline Fallback Shell)"]
    end

    subgraph SecurityLayer ["2. Edge Security, Middleware & Boundary Guard"]
        RateLimit["Sliding Window Rate Limiter (120 req/min per client IP/Token)"]
        SecHeaders["Enterprise OWASP Security Headers (nosniff, DENY, XSS-block)"]
        Sanitization["Credential, URI & Stack-Trace Redactor"]
        RBAC_Guard["Strict Server-Side RBAC & Multi-Tenant Organization Boundary"]
    end

    subgraph CoreEngines ["3. Autonomous Governance & Intelligence Engines"]
        Graph_Engine["Brand Knowledge Graph Engine (NetworkX + BDIG Directed Traversal)"]
        DigitalTwin["Brand Governance Digital Twin (Policy Contradiction & Blast Radius)"]
        AgentPipeline["Autonomous Multi-Agent Orchestrator (Voice, Claims, Legal, Blast)"]
        Ledger_Engine["Cryptographic Trust Ledger (Deterministic SHA-256 Merkle Sealing)"]
    end

    subgraph PersistenceLayer ["4. Persistence & Semantic Grounding"]
        Atlas_DB[("MongoDB Atlas 7.0 Cluster (27 Enterprise BSON Collections)")]
        Atlas_Vector["MongoDB Atlas Vector Search ($vectorSearch, 768-dim Embeddings)"]
        Memory_Fallback["Pragmatic In-Memory Resilient Cache & Deterministic Mock Store"]
    end

    PresentationLayer --> SecurityLayer
    SecurityLayer --> CoreEngines
    CoreEngines --> PersistenceLayer
```

---

## 2. C4 Architecture Breakdown

### Level 1: System Context
The System Context diagram portrays how BRANDTRACE AI interfaces with external enterprise personas, marketing channels, and storage engines:

```mermaid
flowchart LR
    User_Creator["Marketing Creator / Copywriter"]
    User_Manager["Brand Governance Manager"]
    User_Legal["Regulatory & Legal Counsel"]
    User_Auditor["External Compliance Auditor / Judge"]

    BrandTrace["BRANDTRACE AI Control Plane\n(Vercel Frontend + Render FastAPI Backend)"]

    MongoDB_Atlas[("MongoDB Atlas Cloud\n(27 Collections + Atlas Vector Index)")]
    AI_Grounding["Gemini 2.5 Structured LLM Grounding\n(Strict JSON Schema & Zero Hallucination)"]

    User_Creator -->|Submits Content for Inspection| BrandTrace
    User_Manager -->|Simulates Fact & Policy Mutations| BrandTrace
    User_Legal -->|Signs Formal Immutable Release Seals| BrandTrace
    User_Auditor -->|Validates SHA-256 Ledger Authenticity| BrandTrace

    BrandTrace -->|Persists Facts, Graphs, Ledger & Audit Events| MongoDB_Atlas
    BrandTrace -->|Token-Level Grounded Verification| AI_Grounding
```

### Level 2: Container Diagram
The Container diagram highlights the deployed execution environments:

```mermaid
flowchart TB
    subgraph ClientBrowser ["Client Web Application (PWA)"]
        SPA["React 19 Single Page App\n(Vite 6, TypeScript, Tailwind CSS)"]
        ServiceWorker["Service Worker (sw.js)\n(Static Asset Stash, Zero-Cache Private APIs)"]
    end

    subgraph EdgeCDN ["Edge Infrastructure (Vercel)"]
        VercelCDN["Vercel Global Edge Network\n(Static Hosting, Brotli/Gzip, HTTPS/HSTS)"]
    end

    subgraph ComputeBackend ["Application Server (Render Cloud Container)"]
        FastAPI_App["FastAPI REST Application (Python 3.13 / Uvicorn)\nModular Routers: /auth, /facts, /verify, /simulator, /ledger"]
        Middlewares["Security Middleware Stack\n(RateLimiter, SecurityHeaders, ErrorSanitizer)"]
    end

    subgraph DatabaseCloud ["Data Storage (MongoDB Atlas)"]
        MongoCluster[("MongoDB Atlas Replica Set\nbrandtrace_admin DB")]
        AtlasSearch["Atlas Vector Search Index\n(vector_index, 768 dimensions)"]
    end

    ClientBrowser -->|HTTPS / W3C Manifest| VercelCDN
    SPA -->|Authenticated REST API / JWT| FastAPI_App
    FastAPI_App --> Middlewares
    FastAPI_App -->|Async Motor Driver / TLS| MongoCluster
    FastAPI_App -->|Semantic Nearest Neighbor| AtlasSearch
```

### Level 3: Component Diagram (FastAPI Backend Control Plane)
```mermaid
flowchart TD
    subgraph ModularRouters ["FastAPI API Gateway & Routers"]
        R_Auth["/api/auth (Login, Register, Personas, /me)"]
        R_Facts["/api/facts (CRUD Approved Facts, Mutate)"]
        R_Verify["/api/verify (Multi-Agent Content Inspection)"]
        R_Sim["/api/simulator (Propose Simulation, Commit)"]
        R_Ledger["/api/releases & /api/ledger (Sign, Verify, Revoke)"]
        R_Demo["/api/demo (Execute Steps, Reset Workspace)"]
    end

    subgraph PipelineEngines ["Domain Business Logic"]
        Agent_Voice["Voice & Persona Agent (Tone, Slang, Target Audience)"]
        Agent_Claim["Claim Substantiation Agent (Price, Spec, Warranty)"]
        Agent_Legal["Regulatory Compliance Agent (FDA, FTC, Trademark)"]
        Agent_Blast["Cascading Blast Radius Agent (Graph Dependency Traversal)"]
        Engine_Sim["Change Simulation Engine (Digital Twin Projections)"]
        Engine_Ledger["Cryptographic Trust Ledger (SHA-256 Merkle Chains)"]
    end

    subgraph DataRepositories ["Data Access Layer (motor / pymongo)"]
        MongoMgr["MongoManager Singleton (Connection Pool, Auto-Reconnection)"]
        AtlasRepo["AtlasRepository (27 Document Collections)"]
    end

    R_Verify --> Agent_Voice & Agent_Claim & Agent_Legal & Agent_Blast
    R_Sim --> Engine_Sim
    R_Ledger --> Engine_Ledger
    R_Facts --> MongoMgr
    PipelineEngines --> MongoMgr
    MongoMgr --> AtlasRepo
```

---

## 3. Autonomous Multi-Agent Reasoning Pipeline

The inspection pipeline evaluates content against 4 specialized autonomous agents executing sequentially or in parallel:

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Marketing Creator
    participant Gateway as FastAPI Router (/api/verify)
    participant Orchestrator as Governance Pipeline Orchestrator
    participant VoiceAgent as 1. Voice & Persona Agent
    participant ClaimAgent as 2. Claim Substantiation Agent
    participant LegalAgent as 3. Regulatory Compliance Agent
    participant GraphEngine as 4. Blast Radius Graph Traversal
    participant Ledger as Cryptographic Trust Ledger

    Creator->>Gateway: POST /api/verify {brand_id, channel, content}
    Gateway->>Orchestrator: Verify asset against active Brand Knowledge Graph
    
    par Agent Analysis
        Orchestrator->>VoiceAgent: Inspect Tone, Banned Lexicon & Persona Alignment
        VoiceAgent-->>Orchestrator: Voice Report (Spans + Score)
        
        Orchestrator->>ClaimAgent: Extract Claims & Match Approved Fact Catalog
        ClaimAgent-->>Orchestrator: Claim Report (Substantiated / Unverified / Contradictory)
        
        Orchestrator->>LegalAgent: Cross-Reference Statutory Regulations (FTC, FDA, Trademark)
        LegalAgent-->>Orchestrator: Regulatory Report (Critical Violations + Legal Citations)
    end

    Orchestrator->>GraphEngine: Traverse Downstream Graph Dependencies
    GraphEngine-->>Orchestrator: Connected Campaigns, Assets & Document Risks

    Orchestrator->>Orchestrator: Calculate Composite Risk Score (0-100) & Synthesize Remediation
    Orchestrator->>Ledger: Generate Cryptographic Release Proof (Deterministic Hash)
    Orchestrator-->>Gateway: Return Structured VerificationResult
    Gateway-->>Creator: Render Token-Level Spans, Citations, Remediated Copy & Decision
```

### Agent Roles & Governance Responsibilities:
1. **Voice & Brand Persona Agent:**
   - Detects deviations from defined tonal attributes (e.g., authoritative, elevated, accessible).
   - Identifies prohibited informalities, excessive hyperbole, or unauthorized slang.
   - Evaluates channel-specific constraints (Instagram ads vs. Investor presentations).
2. **Claim Substantiation Agent:**
   - Performs named entity and numeric extraction on pricing, battery specs, speed claims, and guarantees.
   - Grounded strictly against the MongoDB-backed Approved Facts Catalog (`APPROVED_FACTS_CATALOG`).
   - Flags unverified assertions with clear citation gaps.
3. **Regulatory & Legal Compliance Agent:**
   - Scans for statutory non-compliance: medical diagnosis claims without FDA clearance (21 CFR §870), unsubstantiated environmental guarantees (FTC Green Guides), or uncredited trademark marks (™ / ®).
   - Assigns severity ratings: `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`.
4. **Cascading Blast Radius Agent:**
   - Traverses the NetworkX directed acyclic graph to identify upstream dependencies and downstream exposure.
   - Computes organizational ripple effects across active campaigns and public channels.

---

## 4. Brand Dependency Intelligence Graph (BDIG)

The BDIG is modeled as an in-memory NetworkX directed graph backed by MongoDB Atlas collections (`graph_nodes`, `graph_relationships`, `knowledge_nodes`).

### Node Types:
- `GUIDELINE`: Brand rules, tone policies, regulatory mandates, and design constraints.
- `FACT`: Verified pricing, hardware specifications, battery life metrics, warranty terms.
- `CLAIM`: Approved marketing assertions grounded in substantiated evidence.
- `CAMPAIGN`: Active commercial flights (e.g., "Aurelle Spatial Audio Q1 Launch").
- `ASSET`: Published or pending marketing touchpoints (Instagram feed ads, landing pages, packaging).
- `DOCUMENT`: Legal disclaimers, FDA filings, technical whitepapers, SLA agreements.

### Edge Types:
- `GOVERNED_BY`: Content asset governed by a specific brand guideline or policy.
- `SUBSTANTIATED_BY`: Claim or copy substantiated by an approved fact or source document.
- `PART_OF_CAMPAIGN`: Asset belonging to an omnichannel campaign flight.
- `DEPENDS_ON`: Commercial dependency between two brand parameters.
- `SUPERSEDES`: Version lineage connecting current approved facts with historical precedents.

---

## 5. Cryptographic Release Ledger & 5-State Architecture

Every approved release is sealed with a deterministic SHA-256 cryptographic signature that chains the asset identifier, canonical content string, approving reviewer identity, and timestamp into an immutable tamper-evident seal.

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Ingestion / Authoring
    DRAFT --> INSPECTED: Multi-Agent Inspection (/api/verify)
    
    INSPECTED --> FLAGGED: Critical Violations Detected (Score >= 50)
    INSPECTED --> PENDING_REVIEW: Medium Risk (Score 20-49)
    INSPECTED --> APPROVED: Clean Inspection (Score < 20)
    
    FLAGGED --> REVISED: One-Click Remediation
    REVISED --> INSPECTED
    
    PENDING_REVIEW --> APPROVED_SEALED: Authorized Brand Manager Sign-Off (/api/releases/sign)
    APPROVED --> APPROVED_SEALED: Authorized Brand Manager Sign-Off (/api/releases/sign)
    
    APPROVED_SEALED --> VALID_UNCHANGED: Content Matches SHA-256 Seal
    APPROVED_SEALED --> MODIFIED_AFTER_APPROVAL: Tampered / Divergent Content
    APPROVED_SEALED --> SUPERSEDED: Replaced by Newer Approved Version (e.g. ₹499 -> ₹599)
    APPROVED_SEALED --> REVOKED: Recalled Due to Regulatory Violation
```

### 5 Statutory Release States:
1. `VALID_UNCHANGED`: Content perfectly matches the cryptographic seal generated at the time of human sign-off.
2. `MODIFIED_AFTER_APPROVAL`: Content has drifted or been maliciously edited after authorized approval. Tampering is flagged instantly.
3. `SUPERSEDED`: Content was legally approved for a prior version, but has been legitimately superseded by a newer approved master record (e.g., historical ₹499 pricing replaced by ₹599 master).
4. `REVOKED`: The release seal has been explicitly invalidated due to an active product recall or regulatory decree.
5. `UNKNOWN_RECORD`: Content hash does not exist in either active memory or MongoDB Atlas release ledger archives.

---

## 6. Resilience, Security & Multi-Tenant Isolation

1. **Sliding-Window Rate Limiter:** 
   - Protects backend APIs from denial-of-service bursts (120 req/minute per IP/token).
   - Test suites and internal services utilize elevated limits (`X-Test-Rate-Limit`).
2. **Server-Side RBAC Enforcement:**
   - 5 organizational personas: `ADMIN`, `BRAND_MANAGER`, `COMPLIANCE_REVIEWER`, `REVIEWER`, `CREATOR`.
   - Critical mutation endpoints (`/api/simulator/commit`, `/api/facts/mutate`, `/api/demo/reset`) enforce role boundaries strictly on the server.
3. **Data Redaction & Error Sanitization:**
   - Custom `ErrorSanitizationMiddleware` scrubs database URIs, API tokens, and internal stack traces before HTTP responses leave the server perimeter.
4. **Tenant Isolation:**
   - Multi-tenant architecture logically partitions all records by `organisation_id` (`ORG-AURELLE`, `ORG-APEX`) and `workspace_id`.
   - Cross-tenant lookups and mutations are blocked at the repository layer.
5. **Progressive Web App (PWA) Zero-Trust Caching:**
   - Service worker caches only immutable static assets (HTML, CSS, JS, SVG).
   - API endpoints (`/api/*`), authentication credentials, and customer data are explicitly excluded from browser storage caches to prevent stale compliance states.
