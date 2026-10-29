# API Contracts: REST Interface Specification (`/api/v1`)

All endpoints return uniform JSON responses. Errors follow RFC 7807 Problem Details.

```json
{
  "success": true,
  "data": { ... },
  "metadata": { ... }
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_COORDINATES",
    "message": "Coordinates fall outside the 1 km study area boundary",
    "details": []
  }
}
```

---

## 1. Study Areas & Boundary Configuration

### `GET /api/v1/study-areas`
Returns active study areas, including center coordinates, radius, and boundary GeoJSON.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "sa-pccoe-1km",
      "name": "PCCOE Pradhikaran 1 km Study Area",
      "centerLatitude": 18.651674,
      "centerLongitude": 73.761536,
      "radiusMeters": 1000,
      "marginMeters": 150,
      "boundaryGeoJson": {
        "type": "Polygon",
        "coordinates": [[[73.7615, 18.6606], ...]]
      },
      "verificationStatus": "VERIFIED"
    }
  ]
}
```

### `PATCH /api/v1/study-areas/:id`
Allows authorized operators to adjust the center coordinate or radius.

---

## 2. GIS & Assets Registry (Module A)

### `GET /api/v1/gis/assets.geojson`
Returns GeoJSON FeatureCollection of all roads, buildings, and green spaces filtered by bounds or asset type.
- **Query Params**:
  - `type`: `road` | `building` | `park` | `amenity` (optional)
  - `include_margin`: `boolean` (default `false`)
- **Response `200 OK`**: GeoJSON FeatureCollection with attributes: `id`, `name`, `assetType`, `heightM`, `heightIsEstimated`, `conditionStatus`.

### `GET /api/v1/assets/:id`
Retrieves detailed asset entity, geometry, provenance, and operational links.

### `GET /api/v1/gis/nearby-assets`
- **Query Params**: `lat`, `lon`, `radius_m` (default: 50m)
- **Response `200 OK`**: Ordered array of assets by distance.

---

## 3. Grievance Management (Module B)

### `POST /api/v1/grievances`
Submit a new citizen grievance.
- **Payload**:
```json
{
  "category": "pothole",
  "description": "Deep asphalt crater on Krantisinha Nana Patil road near Gate 2",
  "latitude": 18.6521,
  "longitude": 73.7620,
  "imageUrl": "/uploads/evidence-01.jpg"
}
```
- **Response `201 Created`**: Returns created grievance with auto-assigned nearby asset ID, priority score, and assigned department.

### `GET /api/v1/grievances`
List grievances with filters: `status`, `category`, `severity`, `asset_id`.

### `PATCH /api/v1/grievances/:id/status`
Updates status (`IN_PROGRESS`, `RESOLVED`, `REJECTED`) with an audit remark.

---

## 4. Intelligent Routing (Module C)

### `POST /api/v1/routes`
Calculates optimal road-constrained path between two points.
- **Payload**:
```json
{
  "origin": { "latitude": 18.6510, "longitude": 73.7550 },
  "destination": { "latitude": 18.6535, "longitude": 73.7630 },
  "avoidAssetIds": ["asset-rd-177084644"]
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "distanceMeters": 1420.5,
    "estimatedDurationSeconds": 170,
    "routeGeometry": {
      "type": "LineString",
      "coordinates": [[73.7550, 18.6510], ...]
    },
    "traversedAssetIds": ["asset-rd-001", "asset-rd-004"],
    "routingEngine": "Pradhikaran Topological OSM Graph v1"
  }
}
```

---

## 5. Predictive Maintenance & AI (Module D & AI Service)

### `GET /api/v1/maintenance/risks`
Returns asset risk rankings, contributing factors, and suggested inspection priority.

### `POST /api/v1/ai/classify-text`
Proxies complaint description to FastAPI classifier.
- **Payload**: `{ "text": "Stagnant stormwater overflowing gutter on sector 26 lane 4" }`
- **Response `200 OK`**: `{ "category": "waterlogging", "confidence": 0.942 }`

### `POST /api/v1/ai/classify-image`
Multi-part photo upload returns detected civic defects.

---

## 6. Knowledge Graph & Scenario Simulation (Modules E & F)

### `GET /api/v1/graph/neighborhood`
- **Query Params**: `entityType`, `entityId`, `depth` (default: 1)
- **Response `200 OK`**: Graph nodes and edges connecting Assets, Departments, Grievances, and Work Orders.

### `POST /api/v1/simulations/run`
Simulates a road closure or maintenance intervention.
- **Payload**:
```json
{
  "scenarioType": "ROAD_CLOSURE",
  "closedAssetIds": ["asset-rd-177084644"],
  "name": "PCCOE North Perimeter Resurfacing"
}
```
- **Response `200 OK`**: Affected assets, isolated access nodes, active grievances impacted, detour overhead metrics.

---

## 7. Analytics & Data Quality (Module G)

### `GET /api/v1/analytics/overview`
Aggregated counts: total mapped assets (roads, buildings, amenities), open complaints, resolved complaints, high-risk assets, and verified vs estimated percentage.
