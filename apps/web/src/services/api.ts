import {
  StudyArea,
  Asset,
  Grievance,
  RouteResult,
  RiskPrediction,
  KnowledgeGraphData,
  SimulationScenario,
  AnalyticsOverview,
  VisionDepartmentPrediction,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Study Areas
  getStudyAreas: async (): Promise<StudyArea[]> => {
    const json: any = await fetchJson(`${API_BASE}/study-areas`);
    return json.data;
  },

  updateStudyArea: async (id: string, payload: Partial<StudyArea>): Promise<StudyArea> => {
    const json: any = await fetchJson(`${API_BASE}/study-areas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  // Assets
  getAssets: async (type?: string): Promise<Asset[]> => {
    const query = type ? `?type=${type}` : '';
    const json: any = await fetchJson(`${API_BASE}/assets${query}`);
    return json.data;
  },

  getAssetsGeoJson: async (type?: string): Promise<any> => {
    const query = type ? `?type=${type}` : '';
    return fetchJson(`${API_BASE}/gis/assets.geojson${query}`);
  },

  getAssetById: async (id: string): Promise<Asset> => {
    const json: any = await fetchJson(`${API_BASE}/assets/${id}`);
    return json.data;
  },

  updateAssetCondition: async (id: string, conditionStatus: string): Promise<Asset> => {
    const json: any = await fetchJson(`${API_BASE}/assets/${id}/condition`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conditionStatus }),
    });
    return json.data;
  },

  // Grievances
  getGrievances: async (): Promise<Grievance[]> => {
    const json: any = await fetchJson(`${API_BASE}/grievances`);
    return json.data;
  },

  submitGrievance: async (payload: {
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    severity?: string;
    imageUrl?: string;
  }): Promise<Grievance> => {
    const json: any = await fetchJson(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  updateGrievanceStatus: async (id: string, status: string, departmentId?: string): Promise<Grievance> => {
    const json: any = await fetchJson(`${API_BASE}/grievances/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, departmentId }),
    });
    return json.data;
  },

  addGrievanceUpdate: async (id: string, payload: {
    authorName: string;
    authorRole: string;
    remarks: string;
    statusChange?: string;
    imageUrl?: string;
  }): Promise<Grievance> => {
    const json: any = await fetchJson(`${API_BASE}/grievances/${id}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  // Routing
  calculateRoute: async (payload: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    avoidAssetIds?: string[];
  }): Promise<RouteResult> => {
    const json: any = await fetchJson(`${API_BASE}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  // Maintenance & Risk
  getRiskPredictions: async (): Promise<RiskPrediction[]> => {
    const json: any = await fetchJson(`${API_BASE}/maintenance/risks`);
    return json.data;
  },

  predictAssetRisk: async (assetId: string): Promise<RiskPrediction> => {
    const json: any = await fetchJson(`${API_BASE}/maintenance/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId }),
    });
    return json.data;
  },

  // Knowledge Graph
  getGraphNeighborhood: async (entityId: string): Promise<KnowledgeGraphData> => {
    const json: any = await fetchJson(`${API_BASE}/graph/neighborhood?entityId=${encodeURIComponent(entityId)}`);
    return json.data;
  },

  // Simulation
  getScenarios: async (): Promise<SimulationScenario[]> => {
    const json: any = await fetchJson(`${API_BASE}/simulations`);
    return json.data;
  },

  runSimulation: async (payload: {
    name: string;
    description?: string;
    closedAssetIds: string[];
  }): Promise<SimulationScenario> => {
    const json: any = await fetchJson(`${API_BASE}/simulations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  // Analytics
  getAnalyticsOverview: async (): Promise<AnalyticsOverview> => {
    const json: any = await fetchJson(`${API_BASE}/analytics/overview`);
    return json.data;
  },

  // Auth & Authority Jurisdiction
  getAuthAccounts: async (): Promise<any[]> => {
    const json: any = await fetchJson(`${API_BASE}/auth/accounts`);
    return json.data;
  },

  login: async (email: string): Promise<{ token: string; user: any }> => {
    const json: any = await fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return json.data;
  },

  getMe: async (token?: string): Promise<any> => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const json: any = await fetchJson(`${API_BASE}/auth/me`, { headers });
    return json.data.user;
  },

  // Department Workload & Routing Management
  getDepartments: async (): Promise<any[]> => {
    const json: any = await fetchJson(`${API_BASE}/departments`);
    return json.data;
  },

  getDepartmentDashboard: async (departmentId: string): Promise<any> => {
    const json: any = await fetchJson(`${API_BASE}/departments/${departmentId}/dashboard`);
    return json.data;
  },

  getDepartmentRoutingRules: async (): Promise<any[]> => {
    const json: any = await fetchJson(`${API_BASE}/departments/admin/routing-rules`);
    return json.data;
  },

  updateDepartmentRoutingRule: async (id: string, payload: any): Promise<any> => {
    const json: any = await fetchJson(`${API_BASE}/departments/admin/routing-rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  reassignGrievance: async (id: string, payload: {
    departmentId: string;
    operatorId?: string;
    reason?: string;
    performedBy?: string;
  }): Promise<Grievance> => {
    const json: any = await fetchJson(`${API_BASE}/grievances/${id}/assignment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  escalateGrievance: async (id: string, payload: {
    reason: string;
    performedBy?: string;
  }): Promise<Grievance> => {
    const json: any = await fetchJson(`${API_BASE}/grievances/${id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  getGrievanceHistory: async (id: string): Promise<any[]> => {
    const json: any = await fetchJson(`${API_BASE}/grievances/${id}/history`);
    return json.data;
  },

  getWorkOrders: async (grievanceId?: string, departmentId?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (grievanceId) params.append('grievance_id', grievanceId);
    if (departmentId) params.append('department_id', departmentId);
    const json: any = await fetchJson(`${API_BASE}/departments/work-orders?${params.toString()}`);
    return json.data;
  },

  createWorkOrder: async (payload: {
    grievanceId: string;
    departmentId: string;
    title: string;
    instructions: string;
    dueDate: string;
    operatorId?: string;
    priority?: string;
  }): Promise<any> => {
    const json: any = await fetchJson(`${API_BASE}/departments/work-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  },

  updateWorkOrderStatus: async (id: string, status: string): Promise<any> => {
    const json: any = await fetchJson(`${API_BASE}/departments/work-orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return json.data;
  },

  classifyDepartmentImage: async (payload: {
    image?: string;
    imageBase64?: string;
    filename?: string;
  }): Promise<VisionDepartmentPrediction> => {
    const json: any = await fetchJson(`${API_BASE}/departments/classify-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  },
};
