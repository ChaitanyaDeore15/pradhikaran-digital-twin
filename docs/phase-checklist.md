# Master Phase Implementation Checklist

## [x] PHASE 0: Inspection, Planning & Geographic Verification
- [x] Inspect existing workspace (confirmed empty clean slate).
- [x] Audit developer environment (Node `v22.13.0`, npm `10.9.2`, Python `3.13.9`, Git `2.52.0`, Docker absent).
- [x] Geographically verify reference point (PCCOE: OSM Way `177084644`, Place `422058848`, Lat `18.652674`, Lon `73.762382`).
- [x] Author architecture document (`docs/architecture.md`).
- [x] Author geographic data acquisition plan (`docs/geographic-data-sources.md`).
- [x] Author data dictionary & schema plan (`docs/data-dictionary.md`).
- [x] Author API contracts (`docs/api-contracts.md`).
- [x] Author technical risk register & cost assessment (`docs/risk-register.md`).
- [x] Establish phase checklist (`docs/phase-checklist.md`).

---

## [x] PHASE 1: Development Foundation & Monorepo Setup
- [x] Initialize monorepo root `package.json` with npm workspaces (`apps/web`, `apps/api`, `services/ingestion`).
- [x] Scaffold `apps/web` (React 18 + Vite + TypeScript + TailwindCSS + CesiumJS setup).
- [x] Scaffold `apps/api` (Node.js 22 + Express + TypeScript + Zod + REST router).
- [x] Scaffold `services/ai` (Python FastAPI + Scikit-learn + Pillow).
- [x] Create `docker-compose.yml` and `.env.example` configurations.
- [x] Implement dual-mode spatial repository (PostGIS adapter + Turf/spatial fallback for dev).
- [x] Verify health-check endpoints across services (`/api/v1/health`).
- [x] Build initial frontend shell with navigation layout and operational tabs.

---

## [x] PHASE 2: Real 3D Pradhikaran Model (PCCOE 1 km Study Area)
- [x] Generate configurable 1 km geodesic circular boundary + 150 m road margin.
- [x] Implement automated OSM data acquisition script for PCCOE bounding box (`services/ingestion/src/ingest.ts`).
- [x] Save authenticated offline snapshot in `data/raw/pccoe_pradhikaran_osm_extract.json`.
- [x] Import and normalize roads, building footprints, green spaces, and amenities into `data/processed/pradhikaran_assets.json`.
- [x] Classify building heights (verified vs level-inferred vs estimated visual default).
- [x] Integrate CesiumJS 3D viewer in React with camera centered at PCCOE (`18.651674°N, 73.761536°E`).
- [x] Procedurally extrude 3D buildings and render roads with stable asset IDs.
- [x] Add layer controls (Buildings, Roads, Green Spaces, Study Perimeter, Margin).
- [x] Implement raycast entity selection and asset inspector sidebar.
- [x] Keep Google 3D Tiles optional via environment flag.

---

## [x] PHASE 3: GIS and Asset Management (Module A)
- [x] Expose Asset REST endpoints (`/api/v1/assets`, `/api/v1/gis/assets.geojson`, `/api/v1/gis/nearby-assets`).
- [x] Implement spatial proximity queries and bounding-box filters.
- [x] Provide asset detail view with condition rating, criticality, and source provenance.
- [x] Add administrative asset condition status update capability.
- [x] Generate data quality metrics and attribution report.

---

## [x] PHASE 4: Authentication & Citizen Grievance Management (Module B)
- [x] Implement JWT authentication and role-based access control (Citizen, Field Officer, Admin).
- [x] Build citizen grievance reporting modal with coordinate picker, photo upload, and description.
- [x] Auto-match submitted grievance to nearest road or building asset.
- [x] Integrate text classification and severity/priority scoring ($[0, 100]$).
- [x] Route grievance to relevant municipal department (`dept-roads`, `dept-drainage`, etc.).
- [x] Display active grievances as interactive 3D pins in CesiumJS.
- [x] Implement status transitions (`SUBMITTED` $\to$ `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`).
- [x] Seed labeled benchmark synthetic complaints with simulation banner.

---

## [x] PHASE 5: Intelligent Road-Network Routing (Module C)
- [x] Build topological graph over imported OSM road segments and junctions.
- [x] Implement Dijkstra pathfinding engine respecting road connectivity.
- [x] Support origin and destination selection via coordinates or presets.
- [x] Render calculated route as glowing 3D polyline corridor in CesiumJS.
- [x] Support dynamic road closure and hazard avoidance.
- [x] Display distance (meters) and estimated travel duration.

---

## [x] PHASE 6: Predictive Infrastructure Maintenance & AI (Module D)
- [x] Build feature engineering pipeline (complaint count, age, road class, condition).
- [x] Implement transparent rule-based risk scoring baseline.
- [x] Implement Python FastAPI endpoint for ML risk inference & metric evaluations.
- [x] Expose risk overlays in 3D scene (color-coded roads from Low to Critical).
- [x] Provide explainable risk factor breakdown cards.

---

## [x] PHASE 7: Knowledge Graph (Module E)
- [x] Build relational graph edges connecting Assets $\leftrightarrow$ Grievances $\leftrightarrow$ Departments $\leftrightarrow$ Work Orders.
- [x] Expose multi-hop neighborhood queries (`/api/v1/graph/neighborhood`).
- [x] Render interactive node-edge relationship visualization in the frontend.
- [x] Implement decision support queries (e.g. repeated complaints, road closure impact).

---

## [x] PHASE 8: Urban Scenario Simulation (Module F)
- [x] Implement what-if simulation engine for proposed road closures and drainage work.
- [x] Compute cut-off assets, affected citizen grievances, and detour overhead.
- [x] Display baseline vs proposed side-by-side comparison metrics.
- [x] Persist simulation scenarios and results.

---

## [x] PHASE 9: Integration, Verification & Final Delivery
- [x] End-to-end integration test of all 7 operational modules.
- [x] Verify no fictional smart city data is shown; 100% grounded in real Pradhikaran OSM geometry.
- [x] Verify that all synthetic operational records are explicitly badged.
- [x] Confirm graceful operation without Google API credentials.
- [x] Produce final demonstration guide and backup/restore documentation.
