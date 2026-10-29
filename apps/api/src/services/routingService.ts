import * as turf from '@turf/turf';
import { spatialRepo } from '../repositories/spatialRepository';

interface Node {
  id: string;
  coord: [number, number]; // [lon, lat]
  neighbors: Map<string, { distance: number; assetId: string }>;
}

export class RoutingService {
  private static graphNodes = new Map<string, Node>();
  private static isGraphBuilt = false;

  private static nodeKey(coord: [number, number]): string {
    return `${coord[0].toFixed(5)},${coord[1].toFixed(5)}`;
  }

  public static async buildGraph(): Promise<void> {
    this.graphNodes.clear();
    const roads = await spatialRepo.getAssets({ type: 'road' });

    for (const road of roads) {
      if (road.geometry.type !== 'LineString') continue;
      const coords: [number, number][] = road.geometry.coordinates;

      for (let i = 0; i < coords.length - 1; i++) {
        const uCoord = coords[i];
        const vCoord = coords[i + 1];
        const uKey = this.nodeKey(uCoord);
        const vKey = this.nodeKey(vCoord);

        if (!this.graphNodes.has(uKey)) {
          this.graphNodes.set(uKey, { id: uKey, coord: uCoord, neighbors: new Map() });
        }
        if (!this.graphNodes.has(vKey)) {
          this.graphNodes.set(vKey, { id: vKey, coord: vCoord, neighbors: new Map() });
        }

        const segmentDist = turf.distance(turf.point(uCoord), turf.point(vCoord), { units: 'meters' });

        this.graphNodes.get(uKey)!.neighbors.set(vKey, { distance: segmentDist, assetId: road.id });
        this.graphNodes.get(vKey)!.neighbors.set(uKey, { distance: segmentDist, assetId: road.id });
      }
    }

    this.isGraphBuilt = true;
    console.log(`[Routing] Topological road graph initialized with ${this.graphNodes.size} junction nodes.`);
  }

  private static findNearestNode(coord: [number, number]): Node | null {
    let nearest: Node | null = null;
    let minDist = Infinity;
    const pt = turf.point(coord);

    for (const node of this.graphNodes.values()) {
      const d = turf.distance(pt, turf.point(node.coord), { units: 'meters' });
      if (d < minDist) {
        minDist = d;
        nearest = node;
      }
    }
    return nearest;
  }

  public static async calculateRoute(
    origin: [number, number], // [lat, lon]
    destination: [number, number], // [lat, lon]
    avoidAssetIds: string[] = []
  ): Promise<{
    distanceMeters: number;
    estimatedDurationSeconds: number;
    routeGeometry: any;
    traversedAssetIds: string[];
    routingEngine: string;
  }> {
    if (!this.isGraphBuilt || this.graphNodes.size === 0) {
      await this.buildGraph();
    }

    const avoidSet = new Set(avoidAssetIds);
    const startNode = this.findNearestNode([origin[1], origin[0]]);
    const endNode = this.findNearestNode([destination[1], destination[0]]);

    if (!startNode || !endNode) {
      throw new Error('Could not find road network nodes near origin or destination');
    }

    // Dijkstra's Algorithm
    const distances = new Map<string, number>();
    const previous = new Map<string, { nodeKey: string; assetId: string }>();
    const unvisited = new Set<string>();

    for (const key of this.graphNodes.keys()) {
      distances.set(key, Infinity);
      unvisited.add(key);
    }
    distances.set(startNode.id, 0);

    while (unvisited.size > 0) {
      let currentKey: string | null = null;
      let minDistance = Infinity;

      for (const key of unvisited) {
        const d = distances.get(key)!;
        if (d < minDistance) {
          minDistance = d;
          currentKey = key;
        }
      }

      if (!currentKey || minDistance === Infinity || currentKey === endNode.id) {
        break;
      }

      unvisited.delete(currentKey);
      const currentNode = this.graphNodes.get(currentKey)!;

      for (const [neighborKey, edge] of currentNode.neighbors.entries()) {
        if (!unvisited.has(neighborKey)) continue;
        if (avoidSet.has(edge.assetId)) continue; // Avoid closed roads

        const alt = distances.get(currentKey)! + edge.distance;
        if (alt < distances.get(neighborKey)!) {
          distances.set(neighborKey, alt);
          previous.set(neighborKey, { nodeKey: currentKey, assetId: edge.assetId });
        }
      }
    }

    if (distances.get(endNode.id) === Infinity) {
      // Fallback: direct connector if graph is partitioned
      const directDist = turf.distance(
        turf.point([origin[1], origin[0]]),
        turf.point([destination[1], destination[0]]),
        { units: 'meters' }
      );
      return {
        distanceMeters: Math.round(directDist),
        estimatedDurationSeconds: Math.round((directDist / 8.33)), // ~30 km/h
        routeGeometry: {
          type: 'LineString',
          coordinates: [[origin[1], origin[0]], [destination[1], destination[0]]]
        },
        traversedAssetIds: [],
        routingEngine: 'Direct Geodesic Line (Destination Disconnected on Graph)'
      };
    }

    // Reconstruct path
    const pathCoords: [number, number][] = [];
    const traversedAssets: string[] = [];
    let curr: string | undefined = endNode.id;

    while (curr) {
      const node = this.graphNodes.get(curr);
      if (node) pathCoords.unshift(node.coord);
      const prevStep = previous.get(curr);
      if (prevStep) {
        if (!traversedAssets.includes(prevStep.assetId)) {
          traversedAssets.unshift(prevStep.assetId);
        }
        curr = prevStep.nodeKey;
      } else {
        break;
      }
    }

    // Connect door-to-door from exact origin to exact destination
    pathCoords.unshift([origin[1], origin[0]]);
    pathCoords.push([destination[1], destination[0]]);

    const totalDistance = distances.get(endNode.id)!;
    const estSeconds = Math.round(totalDistance / 8.33); // avg 30 km/h speed in sector

    return {
      distanceMeters: Math.round(totalDistance * 10) / 10,
      estimatedDurationSeconds: estSeconds,
      routeGeometry: {
        type: 'LineString',
        coordinates: pathCoords
      },
      traversedAssetIds: traversedAssets,
      routingEngine: 'Pradhikaran Topological OSM Graph v1'
    };
  }
}
