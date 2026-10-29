# Data Dictionary: Relational & Geospatial Schema

## 1. Study Areas (`study_areas`)

Represents geographic bounds and configurable center coordinates of operational focus zones.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(64)` | PRIMARY KEY | Unique identifier (e.g. `sa-pccoe-1km`) |
| `name` | `VARCHAR(255)` | NOT NULL | Human-readable title |
| `center_latitude` | `DECIMAL(10, 7)` | NOT NULL | Reference latitude (e.g. `18.651674`) |
| `center_longitude` | `DECIMAL(10, 7)` | NOT NULL | Reference longitude (e.g. `73.761536`) |
| `radius_m` | `DECIMAL(10, 2)` | NOT NULL | Geodesic radius in meters (e.g. `1000.00`) |
| `margin_m` | `DECIMAL(10, 2)` | DEFAULT 150.00 | Connectivity road buffer in meters |
| `boundary_geojson` | `JSONB` / `GEOMETRY(Polygon, 4326)` | NOT NULL | Calculated polygon of the study perimeter |
| `source_name` | `VARCHAR(128)` | NOT NULL | Nominatim / Custom Operator verified source |
| `verification_status` | `VARCHAR(32)` | NOT NULL | `VERIFIED`, `PENDING_REVIEW`, `OPERATOR_MODIFIED` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Last update timestamp |

---

## 2. Core Assets (`assets`)

Unified registry for all spatial and municipal infrastructure entities.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(64)` | PRIMARY KEY | Stable unique asset identifier (e.g. `asset-rd-177084644`) |
| `study_area_id` | `VARCHAR(64)` | REFERENCES `study_areas(id)` | Foreign key to active study area |
| `external_source_id` | `VARCHAR(128)` | INDEXED | Original OSM ID (e.g. `osm-way-177084644`) |
| `asset_type` | `VARCHAR(32)` | NOT NULL, INDEXED | `road`, `building`, `park`, `junction`, `amenity` |
| `name` | `VARCHAR(255)` | | Human-friendly name |
| `geometry` | `JSONB` / `GEOMETRY(Geometry, 4326)` | NOT NULL | Full GeoJSON geometry (LineString, Polygon, Point) |
| `centroid` | `JSONB` / `GEOMETRY(Point, 4326)` | NOT NULL | Centroid coordinates for fast spatial distance |
| `condition_status` | `VARCHAR(32)` | NOT NULL | `EXCELLENT`, `GOOD`, `FAIR`, `DEGRADED`, `CRITICAL` |
| `criticality` | `VARCHAR(32)` | NOT NULL | `LOW`, `MEDIUM`, `HIGH`, `EMERGENCY_CORRIDOR` |
| `height_m` | `DECIMAL(6, 2)` | NULLABLE | 3D visual extrusion height |
| `height_source` | `VARCHAR(64)` | NOT NULL | `source_osm_tag`, `inferred_from_levels`, `default_visualization_fallback` |
| `height_is_estimated`| `BOOLEAN` | NOT NULL | Whether height is an approximation |
| `data_source` | `VARCHAR(128)` | NOT NULL | Origin of geometry |
| `is_synthetic` | `BOOLEAN` | NOT NULL DEFAULT FALSE | True only if synthesized |
| `metadata` | `JSONB` | DEFAULT '{}' | Subtype-specific attributes (road class, building levels, etc.) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Timestamp |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Timestamp |

---

## 3. Citizen Grievances (`grievances`)

