import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { StudyAreaService } from '../services/studyAreaService';
import { seedInitialData } from '../seed';
import { RoutingService } from '../services/routingService';

beforeAll(async () => {
  await StudyAreaService.initializeDefaultStudyArea();
  await seedInitialData();
  await RoutingService.buildGraph();
});

describe('Pradhikaran Digital Twin API Test Suite', () => {
  it('GET /api/v1/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.studyArea).toContain('PCCOE');
  });

  it('GET /api/v1/study-areas should return verified PCCOE 1 km study area', async () => {
    const res = await request(app).get('/api/v1/study-areas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const sa = res.body.data[0];
    expect(sa.centerLatitude).toBeCloseTo(18.651674, 4);
    expect(sa.centerLongitude).toBeCloseTo(73.761536, 4);
    expect(sa.radiusM).toBe(1000);
    expect(sa.boundaryGeoJson.type).toBe('Polygon');
  });

  it('GET /api/v1/assets should list real geographic assets', async () => {
    const res = await request(app).get('/api/v1/assets');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);

    const pccoeMain = res.body.data.find((a: any) => a.id === 'asset-bg-pccoe-main');
    expect(pccoeMain).toBeDefined();
    expect(pccoeMain.assetType).toBe('building');
    expect(pccoeMain.dataSource).toContain('OpenStreetMap');
    expect(pccoeMain.heightIsEstimated).toBe(true);
  });

  it('GET /api/v1/gis/nearby-assets should find assets near PCCOE campus center', async () => {
    const res = await request(app).get('/api/v1/gis/nearby-assets?lat=18.652&lon=73.7615&radius_m=200');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/grievances should submit complaint and auto-match nearby asset', async () => {
    const payload = {
      category: 'pothole',
      description: 'Severe pothole cluster outside PCCOE gate 2',
      latitude: 18.6521,
      longitude: 73.7611,
      severity: 'SEVERE'
    };

    const res = await request(app).post('/api/v1/grievances').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignedDepartmentId).toBe('dept-roads');
    expect(res.body.data.priorityScore).toBeGreaterThanOrEqual(75);
    expect(res.body.data.assetId).toBeDefined();
  });

  it('POST /api/v1/routes should calculate road network path', async () => {
    const payload = {
      origin: { latitude: 18.6470, longitude: 73.7600 },
      destination: { latitude: 18.6590, longitude: 73.7628 }
    };

    const res = await request(app).post('/api/v1/routes').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.distanceMeters).toBeGreaterThan(500);
    expect(res.body.data.routeGeometry.type).toBe('LineString');
    expect(res.body.data.routeGeometry.coordinates.length).toBeGreaterThan(1);
  });

  it('GET /api/v1/graph/neighborhood should retrieve connected entities', async () => {
    const res = await request(app).get('/api/v1/graph/neighborhood?entityId=asset-rd-krantisinha-patil');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.centerEntity).toBeDefined();
    expect(res.body.data.nodes.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/simulations/run should calculate impact of road closure', async () => {
    const payload = {
      name: 'Krantisinha Road Maintenance Test',
      closedAssetIds: ['asset-rd-krantisinha-patil']
    };

    const res = await request(app).post('/api/v1/simulations/run').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results.affectedAssetIds.length).toBeGreaterThan(0);
    expect(res.body.data.results.metrics.directlyClosedCount).toBe(1);
  });

  it('GET /api/v1/analytics/overview should return accurate counts', async () => {
    const res = await request(app).get('/api/v1/analytics/overview');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalAssets).toBeGreaterThan(0);
    expect(res.body.data.syntheticRecordsLabeled).toBe(true);
  });
});
