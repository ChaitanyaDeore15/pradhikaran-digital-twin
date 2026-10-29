import { spatialRepo } from '../repositories/spatialRepository';
import { KnowledgeEdgeEntity } from '../types';

export class KnowledgeGraphService {
  public static async getEntityNeighborhood(
    entityId: string,
    depth: number = 1
  ): Promise<{
    centerEntity: any;
    nodes: { id: string; type: string; name: string; details?: any }[];
    edges: KnowledgeEdgeEntity[];
  }> {
    const directEdges = await spatialRepo.getKnowledgeEdges({ entityId });
    const nodeMap = new Map<string, { id: string; type: string; name: string; details?: any }>();

    // Resolve center entity
    const asset = await spatialRepo.getAsset(entityId);
    const grievance = await spatialRepo.getGrievance(entityId);
    let centerEntity: any = asset || grievance || { id: entityId, type: 'unknown' };

    nodeMap.set(entityId, {
      id: entityId,
      type: asset ? 'asset' : grievance ? 'grievance' : 'entity',
      name: asset?.name || grievance?.description || entityId,
      details: centerEntity
    });

    for (const edge of directEdges) {
      const neighborId = edge.sourceId === entityId ? edge.targetId : edge.sourceId;
      const neighborType = edge.sourceId === entityId ? edge.targetType : edge.sourceType;

      if (!nodeMap.has(neighborId)) {
        let name = neighborId;
        let details: any = null;

        if (neighborType === 'asset') {
          const a = await spatialRepo.getAsset(neighborId);
          name = a?.name || neighborId;
          details = a;
        } else if (neighborType === 'grievance') {
          const g = await spatialRepo.getGrievance(neighborId);
          name = g?.category ? `${g.category.toUpperCase()}: ${g.description.substring(0, 30)}...` : neighborId;
          details = g;
        } else if (neighborType === 'department') {
          name = neighborId.replace('dept-', '').toUpperCase() + ' Maintenance Dept';
        }

        nodeMap.set(neighborId, { id: neighborId, type: neighborType, name, details });
      }
    }

    return {
      centerEntity,
      nodes: Array.from(nodeMap.values()),
      edges: directEdges
    };
  }

  public static async syncAssetGrievanceEdge(
    grievanceId: string,
    assetId: string,
    category: string
  ): Promise<void> {
    const edge: KnowledgeEdgeEntity = {
      id: `edge-grv-ast-${grievanceId}`,
      sourceType: 'grievance',
      sourceId: grievanceId,
      targetType: 'asset',
      targetId: assetId,
      relationshipType: 'LOCATED_ON',
      provenance: 'SPATIAL_PROXIMITY_MATCH',
      metadata: { category },
      createdAt: new Date().toISOString()
    };
    await spatialRepo.saveKnowledgeEdge(edge);
  }
}
