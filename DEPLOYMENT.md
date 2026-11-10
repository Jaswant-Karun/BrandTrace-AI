# BRANDTRACE AI — Enterprise Deployment Guide 🚀

This repository is structured into standard top-level `frontend/` and `backend/` directories for seamless deployment to modern cloud hosting platforms and container environments.

---

## 📁 Project Architecture & Directory Layout

```
BRANDTRACE AI/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS + @xyflow/react
│   ├── src/
│   │   ├── components/           # AssetInspector, KnowledgeGraphView, BlastRadiusSimulator, ReleaseLedgerView
│   │   ├── types/                # Domain TypeScript contracts
│   │   ├── App.tsx               # Control Plane root container
│   │   └── main.tsx
│   ├── Dockerfile                # Production multi-stage NGINX build
│   ├── nginx.conf                # NGINX reverse-proxy configuration
│   └── package.json
│
├── backend/                      # Python 3.13 FastAPI Governance Engine
│   ├── brandtrace/
│   │   ├── agents/               # Multi-agent verification pipeline (Voice, Claim, Regulatory, Blast)
│   │   ├── database/             # MongoDB Motor async client + schema + auto-seed
│   │   ├── graph/                # Brand Knowledge Graph (NetworkX engine + DAG traversal)
│   │   ├── data/                 # Enterprise seed profiles (Apex Dynamics & Novus Health)
│   │   ├── core/                 # Config & cryptographic release hash signing
│   │   └── routes/               # REST API endpoints
│   ├── Dockerfile                # Containerized Uvicorn engine
│   ├── requirements.txt          # Python dependencies (motor, pymongo, fastapi, networkx)
│   └── tests/                    # Pytest test suite (9/9 verified passing)
│
├── docker-compose.yml            # One-click multi-container stack (MongoDB + Backend + Frontend)
├── .env.example                  # Environment configuration template
└── README.md                     # Executive summary & product identity
```

---

## Option 1: One-Click Docker Compose Deployment (Recommended)

Spins up the complete stack with MongoDB 7.0, the FastAPI backend, and the React frontend.

```bash
# 1. Clone repository
git clone <repo-url>
cd "BRANDTRACE AI"

# 2. Copy environment configuration
cp .env.example .env

# 3. Launch all containers in detached mode
docker-compose up -d --build
```

### Access URLs:
- **Frontend Control Plane:** `http://localhost:3000`
- **Backend API Docs (Swagger):** `http://localhost:8000/docs`
- **Backend Health & MongoDB Telemetry:** `http://localhost:8000/health`
- **MongoDB Database:** `mongodb://localhost:27017`

To inspect container logs:
```bash
docker-compose logs -f
```

---

## Option 2: Cloud Deployment (Vercel / Netlify + Render / Railway + MongoDB Atlas)

### Step 1: MongoDB Cluster Setup (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Obtain your connection URI:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=brandtrace
   ```

### Step 2: Backend Deployment (Render / Railway / Fly.io)
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn brandtrace.main:app --host 0.0.0.0 --port 8000`
- **Environment Variables:**
  - `PORT=8000`
  - `HOST=0.0.0.0`
  - `ENVIRONMENT=production`
  - `MONGODB_URI=<your-atlas-uri>`
  - `MONGODB_DB_NAME=brandtrace`
  - `LLM_PROVIDER=mock` (or your `GEMINI_API_KEY`)

### Step 3: Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
- **Root Directory:** `frontend`
- **Framework Preset:** `Vite`
- **Build Command:** `pnpm build` (or `npm run build`)
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL=https://your-backend-service.onrender.com`

---

## Option 3: Local Development (Without Docker)

### 1. Backend Engine
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run server with live reload:
uvicorn brandtrace.main:app --reload --port 8000
```
> **Note:** If MongoDB is running locally (`mongodb://localhost:27017`), BRANDTRACE connects automatically. If MongoDB is not running, BRANDTRACE will automatically engage its **in-memory fallback store** so the platform runs flawlessly without crashing!

### 2. Frontend Web App
```bash
cd frontend
pnpm install
pnpm dev
# Opens at http://localhost:5173
```
