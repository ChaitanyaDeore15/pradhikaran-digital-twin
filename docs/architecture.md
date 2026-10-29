# System Architecture: Pradhikaran Urban Digital Twin

## 1. System Overview

The **Pradhikaran Urban Digital Twin** is an integrated geospatial, analytical, and operational platform designed for urban infrastructure monitoring, citizen grievance management, intelligent routing, knowledge-graph reasoning, and scenario simulation around the 1 km radius of Pimpri Chinchwad College of Engineering (PCCOE), Sector 26, Pradhikaran, Nigdi, Pimpri-Chinchwad, Pune.

```
+---------------------------------------------------------------------------------------------------+
|                                  USER / OPERATOR WORKSTATION                                      |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                     React + TypeScript + Vite Web Application (Port 5173)                   |  |
|  |                                                                                             |  |
|  |  +-------------------------------------+  +----------------------------------------------+  |  |
|  |  |        3D Geospatial Viewport       |  |           Operational Control Panels         |  |  |
|  |  |       (CesiumJS 3D Engine)          |  |                                              |  |  |
|  |  |  - Study Boundary & Margin Buffer   |  |  - Asset Registry & Inspection (Mod A)       |  |  |
|  |  |  - Extruded OSM 3D Buildings        |  |  - AI Citizen Grievance Portal (Mod B)       |  |  |
|  |  |  - Road Network & Centerlines       |  |  - Intelligent Network Routing (Mod C)       |  |  |
|  |  |  - Parks, Green Spaces, Amenities   |  |  - Predictive Maintenance Overlays (Mod D)   |  |  |
|  |  |  - Grievance & Hazard Pins          |  |  - Knowledge Graph Explorer (Mod E)          |  |  |
|  |  |  - Maintenance Risk Heatmaps        |  |  - Urban Scenario Simulation (Mod F)         |  |  |
|  |  |  - Route Polyline Overlays          |  |  - Admin Decision Support & Metrics (Mod G)  |  |  |
|  |  +-------------------------------------+  +----------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------------------+  |
+--------------------------------------------------+------------------------------------------------+
                                                   | HTTP / REST (/api/v1)
                                                   v
+---------------------------------------------------------------------------------------------------+
|                           BACKEND CORE API SERVICE (Node.js + Express + TS)                       |
|                                             (Port 3001)                                           |
|                                                                                                   |
|  +--------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  | Study Area Manager |  | Asset Registry &   |  | Grievance & Ticket  |  | Routing Engine     |  |
|  | & Geodesic Buffer  |  | Spatial Filtering  |  | Lifecycle Manager   |  | (Dijkstra / OSM)   |  |
|  +--------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  +--------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  | Knowledge Graph    |  | Scenario Simulator |  | Analytics & Quality |  | Auth & Role-Based  |  |
|  | Relational Store   |  | What-If Engine     |  | Audit Logger        |  | Access Control     |  |
|  +--------------------+  +--------------------+  +---------------------+  +--------------------+  |
|                                 |                                    |                            |
|                                 | HTTP RPC                           | SQL / Spatial Queries      |
|                                 v                                    v                            |
|                   +---------------------------+       +-------------------------------+           |
|                   | AI & ML MICROSERVICE      |       | POSTGIS / GEOSPATIAL DATABASE |           |
|                   | (Python + FastAPI)        |       | (PostgreSQL 16 + PostGIS 3.4) |           |
|                   | (Port 8000)               |       |                               |           |
|                   |                           |       | - study_areas                 |           |
|                   | - Complaint Classifier    |       | - assets (roads/bldgs/parks)  |           |
|                   | - Image Defect Detector   |       | - grievances & attachments    |           |
|                   | - Maintenance Risk Engine |       | - knowledge_edges             |           |
|                   | - Model Metric Registry   |       | - risk_predictions            |           |
|                   +---------------------------+       | - simulation_scenarios        |           |
|                                                       +-------------------------------+           |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Component Architecture

### 2.1 Frontend (`apps/web`)
- **Technology**: React 18, TypeScript (strict), Vite, CesiumJS, TailwindCSS / CSS Modules, Lucide icons, Recharts.
- **3D Geospatial Engine**: CesiumJS initializes centered on PCCOE (`18.651674, 73.761536`).
  - Renders geodesic circular study-area boundary (1,000 m radius) + road margin boundary.
  - Generates procedural 3D building extrusions from OSM building footprint polygons.
  - Distinguishes verified vs estimated building heights via visual encoding (color gradients, badges).
  - Interactivity: Raycasting / entity pick handler for instant asset inspection, grievance pin selection, and route visualization.
- **Operational UI Modules**:
  - **Module A (Asset Registry)**: Tabular & spatial search, attribute filtering, condition status.
  - **Module B (Grievance Portal)**: Citizen submission form with coordinates, photo upload, category selection, AI classification feedback, and admin lifecycle resolution.
  - **Module C (Intelligent Routing)**: Origin/destination picker, road-constrained routing, closure avoidance.
  - **Module D (Predictive Maintenance)**: Infrastructure risk heatmaps, feature explanation cards, inspection triggers.
  - **Module E (Knowledge Graph)**: Entity-to-entity relationship visualization (Road $\leftrightarrow$ Grievance $\leftrightarrow$ Department $\leftrightarrow$ Work Order).
  - **Module F (Urban Scenario Simulation)**: What-if road closure impact assessment, affected asset list.
  - **Module G (Decision Support Dashboard)**: Real-time aggregated database statistics, data quality metrics.

### 2.2 Core API Service (`apps/api`)
- **Technology**: Node.js 22, Express, TypeScript, Zod schema validation, JWT auth, Multer for file uploads.
- **API Routing**: REST endpoints strictly structured under `/api/v1/...`.
- **Database Access & Dual-Mode Spatial Engine**:
  - Primary mode: Native PostgreSQL with PostGIS extension for spatial queries (`ST_DWithin`, `ST_Intersects`, `ST_Buffer`, `ST_Distance`).
  - Fallback / Dev mode: In-process geospatial engine utilizing `@turf/turf` + persistent store to guarantee that developers can run the entire digital twin without mandatory Docker/PostgreSQL installation on day one.
- **Stable ID Strategy**: Consistent UUIDv4 / formatted identifier (`asset-rd-xxx`, `asset-bg-xxx`, `grv-xxx`) mapped across frontend, database, graph edges, and AI services.

### 2.3 AI & Machine Learning Microservice (`services/ai`)
- **Technology**: Python 3.13, FastAPI, Pydantic, Scikit-learn, NumPy, Pandas, Pillow.
- **Capabilities**:
  - Text Complaint Categorization: Multiclass TF-IDF + Logistic Regression / Naive Bayes pipeline for civic issues (potholes, waterlogging, waste accumulation, streetlights, damaged sidewalk).
  - Image Defect Screening: Lightweight computer vision classifier assessing visual indicators of road surface damage or water accumulation.
  - Infrastructure Risk Scorer: Interpretable risk prediction combining historical grievance frequency, asset age/type, road class, and inspection condition rating into a composite risk score $[0, 100]$ and priority category (Low, Medium, High, Critical).

### 2.4 Data Ingestion Pipeline (`services/ingestion`)
- **Sources**: OpenStreetMap via Overpass API queries, Nominatim geocoding.
- **Workflow**:
  1. Calculate geodesic buffer (center: `18.651674, 73.761536`, radius: `1000m` + `150m` road margin).
  2. Query Overpass API with bounding box `[south, west, north, east]`.
  3. Validate GeoJSON geometries and filter features.
  4. Deduplicate OSM IDs and assign persistent application asset IDs.
  5. Compute centroids, polygon areas, and road lengths.
  6. Classify height sources (`source_provided`, `estimated_by_floors`, `default_fallback`).
  7. Store in spatial database with comprehensive provenance and data-quality metadata.

---

## 3. Data Integrity & Non-Negotiables
1. **Provenance Enforcement**: Every single asset, grievance, and prediction records `is_synthetic`, `data_source`, and `verification_status`.
2. **Clear Labeling**: Synthetic operational demo records are explicitly badged in the UI with a persistent simulation banner.
3. **Google 3D Tiles Option**: Google Photorealistic 3D Tiles integration remains strictly optional via environment variable (`VITE_GOOGLE_MAPS_API_KEY`); when absent, CesiumJS seamlessly renders standard OpenStreetMap / Carto base tiles with procedural PostGIS 3D extruded geometry.
