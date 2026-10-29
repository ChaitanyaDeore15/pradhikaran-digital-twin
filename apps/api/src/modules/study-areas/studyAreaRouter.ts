import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { spatialRepo } from '../../repositories/spatialRepository';
import { StudyAreaService } from '../../services/studyAreaService';

const router = Router();

const UpdateStudyAreaSchema = z.object({
  name: z.string().optional(),
  centerLatitude: z.number().min(-90).max(90).optional(),
  centerLongitude: z.number().min(-180).max(180).optional(),
  radiusM: z.number().min(100).max(10000).optional(),
  marginM: z.number().min(0).max(2000).optional(),
});

// GET /api/v1/study-areas
router.get('/', async (req: Request, res: Response) => {
  try {
    let areas = await spatialRepo.getAllStudyAreas();
    if (areas.length === 0) {
      areas = await StudyAreaService.initializeDefaultStudyAreas();
    }
    return res.json({ success: true, data: areas });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/study-areas/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const area = await spatialRepo.getStudyArea(req.params.id);
    if (!area) {
      return res.status(404).json({ success: false, error: { message: 'Study area not found' } });
    }
    return res.json({ success: true, data: area });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PATCH /api/v1/study-areas/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const parse = UpdateStudyAreaSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.format() });
    }

    const current = await spatialRepo.getStudyArea(req.params.id);
    if (!current) {
      return res.status(404).json({ success: false, error: { message: 'Study area not found' } });
    }

    const updated = StudyAreaService.generateStudyArea(
      current.id,
      parse.data.name ?? current.name,
      parse.data.centerLatitude ?? current.centerLatitude,
      parse.data.centerLongitude ?? current.centerLongitude,
      parse.data.radiusM ?? current.radiusM,
      parse.data.marginM ?? current.marginM,
      current.sourceName,
      current.sourceUrl
    );
    updated.verificationStatus = 'OPERATOR_ADJUSTED';

    await spatialRepo.saveStudyArea(updated);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export const studyAreaRouter = router;
