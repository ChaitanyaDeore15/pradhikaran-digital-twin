import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { RoutingService } from '../../services/routingService';

const router = Router();

const RouteRequestSchema = z.object({
  origin: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  destination: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  avoidAssetIds: z.array(z.string()).optional(),
});

// POST /api/v1/routes
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = RouteRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const { origin, destination, avoidAssetIds } = parsed.data;

    const result = await RoutingService.calculateRoute(
      [origin.latitude, origin.longitude],
      [destination.latitude, destination.longitude],
      avoidAssetIds || []
    );

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/routes/rebuild-graph
router.post('/rebuild-graph', async (req: Request, res: Response) => {
  try {
    await RoutingService.buildGraph();
    return res.json({ success: true, message: 'Topological road graph rebuilt successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export const routingRouter = router;
