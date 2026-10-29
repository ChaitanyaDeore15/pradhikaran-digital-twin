import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { spatialRepo } from '../../repositories/spatialRepository';
import { KnowledgeGraphService } from '../../services/knowledgeGraphService';
import { DepartmentRoutingService } from '../../services/departmentRoutingService';
import { AiVisionClassifierService } from '../../services/aiVisionClassifierService';
import { GrievanceEntity, ComplaintAuditEntry } from '../../types';

const router = Router();

const CreateGrievanceSchema = z.object({
  category: z.string().min(2),
  description: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  severity: z.enum(['LOW', 'MODERATE', 'SEVERE', 'HAZARDOUS']).optional(),
  imageUrl: z.string().optional(),
  assetId: z.string().optional(),
});

// Severity base scores
const SEVERITY_SCORES: Record<string, number> = {
  LOW: 25,
  MODERATE: 50,
  SEVERE: 75,
  HAZARDOUS: 95,
};

// POST /api/v1/grievances
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = CreateGrievanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const { category, description, latitude, longitude, imageUrl } = parsed.data;
    const severity = parsed.data.severity || 'MODERATE';

    // 1. Find nearest asset if not provided
    let matchedAssetId = parsed.data.assetId;
    if (!matchedAssetId) {
      const nearby = await spatialRepo.findNearbyAssets(latitude, longitude, 100);
      if (nearby.length > 0) {
        matchedAssetId = nearby[0].asset.id;
      }
    }

    // 2. Compute priority score
    const baseScore = SEVERITY_SCORES[severity] || 50;
    const proximityBoost = matchedAssetId ? 10 : 0;
    const priorityScore = Math.min(100, baseScore + proximityBoost);

    // 2b. AI Computer Vision Classification if image evidence attached
    let visionResult = null;
    let finalCategory = category;
    if (imageUrl) {
      try {
        visionResult = AiVisionClassifierService.classifyImage({
          imageBase64: imageUrl,
          filename: imageUrl,
        });
        if (category === 'other' || category === 'unclassified' || !category) {
          finalCategory = visionResult.predictedCategory;
        }
      } catch (err) {
        console.warn('Vision classification skipped:', err);
      }
    }

    const grievanceId = `grv-${Date.now()}-${uuidv4().substring(0, 5)}`;
    const newGrievance: GrievanceEntity = {
      id: grievanceId,
      category: finalCategory,
      description,
      latitude,
      longitude,
      assetId: matchedAssetId,
      status: 'SUBMITTED',
      severity,
      priorityScore,
      priorityFactors: {
        severityBase: baseScore,
        infrastructureProximityBonus: proximityBoost,
      },
      classificationResult: visionResult?.predictedCategory || finalCategory,
      classificationConfidence: visionResult?.confidence || 0.85,
      imageUrl,
      isSynthetic: false,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Initial Citizen Submission Audit Log
    const submitAudit: ComplaintAuditEntry = {
      id: `aud-${Date.now()}-${uuidv4().substring(0, 4)}`,
      grievanceId,
      action: 'SUBMITTED',
      performedBy: 'Citizen Reporter',
      newStatus: 'SUBMITTED',
      reason: 'Citizen grievance submitted with verified coordinates.',
      timestamp: new Date().toISOString(),
    };
    await spatialRepo.addComplaintAuditEntry(submitAudit);
    await spatialRepo.saveGrievance(newGrievance);

    // 3. Automated Department Classification & Workload Routing Engine
    const { grievance: routedGrievance } = await DepartmentRoutingService.routeGrievance(newGrievance);

    // If visual evidence was evaluated, annotate routing decision explanation
    if (visionResult && routedGrievance.routingDecision) {
      routedGrievance.routingDecision.explanation = `[AI Vision Model]: Classified image evidence as "${visionResult.predictedCategory}" (${Math.round(visionResult.confidence * 100)}% confidence). ` + routedGrievance.routingDecision.explanation;
      await spatialRepo.saveGrievance(routedGrievance);
    }

    // 4. Synchronize with Knowledge Graph
    if (matchedAssetId) {
      await KnowledgeGraphService.syncAssetGrievanceEdge(grievanceId, matchedAssetId, category);
    }

    return res.status(201).json({ success: true, data: routedGrievance });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/grievances
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category, asset_id } = req.query;
    const grievances = await spatialRepo.getGrievances({
      status: status as string,
      category: category as string,
      assetId: asset_id as string,
    });
    return res.json({ success: true, count: grievances.length, data: grievances });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/grievances/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const g = await spatialRepo.getGrievance(req.params.id);
    if (!g) {
      return res.status(404).json({ success: false, error: { message: 'Grievance not found' } });
    }
    return res.json({ success: true, data: g });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/grievances/:id/history (Single canonical timeline)
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const history = await spatialRepo.getComplaintAuditEntries(req.params.id);
    return res.json({ success: true, count: history.length, data: history });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/grievances/:id/route (Manual or programmatic re-route)
