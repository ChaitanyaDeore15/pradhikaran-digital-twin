import { Router, Request, Response } from 'express';
import { KnowledgeGraphService } from '../../services/knowledgeGraphService';
import { spatialRepo } from '../../repositories/spatialRepository';

const router = Router();

// GET /api/v1/graph/neighborhood
router.get('/neighborhood', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    const depth = parseInt((req.query.depth as string) || '1', 10);

    if (!entityId) {
      return res.status(400).json({ success: false, error: { message: 'entityId query parameter is required' } });
    }

    const neighborhood = await KnowledgeGraphService.getEntityNeighborhood(entityId, depth);
    return res.json({ success: true, data: neighborhood });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/graph/edges
router.get('/edges', async (req: Request, res: Response) => {
  try {
    const edges = await spatialRepo.getKnowledgeEdges();
    return res.json({ success: true, count: edges.length, data: edges });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export const graphRouter = router;
