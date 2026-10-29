import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { Asset, Grievance, RouteResult, StudyArea } from '../../types';
import { Compass, Layers, ShieldCheck, Eye, EyeOff, ZoomIn, Building2, MapPin, Navigation, Crosshair, X, ChevronRight } from 'lucide-react';

interface CesiumViewerProps {
  studyArea: StudyArea | null;
  assets: Asset[];
  grievances: Grievance[];
  activeRoute: RouteResult | null;
  selectedAsset: Asset | null;
  onSelectAsset: (asset: Asset | null) => void;
  selectedGrievance?: Grievance | null;
  onSelectGrievance?: (grievance: Grievance | null) => void;
  flyToGrievance?: Grievance | null;
  onClearFlyToGrievance?: () => void;
  onOpenDepartmentDashboard?: () => void;
  pickingMode?: 'none' | 'origin' | 'destination';
  originPoint?: { latitude: number; longitude: number; name?: string } | null;
  destPoint?: { latitude: number; longitude: number; name?: string } | null;
  onSelectLocation?: (point: { latitude: number; longitude: number; name: string }) => void;
  onCancelPicking?: () => void;
}

export const CesiumViewer: React.FC<CesiumViewerProps> = ({
  studyArea,
  assets,
  grievances,
  activeRoute,
  selectedAsset,
  onSelectAsset,
  selectedGrievance,
  onSelectGrievance,
  flyToGrievance,
  onClearFlyToGrievance,
  onOpenDepartmentDashboard,
  pickingMode = 'none',
  originPoint = null,
  destPoint = null,
  onSelectLocation,
  onCancelPicking,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const osmBuildingsTilesetRef = useRef<any>(null);

  // Sync refs for event handlers
  const pickingModeRef = useRef(pickingMode);
  pickingModeRef.current = pickingMode;
  const onSelectLocationRef = useRef(onSelectLocation);
  onSelectLocationRef.current = onSelectLocation;

  // Layer toggles
  const [show3DBuildings, setShow3DBuildings] = useState(true);
  const [showBuildingLabels, setShowBuildingLabels] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showGrievances, setShowGrievances] = useState(true);
  const [showResolvedGrievances, setShowResolvedGrievances] = useState(false);

  // Entity collections
  const roadEntitiesRef = useRef<Cesium.Entity[]>([]);
  const grievanceEntitiesRef = useRef<Cesium.Entity[]>([]);
  const boundaryEntitiesRef = useRef<Cesium.Entity[]>([]);
  const routeEntitiesRef = useRef<Cesium.Entity[]>([]);
  const highlightEntitiesRef = useRef<Cesium.Entity[]>([]);
  const buildingLabelEntitiesRef = useRef<Cesium.Entity[]>([]);
  const waypointEntitiesRef = useRef<Cesium.Entity[]>([]);
  const focusBeaconEntitiesRef = useRef<Cesium.Entity[]>([]);

  // 1. Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const ionToken =
      import.meta.env.VITE_CESIUM_ION_TOKEN ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IkFMUlBNNnVsZnMydHhFUWciLCJqdGkiOiJjMmRjNjliNS04NjFkLTQ5NTItODliNy1lNDI4NzhjMjg5NDAiLCJpZCI6NTI0MjA4LCJzdWIiOiJDaGFpdGFueWEgRGVvcmUiLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoiRGlnaXRhbCBUd2luIiwiaWF0IjoxNzkxOTcyNjY1fQ.6L42uiksk9lS56gcr11CjkGsV0QyyqwlJlBpg6nbYT8';

    Cesium.Ion.defaultAccessToken = ionToken;

    // Use Cesium Ion Aerial Satellite Imagery with high-contrast labels
    const baseImageryLayer = Cesium.ImageryLayer.fromProviderAsync(
      Cesium.createWorldImageryAsync({
        style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS,
      })
    );

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      baseLayer: baseImageryLayer,
      terrain: Cesium.Terrain.fromWorldTerrain({
        requestVertexNormals: true,
        requestWaterMask: true,
      }),
    });

    viewer.scene.globe.show = true;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b1120');
    viewer.scene.globe.depthTestAgainstTerrain = true;

    // Load REAL 3D OpenStreetMap Buildings from Cesium Ion (Worldwide building models)
    Cesium.createOsmBuildingsAsync({
      defaultColor: Cesium.Color.fromCssColorString('#f8fafc'),
    })
      .then(tileset => {
        osmBuildingsTilesetRef.current = tileset;
        // Apply modern architectural styling to 3D buildings
        tileset.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${feature['building']} === 'university'", "color('#38bdf8', 0.95)"],
              ["${feature['building']} === 'commercial'", "color('#cbd5e1', 0.9)"],
              ["true", "color('#f1f5f9', 0.88)"],
            ],
          },
        });
        viewer.scene.primitives.add(tileset);
      })
      .catch(err => {
        console.warn('Cesium OSM 3D buildings fallback:', err);
      });

    // Initial cinematic 3D perspective looking at PCCOE Campus (ground elevation ~580m in Pune)
    const centerLat = studyArea?.centerLatitude || 18.651674;
    const centerLon = studyArea?.centerLongitude || 73.761536;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0055, 950),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-35), // Natural 35-degree tilted ground perspective
        roll: 0.0,
      },
    });

    // Raycast Pick Handler with Interactive Waypoint Selection
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      let clickedPoint: { latitude: number; longitude: number; name: string } | null = null;
      const pickedObject = viewer.scene.pick(click.position);

      if (Cesium.defined(pickedObject) && pickedObject.id?._customAsset) {
        const a = pickedObject.id._customAsset;
        clickedPoint = {
          latitude: a.centroid ? a.centroid[1] : a.geometry.coordinates[0][0][1],
          longitude: a.centroid ? a.centroid[0] : a.geometry.coordinates[0][0][0],
          name: a.name,
        };
      } else {
        const ray = viewer.camera.getPickRay(click.position);
        if (ray) {
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            clickedPoint = {
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lon.toFixed(6)),
              name: `Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`,
            };
          }
        }
      }

      // If in interactive waypoint picking mode (Origin or Destination)
      if (pickingModeRef.current && pickingModeRef.current !== 'none' && clickedPoint && onSelectLocationRef.current) {
        onSelectLocationRef.current(clickedPoint);
        return;
      }

      // Normal map entity selection
      if (Cesium.defined(pickedObject)) {
        if (pickedObject.id?._customAsset) {
          onSelectAsset(pickedObject.id._customAsset);
        } else if (pickedObject.id?._customGrievance && onSelectGrievance) {
          onSelectGrievance(pickedObject.id._customGrievance);
        }
      } else {
        onSelectAsset(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // 2. Toggle 3D Buildings Tileset
  useEffect(() => {
    if (osmBuildingsTilesetRef.current) {
      osmBuildingsTilesetRef.current.show = show3DBuildings;
    }
  }, [show3DBuildings]);

  // 3. Render 1 km Geodesic Study Boundary (Clean, thin glowing boundary ring)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    boundaryEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    boundaryEntitiesRef.current = [];

    const centerLat = studyArea?.centerLatitude || 18.651674;
    const centerLon = studyArea?.centerLongitude || 73.761536;
    const radiusM = studyArea?.radiusM || 1000;
    const marginM = studyArea?.marginM || 150;

    // Primary 1 km Study Boundary (Clean thin cyan ring clamped to terrain)
    const primaryRing = viewer.entities.add({
      name: '1 km Study Area Boundary',
      show: showBoundary,
      position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat),
      ellipse: {
        semiMinorAxis: radiusM,
        semiMajorAxis: radiusM,
        material: Cesium.Color.CYAN.withAlpha(0.04), // subtle, not covering houses
        outline: true,
        outlineColor: Cesium.Color.CYAN.withAlpha(0.85),
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });

    // 150 m Margin Ring (Thin dashed amber ring clamped to terrain)
    const marginRing = viewer.entities.add({
      name: '150 m Connectivity Road Margin',
      show: showBoundary,
      position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat),
      ellipse: {
        semiMinorAxis: radiusM + marginM,
        semiMajorAxis: radiusM + marginM,
        material: Cesium.Color.TRANSPARENT,
        outline: true,
        outlineColor: Cesium.Color.YELLOW.withAlpha(0.5),
        outlineWidth: 1.5,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });

    // PCCOE Reference Marker (Small pulsing beacon clamped to terrain)
    const centerMarker = viewer.entities.add({
      name: 'PCCOE Reference Center',
      show: showBoundary,
      position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat),
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: 'PCCOE Campus Center',
        font: 'bold 11px sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3000), // Hide when zoomed out
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    boundaryEntitiesRef.current = [primaryRing, marginRing, centerMarker];
  }, [studyArea, showBoundary]);

  // Smooth camera fly-to when study area is switched (e.g. PCCOE 1 km vs PCMC City-Wide)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !studyArea) return;

    const lat = studyArea.centerLatitude || 18.651674;
    const lon = studyArea.centerLongitude || 73.761536;
    const radiusM = studyArea.radiusM || 1000;
    const cameraHeight = Math.max(950, radiusM * 2.2);
    const latOffset = (radiusM / 1000) * 0.0055;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat - latOffset, cameraHeight),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-38),
        roll: 0.0,
      },
      duration: 1.8,
    });
  }, [studyArea?.id]);

  // 4. Render Road Networks & Highlights
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    roadEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    highlightEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    roadEntitiesRef.current = [];
    highlightEntitiesRef.current = [];

    assets.forEach(asset => {
      // Roads (High-visibility luminous ribbons clamped to terrain ground)
      if (asset.assetType === 'road' && asset.geometry.type === 'LineString') {
        const flatCoords: number[] = [];
        asset.geometry.coordinates.forEach(([lon, lat]: [number, number]) => {
          flatCoords.push(lon, lat);
        });

        const isSelected = selectedAsset?.id === asset.id;
        let roadColor = Cesium.Color.fromCssColorString('#f8fafc');

        if (asset.conditionStatus === 'CRITICAL' || asset.conditionStatus === 'DEGRADED') {
          roadColor = Cesium.Color.fromCssColorString('#f97316'); // Alert orange
        }
        if (isSelected) {
          roadColor = Cesium.Color.YELLOW;
        }

        const roadEntity = viewer.entities.add({
          name: asset.name,
          show: showRoads,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            clampToGround: true, // Seamlessly drapes over terrain
            width: isSelected ? 6 : 3.5,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              color: roadColor,
            }),
          },
        });
        (roadEntity as any)._customAsset = asset;
        roadEntitiesRef.current.push(roadEntity);
      }

      // Highlight selected building with an elegant bounding perimeter clamped to terrain
      if (selectedAsset?.id === asset.id && asset.assetType === 'building' && asset.geometry.type === 'Polygon') {
        const flatCoords: number[] = [];
        asset.geometry.coordinates[0].forEach(([lon, lat]: [number, number]) => {
          flatCoords.push(lon, lat);
        });

        const highlightEntity = viewer.entities.add({
          name: `Selected: ${asset.name}`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            clampToGround: true, // Clamped to ground
            width: 4,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.35,
              color: Cesium.Color.YELLOW,
            }),
          },
        });
        highlightEntitiesRef.current.push(highlightEntity);
      }
    });
  }, [assets, selectedAsset, showRoads]);

  // 5. Render Grievances as Clean Interactive Pins Clamped to Ground
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    grievanceEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    grievanceEntitiesRef.current = [];

    grievances.forEach(g => {
      // Remove resolved complaints from the 3D map by default (show only when history archive layer is enabled)
      if (g.status === 'RESOLVED' && !showResolvedGrievances) {
        return;
      }

      let pinColor = Cesium.Color.fromCssColorString('#eab308'); // yellow
      if (g.severity === 'HAZARDOUS' || g.severity === 'SEVERE') {
        pinColor = Cesium.Color.fromCssColorString('#ef4444'); // red
      } else if (g.status === 'RESOLVED') {
        pinColor = Cesium.Color.fromCssColorString('#10b981'); // emerald
      }

      const grvEntity = viewer.entities.add({
        name: `Grievance: ${g.category}`,
        show: showGrievances,
        position: Cesium.Cartesian3.fromDegrees(g.longitude, g.latitude),
        point: {
          pixelSize: 10,
          color: pinColor,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `[${g.category.toUpperCase()}]`,
          font: 'bold 10px sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1200), // Clean: only visible when zoomed in close
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      (grvEntity as any)._customGrievance = g;
      grievanceEntitiesRef.current.push(grvEntity);
    });
  }, [grievances, showGrievances, showResolvedGrievances]);

  // 6. Active Calculated Route (Clamped to Terrain)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    routeEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    routeEntitiesRef.current = [];

    if (activeRoute && activeRoute.routeGeometry?.coordinates) {
      const flatCoords: number[] = [];
      activeRoute.routeGeometry.coordinates.forEach(([lon, lat]: [number, number]) => {
        flatCoords.push(lon, lat);
      });

      const routeEntity = viewer.entities.add({
        name: 'Active Route',
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          clampToGround: true, // Hugs the road elevation
          width: 6,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.35,
            color: Cesium.Color.fromCssColorString('#06b6d4'),
          }),
        },
      });
      routeEntitiesRef.current.push(routeEntity);
    }
  }, [activeRoute]);

  // 7. Render 3D Floating Building & Facility Name Labels
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    buildingLabelEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    buildingLabelEntitiesRef.current = [];

    if (!showBuildingLabels) return;

    assets.forEach(asset => {
      if ((asset.assetType === 'building' || asset.assetType === 'park') && asset.centroid) {
        const [lon, lat] = asset.centroid;
        const isBuilding = asset.assetType === 'building';
        const icon = isBuilding ? '🏢' : '🌳';
        const elevationAboveGround = isBuilding ? (asset.heightM || 14) + 8 : 4;

        const labelEntity = viewer.entities.add({
          name: asset.name,
          position: Cesium.Cartesian3.fromDegrees(lon, lat, elevationAboveGround),
          point: {
            pixelSize: 6,
            color: isBuilding ? Cesium.Color.fromCssColorString('#38bdf8') : Cesium.Color.fromCssColorString('#4ade80'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1.5,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: `${icon} ${asset.name}`,
            font: 'bold 11px sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2.5,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#020617').withAlpha(0.85),
            backgroundPadding: new Cesium.Cartesian2(6, 4),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2400), // Visible when close to campus
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
        (labelEntity as any)._customAsset = asset;
        buildingLabelEntitiesRef.current.push(labelEntity);
      }
    });
  }, [assets, showBuildingLabels]);

  // 8. Render Interactive Origin & Destination Waypoint Pins
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    waypointEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    waypointEntitiesRef.current = [];

    // Origin Pin (Green)
    if (originPoint) {
      const originPin = viewer.entities.add({
        name: `Origin (A): ${originPoint.name || 'Selected Point'}`,
        position: Cesium.Cartesian3.fromDegrees(originPoint.longitude, originPoint.latitude),
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromCssColorString('#10b981'), // Emerald green
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `🟢 ORIGIN (A): ${originPoint.name || 'Selected Point'}`,
          font: 'bold 11px sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2.5,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#064e3b').withAlpha(0.9),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      waypointEntitiesRef.current.push(originPin);
    }

    // Destination Pin (Red)
    if (destPoint) {
      const destPin = viewer.entities.add({
        name: `Destination (B): ${destPoint.name || 'Selected Point'}`,
        position: Cesium.Cartesian3.fromDegrees(destPoint.longitude, destPoint.latitude),
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromCssColorString('#ef4444'), // Crimson red
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `🔴 DESTINATION (B): ${destPoint.name || 'Selected Point'}`,
          font: 'bold 11px sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2.5,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#7f1d1d').withAlpha(0.9),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      waypointEntitiesRef.current.push(destPin);
    }
  }, [originPoint, destPoint]);

  // 9. Camera Flight & High-Visibility Beacon for Selected / Authority-Focused Grievance
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Clear previous focus entities
    focusBeaconEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    focusBeaconEntitiesRef.current = [];

    const target = flyToGrievance || selectedGrievance;
    if (!target) return;

    const lon = target.longitude;
    const lat = target.latitude;

    // Smooth camera swoop down to the grievance coordinates in tilted 3D view
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat - 0.0022, 780),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-38),
        roll: 0.0,
      },
      duration: 1.5,
    });

    // 1. Ground Glowing Pulsing Radar Ring
    const radarRing = viewer.entities.add({
      name: `Active Focus Radar: ${target.category}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      ellipse: {
        semiMinorAxis: 28,
        semiMajorAxis: 28,
        material: Cesium.Color.fromCssColorString('#f43f5e').withAlpha(0.35),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#fda4af'),
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
    focusBeaconEntitiesRef.current.push(radarRing);

    // 2. High-Visibility Ground Ring (Outer Aura)
    const outerAura = viewer.entities.add({
      name: `Active Focus Aura: ${target.category}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      ellipse: {
        semiMinorAxis: 55,
        semiMajorAxis: 55,
        material: Cesium.Color.fromCssColorString('#fb7185').withAlpha(0.15),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#f43f5e').withAlpha(0.7),
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
    focusBeaconEntitiesRef.current.push(outerAura);

    // 3. Glowing Vertical Light Beam clamped to point
    const beam = viewer.entities.add({
      name: `Active Focus Beam: ${target.category}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 25),
      cylinder: {
        length: 50,
        topRadius: 1.5,
        bottomRadius: 6,
        material: Cesium.Color.fromCssColorString('#f43f5e').withAlpha(0.65),
      },
    });
    focusBeaconEntitiesRef.current.push(beam);

    // 4. Floating 3D Target Marker with Category & Severity
    const floatingTag = viewer.entities.add({
      name: `Active Focus Tag: ${target.category}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 55),
      point: {
        pixelSize: 16,
        color: Cesium.Color.fromCssColorString('#e11d48'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `📍 [${target.severity}] ${target.category.toUpperCase()}\n${target.id}`,
        font: 'bold 12px sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#881337').withAlpha(0.92),
        backgroundPadding: new Cesium.Cartesian2(8, 6),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    focusBeaconEntitiesRef.current.push(floatingTag);
  }, [flyToGrievance]);

  // Camera Presets (Calibrated for Pune ~580m Ground Elevation)
  const flyToPreset = (type: 'pccoe' | 'spine' | 'overview') => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (type === 'pccoe') {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(73.761536, 18.651674 - 0.004, 920),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-35),
          roll: 0.0,
        },
        duration: 1.2,
      });
    } else if (type === 'spine') {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(73.761055, 18.6520 - 0.007, 1350),
        orientation: {
          heading: Cesium.Math.toRadians(45),
          pitch: Cesium.Math.toRadians(-40),
          roll: 0.0,
        },
        duration: 1.2,
      });
    } else if (type === 'overview') {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(73.761536, 18.651674 - 0.012, 2800),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-55),
          roll: 0.0,
        },
        duration: 1.2,
      });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <div ref={containerRef} className="w-full h-full" />

      {/* Quick View Presets Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 min-w-[230px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <span className="text-xs font-bold tracking-wider text-slate-200 flex items-center gap-1.5 uppercase">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> 3D Digital Twin
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.2 rounded">
              3D TILES ACTIVE
            </span>
          </div>

          {/* Camera Quick Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Camera Presets
            </span>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <button
                onClick={() => flyToPreset('pccoe')}
                className="bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white py-1 px-1.5 rounded transition text-center font-medium"
              >
                PCCOE 3D
              </button>
              <button
                onClick={() => flyToPreset('spine')}
                className="bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white py-1 px-1.5 rounded transition text-center font-medium"
              >
                Spine Rd
              </button>
              <button
                onClick={() => flyToPreset('overview')}
                className="bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white py-1 px-1.5 rounded transition text-center font-medium"
              >
                1 km Area
              </button>
            </div>
          </div>

          {/* Layer Visibility Controls */}
          <div className="flex flex-col gap-1.5 text-xs text-slate-300 pt-1 border-t border-slate-700/80">
            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span> 3D Buildings (OSM)
              </span>
              <input
                type="checkbox"
                checked={show3DBuildings}
                onChange={e => setShow3DBuildings(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> Road Arterials
              </span>
              <input
                type="checkbox"
                checked={showRoads}
                onChange={e => setShowRoads(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> 1 km Perimeter Ring
              </span>
              <input
                type="checkbox"
                checked={showBoundary}
                onChange={e => setShowBoundary(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span> Active Grievance Pins
              </span>
              <input
                type="checkbox"
                checked={showGrievances}
                onChange={e => setShowGrievances(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Show Resolved (Archive)
              </span>
              <input
                type="checkbox"
                checked={showResolvedGrievances}
                onChange={e => setShowResolvedGrievances(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Building Names (3D Tags)
              </span>
              <input
                type="checkbox"
                checked={showBuildingLabels}
                onChange={e => setShowBuildingLabels(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Real Grounding Info */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg p-2 shadow text-[10px] text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Real PCCOE 3D Geometry
          </span>
          <span className="text-slate-400">© OSM / Cesium Ion</span>
        </div>
      </div>

      {/* Interactive Waypoint Picking Banner */}
      {pickingMode !== 'none' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 backdrop-blur-md border border-cyan-500/80 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-semibold text-white">
              {pickingMode === 'origin' ? (
                <>📍 Click any building or location to set <strong className="text-emerald-400 font-bold">ORIGIN (A)</strong></>
              ) : (
                <>🎯 Click any building or location to set <strong className="text-rose-400 font-bold">DESTINATION (B)</strong></>
              )}
            </span>
          </div>

          {onCancelPicking && (
            <button
              onClick={onCancelPicking}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-700 transition"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Authority Grievance Field Location Inspection HUD Card */}
      {selectedGrievance && (
        <div className="absolute bottom-6 right-6 z-20 max-w-sm w-full bg-slate-900/95 backdrop-blur-md border border-rose-500/60 rounded-xl p-4 shadow-2xl text-xs flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Navigation className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                    {selectedGrievance.category}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      selectedGrievance.severity === 'HAZARDOUS' || selectedGrievance.severity === 'SEVERE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {selectedGrievance.severity}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Ticket #{selectedGrievance.id}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (onClearFlyToGrievance) onClearFlyToGrievance();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
              title="Close focus card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-slate-300 text-[11px] line-clamp-3 leading-relaxed">
            {selectedGrievance.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
            <div>
              <span className="text-slate-400">Coordinates:</span>
              <div className="font-mono text-cyan-300 truncate">
                {selectedGrievance.latitude.toFixed(5)}°N, {selectedGrievance.longitude.toFixed(5)}°E
              </div>
            </div>
            <div>
              <span className="text-slate-400">Department:</span>
              <div className="font-semibold text-slate-200 truncate">
                {selectedGrievance.assignedDepartmentId || 'Roads & Infrastructure'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={() => {
                const viewer = viewerRef.current;
                if (!viewer) return;
                viewer.camera.flyTo({
                  destination: Cesium.Cartesian3.fromDegrees(
                    selectedGrievance.longitude,
                    selectedGrievance.latitude - 0.0022,
                    780
                  ),
                  orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-38),
                    roll: 0.0,
                  },
                  duration: 1.2,
                });
              }}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition border border-slate-700"
            >
              <Crosshair className="w-3.5 h-3.5 text-rose-400" />
              <span>Re-center 3D</span>
            </button>

            {onOpenDepartmentDashboard && (
              <button
                onClick={onOpenDepartmentDashboard}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <span>Department Dispatch</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