router.post('/:id/route', async (req: Request, res: Response) => {
  try {
    const g = await spatialRepo.getGrievance(req.params.id);
    if (!g) {
      return res.status(404).json({ success: false, error: { message: 'Grievance not found' } });
    }

    const { grievance: routedGrievance, decision } = await DepartmentRoutingService.routeGrievance(g);
    return res.json({ success: true, data: routedGrievance, decision });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PATCH /api/v1/grievances/:id/assignment (Authorized Operator Reassignment & Override)
router.patch('/:id/assignment', async (req: Request, res: Response) => {
  try {
    const AssignSchema = z.object({
      departmentId: z.string().min(2),
      operatorId: z.string().optional(),
      reason: z.string().optional(),
      performedBy: z.string().default('Municipal Official'),
    });

    const parsed = AssignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const updated = await DepartmentRoutingService.reassignGrievance(
      req.params.id,
      parsed.data.departmentId,
      parsed.data.operatorId,
      parsed.data.reason,
      parsed.data.performedBy
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Grievance not found' } });
    }

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/grievances/:id/escalate
router.post('/:id/escalate', async (req: Request, res: Response) => {
  try {
    const EscalateSchema = z.object({
      reason: z.string().min(3),
      performedBy: z.string().default('Citizen / Field Inspector'),
    });

    const parsed = EscalateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const escalated = await DepartmentRoutingService.escalateGrievance(
      req.params.id,
      parsed.data.reason,
      parsed.data.performedBy
    );

    if (!escalated) {
      return res.status(404).json({ success: false, error: { message: 'Grievance not found' } });
    }

    return res.json({ success: true, data: escalated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PATCH /api/v1/grievances/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const Schema = z.object({
      status: z.enum(['SUBMITTED', 'AI_CLASSIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
      departmentId: z.string().optional(),
      reason: z.string().optional(),
      performedBy: z.string().default('Official Authority'),
    });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const existing = await spatialRepo.getGrievance(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Grievance not found' } });
    }

    const prevStatus = existing.status;
    const newStatus = parsed.data.status;

    // If resolving, decrement operator active tickets
    if (newStatus === 'RESOLVED' && prevStatus !== 'RESOLVED' && existing.assignedDepartmentId && existing.assignedOperatorId) {
      await spatialRepo.updateOperatorTickets(existing.assignedDepartmentId, existing.assignedOperatorId, -1);
    }

    const updated = await spatialRepo.updateGrievanceStatus(
      req.params.id,
      newStatus,
      parsed.data.departmentId
    );

    const auditEntry: ComplaintAuditEntry = {
      id: `aud-${Date.now()}-${uuidv4().substring(0, 4)}`,
      grievanceId: req.params.id,
      action: 'STATUS_CHANGED',
      performedBy: parsed.data.performedBy,
      previousStatus: prevStatus,
      newStatus,
      reason: parsed.data.reason || `Status updated from ${prevStatus} to ${newStatus}.`,
      timestamp: new Date().toISOString(),
    };
    await spatialRepo.addComplaintAuditEntry(auditEntry);

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/grievances/:id/updates (Official authority progress tracking & remarks)
router.post('/:id/updates', async (req: Request, res: Response) => {
  try {
    const UpdateSchema = z.object({
      authorName: z.string().min(2),
      authorRole: z.string().min(2),
      remarks: z.string().min(3),
      statusChange: z.enum(['SUBMITTED', 'AI_CLASSIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']).optional(),
      imageUrl: z.string().optional(),
    });

    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const updateRecord = {
      id: `upd-${Date.now()}`,
      authorName: parsed.data.authorName,
      authorRole: parsed.data.authorRole,
      remarks: parsed.data.remarks,
      statusChange: parsed.data.statusChange,
      imageUrl: parsed.data.imageUrl,
      createdAt: new Date().toISOString(),
    };

    const updated = await spatialRepo.addGrievanceUpdate(req.params.id, updateRecord);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Grievance not found' } });
    }

    // Add audit entry
    const auditEntry: ComplaintAuditEntry = {
      id: `aud-${Date.now()}-${uuidv4().substring(0, 4)}`,
      grievanceId: req.params.id,
      action: parsed.data.statusChange ? 'STATUS_CHANGED' : 'ASSIGNED',
      performedBy: `${parsed.data.authorName} (${parsed.data.authorRole})`,
      newStatus: parsed.data.statusChange,
      reason: parsed.data.remarks,
      timestamp: new Date().toISOString(),
    };
    await spatialRepo.addComplaintAuditEntry(auditEntry);

    // If resolving, decrement operator active tickets
    if (parsed.data.statusChange === 'RESOLVED' && updated.assignedDepartmentId && updated.assignedOperatorId) {
      await spatialRepo.updateOperatorTickets(updated.assignedDepartmentId, updated.assignedOperatorId, -1);
    }

    return res.status(201).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export const grievanceRouter = router;
