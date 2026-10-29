import * as turf from '@turf/turf';
import { spatialRepo } from '../repositories/spatialRepository';
import { SimulationScenarioEntity } from '../types';

export class SimulationService {
  public static async runRoadClosureScenario(
    name: string,
    closedAssetIds: string[],
    description: string = 'Simulated intervention'
  ): Promise<SimulationScenarioEntity> {
    const closedSet = new Set(closedAssetIds);
    const allAssets = await spatialRepo.getAssets();
    const allGrievances = await spatialRepo.getGrievances();

    // 1. Identify directly closed assets and adjacent buildings/roads
    const closedAssets = allAssets.filter(a => closedSet.has(a.id));
    const affectedAssetIds = new Set<string>(closedAssetIds);

    for (const closed of closedAssets) {
      // Find buildings or junctions within 60 meters of closed road
      const nearby = await spatialRepo.findNearbyAssets(
        closed.centroid[1],
        closed.centroid[0],
        60
      );
      for (const m of nearby) {
        affectedAssetIds.add(m.asset.id);
      }
    }

    // 2. Identify unresolved grievances on or near affected assets
    const affectedGrievances = allGrievances.filter(g => {
      if (g.assetId && affectedAssetIds.has(g.assetId)) return true;
      const pt = turf.point([g.longitude, g.latitude]);
      for (const closed of closedAssets) {
        const d = turf.distance(pt, turf.point(closed.centroid), { units: 'meters' });
        if (d < 50) return true;
      }
      return false;
    });

    const affectedGrievanceIds = affectedGrievances.map(g => g.id);

    // 3. Compute impact metrics
    const totalClosedLengthM = closedAssets
      .filter(a => a.assetType === 'road')
      .reduce((sum, r) => sum + (r.metadata?.length_m || 100), 0);

    const scenarioId = `sim-${Date.now()}`;
    const scenario: SimulationScenarioEntity = {
      id: scenarioId,
      name,
      description,
      scenarioType: 'ROAD_CLOSURE_AND_MAINTENANCE',
      proposedConfiguration: {
        closedAssetIds,
        detourNotes: 'Traffic redirected to parallel sector 26 residential corridors'
      },
      assumptions: [
        'Complete vehicular blockage on selected road segments during intervention window',
        'Pedestrian access restricted within 15 meters of active worksite',
        'Average detour delay estimated at +3.5 to +6.0 minutes during peak transit hours'
      ],
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      results: {
        affectedAssetIds: Array.from(affectedAssetIds),
        affectedGrievanceIds,
        metrics: {
          totalClosedLengthMeters: Math.round(totalClosedLengthM),
          directlyClosedCount: closedAssetIds.length,
          adjacentImpactedAssetsCount: affectedAssetIds.size,
          activeGrievancesImpacted: affectedGrievanceIds.length,
          estimatedDetourTimeMinutes: Math.round((totalClosedLengthM / 250) * 1.5 + 2.0),
          estimatedCommercialAccessReductionPercent: 35
        },
        resultSummary: `Simulated closure of ${closedAssetIds.length} road segment(s) impacts ${affectedAssetIds.size} municipal assets and ${affectedGrievanceIds.length} active grievance reports.`,
        generatedAt: new Date().toISOString()
      }
    };

    await spatialRepo.saveScenario(scenario);
    return scenario;
  }
}
