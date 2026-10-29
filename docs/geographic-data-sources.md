# Geographic Data Acquisition & Study Area Specification

## 1. Study Area Definition

- **Target Location**: Pimpri Chinchwad College of Engineering (PCCOE), Sector 26, Pradhikaran, Nigdi, Pimpri-Chinchwad, Pune, Maharashtra, India.
- **Reference Center Coordinates**:
  - Latitude: `18.651674° N`
  - Longitude: `73.761536° E`
- **Study Radius**: `1,000 meters` (1.0 km)
- **Road Connectivity Import Margin**: `+150 meters` (Total bounding query radius: `1,150 meters`)
  - *Purpose of margin*: Prevents clipping roads at the boundary to maintain graph topology and valid routing at perimeter junctions. Features between 1,000 m and 1,150 m are marked with `is_margin: true`.
- **Nominal Study Area**:
  $$\text{Area} = \pi \cdot r^2 = \pi \cdot (1.0\,\text{km})^2 \approx 3.1416\,\text{km}^2$$
- **Geodesic Bounding Box (WGS84 EPSG:4326)**:
  - 1 degree of latitude $\approx 111,320\text{ m} \implies \Delta\text{lat} \approx 0.01033^\circ$
  - 1 degree of longitude at $18.65^\circ \approx 111,320 \cdot \cos(18.65^\circ) \approx 105,475\text{ m} \implies \Delta\text{lon} \approx 0.01090^\circ$
  - **Query Bounding Box** (including 150m margin):
    - South: `18.641344`
    - North: `18.662004`
    - West: `73.750636`
    - East: `73.772436`

---

## 2. OpenStreetMap (OSM) Ingestion Specifications

### 2.1 Overpass API Query
The ingestion pipeline issues structured Overpass QL requests targeted strictly to the study area bounding box:

```text
[out:json][timeout:35];
(
  // Roads and highways
  way["highway"](18.641344, 73.750636, 18.662004, 73.772436);
  
  // Buildings footprints
  way["building"](18.641344, 73.750636, 18.662004, 73.772436);
  relation["building"](18.641344, 73.750636, 18.662004, 73.772436);
  
  // Green spaces & parks
  way["leisure"~"park|garden|pitch"](18.641344, 73.750636, 18.662004, 73.772436);
  
  // Public amenities & educational institutions
  node["amenity"](18.641344, 73.750636, 18.662004, 73.772436);
  way["amenity"](18.641344, 73.750636, 18.662004, 73.772436);
);
out body;
>;
out skel qt;
```

### 2.2 Public Overpass Endpoints & Fallback Strategy
To adhere to OSM Fair Use policies and handle intermittent network or rate limits:
1. **Primary Endpoint**: `https://overpass-api.de/api/interpreter`
2. **Secondary Endpoint**: `https://lz4.overpass-api.de/api/interpreter`
3. **Tertiary Endpoint**: `https://overpass.kumi.systems/api/interpreter`
4. **Offline Cached Snapshot**: A verified, pre-cached GeoJSON snapshot for the PCCOE 1 km study area will be committed under `data/raw/pccoe_pradhikaran_osm_extract.json`. If live network access fails or Overpass is throttled, the ingestion pipeline automatically falls back to this authenticated offline dataset, logs a clear warning, and completes the import without disruption.

---

## 3. Attribute Normalization & Height Strategy

OSM data contains incomplete 3D height metadata for residential and commercial structures. To maintain scientific integrity without fabricating municipal records:

| Scenario | Height Rule | `height_source` | `height_is_estimated` | Visual Presentation |
|---|---|---|---|---|
| Tag `height=*` present | Convert value to meters | `source_osm_tag` | `false` | Solid blue/slate shade with "Verified Height" tag |
| Tag `building:levels=*` present | $\text{Height} = \text{levels} \times 3.2\text{ m} + 1.0\text{ m}$ | `inferred_from_levels` | `true` | Amber-tinted extrusion with "Level-Inferred" tag |
| Both missing | Configurable fallback default (e.g. $8.0\text{ m}$ for 2-story residential) | `default_visualization_fallback` | `true` | Translucent cyan extrusion with "Estimated" warning |

**Strict Rule**: Inferred and fallback heights are strictly labeled as visual aids and are flagged with `height_is_estimated: true` in PostGIS. AI models and engineering assessments are prohibited from treating fallback visual heights as verified physical measurements.

---

## 4. Provenance & Attribution Tracking

Every imported geographic feature stores:
- `data_source`: `"OpenStreetMap Contributors"`
- `source_license`: `"Open Database License (ODbL) 1.0"`
- `source_url`: `"https://www.openstreetmap.org/copyright"`
- `attribution_required`: `"© OpenStreetMap contributors"`
- `import_timestamp`: ISO 8601 UTC timestamp
- `verification_status`: `"VERIFIED_GEOMETRY"`
