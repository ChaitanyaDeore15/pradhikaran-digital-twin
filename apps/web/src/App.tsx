import React, { useState, useEffect } from 'react';
import { CesiumViewer } from './features/digital-twin/CesiumViewer';
import { AssetRegistryPanel } from './features/assets/AssetRegistryPanel';
import { GrievancePanel } from './features/grievances/GrievancePanel';
import { RoutingPanel } from './features/routing/RoutingPanel';
import { MaintenancePanel } from './features/maintenance/MaintenancePanel';
import { KnowledgeGraphPanel } from './features/knowledge-graph/KnowledgeGraphPanel';
import { SimulationPanel } from './features/simulation/SimulationPanel';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { DepartmentDashboardPanel } from './features/departments/DepartmentDashboardPanel';
import { AuthorityLoginModal } from './features/auth/AuthorityLoginModal';
import { api } from './services/api';
import {
  StudyArea,
  Asset,
  Grievance,
  RouteResult,
  RiskPrediction,
  SimulationScenario,
  AnalyticsOverview,
  User,
} from './types';
import {
  Building2,
  AlertTriangle,
  Navigation,
  ShieldAlert,
  ShieldCheck,
  Network,
  Sliders,
  LayoutDashboard,
  Layers,
  MapPin,
  Info,
  ChevronRight,
  ChevronLeft,
  KeyRound,
  Globe,
  Briefcase,
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation tabs
  type TabKey = 'twin' | 'assets' | 'grievances' | 'departments' | 'routing' | 'maintenance' | 'graph' | 'simulation' | 'dashboard';
  const [activeTab, setActiveTab] = useState<TabKey>('twin');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Authentication & Jurisdiction State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('dt_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Interactive Routing Waypoints & Picking State
  const [pickingMode, setPickingMode] = useState<'none' | 'origin' | 'destination'>('none');
  const [originPoint, setOriginPoint] = useState<{ latitude: number; longitude: number; name: string } | null>(null);
  const [destPoint, setDestPoint] = useState<{ latitude: number; longitude: number; name: string } | null>(null);

  const handleSelectLocationFromMap = (point: { latitude: number; longitude: number; name: string }) => {
    if (pickingMode === 'origin') {
      setOriginPoint(point);
      setPickingMode('none');
    } else if (pickingMode === 'destination') {
      setDestPoint(point);
      setPickingMode('none');
    }
  };

  // Core Data States
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [studyArea, setStudyArea] = useState<StudyArea | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [flyToGrievanceTarget, setFlyToGrievanceTarget] = useState<Grievance | null>(null);
  const [graphFocusId, setGraphFocusId] = useState<string>('');

  const handleGoToGrievanceLocation = (g: Grievance) => {
    setSelectedGrievance(g);
    setFlyToGrievanceTarget({ ...g });
    setActiveTab('twin');
    setSidebarOpen(false);
  };

  // Initial Data Fetch
  const loadData = async () => {
    try {
      const [areas, assetList, grvList, predList, simList, overview] = await Promise.all([
        api.getStudyAreas(),
        api.getAssets(),
        api.getGrievances(),
        api.getRiskPredictions(),
        api.getScenarios(),
        api.getAnalyticsOverview(),
      ]);

      if (areas.length > 0) {
        setStudyAreas(areas);
        setStudyArea(prev => (prev ? areas.find(a => a.id === prev.id) || areas[0] : areas[0]));
      }
      setAssets(assetList);
      setGrievances(grvList);
      setPredictions(predList);
      setScenarios(simList);
      setAnalytics(overview);
    } catch (err) {
      console.error('Failed to load digital twin data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const roads = assets.filter(a => a.assetType === 'road');

  const handleSelectAsset = (asset: Asset | null) => {
    setSelectedAsset(asset);
    if (asset) {
      setActiveTab('assets');
      setSidebarOpen(true);
    }
  };

  const handleSelectAssetById = (id: string) => {
    const a = assets.find(item => item.id === id);
    if (a) {
      setSelectedAsset(a);
      setActiveTab('assets');
      setSidebarOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. TOP HEADER & NAVIGATION */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-md">
            DT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold tracking-wider uppercase text-white">
                Pradhikaran Urban Digital Twin
              </h1>
              {/* Study Area / Boundary Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-700/80">
                <Globe className="w-3 h-3 text-cyan-400" />
                <select
                  value={studyArea?.id || 'sa-pccoe-1km'}
                  onChange={e => {
                    const selected = studyAreas.find(a => a.id === e.target.value);
                    if (selected) setStudyArea(selected);
                  }}
                  className="bg-transparent text-[10px] font-semibold text-cyan-300 focus:outline-none cursor-pointer"
                  title="Switch geographic study area / municipality boundary"
                >
                  {studyAreas.map(sa => (
                    <option key={sa.id} value={sa.id} className="bg-slate-900 text-white">
                      {sa.id === 'sa-pcmc-full'
                        ? 'PCMC City-Wide (181 km²)'
                        : 'PCCOE 1 km Core (Pradhikaran)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-red-400" />
              <span>
                Center: {studyArea ? `${studyArea.centerLatitude.toFixed(4)}°N, ${studyArea.centerLongitude.toFixed(4)}°E` : '18.6517°N, 73.7615°E'}
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Radius: {studyArea ? `${(studyArea.radiusM / 1000).toFixed(1)} km` : '1.0 km'} (+{studyArea?.marginM || 150}m margin)
              </span>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => {
              setActiveTab('twin');
              setSidebarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'twin' && !sidebarOpen
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 3D Twin
          </button>

          <button
            onClick={() => {
              setActiveTab('assets');
              setSidebarOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'assets' && sidebarOpen
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Assets
          </button>

          <button
            onClick={() => {
              setActiveTab('grievances');
              setSidebarOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'grievances' && sidebarOpen
                ? 'bg-orange-600 text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Grievances
          </button>

          <button
            onClick={() => {
              setActiveTab('departments');
              setSidebarOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'departments' && sidebarOpen
                ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-400" /> Departments
          </button>

          <button
            onClick={() => {
              setActiveTab('routing');
              setSidebarOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'routing' && sidebarOpen
                ? 'bg-cyan-600 text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> Routing
          </button>

          <button
            onClick={() => {
              setActiveTab('maintenance');
              setSidebarOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'maintenance' && sidebarOpen
                ? 'bg-rose-600 text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Maintenance
          </button>

          <button
            onClick={() => {
              setActiveTab('graph');
              setSidebarOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'graph' && sidebarOpen
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" /> Graph
          </button>

          <button
            onClick={() => {
              setActiveTab('simulation');
              setSidebarOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'simulation' && sidebarOpen
                ? 'bg-emerald-600 text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Simulation
          </button>

          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSidebarOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'dashboard' && sidebarOpen
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Metrics
          </button>
        </nav>

        {/* Right side: Authority Portal & User Jurisdiction */}
        <div className="flex items-center gap-3">
          {currentUser && (currentUser.role === 'AUTHORITY_ADMIN' || currentUser.role === 'CAMPUS_AUTHORITY') ? (
            <div className="flex items-center gap-2">
              <div
                onClick={() => setAuthModalOpen(true)}
                className="cursor-pointer bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/80 px-2.5 py-1 rounded-lg flex items-center gap-2 transition shadow-sm"
                title="Click to manage authority profile or switch jurisdiction"
              >
                <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    {currentUser.displayName}
                    <span className="text-[9px] bg-emerald-800 text-emerald-200 px-1 py-0.2 rounded font-mono">
                      {currentUser.badgeNumber || 'OFFICIAL'}
                    </span>
                  </span>
                  <span className="text-[9px] text-emerald-300 line-clamp-1 max-w-[190px]">
                    {currentUser.jurisdiction || currentUser.department}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem('dt_auth_token');
                  localStorage.removeItem('dt_auth_user');
                  setCurrentUser(null);
                }}
                className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded hover:bg-slate-800 transition"
                title="Switch back to public citizen mode"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden sm:inline">Citizen Mode</span>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Authority Login</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. PERSISTENT DEMONSTRATION & ETHICS BANNER */}
      <div className="bg-slate-900 border-b border-slate-800 text-[11px] px-4 py-1 flex items-center justify-between text-slate-300 z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span><strong>Grounding:</strong> Real Pradhikaran PCCOE OpenStreetMap Geometry (ODbL 1.0).</span>
          <span className="text-slate-500">•</span>
          <span className="text-purple-300 font-medium">Demo tickets & simulated condition ratings labeled synthetic.</span>
        </div>
        <div className="text-[10px] text-slate-400">
          Core twin operates 100% open-source without Google API keys
        </div>
      </div>

      {/* 3. MAIN WORKSPACE VIEWPORT (3D CESIUM + SLIDE-OVER SIDEBAR) */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Full-bleed CesiumJS 3D Viewport */}
        <div className="flex-1 h-full relative">
          <CesiumViewer
            studyArea={studyArea}
            assets={assets}
            grievances={grievances}
            activeRoute={activeRoute}
            selectedAsset={selectedAsset}
            onSelectAsset={handleSelectAsset}
            selectedGrievance={selectedGrievance}
            onSelectGrievance={g => {
              setSelectedGrievance(g);
              if (g) {
                setFlyToGrievanceTarget({ ...g });
              }
            }}
            flyToGrievance={flyToGrievanceTarget}
            onClearFlyToGrievance={() => {
              setSelectedGrievance(null);
              setFlyToGrievanceTarget(null);
            }}
            onOpenDepartmentDashboard={() => {
              setActiveTab('departments');
              setSidebarOpen(true);
            }}
            pickingMode={pickingMode}
            originPoint={originPoint}
            destPoint={destPoint}
            onSelectLocation={handleSelectLocationFromMap}
            onCancelPicking={() => setPickingMode('none')}
          />

          {/* Toggle Sidebar Handle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-4 right-4 z-10 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white p-2 rounded-lg shadow-xl flex items-center gap-1 text-xs"
            title={sidebarOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{sidebarOpen ? 'Hide Panel' : 'Open Controls'}</span>
          </button>
        </div>

        {/* Operational Modules Slide-Over Sidebar */}
        {sidebarOpen && (
          <aside className={`${activeTab === 'departments' ? 'w-[560px]' : 'w-[420px]'} h-full z-10 flex-shrink-0 shadow-2xl transition-all duration-200`}>
            {activeTab === 'assets' && (
              <AssetRegistryPanel
                assets={assets}
                selectedAsset={selectedAsset}
                onSelectAsset={setSelectedAsset}
                onRefresh={loadData}
                currentUser={currentUser}
                onOpenAuthorityLogin={() => setAuthModalOpen(true)}
              />
            )}
            {activeTab === 'grievances' && (
              <GrievancePanel
                grievances={grievances}
                onRefresh={loadData}
                currentUser={currentUser}
                onOpenAuthorityLogin={() => setAuthModalOpen(true)}
                onSelectGrievanceOnMap={handleGoToGrievanceLocation}
              />
            )}
            {activeTab === 'departments' && (
              <DepartmentDashboardPanel
                currentUser={currentUser}
                onSelectGrievanceOnMap={handleGoToGrievanceLocation}
                onRefreshMapGrievances={loadData}
              />
            )}
            {activeTab === 'routing' && (
              <RoutingPanel
                roads={roads}
                assets={assets}
                activeRoute={activeRoute}
                onRouteCalculated={setActiveRoute}
                originPoint={originPoint}
                destPoint={destPoint}
                onSetOriginPoint={setOriginPoint}
                onSetDestPoint={setDestPoint}
                pickingMode={pickingMode}
                onStartPicking={mode => setPickingMode(mode)}
                onCancelPicking={() => setPickingMode('none')}
              />
            )}
            {activeTab === 'maintenance' && (
              <MaintenancePanel
                predictions={predictions}
                assets={assets}
                onRefresh={loadData}
                onSelectAssetById={handleSelectAssetById}
              />
            )}
            {activeTab === 'graph' && (
              <KnowledgeGraphPanel
                assets={assets}
                initialEntityId={graphFocusId || (selectedAsset ? selectedAsset.id : undefined)}
                onSelectAssetById={handleSelectAssetById}
              />
            )}
            {activeTab === 'simulation' && (
              <SimulationPanel
                roads={roads}
                scenarios={scenarios}
                onRefresh={loadData}
              />
            )}
            {activeTab === 'dashboard' && (
              <DashboardOverview
                analytics={analytics}
                onRefresh={loadData}
              />
            )}
          </aside>
        )}
      </div>

      {/* Authority Jurisdictional Login Modal */}
      <AuthorityLoginModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={user => setCurrentUser(user)}
      />
    </div>
  );
};