Tracks civic infrastructure complaints reported by citizens or field teams.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(64)` | PRIMARY KEY | Unique complaint ID (e.g. `grv-2026-0012`) |
| `reporter_id` | `VARCHAR(64)` | NULLABLE | User ID if authenticated |
| `asset_id` | `VARCHAR(64)` | REFERENCES `assets(id)` | Matched nearby asset |
| `category` | `VARCHAR(64)` | NOT NULL | `pothole`, `waterlogging`, `damaged_sidewalk`, `waste_accumulation`, `broken_streetlight` |
| `description` | `TEXT` | NOT NULL | Citizen-submitted explanation |
| `latitude` | `DECIMAL(10, 7)` | NOT NULL | GPS latitude |
| `longitude` | `DECIMAL(10, 7)` | NOT NULL | GPS longitude |
| `status` | `VARCHAR(32)` | NOT NULL | `SUBMITTED`, `AI_CLASSIFIED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED` |
| `severity` | `VARCHAR(32)` | NOT NULL | `LOW`, `MODERATE`, `SEVERE`, `HAZARDOUS` |
| `priority_score` | `DECIMAL(5, 2)` | NOT NULL | Calculated score between 0.00 and 100.00 |
| `assigned_department_id` | `VARCHAR(64)` | REFERENCES `departments(id)` | Handling civic authority |
| `classification_result` | `VARCHAR(64)` | NULLABLE | AI predicted label |
| `classification_confidence` | `DECIMAL(4, 3)`| NULLABLE | AI confidence [0.000 to 1.000] |
| `image_url` | `VARCHAR(512)` | NULLABLE | Uploaded photo evidence URL |
| `is_synthetic` | `BOOLEAN` | NOT NULL DEFAULT FALSE | True for benchmark demonstration data |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Submission time |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Last update |
| `resolved_at` | `TIMESTAMPTZ` | NULLABLE | Time of resolution |

---

## 4. Departments (`departments`)

| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(64)` PRIMARY KEY | e.g. `dept-roads`, `dept-drainage`, `dept-sanitation`, `dept-electrical` |
| `name` | `VARCHAR(128)` NOT NULL | e.g. "PCMC Road Infrastructure Maintenance" |
| `contact_email` | `VARCHAR(128)` NOT NULL | Notification endpoint |
| `is_active` | `BOOLEAN` DEFAULT TRUE | Active status |

---

## 5. Maintenance Risk Predictions (`risk_predictions`)

| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(64)` PRIMARY KEY | Unique prediction identifier |
| `asset_id` | `VARCHAR(64)` REFERENCES `assets(id)` | Target infrastructure asset |
| `model_name` | `VARCHAR(64)` NOT NULL | e.g. `pradhikaran_infrastructure_risk_baseline_v1` |
| `model_version` | `VARCHAR(32)` NOT NULL | Semantic version (e.g. `1.0.0`) |
| `risk_score` | `DECIMAL(5, 2)` NOT NULL | Continuous score [0.00, 100.00] |
| `risk_category` | `VARCHAR(32)` NOT NULL | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `feature_summary` | `JSONB` NOT NULL | Key feature contributions (pothole count, age, road class) |
| `is_synthetic` | `BOOLEAN` NOT NULL | Labeled synthetic flag |
| `generated_at` | `TIMESTAMPTZ` DEFAULT NOW()| Inference timestamp |

---

## 6. Knowledge Graph Edges (`knowledge_edges`)

Relationally indexed directed knowledge graph for multi-hop urban decision support.

| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(64)` PRIMARY KEY | Edge ID |
| `source_type` | `VARCHAR(32)` NOT NULL | `asset`, `grievance`, `department`, `work_order` |
| `source_id` | `VARCHAR(64)` NOT NULL | Source entity key |
| `target_type` | `VARCHAR(32)` NOT NULL | `asset`, `grievance`, `department`, `work_order` |
| `target_id` | `VARCHAR(64)` NOT NULL | Target entity key |
| `relationship_type` | `VARCHAR(64)` NOT NULL | `CONNECTS_TO`, `CONTAINS`, `LOCATED_ON`, `ASSIGNED_TO`, `AFFECTED_BY`, `RESOLVED_BY` |
| `provenance` | `VARCHAR(64)` NOT NULL | `SPATIAL_TOPOLOGY`, `ADMINISTRATIVE_RULE`, `INCIDENT_CORRELATION` |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW()| Creation time |

---

## 7. Urban Scenario Simulations (`simulation_scenarios` & `simulation_results`)

| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(64)` PRIMARY KEY | Scenario ID |
| `name` | `VARCHAR(128)` NOT NULL | e.g. "Sector 26 Main Gate Road Closure & Drainage Repair" |
| `scenario_type` | `VARCHAR(64)` NOT NULL | `ROAD_CLOSURE`, `MONSOON_DRAINAGE_SURGE`, `PREVENTIVE_RESURFACING` |
| `proposed_configuration`| `JSONB` NOT NULL | Closed asset IDs, detour constraints, scheduled dates |
| `affected_asset_ids` | `JSONB` NOT NULL | Computed downstream cut-off assets |
| `affected_grievance_ids`| `JSONB` NOT NULL | Grievances on affected paths |
| `metrics` | `JSONB` NOT NULL | Detour delay delta, cost estimate, access reduction index |
