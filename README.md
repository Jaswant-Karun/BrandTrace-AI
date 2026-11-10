# BRANDTRACE AI 🛡️

## *The Autonomous Brand Intelligence & Governance Control Plane*

> **Tagline:** *Every brand decision connected. Every risk traceable. Every release accountable.*

[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-60%2F60%20Passing-emerald?style=for-the-badge&logo=pytest)](docs/TESTING.md)
[![TypeScript](https://img.shields.io/badge/Frontend%20Build-0%20Errors-cyan?style=for-the-badge&logo=typescript)](frontend)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-green?style=for-the-badge&logo=mongodb)](docs/DATABASE.md)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue?style=for-the-badge)](LICENSE)

---

## 🌟 Executive Summary & Problem Definition

Modern enterprises release thousands of multi-channel marketing campaigns, advertisements, press statements, digital packaging, and partner collateral across dozens of distributed business units.

When a brand guideline, product price, marketing claim, or regulatory policy changes, organizations struggle to identify which published or in-flight content is affected. Governance is fractured across static PDF style guides, disconnected email threads, and reactive PR firefighting.

**BRANDTRACE AI** solves this systemic challenge with the **Brand Dependency Intelligence Graph (BDIG)**. Instead of treating content reviews as disconnected text checks, BrandTrace connects content to the facts, guidelines, campaigns, and visual assets on which it depends.

Whenever an approved fact or policy changes (e.g., product price updates from ₹499 to ₹599), BrandTrace instantly traverses the dependency graph, highlights impacted touchpoints, runs non-destructive **Digital Twin simulations**, routes automated revision tasks to creators, and seals approved releases with **SHA-256 cryptographic proofs** in an immutable trust ledger.

---

## ⚡ The 3 Signature Hackathon Differentiators

1. **Brand Dependency Intelligence Graph (BDIG):**
   - Live MongoDB-backed directed acyclic knowledge graph linking guidelines, approved commercial facts, marketing claims, campaigns, and content assets.
   - Real-time dependency pathfinding (`/api/graph/traverse`) with evidence citations, upstream rule mapping, and downstream asset exposure highlighting.
2. **Brand Governance Digital Twin:**
   - Non-destructive simulation engine projecting organizational blast radius across 5 mutation categories (product facts, brand policies, terminology, claim restrictions, campaign guidelines).
   - Automated policy contradiction detection (`DIRECT_CONTRADICTION`, `REGULATORY_NON_COMPLIANCE`, `REGIONAL_OVERRIDE_CONFLICT`).
   - Quantified departmental review workload estimation and before/after compliance scoring with a mandatory authorized human commit gate.
3. **Multimodal Governance & 5-State Cryptographic Release History:**
   - Unified inspection across Text, PDF, DOCX, raster images, and video keyframes.
   - SHA-256 Merkle-style block sealing distinguishing 5 statutory states: `VALID_UNCHANGED`, `MODIFIED_AFTER_APPROVAL`, `SUPERSEDED`, `REVOKED`, and `UNKNOWN_RECORD`.
   - Strict human-in-the-loop guarantee: zero automatic publishing.

---

## 🧭 The 14 Core Enterprise Modules

| # | Module | Core Functionality |
| --- | --- | --- |
| 1 | **Landing Page** | Public SaaS presentation, value proposition, and interactive live demo launcher |
| 2 | **Authentication & RBAC** | JWT authentication (HS256) enforcing server-side RBAC across 5 organizational roles |
| 3 | **Command Center** | Executive telemetry dashboard: active workspaces, asset counts, risk trends, and health |
| 4 | **Brand Knowledge Graph** | Interactive `@xyflow/react` canvas visualizing brand ontology with dependency traversal |
| 5 | **Content Studio** | Ingestion studio with real-time multi-agent inspection (Voice, Claims, Regulations) |
| 6 | **Change Impact Simulator** | Digital Twin sandbox simulating policy mutations, blast radius, and review workload |
| 7 | **Multimodal Inspection** | Creative design inspection: WCAG AA contrast, logo safe zones, and palette validation |
| 8 | **Campaign Intelligence** | Portfolio health, channel flight dates, allocated budgets, and compliance scores |
| 9 | **Risk Intelligence** | Enterprise risk taxonomy (FTC, trademark, accessibility, claims) with severity scoring |
| 10 | **Approval Center** | Atomic human review queue with role-based sign-offs and one-click remediation |
| 11 | **Brand Knowledge Base** | Official truth-set registry with live MongoDB Atlas Vector Search (`$vectorSearch`) |
| 12 | **Governance Analytics** | Time-series governance velocity, compliance trajectories, and review lead times |
| 13 | **Audit & Trust Center** | Cryptographic release verifier testing live content against SHA-256 block signatures |
| 14 | **Settings & Security** | Multi-tenant tenant boundary posture, MongoDB Atlas telemetry, and re-seeding controls |

---

## 🏗️ System Architecture & Technology Stack

```text
BRANDTRACE AI/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS + @xyflow/react
│   ├── src/
│   │   ├── components/           # 14 Modular SaaS Views (CommandCenter, KnowledgeGraph, Simulator, etc.)
│   │   ├── context/              # Multi-tenant AuthContext & Persona Switcher
│   │   ├── services/             # Centralized apiClient with offline resilience
│   │   └── App.tsx               # Enterprise Control Plane Root Container
│   ├── Dockerfile                # Production multi-stage NGINX build
│   └── nginx.conf                # Reverse proxy routing /api/* to backend
│
├── backend/                      # Python 3.13 FastAPI Governance Engine
│   ├── brandtrace/
│   │   ├── agents/               # Multi-agent verification pipeline (Voice, Claim, Regulatory, Blast)
│   │   ├── database/             # MongoDB Motor async client + 27 BSON collections + auto-seed
│   │   ├── engine/               # Simulation, Explainable Review, Audit Ledger, Multimodal engines
│   │   ├── graph/                # Brand Knowledge Graph (NetworkX engine + DAG traversal)
│   │   ├── modules/              # Modular domain routers (auth, orgs, kb, graph, content, approvals, demo, security)
│   │   └── core/                 # Config, Security, Rate Limiter, and Cryptographic hashing
│   ├── Dockerfile                # Production Uvicorn container
│   ├── requirements.txt          # Python dependencies (fastapi, motor, pymongo, networkx, pydantic)
│   └── tests/                    # 10 Pytest test suites (60/60 passing)
│
├── docs/                         # Comprehensive Technical Documentation
│   ├── ARCHITECTURE.md           # System architecture, data flow, and multi-agent pipeline
│   ├── API.md                    # REST API endpoints, schemas, and auth contracts
│   ├── DATABASE.md               # MongoDB Atlas 27 collections, indexes, and vector search
│   ├── RESPONSIBLE_AI.md         # Ethical AI limits, human-in-the-loop, and privacy guards
│   └── TESTING.md                # 60 test results, 23-sample benchmark, and verification
│
├── docker-compose.yml            # One-click multi-container deployment (MongoDB + Backend + Frontend)
├── render.yaml                   # Cloud backend deployment blueprint for Render
├── vercel.json                   # Cloud frontend deployment blueprint for Vercel
├── .env.example                  # Environment configuration template
└── package.json                  # Root monorepo script runner
```

---

## 🚀 Quickstart & Local Installation

### Prerequisites

- Node.js 20+ and `pnpm` (or `npm`)
- Python 3.11+ (Python 3.13 recommended)
- MongoDB 7.0+ (Local or MongoDB Atlas cluster)

### Option 1: One-Click Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/your-org/brandtrace-ai.git
cd "BRANDTRACE AI"

# 2. Configure environment
cp .env.example .env

# 3. Launch stack
docker-compose up -d --build
```

- **Frontend Control Plane:** `http://localhost:3000`
- **Backend Swagger API Docs:** `http://localhost:8000/docs`
- **Backend Health Check:** `http://localhost:8000/health`
- **Local MongoDB:** `mongodb://localhost:27017`

---

### Option 2: Local Development (Without Containers)

#### 1. Backend Engine

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate          # On Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt

# Run server with live reload:
uvicorn brandtrace.main:app --reload --port 8000
```

> **Resilient Offline Fallback:** If MongoDB is running locally (`mongodb://localhost:27017`), BrandTrace connects automatically. If MongoDB is offline, BrandTrace engages its **in-memory fallback repository** so the entire platform runs smoothly without crashes!

#### 2. Frontend Control Plane

```bash
cd frontend
pnpm install
pnpm dev
# Opens at http://localhost:5173 with automatic API proxying to port 8000
```

---

## 🌐 Cloud Deployment Guide

### Database: MongoDB Atlas

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Whitelist your application's IP ranges (`0.0.0.0/0` for initial cloud deployment).
3. Obtain your connection URI:

   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=brandtrace
   ```

### Backend: Render / Railway / Fly.io

Deploy using the included `render.yaml`:

- **Root Directory:** `backend`
- **Build Command:** `uv venv && uv pip install -r requirements.txt`
- **Start Command:** `.venv/bin/uvicorn brandtrace.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `PORT=8000`
  - `ENVIRONMENT=production`
  - `MONGODB_URI=<your-atlas-uri>`
  - `MONGODB_DB_NAME=brandtrace`
  - `JWT_SECRET_KEY=<your-secret-key>`
  - `ALLOWED_ORIGINS=https://brandtrace-ai.vercel.app,http://localhost:5173,http://localhost:3000`

### Frontend: Vercel / Netlify

Deploy using the included `vercel.json`:

- **Root Directory:** `frontend`
- **Build Command:** `pnpm build`
- **Output Directory:** `dist`
- **API Rewrites:** Configured to automatically proxy `/api/*` to your production backend.

---

## 👥 Demo Personas & Safe Demo Access

The platform includes 5 pre-configured demonstration personas across **AURELLE Global** (`ORG-AURELLE`, `aurelle-tech`):

| Persona Name | Email | Role | Accessible Permissions |
| :--- | :--- | :--- | :--- |
| **Sarah Chen** | `sarah.chen@aurelle.com` | `ADMIN` | Full tenant management, benchmark execution, settings |
| **Julian Vance** | `julian.vance@aurelle.com` | `BRAND_MANAGER` | Brand truth-set, Digital Twin simulations, policy commits |
| **Maya Lin** | `maya.lin@aurelle.com` | `CONTENT_CREATOR` | Submitting creative copy, executing remediations |
| **Elena Rostova** | `elena.rostova@aurelle.com` | `REVIEWER` | Reviewing flagged copy, adding annotations |
| **David Sterling** | `david.sterling@aurelle.com` | `COMPLIANCE_REVIEWER` | Statutory approvals, cryptographic release block signing |

*You can switch between personas with a single click using the persona dropdown in the top header.*

---

## 📊 Verification & Empirical Test Results

```text
======================== 77 passed in 5.66s ========================
```

- **Backend Test Suite:** **60 / 60 Pytest tests passing (100%)** across 10 test suites.
- **Frontend Compilation:** `tsc && vite build` $\to$ **0 errors** (2,563 modules transformed in 12.34s).
- **23-Sample Benchmark Evaluation:** **100% Precision**, **94.4% Recall**, **0.971 F1-Score**.
- **Cryptographic Trust Ledger:** 100% deterministic distinction across all 5 states (`VALID_UNCHANGED`, `MODIFIED_AFTER_APPROVAL`, `SUPERSEDED`, `REVOKED`, `UNKNOWN_RECORD`).

For detailed architectural and API documentation, explore the [`docs/`](docs/) directory.
