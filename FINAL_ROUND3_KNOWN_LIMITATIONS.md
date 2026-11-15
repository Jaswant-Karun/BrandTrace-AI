# BRANDTRACE AI — Final Round 3 Known Limitations & Operational Boundaries ⚠️

> **Product:** BRANDTRACE AI — *The Autonomous Brand Intelligence & Governance Control Plane*  
> **Team:** Storm Crackers (Jaswant Karun S A & Jaiwant Karrun S A)  
> **Institution:** KPR Institute of Engineering and Technology  
> **Document Status:** Authoritative Hackathon Submission Disclosure  
> **Last Verified:** November 14, 2026 · 14:37 IST

---

## 1. Purpose of This Document

In strict accordance with the hackathon principles of **architectural honesty, software transparency, and zero fabrication**, this document provides an exhaustive, unambiguous disclosure of all known system limitations, cloud infrastructure constraints, and intentional design trade-offs in BrandTrace AI.

External evaluators and hackathon judges are strongly encouraged to review these disclosures to distinguish between deliberate architectural boundaries and software defects.

---

## 2. Infrastructure & Cloud Deployment Boundaries

### 2.1 Render Free-Tier PaaS Container Cold Start (P3 Operational)

- **Observed Behavior:** If the backend API receives no incoming traffic for 15 consecutive minutes, the Render free-tier container enters an idle suspension state. The first subsequent incoming HTTP request will experience a latency of **30 to 45 seconds** while the Python virtualenv and FastAPI container spin up.
- **Subsequent Performance:** Once warmed, all subsequent API operations complete in **300ms to 800ms**.
- **Mitigation for Judges:** The frontend application displays an active retry spinner with the notice: *"Warming up cloud governance engine (first-load cold start)..."*
- **Enterprise Architecture Roadmap:** In a commercial enterprise deployment, BrandTrace AI deploys on AWS ECS / EKS or Render Team instances configured with a minimum replica floor of 2, completely eliminating cold-start latency.

### 2.2 Primary Production Vercel Domain Parity

- **Authoritative Verified Target:** [https://brand-trace-ai-dun.vercel.app/](https://brand-trace-ai-dun.vercel.app/)
- **Observed Boundary:** Older documentation drafts previously cited the custom alias `brandtrace.vercel.app`. While that domain routes to Vercel, edge proxying and latest static assets (including the W3C service worker `/sw.js` and manifest) are verified live on the active `brand-trace-ai-dun.vercel.app` deployment.
- **Guidance for Evaluators:** Please evaluate the live application exclusively at [https://brand-trace-ai-dun.vercel.app/](https://brand-trace-ai-dun.vercel.app/).

---

## 3. Offline Progressive Web App (PWA) Boundaries

### 3.1 Zero-Trust Offline Inspection Limitation

- **Architectural Decision:** When client network connectivity is completely severed, BrandTrace AI serves a branded offline fallback screen (`/offline.html`) rather than allowing local content inspection or fact modification.
- **Security & Cryptographic Rationale:** Content intelligence inspection requires real-time vector search across 35 MongoDB Atlas collections and cryptographic SHA-256 Merkle tree verification. Allowing an offline client device to issue local "approval seals" would violate zero-trust brand governance principles and enable spoofing.
- **Permitted Offline Actions:** Viewing cached static documentation and review interface layouts.

---

## 4. Multi-Agent Governance & LLM Fallback Behavior

### 4.1 Upstream LLM Quota Throttling & Deterministic Fallback

- **Observed Behavior:** If Google Gemini API keys experience external rate-limiting (HTTP 429) or transient network interruption, BrandTrace AI does not fail or raise unhandled exceptions.
- **Deterministic Heuristic Engine:** The platform automatically engages its secondary deterministic rule engine (regex AST parsers, Levenshtein distance metrics, and pre-compiled statutory legal pattern matchers).
- **Graceful Degradation:** Factual verification against known truth nodes and statutory legal citations (e.g., FDA 21 CFR §870, FTC 16 CFR §260.4) remains 100% operational even when third-party generative LLMs are unavailable.

### 4.2 Multi-Agent Orchestration Scope

- **Inspection Agent Suite (3 Agents):** Voice & Persona Agent, Claim & Fact Substantiation Agent, and Regulatory & Legal Compliance Agent run concurrently on `/api/verify`.
- **System-Wide Agent Suite (4 Agents):** The control plane operates 4 specialized agent instances across content verification and dependency graph intelligence.

---

## 5. Multi-Tenant Role-Based Access Control (RBAC)

### 5.1 Demo Persona Authorization Boundary

- **Assigned Demo Persona:** Alex Mercer, VP Global Brand Governance (`BRAND_MANAGER` role, scoped to `aurelle-tech`).
- **Gated Endpoints:** The demo account has intentionally restricted permissions:
  - Allowed: Browsing facts, proposing simulation DAG changes, submitting content, inspecting risk, human approval signing, and ledger verification.
  - Blocked: Accessing root administrator endpoints (`/api/admin/*`) or deleting cross-tenant database collections. Attempting these actions correctly returns **HTTP 403 Forbidden**.

### 5.2 Non-Destructive Demonstration Sandbox

- **Simulation Sandbox:** Change impact simulations (Commitment 1) run in an in-memory virtual DAG. They do not write mutations to production facts in MongoDB until an authorized administrator commits the change.
- **Ledger Verification:** Tamper detection tests (Commitment 3) evaluate presented hashes against immutable database records without corrupting or deleting genuine historical release seals.

---

## 6. Strict Human-in-the-Loop Release Architecture

- **Deliberate Design Limitation:** BrandTrace AI is explicitly designed **never to auto-publish content** to social or ad channels without human sign-off.
- **Governance Mandate:** Regardless of whether content achieves a 0.0 composite risk score, an authorized brand manager or compliance officer must affix their cryptographic sign-off (`BT-SEAL-...`) before a release enters the tamper-evident audit ledger.
