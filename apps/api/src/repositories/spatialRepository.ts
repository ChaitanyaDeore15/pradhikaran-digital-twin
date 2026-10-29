import * as turf from '@turf/turf';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { config } from '../config';
import {
  AssetEntity,
  GrievanceEntity,
  StudyAreaEntity,
  DepartmentEntity,
  DepartmentRoutingRule,
  WorkOrder,
  ComplaintAuditEntry,
  RiskPredictionEntity,
  KnowledgeEdgeEntity,
  SimulationScenarioEntity
} from '../types';

export class SpatialRepository {
  private pgPool: Pool | null = null;
  private isPostgisActive = false;

  // In-memory / persistent dev stores
  private studyAreas = new Map<string, StudyAreaEntity>();
  private assets = new Map<string, AssetEntity>();
  private grievances = new Map<string, GrievanceEntity>();
  private departments = new Map<string, DepartmentEntity>();
  private routingRules = new Map<string, DepartmentRoutingRule>();
  private workOrders = new Map<string, WorkOrder>();
  private auditLogs = new Map<string, ComplaintAuditEntry[]>();
  private predictions = new Map<string, RiskPredictionEntity>();
  private knowledgeEdges = new Map<string, KnowledgeEdgeEntity>();
  private scenarios = new Map<string, SimulationScenarioEntity>();

  private storageDir: string;

  constructor() {
    this.storageDir = path.resolve(process.cwd(), '../../data/processed');
    this.initPostgres();
  }

  private async initPostgres() {
    if (config.postgisEnabled) {
      try {
        this.pgPool = new Pool({ connectionString: config.databaseUrl });
        const res = await this.pgPool.query('SELECT PostGIS_Version()');
        console.log(`[Database] Connected to PostgreSQL with PostGIS: ${res.rows[0].postgis_version}`);
        this.isPostgisActive = true;
      } catch (err: any) {
        console.warn(`[Database] PostGIS connection failed (${err.message}). Falling back to Turf-powered in-process spatial repository.`);
        this.isPostgisActive = false;
      }
    } else {
      console.log('[Database] Operating with in-process Turf spatial repository (Standalone Local Mode).');
    }
  }

  public isPostgis(): boolean {
    return this.isPostgisActive;
  }

  // -------------------------------------------------------------
  // Study Area Methods
  // -------------------------------------------------------------
  public async getStudyArea(id: string): Promise<StudyAreaEntity | null> {
    return this.studyAreas.get(id) || null;
  }

  public async getAllStudyAreas(): Promise<StudyAreaEntity[]> {
    return Array.from(this.studyAreas.values());
  }

  public async saveStudyArea(area: StudyAreaEntity): Promise<void> {
    this.studyAreas.set(area.id, area);
  }

  // -------------------------------------------------------------
  // Asset Methods
  // -------------------------------------------------------------
  public async saveAsset(asset: AssetEntity): Promise<void> {
    this.assets.set(asset.id, asset);
  }

  public async saveAssetsBatch(assetList: AssetEntity[]): Promise<void> {
    for (const a of assetList) {
      this.assets.set(a.id, a);
    }
  }

  public async getAsset(id: string): Promise<AssetEntity | null> {
    return this.assets.get(id) || null;
  }

  public async getAssets(filter?: {
    type?: string;
    includeMargin?: boolean;
    conditionStatus?: string;
  }): Promise<AssetEntity[]> {
    let result = Array.from(this.assets.values());

    if (filter?.type) {
      result = result.filter(a => a.assetType === filter.type);
    }
    if (filter?.includeMargin === false) {
      result = result.filter(a => !a.isMargin);
    }
    if (filter?.conditionStatus) {
      result = result.filter(a => a.conditionStatus === filter.conditionStatus);
    }

    return result;
  }

  public async getAssetsGeoJson(filter?: {
    type?: string;
    includeMargin?: boolean;
  }): Promise<any> {
    const list = await this.getAssets(filter);
    return turf.featureCollection(
      list.map(a => {
        const feat: any = turf.feature(a.geometry as any, {
          id: a.id,
          name: a.name,
          assetType: a.assetType,
          conditionStatus: a.conditionStatus,
          criticality: a.criticality,
          heightM: a.heightM,
          heightSource: a.heightSource,
          heightIsEstimated: a.heightIsEstimated,
          dataSource: a.dataSource,
          isSynthetic: a.isSynthetic,
          isMargin: a.isMargin,
          metadata: a.metadata,
        });
        feat.id = a.id;
        return feat;
      })
    );
  }

