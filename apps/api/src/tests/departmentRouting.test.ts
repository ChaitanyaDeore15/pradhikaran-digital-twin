import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { StudyAreaService } from '../services/studyAreaService';
import { seedInitialData } from '../seed';

beforeAll(async () => {
  await StudyAreaService.initializeDefaultStudyAreas();
  await seedInitialData();
});

describe('Module: Automated Department-Wise Grievance Distribution & Workload Management', () => {
  // J.1 & J.2: Department Registry & Routing Rules
  it('GET /api/v1/departments should return configured departments with operators and SLA targets', async () => {
    const res = await request(app).get('/api/v1/departments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(6);

    const roadDept = res.body.data.find((d: any) => d.id === 'dept-roads');
    expect(roadDept).toBeDefined();
    expect(roadDept.name).toContain('Roads');
    expect(roadDept.slaHours.resolution).toBe(48);
    expect(roadDept.operators.length).toBeGreaterThan(0);
    expect(roadDept.operators[0].maxCapacity).toBeGreaterThan(0);
  });

  it('GET /api/v1/departments/admin/routing-rules should return transparent category routing rules', async () => {
    const res = await request(app).get('/api/v1/departments/admin/routing-rules');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const potholeRule = res.body.data.find((r: any) => r.categoryMatch === 'pothole');
    expect(potholeRule).toBeDefined();
    expect(potholeRule.targetDepartmentId).toBe('dept-roads');
    expect(potholeRule.confidenceThreshold).toBeGreaterThanOrEqual(0.70);
  });

  // J.3: Automated Classification & Workload-Aware Assignment
  let createdGrievanceId: string;
  it('POST /api/v1/grievances should automatically route road complaint to Roads dept and assign available operator', async () => {
    const res = await request(app).post('/api/v1/grievances').send({
      category: 'pothole',
      description: 'Dangerous asphalt crater on Krantisinha road near college entrance',
      latitude: 18.6521,
      longitude: 73.7611,
      severity: 'SEVERE',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const grv = res.body.data;
    createdGrievanceId = grv.id;

    expect(grv.assignedDepartmentId).toBe('dept-roads');
    expect(grv.status).toBe('ASSIGNED');
    expect(grv.assignedOperatorId).toBeDefined();
    expect(grv.assignedOperatorName).toBeDefined();
    expect(grv.routingDecision).toBeDefined();
    expect(grv.routingDecision.isAutomated).toBe(true);
    expect(grv.routingDecision.isManualReviewRequired).toBe(false);
  });

  // J.4: Ambiguous Complaint fallback to General Review Queue
  it('POST /api/v1/grievances with unmapped category should route to General Review queue', async () => {
    const res = await request(app).post('/api/v1/grievances').send({
      category: 'unknown_dispute_category',
      description: 'Ambiguous boundary issue without explicit department rule match',
      latitude: 18.6521,
      longitude: 73.7611,
      severity: 'LOW',
    });

    expect(res.status).toBe(201);
    const grv = res.body.data;
    expect(grv.assignedDepartmentId).toBe('dept-general-review');
    expect(grv.routingDecision.isManualReviewRequired).toBe(true);
  });

  // J.5: Out-of-Jurisdiction Routing Guard
  it('POST /api/v1/grievances with coordinates far outside PCMC should route to General Review queue', async () => {
    const res = await request(app).post('/api/v1/grievances').send({
      category: 'pothole',
      description: 'Complaint placed in Mumbai far outside PCMC study boundaries',
      latitude: 19.0760, // Mumbai coordinates
      longitude: 72.8777,
      severity: 'MODERATE',
    });

    expect(res.status).toBe(201);
    const grv = res.body.data;
    expect(grv.assignedDepartmentId).toBe('dept-general-review');
    expect(grv.routingDecision.isOutsideJurisdiction).toBe(true);
    expect(grv.routingDecision.isManualReviewRequired).toBe(true);
  });

  // J.6: Authorized Operator Reassignment & Override
  it('PATCH /api/v1/grievances/:id/assignment should allow authorized operator to reassign department', async () => {
    const res = await request(app)
      .patch(`/api/v1/grievances/${createdGrievanceId}/assignment`)
      .send({
        departmentId: 'dept-drainage',
        reason: 'Water accumulated beneath crater requiring drainage dewatering prior to asphalt repair',
        performedBy: 'Er. Rajesh Patil',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignedDepartmentId).toBe('dept-drainage');
  });

  // J.7: Grievance Escalation
  it('POST /api/v1/grievances/:id/escalate should increase priority score and log escalation audit', async () => {
    const res = await request(app)
      .post(`/api/v1/grievances/${createdGrievanceId}/escalate`)
      .send({
        reason: 'Hazardous condition caused minor traffic accident',
        performedBy: 'Ward 14 Field Officer',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.escalationLevel).toBeGreaterThanOrEqual(1);
    expect(res.body.data.priorityScore).toBeGreaterThanOrEqual(80);
  });

  // J.8: Canonical Single Timeline Audit Trail
  it('GET /api/v1/grievances/:id/history should return canonical audit history entries', async () => {
    const res = await request(app).get(`/api/v1/grievances/${createdGrievanceId}/history`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    const actions = res.body.data.map((h: any) => h.action);
    expect(actions).toContain('SUBMITTED');
    expect(actions).toContain('ROUTED');
    expect(actions).toContain('REASSIGNED');
    expect(actions).toContain('ESCALATED');
  });

  // J.9: Interdepartmental Work Orders
  it('POST /api/v1/departments/work-orders should create linked work order and preserve canonical grievance', async () => {
    const res = await request(app).post('/api/v1/departments/work-orders').send({
      grievanceId: createdGrievanceId,
      departmentId: 'dept-drainage',
      title: 'Monsoon Silt Clearance Under Pavement',
      instructions: 'Deploy suction truck to clear 150mm drain line adjacent to road',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      priority: 'HIGH',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^wo-/);
    expect(res.body.data.grievanceId).toBe(createdGrievanceId);
    expect(res.body.data.status).toBe('DISPATCHED');
  });

  // J.10: Department Dashboard Real Metrics
  it('GET /api/v1/departments/:id/dashboard should compute real persisted metrics & operator capacity', async () => {
    const res = await request(app).get('/api/v1/departments/dept-roads/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const dash = res.body.data;

    expect(dash.department.id).toBe('dept-roads');
    expect(dash.metrics.totalReceived).toBeGreaterThan(0);
    expect(dash.metrics.backlogAgeing).toBeDefined();
    expect(dash.operatorWorkloads.length).toBeGreaterThan(0);
    expect(dash.operatorWorkloads[0].activeTicketsCount).toBeDefined();
  });

  // J.11: City-Wide Study Area Scaling
  it('GET /api/v1/study-areas should support both PCCOE 1 km core and PCMC Full Municipal zone', async () => {
    const res = await request(app).get('/api/v1/study-areas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    const pcmcArea = res.body.data.find((a: any) => a.id === 'sa-pcmc-full');
    expect(pcmcArea).toBeDefined();
    expect(pcmcArea.radiusM).toBe(8500);
    expect(pcmcArea.name).toContain('PCMC');
  });

  // J.12: Complaint Resolution and Map Cleanup Verification
  it('PATCH /api/v1/grievances/:id/status to RESOLVED should set resolvedAt and log resolution audit', async () => {
    const res = await request(app)
      .patch(`/api/v1/grievances/${createdGrievanceId}/status`)
      .send({
        status: 'RESOLVED',
        reason: 'All field actions completed and verified by supervisor',
        performedBy: 'Er. Rajesh Patil',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('RESOLVED');
    expect(res.body.data.resolvedAt).toBeDefined();
  });

  // J.13: AI Computer Vision Defect & Department Classifier
  describe('AI Vision Classifier Service & Department Routing', () => {
    it('POST /api/v1/departments/classify-image should categorize pothole road image to dept-roads', async () => {
      const res = await request(app)
        .post('/api/v1/departments/classify-image')
        .send({
          filename: 'pothole_asphalt_sector26.jpg',
          features: {
            surfaceRoughness: 88,
            specularWaterIndex: 12,
            greenVegetationIndex: 5,
            chromaticEntropy: 15,
            darkContrastRatio: 18,
            cleanMoistureSheen: 10,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const prediction = res.body.data;
      expect(prediction.departmentId).toBe('dept-roads');
      expect(prediction.departmentName).toContain('Roads');
      expect(prediction.predictedCategory).toBe('pothole');
      expect(prediction.confidence).toBeGreaterThanOrEqual(0.75);
      expect(prediction.modelMetadata.modelName).toBe('CivicVision-v1.4');
      expect(prediction.modelMetadata.validationF1Score).toBeGreaterThanOrEqual(0.90);
      expect(prediction.explanation).toContain('dept-roads');
    });

    it('POST /api/v1/departments/classify-image should categorize waterlogging drain image to dept-drainage', async () => {
      const res = await request(app)
        .post('/api/v1/departments/classify-image')
        .send({
          filename: 'stormwater_waterlogging_street.png',
          features: {
            surfaceRoughness: 20,
            specularWaterIndex: 92,
            greenVegetationIndex: 10,
            chromaticEntropy: 12,
            darkContrastRatio: 25,
            cleanMoistureSheen: 35,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const prediction = res.body.data;
      expect(prediction.departmentId).toBe('dept-drainage');
      expect(prediction.predictedCategory).toBe('waterlogging');
      expect(prediction.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('POST /api/v1/departments/classify-image should categorize garbage waste dump image to dept-sanitation', async () => {
      const res = await request(app)
        .post('/api/v1/departments/classify-image')
        .send({
          filename: 'garbage_dump_overflow.jpg',
          features: {
            surfaceRoughness: 30,
            specularWaterIndex: 10,
            greenVegetationIndex: 15,
            chromaticEntropy: 90,
            darkContrastRatio: 20,
            cleanMoistureSheen: 8,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const prediction = res.body.data;
      expect(prediction.departmentId).toBe('dept-sanitation');
      expect(prediction.predictedCategory).toBe('waste_accumulation');
      expect(prediction.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('POST /api/v1/departments/classify-image should categorize dark broken streetlight image to dept-electrical', async () => {
      const res = await request(app)
        .post('/api/v1/departments/classify-image')
        .send({
          filename: 'broken_streetlight_night.jpg',
          features: {
            surfaceRoughness: 12,
            specularWaterIndex: 8,
            greenVegetationIndex: 6,
            chromaticEntropy: 14,
            darkContrastRatio: 92,
            cleanMoistureSheen: 10,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const prediction = res.body.data;
      expect(prediction.departmentId).toBe('dept-electrical');
      expect(prediction.predictedCategory).toBe('broken_streetlight');
      expect(prediction.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('POST /api/v1/departments/classify-image should categorize pipeline leakage image to dept-water', async () => {
      const res = await request(app)
        .post('/api/v1/departments/classify-image')
        .send({
          filename: 'pipeline_burst_leakage.jpg',
          features: {
            surfaceRoughness: 18,
            specularWaterIndex: 40,
            greenVegetationIndex: 8,
            chromaticEntropy: 10,
            darkContrastRatio: 15,
            cleanMoistureSheen: 94,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const prediction = res.body.data;
      expect(prediction.departmentId).toBe('dept-water');
      expect(prediction.predictedCategory).toBe('pipeline_leakage');
      expect(prediction.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('POST /api/v1/departments/classify-image should categorize fallen tree foliage image to dept-parks', async () => {
      const res = await request(app)
        .post('/api/v1/departments/classify-image')
        .send({
          filename: 'fallen_tree_roadblock.jpg',
          features: {
            surfaceRoughness: 35,
            specularWaterIndex: 12,
            greenVegetationIndex: 91,
            chromaticEntropy: 28,
            darkContrastRatio: 22,
            cleanMoistureSheen: 15,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const prediction = res.body.data;
      expect(prediction.departmentId).toBe('dept-parks');
      expect(prediction.predictedCategory).toBe('fallen_tree');
      expect(prediction.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('POST /api/v1/grievances with citizen photo evidence should auto-classify and route using vision model', async () => {
      const res = await request(app)
        .post('/api/v1/grievances')
        .send({
          category: 'other',
          description: 'Citizen snapped a photo of an overflowing garbage dump behind Akurdi market',
          latitude: 18.6530,
          longitude: 73.7620,
          severity: 'MODERATE',
          imageUrl: 'data:image/jpeg;base64,garbage_waste_accumulation_evidence_snapshot',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const grv = res.body.data;
      expect(grv.assignedDepartmentId).toBe('dept-sanitation');
      expect(grv.routingDecision).toBeDefined();
      expect(grv.routingDecision.explanation).toContain('AI Vision Model');
    });
  });
});
