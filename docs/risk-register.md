# Technical Risk Register & External Dependency Cost Assessment

## 1. Technical Risk Register

| Risk ID | Risk Description | Severity | Likelihood | Mitigation Strategy |
|---|---|---|---|---|
| **TR-01** | **Docker Daemon Unavailable on Dev Host**<br>Windows environment lacks Docker in PATH. Running containerized multi-service stack could block local development. | High | Certain | Provide Docker Compose for production/CI, while designing the local backend and frontend to run cleanly as native Node/npm and Python processes. Implement an in-memory/SpatiaLite/@turf spatial repository fallback for local dev. |
| **TR-02** | **Overpass API Rate Limiting & Intermittent Downtime**<br>Public Overpass instances may throttle queries or fail during bulk fetch. | Medium | Moderate | 1) Multi-endpoint fallback list (`overpass-api.de`, `kumi.systems`, `lz4`).<br>2) Commit an authenticated offline PCCOE 1 km snapshot into `data/raw/` so development and tests never block on external internet downtime. |
| **TR-03** | **Missing 3D Building Heights in OSM**<br>Most Indian municipal OSM footprints lack explicit building height or level tags. | Medium | Certain | Implement clear height attribution hierarchy: 1) `height` tag, 2) inferred from `building:levels` ($levels \times 3.2\text{m} + 1\text{m}$), 3) default visual fallback ($8\text{m}$). Clearly label visual fallbacks in CesiumJS and explicitly set `height_is_estimated: true`. Prohibit AI models from using visual approximations as ground truth. |
| **TR-04** | **CesiumJS Token & Tile Access**<br>Cesium ion default assets require an access token. | Low | Low | CesiumJS works completely standalone with open raster/vector providers (OpenStreetMap, Carto, Natural Earth). Provide a default open Carto/OSM imagery layer so no paid Cesium ion token is strictly required. |
| **TR-05** | **Google Photorealistic 3D Tiles Dependency**<br>Requires Google Cloud API key, billing account, and Map Tiles API enablement. | Low | Low | Make Google 3D Tiles strictly optional via environment variable (`VITE_GOOGLE_MAPS_API_KEY`). The core digital twin renders natively using procedural 3D PostGIS geometry without Google Maps API credentials. |
| **TR-06** | **Topological Road Connectivity at 1 km Boundary**<br>Clipping roads strictly at 1,000 m could create dead-end dangling nodes at the perimeter. | Medium | Moderate | Ingest a +150 m road buffer margin (1,150 m total). Flag margin assets with `is_margin: true` and display only within the 1 km boundary by default while preserving network graph topology. |

---

## 2. External Dependency & Cost Assessment

| Service / Dependency | Usage | Cost / Tier | Fallback if Unavailable |
|---|---|---|---|
| **OpenStreetMap Overpass API** | Geographic feature retrieval (roads, footprints, parks) | Free / Open Database License (ODbL) | Local pre-cached extract in `data/raw/pccoe_pradhikaran_osm_extract.json` |
| **OSM Nominatim** | Reference coordinate geocoding | Free (Subject to 1 req/sec max and User-Agent) | Hardcoded verified PCCOE reference coordinates |
| **CesiumJS Engine** | WebGL 3D Geospatial client engine | Apache 2.0 (Open Source) | 100% Free / Local build |
| **PostgreSQL + PostGIS** | Spatial database | Open Source (PostgreSQL License) | Node.js `@turf/turf` in-process spatial engine for dev |
| **Python FastAPI + Scikit-Learn** | AI classification & risk inference | Open Source (MIT/BSD) | Transparent rule-based fallback inside API service |
| **Google Photorealistic 3D Tiles** | Optional visual photogrammetry layer | Commercial / Google Cloud (Free monthly tier $200 credit) | Pure CesiumJS + PostGIS procedural 3D model (100% Free) |
| **Total Estimated Cost for Project** | **$0.00 USD (Fully operable with 100% free and open-source stack)** |