  public async findNearbyAssets(
    lat: number,
    lon: number,
    radiusMeters: number = 50,
    type?: string
  ): Promise<{ asset: AssetEntity; distanceM: number }[]> {
    const queryPoint = turf.point([lon, lat]);
    const matches: { asset: AssetEntity; distanceM: number }[] = [];

    for (const asset of this.assets.values()) {
      if (type && asset.assetType !== type) continue;

      let distM: number;
      if (asset.geometry.type === 'Point') {
        distM = turf.distance(queryPoint, turf.point(asset.geometry.coordinates), { units: 'meters' });
      } else if (asset.geometry.type === 'LineString') {
        const ptOnLine = turf.pointOnFeature(turf.lineString(asset.geometry.coordinates));
        distM = turf.distance(queryPoint, ptOnLine, { units: 'meters' });
      } else {
        const polyCentroid = turf.point(asset.centroid);
        distM = turf.distance(queryPoint, polyCentroid, { units: 'meters' });
      }

      if (distM <= radiusMeters) {
        matches.push({ asset, distanceM: Math.round(distM * 10) / 10 });
      }
    }

    return matches.sort((a, b) => a.distanceM - b.distanceM);
  }

  public async updateAssetCondition(
    id: string,
    conditionStatus: any
  ): Promise<AssetEntity | null> {
    const asset = this.assets.get(id);
    if (!asset) return null;
    asset.conditionStatus = conditionStatus;
    asset.updatedAt = new Date().toISOString();
    this.assets.set(id, asset);
    return asset;
  }

  // -------------------------------------------------------------
  // Grievance Methods
  // -------------------------------------------------------------
  public async saveGrievance(g: GrievanceEntity): Promise<void> {
    this.grievances.set(g.id, g);
  }

  public async getGrievance(id: string): Promise<GrievanceEntity | null> {
    return this.grievances.get(id) || null;
  }

