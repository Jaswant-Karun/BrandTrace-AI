# BRANDTRACE AI 🛡️
### *The Autonomous Brand Intelligence & Governance Control Plane*

> **Tagline:** *Every brand decision connected. Every risk traceable. Every release accountable.*

---

## 🌟 Executive Summary

Modern enterprises release thousands of multi-channel marketing campaigns, press statements, digital packaging, and partner assets every month. Today, brand governance is fractured between static PDF style guides, disconnected legal reviews, and reactive manual PR firefighting.

**BRANDTRACE AI** is an enterprise-grade AI SaaS control plane that transforms static brand guidelines into an active, **interconnected Brand Knowledge Graph (BKG)**. Powered by an autonomous multi-agent verification pipeline, it analyzes every marketing release for brand voice fidelity, factual claim substantiation, and regulatory compliance (FTC, ASA, EU Green Claims). Crucially, BRANDTRACE features **Cascading Blast Radius Analysis**, instantly calculating which downstream campaigns and touchpoints are impacted whenever a brand guideline or regulatory constraint changes.

---

## ⚡ Core Capabilities

1. **Brand Knowledge Graph (BKG)**
   - Unified ontological representation of Brand DNA, Approved Claims, Competitor Boundaries, Tone Metrics, and Historical Releases.
   - Graph-based dependency modeling linking legal policies to live campaign assets.

2. **Autonomous Multi-Agent Verification Pipeline**
   - **Voice & Persona Agent:** Computes stylistic fidelity, lexical compliance, acoustic tone, and anti-persona violations.
   - **Claim & Fact Substantiation Agent:** Cross-checks empirical claims against verified truth-sets and substantiation citations.
   - **Regulatory & Legal Compliance Agent:** Flags greenwashing, deceptive claims, missing FTC disclosures, and trademark infringements.
   - **Blast Radius Impact Agent:** Performs graph traversal to identify downstream exposure across channels when policies shift.

3. **Explainable AI & Token-Level Traceability**
   - High-fidelity token-level and clause-level highlighting with severity scoring (Critical, High, Moderate, Low).
   - Exact policy citations and deterministic rationale for every decision.
   - Cryptographic release verification hashes for tamper-evident compliance audit logs.

4. **One-Click Graph-Preserving Remediation**
   - Autonomous rewrite suggestions that fix regulatory and brand defects while strictly preserving the asset’s original tone and length constraints.

5. **Human-in-the-Loop Release Gates**
   - Configurable governance thresholds (Automated Pass, Staged for Human Review, Hard Rejection).
   - Enterprise release ledger with sign-off workflows and historical version diffing.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BRANDTRACE AI PLATFORM                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [ FRONTEND CONTROL PLANE ] (Vite + React 19 + TypeScript + Tailwind)  │
│    ├── Executive Governance Command Center                             │
│    ├── Interactive Brand Knowledge Graph (ReactFlow Canvas)            │
│    ├── Real-Time Multi-Agent Trace Inspector (SSE Streaming)           │
│    ├── Policy Mutation & Blast Radius Simulator                        │
│    └── Immutable Release Audit Ledger                                  │
│                                │                                       │
│                                ▼ (REST / SSE)                          │
│                                                                        │
│  [ BACKEND GOVERNANCE ENGINE ] (FastAPI + Python 3.13)                 │
│    ├── Autonomous Multi-Agent Orchestrator                             │
│    │     ├── Brand Voice & Tone Agent                                  │
│    │     ├── Claim Substantiation Agent                                │
│    │     ├── Regulatory & FTC Compliance Agent                         │
│    │     └── Cascading Blast Radius Agent                              │
│    ├── Brand Knowledge Graph Engine (NetworkX + Vector Index)          │
│    ├── Deterministic Rule & Regex Verification Substrate               │
│    └── Tamper-Evident Cryptographic Ledger Storage                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js `v20+` or `v22+`
- Python `3.11+` or `3.13+`
- `uv` (recommended) or standard `pip`

### 1. Clone & Setup Workspace
```bash
# Clone the repository
git clone <repo-url>
cd "BRANDTRACE AI"

# Copy environment file
cp .env.example .env
```

### 2. Backend Engine Setup
```bash
cd apps/api
# Using uv (lightning fast):
uv venv
uv pip install -r requirements.txt

# Or using standard pip:
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start backend server (runs at http://localhost:8000)
uv run uvicorn brandtrace.main:app --reload --port 8000
```

### 3. Frontend Web App Setup
```bash
cd apps/web
npm install
npm run dev
# Open http://localhost:5173
```

---

## 🛡️ Hackathon Integrity & Disclosures

- **Development Window:** Built strictly within the official hackathon development period.
- **Third-Party Libraries & Templates:**
  - Frontend: React 19, Tailwind CSS, Lucide Icons, @xyflow/react (ReactFlow).
  - Backend: FastAPI, Pydantic v2, NetworkX, Uvicorn.
  - Zero proprietary or closed templates were copied.
- **Dual-Mode Engine:** Includes a deterministic local reasoning engine with seeded brand graphs so judges can evaluate the platform instantly with zero API keys required.

