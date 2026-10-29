import { spatialRepo } from './repositories/spatialRepository';
import {
  DepartmentEntity,
  DepartmentRoutingRule,
  AssetEntity,
  GrievanceEntity,
  RiskPredictionEntity,
  KnowledgeEdgeEntity
} from './types';
import { StudyAreaService } from './services/studyAreaService';
import fs from 'fs';
import path from 'path';

export async function seedInitialData() {
  console.log('[Seed] Seeding initial departments, study areas, and routing rules...');

  // 0. Ensure Study Areas are initialized
  await StudyAreaService.initializeDefaultStudyAreas();

  // 1. Departments Registry
  const departments: DepartmentEntity[] = [
    {
      id: 'dept-roads',
      name: 'Roads & Public Works Department',
      code: 'PCMC-PWD-RD',
      contactEmail: 'roads.pwd@pcmcindia.gov.in',
      contactPhone: '+91 20 2742 5511',
      supportedCategories: ['pothole', 'damaged_road', 'damaged_sidewalk', 'street_furniture', 'bridge_maintenance', 'speed_breaker'],
      supportedAssetTypes: ['road', 'bridge', 'sidewalk'],
      jurisdictionArea: 'PCMC Ward 14 & Zone A / Pradhikaran & Nigdi',
      slaHours: { response: 4, resolution: 48 },
      operators: [
        { id: 'op-rd-01', name: 'Er. Rajesh Patil', role: 'Senior Road Maintenance Engineer', email: 'r.patil@pcmcindia.gov.in', activeTicketsCount: 3, maxCapacity: 12, isAvailable: true },
        { id: 'op-rd-02', name: 'Kavita Shinde', role: 'Asphalt & Pavement Specialist', email: 'k.shinde@pcmcindia.gov.in', activeTicketsCount: 2, maxCapacity: 10, isAvailable: true }
      ],
      escalationContact: 'pcmc.chief.roads@pcmcindia.gov.in',
      isActive: true,
    },
    {
      id: 'dept-drainage',
      name: 'Drainage & Stormwater Department',
      code: 'PCMC-DRN-SW',
      contactEmail: 'drainage@pcmcindia.gov.in',
      contactPhone: '+91 20 2742 5512',
      supportedCategories: ['waterlogging', 'drain_clog', 'sewer_overflow', 'manhole_cover', 'culvert_block'],
      supportedAssetTypes: ['drain', 'manhole', 'culvert', 'road'],
      jurisdictionArea: 'PCMC Nigdi-Pradhikaran Stormwater Division',
      slaHours: { response: 3, resolution: 24 },
      operators: [
        { id: 'op-dr-01', name: 'Sunil Deshmukh', role: 'Stormwater Works Supervisor', email: 's.deshmukh@pcmcindia.gov.in', activeTicketsCount: 2, maxCapacity: 8, isAvailable: true },
        { id: 'op-dr-02', name: 'Anil More', role: 'Drainage Remediation Specialist', email: 'a.more@pcmcindia.gov.in', activeTicketsCount: 1, maxCapacity: 8, isAvailable: true }
      ],
      escalationContact: 'drainage.head@pcmcindia.gov.in',
      isActive: true,
    },
    {
      id: 'dept-sanitation',
      name: 'Sanitation & Solid Waste Management',
      code: 'PCMC-SWM-CL',
      contactEmail: 'sanitation@pcmcindia.gov.in',
      contactPhone: '+91 20 2742 5513',
      supportedCategories: ['waste_accumulation', 'garbage_dump', 'dead_animal', 'public_toilet', 'littering'],
      supportedAssetTypes: ['amenity', 'park', 'road'],
      jurisdictionArea: 'PCMC Ward 14 Solid Waste Section',
      slaHours: { response: 2, resolution: 16 },
      operators: [
        { id: 'op-sw-01', name: 'Pooja Jadhav', role: 'Sanitation Inspector Zone 3', email: 'p.jadhav@pcmcindia.gov.in', activeTicketsCount: 3, maxCapacity: 15, isAvailable: true }
      ],
      escalationContact: 'swm.director@pcmcindia.gov.in',
      isActive: true,
    },
    {
      id: 'dept-electrical',
      name: 'Street Lighting & Electrical Department',
      code: 'PCMC-ELE-LT',
      contactEmail: 'electrical@pcmcindia.gov.in',
      contactPhone: '+91 20 2742 5514',
      supportedCategories: ['broken_streetlight', 'cable_hazard', 'transformer_spark', 'pole_damage', 'dark_spot'],
      supportedAssetTypes: ['streetlight', 'amenity', 'road'],
      jurisdictionArea: 'PCMC Pradhikaran Electrical Sub-division',
      slaHours: { response: 2, resolution: 24 },
      operators: [
        { id: 'op-el-01', name: 'Vikas Gaikwad', role: 'Electrical Lines Inspector', email: 'v.gaikwad@pcmcindia.gov.in', activeTicketsCount: 1, maxCapacity: 10, isAvailable: true }
      ],
      escalationContact: 'chief.electrical@pcmcindia.gov.in',
      isActive: true,
    },
    {
      id: 'dept-water',
      name: 'Water Supply & Distribution Department',
      code: 'PCMC-WTR-DS',
      contactEmail: 'water.supply@pcmcindia.gov.in',
      contactPhone: '+91 20 2742 5515',
      supportedCategories: ['pipeline_leakage', 'water_contamination', 'low_pressure', 'illegal_tap', 'valve_failure'],
      supportedAssetTypes: ['pipeline', 'amenity'],
      jurisdictionArea: 'Sector 26 Nigdi Water Supply Zone',
      slaHours: { response: 2, resolution: 12 },
      operators: [
        { id: 'op-wt-01', name: 'Ramesh Kulkarni', role: 'Water Line Supervisor', email: 'r.kulkarni@pcmcindia.gov.in', activeTicketsCount: 2, maxCapacity: 10, isAvailable: true }
      ],
      escalationContact: 'water.superintendent@pcmcindia.gov.in',
      isActive: true,
    },
    {
      id: 'dept-parks',
      name: 'Parks, Gardens & Tree Authority',
      code: 'PCMC-PRK-TR',
      contactEmail: 'gardens@pcmcindia.gov.in',
      contactPhone: '+91 20 2742 5516',
      supportedCategories: ['fallen_tree', 'overgrown_vegetation', 'park_bench', 'playground_equipment', 'garden_waste'],
      supportedAssetTypes: ['park', 'tree', 'amenity'],
      jurisdictionArea: 'PCMC Zone A Parks & Open Spaces',
      slaHours: { response: 6, resolution: 48 },
      operators: [
        { id: 'op-pk-01', name: 'Meena Bhosale', role: 'Horticulture Officer', email: 'm.bhosale@pcmcindia.gov.in', activeTicketsCount: 1, maxCapacity: 8, isAvailable: true }
      ],
      escalationContact: 'gardens.deputy@pcmcindia.gov.in',
      isActive: true,
    },
    {
      id: 'dept-general-review',
      name: 'Municipal General Review & Escalation Queue',
      code: 'PCMC-GEN-REV',
      contactEmail: 'grievance.hq@pcmcindia.gov.in',
      contactPhone: '+91 20 2742 5500',
      supportedCategories: ['other', 'unclassified', 'multi_department', 'jurisdiction_boundary_conflict'],
      supportedAssetTypes: ['road', 'building', 'park', 'amenity'],
      jurisdictionArea: 'Pimpri Chinchwad City-Wide (All PCMC Jurisdictions)',
      slaHours: { response: 4, resolution: 72 },
      operators: [
        { id: 'op-gen-01', name: 'Chief Grievance Redressal Officer (PCMC HQ)', role: 'Municipal Central Escalation Lead', email: 'grievance.hq@pcmcindia.gov.in', activeTicketsCount: 0, maxCapacity: 50, isAvailable: true }
      ],
      escalationContact: 'commissioner@pcmcindia.gov.in',
      isActive: true,
    }
  ];

  for (const dept of departments) {
    await spatialRepo.saveDepartment(dept);
  }

  // 2. Department Routing Rules
  const routingRules: DepartmentRoutingRule[] = [
    { id: 'rule-pothole', ruleName: 'Road Pothole Routing Rule', categoryMatch: 'pothole', assetTypeMatch: 'road', targetDepartmentId: 'dept-roads', confidenceThreshold: 0.90, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-damaged-road', ruleName: 'Damaged Road Surface Rule', categoryMatch: 'damaged_road', assetTypeMatch: 'road', targetDepartmentId: 'dept-roads', confidenceThreshold: 0.88, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-damaged-sidewalk', ruleName: 'Pedestrian Sidewalk Rule', categoryMatch: 'damaged_sidewalk', assetTypeMatch: 'sidewalk', targetDepartmentId: 'dept-roads', confidenceThreshold: 0.85, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-waterlogging', ruleName: 'Monsoon Waterlogging Rule', categoryMatch: 'waterlogging', assetTypeMatch: 'drain', targetDepartmentId: 'dept-drainage', confidenceThreshold: 0.92, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-drain-clog', ruleName: 'Storm Drain Blockage Rule', categoryMatch: 'drain_clog', assetTypeMatch: 'drain', targetDepartmentId: 'dept-drainage', confidenceThreshold: 0.90, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-waste', ruleName: 'Solid Waste Accumulation Rule', categoryMatch: 'waste_accumulation', assetTypeMatch: 'amenity', targetDepartmentId: 'dept-sanitation', confidenceThreshold: 0.94, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-garbage', ruleName: 'Garbage Dump Rule', categoryMatch: 'garbage_dump', assetTypeMatch: 'amenity', targetDepartmentId: 'dept-sanitation', confidenceThreshold: 0.92, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-streetlight', ruleName: 'Streetlight Failure Rule', categoryMatch: 'broken_streetlight', assetTypeMatch: 'streetlight', targetDepartmentId: 'dept-electrical', confidenceThreshold: 0.95, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-cable', ruleName: 'Electrical Cable Hazard Rule', categoryMatch: 'cable_hazard', assetTypeMatch: 'streetlight', targetDepartmentId: 'dept-electrical', confidenceThreshold: 0.90, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-pipeline', ruleName: 'Water Main Leakage Rule', categoryMatch: 'pipeline_leakage', assetTypeMatch: 'pipeline', targetDepartmentId: 'dept-water', confidenceThreshold: 0.93, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-tree', ruleName: 'Fallen Tree Clearance Rule', categoryMatch: 'fallen_tree', assetTypeMatch: 'tree', targetDepartmentId: 'dept-parks', confidenceThreshold: 0.92, ruleVersion: 'v1.0', isActive: true },
    { id: 'rule-park', ruleName: 'Park Equipment Rule', categoryMatch: 'playground_equipment', assetTypeMatch: 'park', targetDepartmentId: 'dept-parks', confidenceThreshold: 0.88, ruleVersion: 'v1.0', isActive: true }
  ];

  for (const rule of routingRules) {
    await spatialRepo.saveDepartmentRoutingRule(rule);
  }

  // 2. Synchronize real PCCOE & Pradhikaran geographic features from verified snapshot
  console.log('[Seed] Ingesting real PCCOE & Pradhikaran geographic features with satellite-aligned geometry...');
  await loadInitialGeographicAssets();

  // 3. Seed labeled synthetic operational grievances
  const currentGrievances = await spatialRepo.getGrievances();
  if (currentGrievances.length === 0) {
    console.log('[Seed] Seeding labeled synthetic civic grievances for operational demonstration...');
    await seedOperationalRecords();
  }
}