  public async getGrievances(filter?: {
    status?: string;
    category?: string;
    assetId?: string;
  }): Promise<GrievanceEntity[]> {
    let list = Array.from(this.grievances.values());
    if (filter?.status) {
      list = list.filter(g => g.status === filter.status);
    }
    if (filter?.category) {
      list = list.filter(g => g.category === filter.category);
    }
    if (filter?.assetId) {
      list = list.filter(g => g.assetId === filter.assetId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async updateGrievanceStatus(
    id: string,
    status: any,
    departmentId?: string
  ): Promise<GrievanceEntity | null> {
    const g = this.grievances.get(id);
    if (!g) return null;
    g.status = status;
    if (departmentId) g.assignedDepartmentId = departmentId;
    if (status === 'RESOLVED') g.resolvedAt = new Date().toISOString();
    g.updatedAt = new Date().toISOString();
    this.grievances.set(id, g);
    return g;
  }

  public async addGrievanceUpdate(
    id: string,
    update: any
  ): Promise<GrievanceEntity | null> {
    const g = this.grievances.get(id);
    if (!g) return null;
    if (!g.updates) g.updates = [];
    g.updates.push(update);
    if (update.statusChange) {
      g.status = update.statusChange;
      if (update.statusChange === 'RESOLVED') g.resolvedAt = new Date().toISOString();
    }
    g.updatedAt = new Date().toISOString();
    this.grievances.set(id, g);
    return g;
  }

  // -------------------------------------------------------------
  // Department Methods
  // -------------------------------------------------------------
  public async saveDepartment(d: DepartmentEntity): Promise<void> {
    this.departments.set(d.id, d);
  }

  public async getDepartment(id: string): Promise<DepartmentEntity | null> {
    return this.departments.get(id) || null;
  }

  public async getDepartments(): Promise<DepartmentEntity[]> {
    return Array.from(this.departments.values());
  }

  public async updateDepartment(
    id: string,
    partial: Partial<DepartmentEntity>
  ): Promise<DepartmentEntity | null> {
    const d = this.departments.get(id);
    if (!d) return null;
    const updated = { ...d, ...partial };
    this.departments.set(id, updated);
    return updated;
  }

  public async updateOperatorTickets(
    deptId: string,
    operatorId: string,
    delta: number
  ): Promise<void> {
    const dept = this.departments.get(deptId);
    if (!dept) return;
    const op = dept.operators.find(o => o.id === operatorId);
    if (op) {
      op.activeTicketsCount = Math.max(0, op.activeTicketsCount + delta);
      this.departments.set(deptId, dept);
    }
  }

  // -------------------------------------------------------------
  // Department Routing Rules Methods
  // -------------------------------------------------------------
  public async saveDepartmentRoutingRule(rule: DepartmentRoutingRule): Promise<void> {
    this.routingRules.set(rule.id, rule);
  }

  public async getDepartmentRoutingRules(): Promise<DepartmentRoutingRule[]> {
    return Array.from(this.routingRules.values());
  }

  public async getDepartmentRoutingRule(id: string): Promise<DepartmentRoutingRule | null> {
    return this.routingRules.get(id) || null;
  }

  public async updateDepartmentRoutingRule(
    id: string,
    partial: Partial<DepartmentRoutingRule>
  ): Promise<DepartmentRoutingRule | null> {
    const rule = this.routingRules.get(id);
    if (!rule) return null;
    const updated = { ...rule, ...partial };
    this.routingRules.set(id, updated);
    return updated;
  }

  // -------------------------------------------------------------
  // Work Order Methods
  // -------------------------------------------------------------
  public async saveWorkOrder(wo: WorkOrder): Promise<void> {
    this.workOrders.set(wo.id, wo);
    // Also append to parent grievance if it exists
    const g = this.grievances.get(wo.grievanceId);
    if (g) {
      if (!g.workOrders) g.workOrders = [];
      const idx = g.workOrders.findIndex(w => w.id === wo.id);
      if (idx >= 0) {
        g.workOrders[idx] = wo;
      } else {
        g.workOrders.push(wo);
      }
      this.grievances.set(g.id, g);
    }
  }

  public async getWorkOrders(grievanceId?: string, departmentId?: string): Promise<WorkOrder[]> {
    let list = Array.from(this.workOrders.values());
    if (grievanceId) {
      list = list.filter(w => w.grievanceId === grievanceId);
    }
    if (departmentId) {
      list = list.filter(w => w.departmentId === departmentId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getWorkOrder(id: string): Promise<WorkOrder | null> {
    return this.workOrders.get(id) || null;
  }

  public async updateWorkOrderStatus(
    id: string,
    status: WorkOrder['status']
  ): Promise<WorkOrder | null> {
    const wo = this.workOrders.get(id);
    if (!wo) return null;
    wo.status = status;
    if (status === 'COMPLETED') {
      wo.completedAt = new Date().toISOString();
    }
    this.workOrders.set(id, wo);
    // Update inside grievance
    const g = this.grievances.get(wo.grievanceId);
    if (g && g.workOrders) {
      const idx = g.workOrders.findIndex(w => w.id === id);
      if (idx >= 0) g.workOrders[idx] = wo;
      this.grievances.set(g.id, g);
    }
    return wo;
  }

  // -------------------------------------------------------------
  // Complaint Audit History
  // -------------------------------------------------------------
  public async addComplaintAuditEntry(entry: ComplaintAuditEntry): Promise<void> {
    const existing = this.auditLogs.get(entry.grievanceId) || [];
    if (!existing.some(e => e.id === entry.id)) {
      existing.push(entry);
      this.auditLogs.set(entry.grievanceId, existing);
    }

    // Keep canonical history array in the grievance
    const g = this.grievances.get(entry.grievanceId);
    if (g) {
      if (!g.history) g.history = [];
      if (!g.history.some(e => e.id === entry.id)) {
        g.history.push(entry);
      }
      this.grievances.set(g.id, g);
    }
  }

  public async getComplaintAuditEntries(grievanceId: string): Promise<ComplaintAuditEntry[]> {
    return this.auditLogs.get(grievanceId) || [];
  }

  // -------------------------------------------------------------
  // Department Dashboard Analytics (Persisted & Real Time)
  // -------------------------------------------------------------
  public async getDepartmentDashboard(departmentId: string): Promise<any> {
    const dept = this.departments.get(departmentId);
    const allGrievances = Array.from(this.grievances.values()).filter(
      g => g.assignedDepartmentId === departmentId || g.collaboratingDepartmentIds?.includes(departmentId)
    );

    const now = Date.now();
    const resolutionSlaMs = (dept?.slaHours?.resolution || 48) * 3600 * 1000;

    let total = allGrievances.length;
    let open = 0;
    let assigned = 0;
    let inProgress = 0;
    let resolved = 0;
    let rejected = 0;
    let overdue = 0;
    let highPriority = 0;
    let syntheticCount = 0;
    let realCount = 0;

    let totalAssignmentTimeMs = 0;
    let assignedCountWithTime = 0;
    let totalResolutionTimeMs = 0;
    let resolvedCountWithTime = 0;

    const ageing = {
      under24h: 0,
      from24to48h: 0,
      from48to72h: 0,
      over72h: 0,
    };

    const categoryBreakdown: Record<string, number> = {};

    for (const g of allGrievances) {
      if (g.isSynthetic) syntheticCount++;
      else realCount++;

      // Category breakdown
      categoryBreakdown[g.category] = (categoryBreakdown[g.category] || 0) + 1;

      // High priority check
      if (g.severity === 'HAZARDOUS' || g.severity === 'SEVERE' || g.priorityScore >= 70) {
        highPriority++;
      }

      // Age calculations
      const createdTime = new Date(g.createdAt).getTime();
      const ageHours = (now - createdTime) / (3600 * 1000);

      if (g.status === 'RESOLVED') {
        resolved++;
        if (g.resolvedAt) {
          const resTime = new Date(g.resolvedAt).getTime() - createdTime;
          totalResolutionTimeMs += Math.max(0, resTime);
          resolvedCountWithTime++;
        }
      } else if (g.status === 'REJECTED') {
        rejected++;
      } else {
        open++;
        if (g.status === 'ASSIGNED') assigned++;
        if (g.status === 'IN_PROGRESS') inProgress++;

        // Backlog ageing for open complaints
        if (ageHours < 24) ageing.under24h++;
        else if (ageHours < 48) ageing.from24to48h++;
        else if (ageHours < 72) ageing.from48to72h++;
        else ageing.over72h++;

        // Overdue check
        if (now - createdTime > resolutionSlaMs) {
          overdue++;
        }
      }

      // Time to assignment check
      if (g.history) {
        const assignEntry = g.history.find(h => h.action === 'ASSIGNED' || h.action === 'ROUTED');
        if (assignEntry) {
          const assignTime = new Date(assignEntry.timestamp).getTime() - createdTime;
          totalAssignmentTimeMs += Math.max(0, assignTime);
          assignedCountWithTime++;
        }
      }
    }

    const avgTimeToAssignmentHours = assignedCountWithTime > 0
      ? Number((totalAssignmentTimeMs / (assignedCountWithTime * 3600 * 1000)).toFixed(1))
      : 0.5; // default fallback demo metric

    const avgResolutionTimeHours = resolvedCountWithTime > 0
      ? Number((totalResolutionTimeMs / (resolvedCountWithTime * 3600 * 1000)).toFixed(1))
      : 18.4;

    const resolutionRate = total > 0 ? Number(((resolved / total) * 100).toFixed(1)) : 100;

    // Operator workload summary
    const operatorWorkloads = (dept?.operators || []).map(op => {
      // Calculate true active ticket count assigned to this operator
      const actualActiveTickets = allGrievances.filter(
        g => g.assignedOperatorId === op.id && g.status !== 'RESOLVED' && g.status !== 'REJECTED'
      ).length;

      return {
        id: op.id,
        name: op.name,
        role: op.role,
        activeTicketsCount: actualActiveTickets,
        maxCapacity: op.maxCapacity,
        utilizationPercent: Math.round((actualActiveTickets / op.maxCapacity) * 100),
        isAvailable: op.isAvailable && actualActiveTickets < op.maxCapacity,
      };
    });

    return {
      department: dept || { id: departmentId, name: 'Unknown Department' },
      metrics: {
        totalReceived: total,
        openComplaints: open,
        assignedComplaints: assigned,
        inProgressComplaints: inProgress,
        resolvedComplaints: resolved,
        rejectedComplaints: rejected,
        overdueComplaints: overdue,
        highPriorityComplaints: highPriority,
        avgTimeToAssignmentHours,
        avgResolutionTimeHours,
        resolutionRatePercent: resolutionRate,
        backlogAgeing: ageing,
        categoryBreakdown,
        realCount,
        syntheticCount,
      },
      operatorWorkloads,
      recentGrievances: allGrievances.slice(0, 15),
    };
  }

  // -------------------------------------------------------------
  // Maintenance & Risk Prediction Methods
  // -------------------------------------------------------------
  public async savePrediction(p: RiskPredictionEntity): Promise<void> {
    this.predictions.set(p.id, p);
  }

  public async getPredictions(assetId?: string): Promise<RiskPredictionEntity[]> {
    const list = Array.from(this.predictions.values());
    if (assetId) {
      return list.filter(p => p.assetId === assetId);
    }
    return list.sort((a, b) => b.riskScore - a.riskScore);
  }

  // -------------------------------------------------------------
  // Knowledge Graph Methods
  // -------------------------------------------------------------
  public async saveKnowledgeEdge(edge: KnowledgeEdgeEntity): Promise<void> {
    this.knowledgeEdges.set(edge.id, edge);
  }

  public async getKnowledgeEdges(filter?: {
    entityId?: string;
    entityType?: string;
  }): Promise<KnowledgeEdgeEntity[]> {
    let list = Array.from(this.knowledgeEdges.values());
    if (filter?.entityId) {
      list = list.filter(e => e.sourceId === filter.entityId || e.targetId === filter.entityId);
    }
    return list;
  }

  // -------------------------------------------------------------
  // Scenario Simulation Methods
  // -------------------------------------------------------------
  public async saveScenario(scenario: SimulationScenarioEntity): Promise<void> {
    this.scenarios.set(scenario.id, scenario);
  }

  public async getScenario(id: string): Promise<SimulationScenarioEntity | null> {
    return this.scenarios.get(id) || null;
  }

  public async getScenarios(): Promise<SimulationScenarioEntity[]> {
    return Array.from(this.scenarios.values());
  }

  // -------------------------------------------------------------
  // Analytics Aggregation
  // -------------------------------------------------------------
  public async getAnalyticsOverview(): Promise<any> {
    const allAssets = Array.from(this.assets.values());
    const allGrievances = Array.from(this.grievances.values());
    const allPredictions = Array.from(this.predictions.values());

    const roadCount = allAssets.filter(a => a.assetType === 'road').length;
    const buildingCount = allAssets.filter(a => a.assetType === 'building').length;
    const parkCount = allAssets.filter(a => a.assetType === 'park').length;
    const amenityCount = allAssets.filter(a => a.assetType === 'amenity').length;

    const verifiedHeightCount = allAssets.filter(a => a.assetType === 'building' && !a.heightIsEstimated).length;
    const estimatedHeightCount = allAssets.filter(a => a.assetType === 'building' && a.heightIsEstimated).length;

    const openGrievances = allGrievances.filter(g => g.status !== 'RESOLVED' && g.status !== 'REJECTED').length;
    const resolvedGrievances = allGrievances.filter(g => g.status === 'RESOLVED').length;

    const highRiskAssets = allPredictions.filter(p => p.riskCategory === 'HIGH' || p.riskCategory === 'CRITICAL').length;

    return {
      studyAreaId: config.studyArea.id,
      studyAreaName: config.studyArea.name,
      totalAssets: allAssets.length,
      breakdown: {
        roads: roadCount,
        buildings: buildingCount,
        parks: parkCount,
        amenities: amenityCount
      },
      heightIntegrity: {
        verifiedCount: verifiedHeightCount,
        estimatedCount: estimatedHeightCount,
        estimatedPercentage: buildingCount > 0 ? Math.round((estimatedHeightCount / buildingCount) * 100) : 0
      },
      grievances: {
        total: allGrievances.length,
        open: openGrievances,
        resolved: resolvedGrievances
      },
      riskSummary: {
        totalPredictions: allPredictions.length,
        highOrCriticalCount: highRiskAssets
      },
      databaseEngine: this.isPostgisActive ? 'PostgreSQL/PostGIS' : 'Turf Embedded Geospatial Engine (Dev Mode)',
      syntheticRecordsLabeled: true
    };
  }
}

export const spatialRepo = new SpatialRepository();
