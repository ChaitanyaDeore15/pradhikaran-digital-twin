# Demonstration Guide: 7-Module End-to-End Walkthrough

Follow this step-by-step walkthrough to demonstrate the full functional capabilities of the **Pradhikaran Urban Digital Twin**.

---

## 1. 3D Geospatial Digital Twin View
1. Open `http://localhost:5173`.
2. Notice the CesiumJS 3D viewport automatically centered on **PCCOE Campus** (`18.651674°N, 73.761536°E`).
3. Observe the cyan **1 km geodesic study boundary ring** and the yellow **150 m connectivity road margin ring**.
4. Examine the 3D procedural buildings extruded from real OpenStreetMap footprints. Notice the visual color encoding:
   - Cyan/Slate buildings: Fallback estimated visual height (clearly labeled with warning badge).
   - Royal Blue buildings: Inferred from tagged `building:levels` or verified height tags.
5. In the top-left layer control panel, toggle individual scene layers:
   - *3D Buildings*, *Roads Network*, *Parks & Greens*, *1 km Boundary Ring*, *Grievance Pins*.
6. Click the Compass icon to reset the camera back to PCCOE center at any time.

---

## 2. Module A: Asset Registry & Inspection
1. Click any building (e.g. *PCCOE Academic Complex & Administrative Wing*) or road on the 3D map, or select the **Assets** tab in the top navigation bar.
2. The sidebar slides open displaying:
   - Stable Asset ID (e.g. `asset-bg-pccoe-main` / `asset-rd-krantisinha-patil`).
   - Ground truth data provenance: `OpenStreetMap contributors (ODbL 1.0)`.
   - Visual Extrusion Height ($18.5\text{ m}$) with explicit tag *"Inferred from levels"*.
3. Change the **Infrastructure Condition Status** from `GOOD` to `DEGRADED`.
4. Click outside to confirm the update persists immediately in the database.

---

## 3. Module B: AI Citizen Grievance Portal
1. Click the **Grievances** tab.
2. Observe active civic reports color-coded by severity, badged with explicit **`SYNTHETIC DEMO`** labels.
3. Click **Report Issue**:
   - Category: Select `Pothole / Road Damage`.
   - Severity: Select `SEVERE`.
   - Description: Enter *"Deep asphalt crater on Krantisinha Nana Patil road near Gate 2"*.
   - Coordinates: Defaulted to PCCOE gate (`18.6520, 73.7615`).
   - Click **Confirm Submission**.
4. Notice the system automatically matches the nearest road asset (`asset-rd-krantisinha-patil`), calculates a priority score ($85/100$), routes the issue to `dept-roads`, generates a new 3D red pin in CesiumJS, and creates a knowledge graph edge!
5. Test status transitions: Click **Mark In Progress** $\to$ **Mark Resolved**.

---

## 4. Module C: Intelligent Road-Network Routing
1. Click the **Routing** tab.
2. The system loads pre-configured waypoints:
   - Origin: PCCOE South Gate (`18.6470, 73.7600`).
   - Destination: Sector 26 North Corridor (`18.6590, 73.7628`).
3. Click **Calculate 3D Route**.
4. Observe the route calculated via Dijkstra's pathfinding over topological OSM road segments. A luminous blue polyline corridor appears across the road network in CesiumJS.
5. View total distance (e.g. $1,350\text{ m}$) and estimated travel duration.
6. Test **Road Closure Avoidance**: Under *Simulated Road Closure Avoidance*, select `Krantisinha Nana Patil Road` and click **Calculate 3D Route**. The engine re-routes traffic around the closed segment!

---

## 5. Module D: Predictive Infrastructure Maintenance
1. Click the **Maintenance** tab.
2. Review the ranked risk table: assets are classified into **LOW**, **MEDIUM**, **HIGH**, and **CRITICAL** risk tiers.
3. Examine the explainable breakdown card:
   - Base condition rating component.
   - Citizen complaint density penalty.
   - Incident severity penalty.
   - Road classification multiplier.
4. Select any asset in the dropdown and click **Evaluate Predictive Risk** to trigger on-demand inference.

---

## 6. Module E: Knowledge Graph Explorer
1. Click the **Graph** tab.
2. Select `Krantisinha Nana Patil Road` as the center entity.
3. View the connected multi-hop graph neighborhood:
   - Matched citizen grievances (`LOCATED_ON`).
   - Handling municipal department (`PCMC Road Infrastructure Maintenance`).
   - Associated work orders and risk predictions.
4. Click any connected node to dynamically pivot and traverse the graph.

---

## 7. Module F: Urban Scenario Simulation
1. Click the **Simulation** tab.
2. Select target road `Krantisinha Nana Patil Road` and click **Run Scenario Simulation**.
3. View the generated what-if impact assessment:
   - Impacted adjacent assets: $7$ municipal structures.
   - Active citizen grievances impacted: $2$ open reports.
   - Average detour time penalty: $+5\text{ minutes}$.
   - Explicit list of modeling assumptions and limitations.

---

## 8. Module G: Administrative Decision Support Dashboard
1. Click the **Metrics** tab.
2. Review real database-backed metrics:
   - Total mapped assets (buildings, roads, parks).
   - High-risk infrastructure count.
   - Grievance resolution counts (Open vs Resolved).
   - 3D building height completeness progress bar.
   - Real legal attribution to OpenStreetMap contributors.