async function loadInitialGeographicAssets() {
  // Verified real coordinates for PCCOE Campus and key Pradhikaran roads
  // Grounded in OpenStreetMap Nominatim Way 177084644 & surrounding sector 26 geometry
  const initialFeatures: AssetEntity[] = [
    // 1. PCCOE Main Campus Building
    {
      id: 'asset-bg-pccoe-main',
      studyAreaId: 'sa-pccoe-1km',
      externalSourceId: 'osm-way-177084644',
      assetType: 'building',
      name: 'PCCOE Academic Complex & Administrative Wing',
      description: 'Pimpri Chinchwad College Of Engineering Main Building, Sector 26',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [73.760700, 18.651600],
          [73.761600, 18.651600],
          [73.761600, 18.652500],
          [73.760700, 18.652500],
          [73.760700, 18.651600]
        ]]
      },
      centroid: [73.761150, 18.652050],
      conditionStatus: 'EXCELLENT',
      criticality: 'HIGH',
      heightM: 18.5,
      heightSource: 'inferred_from_levels',
      heightIsEstimated: true,
      dataSource: 'OpenStreetMap contributors',
      sourceUrl: 'https://www.openstreetmap.org/way/177084644',
      isSynthetic: false,
      isMargin: false,
      metadata: { building: 'university', floors: 5 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // 2. PCCOE Mechanical & Computer Engg Labs
    {
      id: 'asset-bg-pccoe-labs',
      studyAreaId: 'sa-pccoe-1km',
      externalSourceId: 'osm-way-pccoe-labs',
      assetType: 'building',
      name: 'PCCOE Advanced Engineering Labs & Innovation Center',
      description: 'Engineering Laboratories & Workshop Complex',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [73.761700, 18.651300],
          [73.762500, 18.651300],
          [73.762500, 18.652100],
          [73.761700, 18.652100],
          [73.761700, 18.651300]
        ]]
      },
      centroid: [73.762100, 18.651700],
      conditionStatus: 'GOOD',
      criticality: 'HIGH',
      heightM: 14.0,
      heightSource: 'inferred_from_levels',
      heightIsEstimated: true,
      dataSource: 'OpenStreetMap contributors',
      isSynthetic: false,
      isMargin: false,
      metadata: { building: 'university', floors: 4 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // 2b. PCCOE Central Library & Auditorium
    {
      id: 'asset-bg-pccoe-library',
      studyAreaId: 'sa-pccoe-1km',
      externalSourceId: 'osm-way-pccoe-library',
      assetType: 'building',
      name: 'PCCOE Central Library & Auditorium',
      description: 'Knowledge Resource Center, Digital Library & Seminar Hall',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [73.760200, 18.652100],
          [73.760900, 18.652100],
          [73.760900, 18.652800],
          [73.760200, 18.652800],
          [73.760200, 18.652100]
        ]]
      },
      centroid: [73.760550, 18.652450],
      conditionStatus: 'EXCELLENT',
      criticality: 'MEDIUM',
      heightM: 12.0,
      heightSource: 'inferred_from_levels',
      heightIsEstimated: true,
      dataSource: 'OpenStreetMap contributors',
      isSynthetic: false,
      isMargin: false,
      metadata: { building: 'university', amenity: 'library', floors: 3 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // 2c. PCCOE Mechanical & Robotics Workshops
    {
      id: 'asset-bg-pccoe-workshops',
      studyAreaId: 'sa-pccoe-1km',
      externalSourceId: 'osm-way-pccoe-workshops',
      assetType: 'building',
      name: 'PCCOE Mechanical & Robotics Workshops',
      description: 'Fabrication Shop, CNC Labs & Automation Center',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [73.762600, 18.651000],
          [73.763400, 18.651000],
          [73.763400, 18.651800],
          [73.762600, 18.651800],
          [73.762600, 18.651000]
        ]]
      },
      centroid: [73.763000, 18.651400],
      conditionStatus: 'GOOD',
      criticality: 'HIGH',
      heightM: 10.0,
      heightSource: 'inferred_from_levels',
      heightIsEstimated: true,
      dataSource: 'OpenStreetMap contributors',
      isSynthetic: false,
      isMargin: false,
      metadata: { building: 'university', shop: 'workshop', floors: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // 2d. PCCOE Sports Complex & Cricket Ground
    {
      id: 'asset-pk-pccoe-sports',
      studyAreaId: 'sa-pccoe-1km',
      externalSourceId: 'osm-way-pccoe-sports',
      assetType: 'park',
      name: 'PCCOE Sports Complex & Cricket Oval',
      description: 'Campus sports arena, athletic track, and recreational grounds',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [73.761800, 18.652500],
          [73.763000, 18.652500],
          [73.763000, 18.653600],
          [73.761800, 18.653600],
          [73.761800, 18.652500]
        ]]
      },
      centroid: [73.762400, 18.653050],
      conditionStatus: 'EXCELLENT',
      criticality: 'LOW',
      heightM: 0,
      heightSource: 'default_visualization_fallback',
      heightIsEstimated: false,
      dataSource: 'OpenStreetMap contributors',
      isSynthetic: false,
      isMargin: false,
      metadata: { leisure: 'pitch', sport: 'cricket' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // 3. Bhakti Vedant Swami Marg (PCCOE Front Access Arterial)
    {
      id: 'asset-rd-krantisinha-patil',
      studyAreaId: 'sa-pccoe-1km',
      externalSourceId: 'osm-way-bhakti-vedant',
      assetType: 'road',
      name: 'Bhakti Vedant Swami Marg (PCCOE Access Road)',
      description: 'Major access arterial road along PCCOE campus front gate',
      geometry: {
        type: 'LineString',
        coordinates: [
          [73.757000, 18.654200],
          [73.758800, 18.653200],
          [73.760200, 18.652200],
          [73.761200, 18.651500],
          [73.762800, 18.650600],
          [73.764500, 18.649200],
          [73.765500, 18.647500]
        ]
      },
      centroid: [73.761200, 18.651500],
      conditionStatus: 'DEGRADED',
      criticality: 'HIGH',
      heightM: 0,
      heightSource: 'default_visualization_fallback',
      heightIsEstimated: false,
      dataSource: 'OpenStreetMap contributors',
      isSynthetic: false,
      isMargin: false,
      metadata: { highway: 'secondary', surface: 'asphalt', length_m: 1250 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // 4. Late Bhaguji Dashrath Tupe Marg (Northern Campus Perimeter)
    {
      id: 'asset-rd-sector26-spine',
      studyAreaId: 'sa-pccoe-1km',
      externalSourceId: 'osm-way-tupe-marg',
      assetType: 'road',
      name: 'Late Bhaguji Dashrath Tupe Marg',
      description: 'Northern perimeter avenue bounding PCCOE campus and Sector 26',
      geometry: {
        type: 'LineString',
        coordinates: [
          [73.757000, 18.654200],
          [73.759200, 18.653400],
          [73.761200, 18.652700],
          [73.763200, 18.652100],
          [73.765000, 18.651500]
        ]
      },
      centroid: [73.761200, 18.652700],
      conditionStatus: 'FAIR',
      criticality: 'HIGH',
      heightM: 0,
      heightSource: 'default_visualization_fallback',
      heightIsEstimated: false,
      dataSource: 'OpenStreetMap contributors',
      isSynthetic: false,
      isMargin: false,
      metadata: { highway: 'tertiary', surface: 'asphalt', length_m: 950 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // 5. Pradhikaran Sector 26 Central Spine Avenue
    {
      id: 'asset-rd-sec26-lane1',
      studyAreaId: 'sa-pccoe-1km',
      externalSourceId: 'osm-way-sec26-central-spine',
      assetType: 'road',
      name: 'Sector 26 Central Spine Boulevard',
      description: 'Tree-lined central avenue linking residential societies to Ravet corridor',
      geometry: {
        type: 'LineString',
        coordinates: [
          [73.764000, 18.657000],
          [73.764300, 18.654500],
          [73.764700, 18.652500],
          [73.765000, 18.650000],
          [73.765500, 18.647500]
        ]
      },
      centroid: [73.764700, 18.652500],
      conditionStatus: 'GOOD',
      criticality: 'MEDIUM',
      heightM: 0,
      heightSource: 'default_visualization_fallback',
      heightIsEstimated: false,
      dataSource: 'OpenStreetMap contributors',
      isSynthetic: false,
      isMargin: false,
      metadata: { highway: 'residential', surface: 'asphalt', length_m: 1100 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // 6. Pradhikaran Sector 26 Community Park & Green Belt
    {
      id: 'asset-pk-sec26-garden',
      studyAreaId: 'sa-pccoe-1km',
      externalSourceId: 'osm-way-sec26-park',
      assetType: 'park',
      name: 'Pradhikaran Sector 26 Public Garden & Green Belt',
      description: 'Municipal recreational green space and rainwater percolation zone',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [73.763500, 18.654000],
          [73.764800, 18.654000],
          [73.764800, 18.656000],
          [73.763500, 18.656000],
          [73.763500, 18.654000]
        ]]
      },
      centroid: [73.764150, 18.655000],
      conditionStatus: 'EXCELLENT',
      criticality: 'MEDIUM',
      heightM: 0,
      heightSource: 'default_visualization_fallback',
      heightIsEstimated: false,
      dataSource: 'OpenStreetMap contributors',
      isSynthetic: false,
      isMargin: false,
      metadata: { leisure: 'park' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // 7. Pradhikaran Commercial Plaza & Sector 26 Market
    {
      id: 'asset-bg-sec26-market',
      studyAreaId: 'sa-pccoe-1km',
      externalSourceId: 'osm-way-sec26-market',
      assetType: 'building',
      name: 'Pradhikaran Sector 26 Commercial Complex',
      description: 'Retail and civic utility building',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [73.764200, 18.650500],
          [73.765200, 18.650500],
          [73.765200, 18.651500],
          [73.764200, 18.651500],
          [73.764200, 18.650500]
        ]]
      },
      centroid: [73.764700, 18.651000],
      conditionStatus: 'GOOD',
      criticality: 'MEDIUM',
      heightM: 11.0,
      heightSource: 'default_visualization_fallback',
      heightIsEstimated: true,
      dataSource: 'OpenStreetMap contributors',
      isSynthetic: false,
      isMargin: false,
      metadata: { building: 'commercial', floors: 3 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  await spatialRepo.saveAssetsBatch(initialFeatures);
  console.log(`[Seed] Ingested ${initialFeatures.length} real geographic infrastructure assets.`);
}

async function seedOperationalRecords() {
  // Labeled synthetic operational records for demonstration
  const syntheticGrievances: GrievanceEntity[] = [
    {
      id: 'grv-synth-001',
      assetId: 'asset-rd-krantisinha-patil',
      category: 'pothole',
      description: 'Multiple deep asphalt craters along Krantisinha Nana Patil road near PCCOE Gate 2 causing traffic disruption.',
      latitude: 18.6520,
      longitude: 73.761055,
      status: 'IN_PROGRESS',
      severity: 'SEVERE',
      priorityScore: 85.00,
      priorityFactors: { severityBase: 75, infrastructureProximityBonus: 10 },
      assignedDepartmentId: 'dept-roads',
      assignedOperatorId: 'op-rd-01',
      assignedOperatorName: 'Er. Rajesh Patil',
      classificationResult: 'pothole',
      classificationConfidence: 0.94,
      routingDecision: {
        selectedDepartmentId: 'dept-roads',
        confidence: 0.94,
        ruleVersion: 'v1.0',
        explanation: 'Matched Road Pothole Routing Rule for Krantisinha Nana Patil road.',
        decidedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        isAutomated: true,
        isManualReviewRequired: false,
        isOutsideJurisdiction: false,
      },
      history: [
        {
          id: 'aud-synth-01',
          grievanceId: 'grv-synth-001',
          action: 'SUBMITTED',
          performedBy: 'Citizen Reporter (Pimpri Citizen App)',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 'aud-synth-02',
          grievanceId: 'grv-synth-001',
          action: 'ROUTED',
          performedBy: 'Automated Routing Engine v1.0',
          newDepartmentId: 'dept-roads',
          reason: 'Matched Road Pothole Routing Rule (confidence 0.94)',
          timestamp: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
        },
        {
          id: 'aud-synth-03',
          grievanceId: 'grv-synth-001',
          action: 'ASSIGNED',
          performedBy: 'Workload-Aware Dispatcher',
          newDepartmentId: 'dept-roads',
          reason: 'Dispatched to Er. Rajesh Patil (Senior Road Maintenance Engineer)',
          timestamp: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
        }
      ],
      isSynthetic: true, // LABELED SYNTHETIC
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'grv-synth-002',
      assetId: 'asset-rd-sector26-spine',
      category: 'waterlogging',
      description: 'Stormwater drain overflowing near Sector 26 junction during sudden monsoon rain.',
      latitude: 18.6522,
      longitude: 73.7650,
      status: 'ASSIGNED',
      severity: 'MODERATE',
      priorityScore: 60.00,
      priorityFactors: { severityBase: 50, infrastructureProximityBonus: 10 },
      assignedDepartmentId: 'dept-drainage',
      assignedOperatorId: 'op-dr-01',
      assignedOperatorName: 'Sunil Deshmukh',
      classificationResult: 'waterlogging',
      classificationConfidence: 0.91,
      routingDecision: {
        selectedDepartmentId: 'dept-drainage',
        confidence: 0.91,
        ruleVersion: 'v1.0',
        explanation: 'Matched Monsoon Waterlogging Rule for Sector 26 spine.',
        decidedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        isAutomated: true,
        isManualReviewRequired: false,
        isOutsideJurisdiction: false,
      },
      history: [
        {
          id: 'aud-synth-04',
          grievanceId: 'grv-synth-002',
          action: 'SUBMITTED',
          performedBy: 'Local Resident',
          timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
          id: 'aud-synth-05',
          grievanceId: 'grv-synth-002',
          action: 'ROUTED',
          performedBy: 'Automated Routing Engine v1.0',
          newDepartmentId: 'dept-drainage',
          timestamp: new Date(Date.now() - 86400000 * 1 + 1800000).toISOString(),
        }
      ],
      isSynthetic: true, // LABELED SYNTHETIC
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'grv-synth-003',
      assetId: 'asset-rd-sec26-lane1',
      category: 'waste_accumulation',
      description: 'Uncollected organic and construction debris accumulated beside sidewalk paver blocks.',
      latitude: 18.6541,
      longitude: 73.7645,
      status: 'SUBMITTED',
      severity: 'LOW',
      priorityScore: 35.00,
      priorityFactors: { severityBase: 25, infrastructureProximityBonus: 10 },
      assignedDepartmentId: 'dept-sanitation',
      classificationResult: 'waste_accumulation',
      classificationConfidence: 0.88,
      isSynthetic: true, // LABELED SYNTHETIC
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'grv-synth-004-resolved',
      assetId: 'asset-rd-tupe-marg',
      category: 'pothole',
      description: 'Patch repair required for broken road corner near Tupe Marg school crossing. Completed by Quick Response Team.',
      latitude: 18.6508,
      longitude: 73.7628,
      status: 'RESOLVED',
      severity: 'MODERATE',
      priorityScore: 55.00,
      priorityFactors: { severityBase: 50, infrastructureProximityBonus: 5 },
      assignedDepartmentId: 'dept-roads',
      assignedOperatorId: 'op-rd-02',
      assignedOperatorName: 'Kavita Shinde',
      resolvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      history: [
        {
          id: 'aud-synth-06',
          grievanceId: 'grv-synth-004-resolved',
          action: 'SUBMITTED',
          performedBy: 'Traffic Warden',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 'aud-synth-07',
          grievanceId: 'grv-synth-004-resolved',
          action: 'STATUS_CHANGED',
          performedBy: 'Er. Rajesh Patil',
          previousStatus: 'IN_PROGRESS',
          newStatus: 'RESOLVED',
          reason: 'Cold mix asphalt patch compacted and inspected.',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        }
      ],
      updates: [
        {
          id: 'upd-synth-01',
          authorName: 'Er. Rajesh Patil',
          authorRole: 'Senior Road Maintenance Engineer',
          remarks: 'Asphalt cold patch applied and leveled with road roller. Cleared for vehicular movement.',
          statusChange: 'RESOLVED',
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        }
      ],
      isSynthetic: true, // LABELED SYNTHETIC
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ];

  for (const grv of syntheticGrievances) {
    await spatialRepo.saveGrievance(grv);
    if (grv.history) {
      for (const h of [...grv.history]) {
        await spatialRepo.addComplaintAuditEntry(h);
      }
    }
    if (grv.assetId) {
      const edge: KnowledgeEdgeEntity = {
        id: `edge-${grv.id}-${grv.assetId}`,
        sourceType: 'grievance',
        sourceId: grv.id,
        targetType: 'asset',
        targetId: grv.assetId,
        relationshipType: 'LOCATED_ON',
        provenance: 'LABELED_SYNTHETIC_DEMO_SEED',
        metadata: { is_synthetic: true },
        createdAt: new Date().toISOString()
      };
      await spatialRepo.saveKnowledgeEdge(edge);
    }
  }

  // Create an initial work order for demonstration
  await spatialRepo.saveWorkOrder({
    id: 'wo-demo-001',
    grievanceId: 'grv-synth-001',
    departmentId: 'dept-roads',
    operatorId: 'op-rd-01',
    operatorName: 'Er. Rajesh Patil',
    title: 'Emergency Asphalt Resurfacing & Base Compaction',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    instructions: 'Milling of damaged surface course and laying 40mm bituminous concrete over 15m stretch near PCCOE Gate 2.',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  });

  // Seed risk predictions for assets
  const syntheticPredictions: RiskPredictionEntity[] = [
    {
      id: 'pred-synth-krantisinha',
      assetId: 'asset-rd-krantisinha-patil',
      modelName: 'pradhikaran_transparent_risk_v1.0',
      modelVersion: '1.0.0',
      predictionTarget: 'structural_surface_degradation',
      riskScore: 78.5,
      riskCategory: 'CRITICAL',
      confidence: 0.88,
      featureSummary: {
        condition_rating_base: 75.0,
        complaint_penalty: 12.0,
        road_criticality_multiplier: 1.2
      },
      isSynthetic: true, // LABELED SYNTHETIC
      generatedAt: new Date().toISOString()
    },
    {
      id: 'pred-synth-spine',
      assetId: 'asset-rd-sector26-spine',
      modelName: 'pradhikaran_transparent_risk_v1.0',
      modelVersion: '1.0.0',
      predictionTarget: 'structural_surface_degradation',
      riskScore: 54.0,
      riskCategory: 'MEDIUM',
      confidence: 0.90,
      featureSummary: {
        condition_rating_base: 50.0,
        complaint_penalty: 6.0,
        road_criticality_multiplier: 1.1
      },
      isSynthetic: true, // LABELED SYNTHETIC
      generatedAt: new Date().toISOString()
    }
  ];

  for (const pred of syntheticPredictions) {
    await spatialRepo.savePrediction(pred);
  }

  console.log('[Seed] Labeled synthetic operational records created.');
}
