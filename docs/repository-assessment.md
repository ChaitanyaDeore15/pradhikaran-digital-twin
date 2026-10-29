# Repository Assessment: Pradhikaran City Digital Twin

## 1. Executive Summary
- **Workspace Location**: `c:\Users\deore\Desktop\Final Project 3d model`
- **Assessment Date**: October 2026
- **Initial Workspace State**: Clean directory, no legacy code or conflicting dependencies detected.
- **Project Goal**: Knowledge-Graph-Enabled Urban Digital Twin for Predictive Infrastructure Maintenance, Simulation, and Citizen-Centric Decision Support (focused on a 1 km radius around PCCOE, Sector 26, Pradhikaran, Nigdi, Pimpri-Chinchwad, Pune, Maharashtra).

---

## 2. Environment & Host Toolchain Audit

| Tool | Version / Status | Impact & Strategy |
|---|---|---|
| **Operating System** | Windows 11 (PowerShell) | Native commands, cross-platform path handling required (`path.posix` / forward slashes in web/api). |
| **Node.js** | `v22.13.0` | Excellent modern runtime support for ESM, TypeScript, Express, and Vite. |
| **npm** | `10.9.2` | Monorepo workspaces (`npm workspaces`) supported out-of-the-box. |
| **Python** | `3.13.9` | Modern Python for FastAPI AI microservice, pandas, scikit-learn. |
| **Git** | `2.52.0` | Available for version control. |
| **Docker** | Not currently installed / not in PATH | Architecture must support **Dual-Execution Mode**: 1) Production Docker Compose orchestration, and 2) Standalone local development mode (Node API + Vite Frontend + Python FastAPI + local storage adapter) without hard Docker dependencies blocking local execution. |
| **PostgreSQL / PostGIS** | No native service in PATH | Database layer architected with a **Repository Pattern**: Full PostGIS spatial queries when connected to PostgreSQL + PostGIS, paired with a seamless development fallback spatial engine powered by `@turf/turf` + SQLite/GeoJSON for instant out-of-the-box local testing. |

---

## 3. Geographic Reference Verification

- **Reference Target**: Pimpri Chinchwad College of Engineering (PCCOE), Sector 26, Pradhikaran, Nigdi, Maharashtra.
- **OSM Nominatim Geocoding Verification**:
  - OSM Way ID: `177084644` (Place ID: `422058848`)
  - Class: `amenity: university`
  - Address: *Krantisinha Nana Patil Road, Nigdi, Pimpri-Chinchwad, Haveli Subdistrict, Pune, Maharashtra, 411044, India*
  - Polygon Bounding Box: `[18.6508868, 18.6546592, 73.7610553, 73.7631375]`
  - Centroid Coordinates: `18.652674, 73.762382`
  - Prompt Reference Coordinates: `18.651674, 73.761536` (Falls directly within campus boundary).
- **Study Area Radius**: 1,000 metres (1 km).
- **Study Area Area**: ~3.1416 sq km circular geodesic buffer.
- **Verification Status**: **VERIFIED** via OpenStreetMap Nominatim. Coordinates made strictly configurable via database and environment variables.

---

## 4. Architectural Structure

A modular monorepo structure will be established:
```text
pradhikaran-digital-twin/
├── apps/
│   ├── web/                  # React + Vite + TypeScript + CesiumJS 3D Viewport + Operational UI
│   └── api/                  # Node.js + Express + TypeScript + PostGIS/Spatial Repository + REST API (/api/v1)
├── services/
│   ├── ai/                   # Python FastAPI microservice (Image & text classification, maintenance risk)
│   └── ingestion/            # Automated OSM Overpass ingestion, clipping, deduplication, provenance tracking
├── database/
│   ├── migrations/           # Versioned SQL migrations
│   └── seeds/                # Seed scripts with verified study areas & labeled synthetic operational records
├── data/
│   ├── raw/                  # Cached Overpass geojson extracts
│   └── processed/            # Clipped and normalized features
├── docs/                     # Full system specifications, data dictionary, risk register, API contracts
└── docker-compose.yml        # Multi-container orchestration
```
