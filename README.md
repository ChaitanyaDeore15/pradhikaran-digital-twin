# Knowledge-Graph-Enabled Urban Digital Twin
## PCCOE 1 km Study Area — Sector 26, Pradhikaran, Nigdi, Pimpri-Chinchwad, Pune

A modular, data-driven urban Digital Twin focused on a 1 km radius around **Pimpri Chinchwad College of Engineering (PCCOE)**, Sector 26, Pradhikaran, Nigdi, Maharashtra, India (`18.651674° N, 73.761536° E`).

Integrates a geographically grounded **3D CesiumJS urban environment** with GIS asset management, AI-powered citizen grievance reporting, intelligent road routing, predictive infrastructure maintenance, multi-hop knowledge-graph reasoning, and urban scenario simulation.

---

## Key Highlights & Non-Negotiables
- **Real Geographic Grounding**: Grounded in OpenStreetMap data (ODbL 1.0) centered on PCCOE (OSM Way ID `177084644`).
- **No Paid Google Credentials Required**: Operates 100% open-source without requiring Google Maps API keys.
- **Dual-Mode Geospatial Engine**: Operates seamlessly with PostgreSQL/PostGIS in production, and provides an embedded `@turf/turf` spatial engine for instant out-of-the-box local development without requiring local Docker or PostgreSQL installations.
- **Ethics & Provenance**: All synthetic operational demo records are explicitly labeled with `is_synthetic: true`. 3D building visual height estimates are clearly distinguished from engineering-grade measurements.

---

## 7 Integrated Operational Modules

| Module | Purpose & Capabilities |
|---|---|
| **3D Geospatial Viewport** | CesiumJS engine rendering PCCOE campus, 1 km study boundary, 150m margin ring, 3D extruded buildings, road network polyline ribbons, and grievance pins. |
| **Module A: Asset Registry** | Unified registry for roads, buildings, and parks with spatial search, condition ratings, and data provenance. |
| **Module B: AI Grievance Management** | Citizen reporting form with GPS picker, severity scoring, auto-matching to nearest road, and department routing. |
| **Module C: Intelligent Routing** | Dijkstra pathfinding over topological OSM road network with road closure avoidance, distance, and duration. |
| **Module D: Predictive Maintenance** | Interpretable multi-factor asset risk scoring with explainable factor cards and priority tiers. |
| **Module E: Knowledge Graph** | Multi-hop relational graph connecting Assets $\leftrightarrow$ Grievances $\leftrightarrow$ Departments $\leftrightarrow$ Work Orders. |
| **Module F: Scenario Simulation** | What-if road closure impact assessment computing affected assets, isolated nodes, and detour overhead. |
| **Module G: Decision Support** | Real-time database metrics, 3D building height completeness breakdown, and compliance attribution. |

---

## Architecture & Monorepo Structure

```text
pradhikaran-digital-twin/
├── apps/
│   ├── web/                  # React 18 + Vite + TypeScript + CesiumJS 3D Viewport + Operational UI
│   └── api/                  # Node.js 22 + Express + TypeScript + Spatial Repository + REST API (/api/v1)
├── services/
│   ├── ai/                   # Python FastAPI microservice (Scikit-learn NLP & risk prediction)
│   └── ingestion/            # Automated OSM Overpass ingestion and geometry normalization
├── database/
│   └── migrations/           # PostGIS schema migrations (001_initial_schema.sql)
├── data/
│   ├── raw/                  # Cached Overpass extract snapshot
│   └── processed/            # Normalized GeoJSON assets
├── docs/                     # Full technical specifications, API contracts, model cards, setup guides
├── docker-compose.yml        # Multi-container orchestration
└── package.json              # Monorepo workspaces
```

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Data Ingestion (Acquire Real OSM Features)
```bash
npm --workspace=services/ingestion run ingest
```

### 3. Run Automated Tests
```bash
# Backend unit & integration test suite (Vitest + Supertest)
npm --workspace=apps/api run test

# Python AI pipeline tests
python services/ai/tests/test_ai.py
```

### 4. Start Development Servers
```bash
# Start backend API (Port 3001)
npm --workspace=apps/api run dev

# Start frontend Web App (Port 5173)
npm --workspace=apps/web run dev
```
Open **`http://localhost:5173`** in your browser.

---

## Documentation Index
- [Architecture Document](file:///c:/Users/deore/Desktop/Final%20Project%203d%20model/docs/architecture.md)
- [Geographic Data Sources & Height Strategy](file:///c:/Users/deore/Desktop/Final%20Project%203d%20model/docs/geographic-data-sources.md)
- [Data Dictionary & PostGIS Schema](file:///c:/Users/deore/Desktop/Final%20Project%203d%20model/docs/data-dictionary.md)
- [REST API Contracts (/api/v1)](file:///c:/Users/deore/Desktop/Final%20Project%203d%20model/docs/api-contracts.md)
- [Demonstration & Walkthrough Guide](file:///c:/Users/deore/Desktop/Final%20Project%203d%20model/docs/demonstration-guide.md)
- [AI Model Cards](file:///c:/Users/deore/Desktop/Final%20Project%203d%20model/docs/ai-model-cards.md)
- [Setup & Deployment Guide](file:///c:/Users/deore/Desktop/Final%20Project%203d%20model/docs/setup-guide.md)
- [Risk Register](file:///c:/Users/deore/Desktop/Final%20Project%203d%20model/docs/risk-register.md)
- [Phase Checklist](file:///c:/Users/deore/Desktop/Final%20Project%203d%20model/docs/phase-checklist.md)
