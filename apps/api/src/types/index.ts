export type AssetType = 'road' | 'building' | 'park' | 'junction' | 'amenity';
export type ConditionStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DEGRADED' | 'CRITICAL';
export type Criticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY_CORRIDOR';
export type GrievanceStatus = 'SUBMITTED' | 'AI_CLASSIFIED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type GrievanceSeverity = 'LOW' | 'MODERATE' | 'SEVERE' | 'HAZARDOUS';
export type HeightSource = 'source_osm_tag' | 'inferred_from_levels' | 'default_visualization_fallback';

export interface GeoJsonGeometry {
  type: string;
  coordinates: any;
}

export interface StudyAreaEntity {
  id: string;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusM: number;
  marginM: number;
  boundaryGeoJson: GeoJsonGeometry;
  marginBoundaryGeoJson: GeoJsonGeometry;
  sourceName: string;
  sourceUrl?: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetEntity {
  id: string;
  studyAreaId: string;
  externalSourceId: string;
  assetType: AssetType;
  name: string;
  description?: string;
  geometry: GeoJsonGeometry;
  centroid: [number, number]; // [lon, lat]
  conditionStatus: ConditionStatus;
  criticality: Criticality;
  heightM: number;
  heightSource: HeightSource;
  heightIsEstimated: boolean;
  dataSource: string;
  sourceUrl?: string;
  isSynthetic: boolean;
  isMargin: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentOperator {
  id: string;
  name: string;
  role: string;
  email: string;
  activeTicketsCount: number;
  maxCapacity: number;
  isAvailable: boolean;
}

export interface DepartmentEntity {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  contactPhone?: string;
  supportedCategories: string[];
  supportedAssetTypes: string[];
  jurisdictionArea: string;
  slaHours: {
    response: number;
    resolution: number;
  };
  operators: DepartmentOperator[];
  escalationContact?: string;
  isActive: boolean;
}

export interface DepartmentRoutingRule {
  id: string;
  ruleName: string;
  categoryMatch: string;
  assetTypeMatch?: string;
  jurisdictionMatch?: string;
  targetDepartmentId: string;
  confidenceThreshold: number;
  ruleVersion: string;
  priorityScoreBoost?: number;
  isActive: boolean;
}

export interface WorkOrder {
  id: string;
  grievanceId: string;
  departmentId: string;
  operatorId?: string;
  operatorName?: string;
  title: string;
  status: 'PENDING' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: string;
  instructions: string;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface ComplaintAuditEntry {
  id: string;
  grievanceId: string;
  action: 'SUBMITTED' | 'AI_CLASSIFIED' | 'ROUTED' | 'ASSIGNED' | 'REASSIGNED' | 'STATUS_CHANGED' | 'ESCALATED' | 'WORK_ORDER_CREATED';
  performedBy: string;
  previousDepartmentId?: string;
  newDepartmentId?: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  timestamp: string;
}

export interface RoutingDecision {
  selectedDepartmentId: string;
  confidence: number;
  ruleVersion: string;
  explanation: string;
  decidedAt: string;
  isAutomated: boolean;
  isManualReviewRequired: boolean;
  isOutsideJurisdiction: boolean;
}

export interface GrievanceEntity {
  id: string;
  reporterId?: string;
  assetId?: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  status: GrievanceStatus;
  severity: GrievanceSeverity;
  priorityScore: number;
  priorityFactors: Record<string, any>;
  assignedDepartmentId?: string;
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  collaboratingDepartmentIds?: string[];
  classificationResult?: string;
  classificationConfidence?: number;
  imageUrl?: string;
  routingDecision?: RoutingDecision;
  workOrders?: WorkOrder[];
  history?: ComplaintAuditEntry[];
  updates?: GrievanceUpdate[];
  slaTargetHours?: number;
  isOverdue?: boolean;
  escalationLevel?: number;
  isSynthetic: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface GrievanceUpdate {
  id: string;
  authorName: string;
  authorRole: string;
  remarks: string;
  statusChange?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface RiskPredictionEntity {
  id: string;
  assetId: string;
  modelName: string;
  modelVersion: string;
  predictionTarget: string;
  riskScore: number;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence?: number;
  featureSummary: Record<string, any>;
  isSynthetic: boolean;
  generatedAt: string;
}

export interface KnowledgeEdgeEntity {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationshipType: string;
  provenance: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SimulationScenarioEntity {
  id: string;
  name: string;
  description: string;
  scenarioType: string;
  proposedConfiguration: {
    closedAssetIds: string[];
    detourNotes?: string;
  };
  assumptions: string[];
  status: string;
  createdBy?: string;
  createdAt: string;
  results?: {
    affectedAssetIds: string[];
    affectedGrievanceIds: string[];
    metrics: Record<string, any>;
    resultSummary: string;
    generatedAt: string;
  };
}
