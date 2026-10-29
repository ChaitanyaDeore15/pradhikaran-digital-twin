import { Router, Request, Response } from 'express';
import { spatialRepo } from '../../repositories/spatialRepository';

const router = Router();

// GET /api/v1/gis/assets.geojson
router.get('/assets.geojson', async (req: Request, res: Response) => {
  try {
    const { type, include_margin } = req.query;
    const geojson = await spatialRepo.getAssetsGeoJson({
      type: type as string,
      includeMargin: include_margin === 'true'
    });
    return res.json(geojson);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/gis/nearby-assets?lat={lat}&lon={lon}&radius_m={radius}
router.get('/nearby-assets', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radiusM = parseFloat((req.query.radius_m as string) || '50');
    const type = req.query.type as string | undefined;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid lat/lon parameters' } });
    }

    const matches = await spatialRepo.findNearbyAssets(lat, lon, radiusM, type);
    return res.json({ success: true, count: matches.length, data: matches });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export const gisRouter = router;
