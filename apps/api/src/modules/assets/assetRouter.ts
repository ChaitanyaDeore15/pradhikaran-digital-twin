import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { spatialRepo } from '../../repositories/spatialRepository';

const router = Router();

// GET /api/v1/assets
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, include_margin, condition } = req.query;
    const assets = await spatialRepo.getAssets({
      type: type as string,
      includeMargin: include_margin === 'true',
      conditionStatus: condition as string,
    });
    return res.json({ success: true, count: assets.length, data: assets });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/assets/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await spatialRepo.getAsset(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, error: { message: 'Asset not found' } });
    }
    return res.json({ success: true, data: asset });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PATCH /api/v1/assets/:id/condition
router.patch('/:id/condition', async (req: Request, res: Response) => {
  try {
    const Schema = z.object({
      conditionStatus: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'DEGRADED', 'CRITICAL'])
    });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const updated = await spatialRepo.updateAssetCondition(req.params.id, parsed.data.conditionStatus);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Asset not found' } });
    }
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export const assetRouter = router;
