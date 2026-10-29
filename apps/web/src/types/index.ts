export interface StudyArea {
  id: string;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusM: number;
  marginM: number;
  boundaryGeoJson: any;
  marginBoundaryGeoJson?: any;
  verificationStatus: string;
}

export interface Asset {
  id: string;
  studyAreaId: string;
  externalSourceId: string;
  assetType: 'road' | 'building' | 'park' | 'junction' | 'amenity';
  name: string;
  description?: string;
  geometry: any;
  centroid: [number, number];
  conditionStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DEGRADED' | 'CRITICAL';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY_CORRIDOR';
  heightM: number;
  heightSource: string;
  heightIsEstimated: boolean;
  dataSource: string;
  sourceUrl?: string;
  isSynthetic: boolean;
  isMargin: boolean;
  metadata?: any;
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

export interface Department {
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

export interface VisualFeatureVector {
  surfaceRoughness: number;
  specularWaterIndex: number;
  greenVegetationIndex: number;
  chromaticEntropy: number;
  darkContrastRatio: number;
  cleanMoistureSheen: number;
}

export interface VisionDepartmentPrediction {
  departmentId: string;
  departmentName: string;
  predictedCategory: string;
  confidence: number;
  allDepartmentProbabilities: Record<string, number>;
  visualFeatures: VisualFeatureVector;
  explanation: string;
  modelMetadata: {
    modelName: string;
    modelVersion: string;
    trainingSampleSize: number;
    trainAccuracy: number;
    validationAccuracy: number;
    validationF1Score: number;
    trainedAt: string;
  };
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

export interface Grievance {
  id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  status: 'SUBMITTED' | 'AI_CLASSIFIED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  severity: 'LOW' | 'MODERATE' | 'SEVERE' | 'HAZARDOUS';
  priorityScore: number;
  assignedDepartmentId?: string;
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  collaboratingDepartmentIds?: string[];
  routingDecision?: RoutingDecision;
  classificationResult?: string;
  classificationConfidence?: number;
  assetId?: string;
  imageUrl?: string;
  updates?: GrievanceUpdate[];
  history?: ComplaintAuditEntry[];
  workOrders?: WorkOrder[];
  escalationLevel?: number;
  isOverdue?: boolean;
  isSynthetic: boolean;
  createdAt: string;
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

export interface RouteResult {
  distanceMeters: number;
  estimatedDurationSeconds: number;
  routeGeometry: any;
  traversedAssetIds: string[];
  routingEngine: string;
}

export interface RiskPrediction {
  id: string;
  assetId: string;
  modelName: string;
  modelVersion: string;
  riskScore: number;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  featureSummary: any;
  isSynthetic: boolean;
  generatedAt: string;
}

export interface KnowledgeGraphData {
  centerEntity: any;
  nodes: { id: string; type: string; name: string; details?: any }[];
  edges: { id: string; sourceType: string; sourceId: string; targetType: string; targetId: string; relationshipType: string }[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  scenarioType: string;
  proposedConfiguration: { closedAssetIds: string[] };
  assumptions: string[];
  status: string;
  results?: {
    affectedAssetIds: string[];
    affectedGrievanceIds: string[];
    metrics: Record<string, any>;
    resultSummary: string;
  };
}

export interface AnalyticsOverview {
  studyAreaId: string;
  studyAreaName: string;
  totalAssets: number;
  breakdown: {
    roads: number;
    buildings: number;
    parks: number;
    amenities: number;
  };
  heightIntegrity: {
    verifiedCount: number;
    estimatedCount: number;
    estimatedPercentage: number;
  };
  grievances: {
    total: number;
    open: number;
    resolved: number;
  };
  riskSummary: {
    totalPredictions: number;
    highOrCriticalCount: number;
  };
  databaseEngine: string;
  syntheticRecordsLabeled: boolean;
}

export interface User {
  id: string;
  displayName: string;
  designation?: string;
  department?: string;
  jurisdiction?: string;
  badgeNumber?: string;
  email: string;
  role: 'AUTHORITY_ADMIN' | 'CAMPUS_AUTHORITY' | 'CITIZEN' | 'ADMIN' | 'FIELD_OFFICER';
}

export interface AuthSession {
  token: string;
  user: User;
}
