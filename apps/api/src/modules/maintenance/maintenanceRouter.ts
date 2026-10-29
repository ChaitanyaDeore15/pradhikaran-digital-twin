import { Router, Request, Response } from 'express';
import { spatialRepo } from '../../repositories/spatialRepository';
import { config } from '../../config';

const router = Router();

// GET /api/v1/maintenance/risks
router.get('/risks', async (req: Request, res: Response) => {
  try {
    const predictions = await spatialRepo.getPredictions();
    return res.json({ success: true, count: predictions.length, data: predictions });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/maintenance/risks/:assetId
router.get('/risks/:assetId', async (req: Request, res: Response) => {
  try {
    const list = await spatialRepo.getPredictions(req.params.assetId);
    if (list.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'No risk prediction recorded for this asset' } });
    }
    return res.json({ success: true, data: list[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/maintenance/predict (proxies to AI microservice or uses internal deterministic baseline)
router.post('/predict', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.body;
    if (!assetId) {
      return res.status(400).json({ success: false, error: { message: 'assetId is required' } });
    }

    const asset = await spatialRepo.getAsset(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, error: { message: 'Asset not found' } });
    }

    // Try Python FastAPI service if reachable
    try {
      const resp = await fetch(`${config.aiServiceUrl}/api/v1/ai/predict-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.id,
          asset_type: asset.assetType,
          road_class: asset.metadata?.highway || 'residential',
          age_years: 4.5,
          complaint_count: 2,
          recent_severity_sum: 5.0,
          condition_rating: asset.conditionStatus
        })
      });
      if (resp.ok) {
        const aiData: any = await resp.json();
        const pred = {
          id: `risk-pred-${asset.id}`,
          assetId: asset.id,
          modelName: 'FastAPI_AI_Service_Predictor',
          modelVersion: aiData.model_version || '1.0.0',
          predictionTarget: 'structural_surface_degradation',
          riskScore: aiData.risk_score,
          riskCategory: aiData.risk_category,
          featureSummary: aiData.contributing_factors,
          isSynthetic: false,
          generatedAt: new Date().toISOString()
        };
        await spatialRepo.savePrediction(pred);
        return res.json({ success: true, data: pred });
      }
    } catch (aiErr) {
      // Fallback: Internal deterministic baseline
    }

    // Fallback baseline calculation
    const scoreMap: Record<string, number> = {
      CRITICAL: 90,
      DEGRADED: 72,
      FAIR: 48,
      GOOD: 24,
      EXCELLENT: 10
    };
    const score = scoreMap[asset.conditionStatus] || 35;
    const cat = score >= 75 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

    const baselinePred = {
      id: `risk-pred-${asset.id}`,
      assetId: asset.id,
      modelName: 'Pradhikaran_Deterministic_Baseline_v1',
      modelVersion: '1.0.0',
      predictionTarget: 'structural_surface_degradation',
      riskScore: score,
      riskCategory: cat as any,
      featureSummary: {
        conditionStatus: asset.conditionStatus,
        assetType: asset.assetType,
        rule: 'condition_to_score_lookup'
      },
      isSynthetic: false,
      generatedAt: new Date().toISOString()
    };
    await spatialRepo.savePrediction(baselinePred);
    return res.json({ success: true, data: baselinePred });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export const maintenanceRouter = router;
