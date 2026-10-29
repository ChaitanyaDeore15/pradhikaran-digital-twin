import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SimulationService } from '../../services/simulationService';
import { spatialRepo } from '../../repositories/spatialRepository';

const router = Router();

const RunSimulationSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  closedAssetIds: z.array(z.string()).min(1),
});

// POST /api/v1/simulations/run
router.post('/run', async (req: Request, res: Response) => {
  try {
    const parsed = RunSimulationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const { name, description, closedAssetIds } = parsed.data;
    const scenario = await SimulationService.runRoadClosureScenario(
      name,
      closedAssetIds,
      description
    );

    return res.status(201).json({ success: true, data: scenario });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/simulations
router.get('/', async (req: Request, res: Response) => {
  try {
    const scenarios = await spatialRepo.getScenarios();
    return res.json({ success: true, count: scenarios.length, data: scenarios });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/simulations/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const scenario = await spatialRepo.getScenario(req.params.id);
    if (!scenario) {
      return res.status(404).json({ success: false, error: { message: 'Scenario not found' } });
    }
    return res.json({ success: true, data: scenario });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export const simulationRouter = router;
