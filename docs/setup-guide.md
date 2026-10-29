# Setup & Run Guide: Pradhikaran Urban Digital Twin

## 1. Prerequisites
- **Node.js**: `v20+` or `v22+` (Installed: `v22.13.0`)
- **npm**: `10+` (Installed: `10.9.2`)
- **Python**: `3.10+` (Installed: `3.13.9`)
- **Git** (Installed)
- *(Optional)* **Docker & Docker Compose**: For containerized deployment.

---

## 2. Quickstart (Standalone Local Development Mode)

Because Docker or PostgreSQL may not be configured on every workstation, the system is architected with a **Dual-Mode Geospatial Engine**. The Express API features an embedded spatial repository powered by `@turf/turf` that runs out-of-the-box without requiring database setup!

### Step 1: Install Workspace Dependencies
```bash
npm install
```

### Step 2: Run Data Ingestion Pipeline (Phase 2 Real OSM Acquisition)
```bash
npm --workspace=services/ingestion run ingest
```
This queries OpenStreetMap Overpass for the PCCOE 1 km study area bounding box and normalizes roads, building footprints, heights, and parks into `data/processed/pradhikaran_assets.json`.

### Step 3: Run Backend API & Automated Tests
In a terminal:
```bash
# Run unit & integration test suite (Vitest + Supertest)
npm --workspace=apps/api run test

# Start the Express API server (Port 3001)
npm --workspace=apps/api run dev
```

### Step 4: Run Python AI Service (Optional / Parallel)
In a second terminal:
```bash
# Run AI model tests
python services/ai/tests/test_ai.py

# Launch FastAPI AI microservice (Port 8000)
uvicorn services.ai.app.main:app --port 8000 --reload
```

### Step 5: Launch React + CesiumJS 3D Frontend
In a third terminal:
```bash
npm --workspace=apps/web run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 3. Docker Compose Orchestration (Production Mode)

When Docker is available:
```bash
# Build and launch all 4 services: PostgreSQL/PostGIS, AI FastAPI, Express API, Vite Web
docker compose up --build
```
- Web UI: `http://localhost:5173`
- API Health: `http://localhost:3001/api/v1/health`
- AI Health: `http://localhost:8000/health`
- PostGIS: `localhost:5432`
