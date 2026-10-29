import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { spatialRepo } from '../../repositories/spatialRepository';
import { DepartmentRoutingService } from '../../services/departmentRoutingService';
import { AiVisionClassifierService } from '../../services/aiVisionClassifierService';
import { DepartmentRoutingRule } from '../../types';

const router = Router();

// -------------------------------------------------------------
// Department Endpoints
// -------------------------------------------------------------

// POST /api/v1/departments/classify-image (AI Computer Vision Department Categorization)
router.post('/classify-image', async (req: Request, res: Response) => {
  try {
    const { image, imageBase64, filename, sampleFeatures, features } = req.body;
    const imgData = image || imageBase64;

    const prediction = AiVisionClassifierService.classifyImage({
      imageBase64: imgData,
      filename,
      sampleFeatures: sampleFeatures || features,
    });

    return res.json({ success: true, data: prediction });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/departments
router.get('/', async (req: Request, res: Response) => {
  try {
    const depts = await spatialRepo.getDepartments();
    return res.json({ success: true, count: depts.length, data: depts });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/departments/admin/routing-rules
router.get('/admin/routing-rules', async (req: Request, res: Response) => {
  try {
    const rules = await spatialRepo.getDepartmentRoutingRules();
    return res.json({ success: true, count: rules.length, data: rules });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/departments/admin/routing-rules
router.post('/admin/routing-rules', async (req: Request, res: Response) => {
  try {
    const RuleSchema = z.object({
      ruleName: z.string().min(3),
      categoryMatch: z.string().min(2),
      assetTypeMatch: z.string().optional(),
      jurisdictionMatch: z.string().optional(),
      targetDepartmentId: z.string().min(2),
      confidenceThreshold: z.number().min(0).max(1),
      ruleVersion: z.string().default('v1.0'),
      priorityScoreBoost: z.number().optional(),
      isActive: z.boolean().default(true),
    });

    const parsed = RuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const rule: DepartmentRoutingRule = {
      id: `rule-${Date.now()}-${uuidv4().substring(0, 4)}`,
      ...parsed.data,
    };

    await spatialRepo.saveDepartmentRoutingRule(rule);
    return res.status(201).json({ success: true, data: rule });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PATCH /api/v1/departments/admin/routing-rules/:id
router.patch('/admin/routing-rules/:id', async (req: Request, res: Response) => {
  try {
    const RuleUpdateSchema = z.object({
      ruleName: z.string().optional(),
      categoryMatch: z.string().optional(),
      targetDepartmentId: z.string().optional(),
      confidenceThreshold: z.number().min(0).max(1).optional(),
      isActive: z.boolean().optional(),
      priorityScoreBoost: z.number().optional(),
    });

    const parsed = RuleUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const updated = await spatialRepo.updateDepartmentRoutingRule(req.params.id, parsed.data);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Routing rule not found' } });
    }
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/departments/work-orders
router.get('/work-orders', async (req: Request, res: Response) => {
  try {
    const { grievance_id, department_id } = req.query;
    const workOrders = await spatialRepo.getWorkOrders(
      grievance_id as string | undefined,
      department_id as string | undefined
    );
    return res.json({ success: true, count: workOrders.length, data: workOrders });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/departments/work-orders
router.post('/work-orders', async (req: Request, res: Response) => {
  try {
    const WOSchema = z.object({
      grievanceId: z.string().min(2),
      departmentId: z.string().min(2),
      title: z.string().min(3),
      instructions: z.string().min(5),
      dueDate: z.string(),
      operatorId: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('HIGH'),
    });

    const parsed = WOSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const created = await DepartmentRoutingService.createWorkOrder(
      parsed.data.grievanceId,
      parsed.data.departmentId,
      parsed.data.title,
      parsed.data.instructions,
      parsed.data.dueDate,
      parsed.data.operatorId,
      parsed.data.priority
    );

    if (!created) {
      return res.status(404).json({ success: false, error: { message: 'Parent grievance not found' } });
    }

    return res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PATCH /api/v1/departments/work-orders/:id/status
router.patch('/work-orders/:id/status', async (req: Request, res: Response) => {
  try {
    const Schema = z.object({
      status: z.enum(['PENDING', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.format() });
    }

    const updated = await spatialRepo.updateWorkOrderStatus(req.params.id, parsed.data.status);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Work order not found' } });
    }
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/departments/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const dept = await spatialRepo.getDepartment(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, error: { message: 'Department not found' } });
    }
    return res.json({ success: true, data: dept });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/departments/:id/dashboard
router.get('/:id/dashboard', async (req: Request, res: Response) => {
  try {
    const dashboard = await spatialRepo.getDepartmentDashboard(req.params.id);
    return res.json({ success: true, data: dashboard });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/departments/:id/complaints
router.get('/:id/complaints', async (req: Request, res: Response) => {
  try {
    const all = await spatialRepo.getGrievances();
    const deptComplaints = all.filter(
      g => g.assignedDepartmentId === req.params.id || g.collaboratingDepartmentIds?.includes(req.params.id)
    );
    return res.json({ success: true, count: deptComplaints.length, data: deptComplaints });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export const departmentRouter = router;
