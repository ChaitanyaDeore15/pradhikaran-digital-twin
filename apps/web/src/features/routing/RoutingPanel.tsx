import React, { useState, useEffect } from 'react';
import { RouteResult, Asset } from '../../types';
import { api } from '../../services/api';
import {
  Navigation,
  Compass,
  AlertOctagon,
  CheckCircle2,
  MapPin,
  Target,
  ArrowUpDown,
  Building,
  Sparkles,
  MousePointerClick,
  X,
} from 'lucide-react';

interface WaypointLocation {
  latitude: number;
  longitude: number;
  name: string;
}

interface RoutingPanelProps {
  roads: Asset[];
  assets: Asset[];
  activeRoute: RouteResult | null;
  onRouteCalculated: (route: RouteResult | null) => void;
  originPoint: WaypointLocation | null;
  destPoint: WaypointLocation | null;
  onSetOriginPoint: (point: WaypointLocation | null) => void;
  onSetDestPoint: (point: WaypointLocation | null) => void;
  pickingMode: 'none' | 'origin' | 'destination';
  onStartPicking: (mode: 'origin' | 'destination') => void;
  onCancelPicking: () => void;
}

export const RoutingPanel: React.FC<RoutingPanelProps> = ({
  roads,
  assets,
  activeRoute,
  onRouteCalculated,
  originPoint,
  destPoint,
  onSetOriginPoint,
  onSetDestPoint,
  pickingMode,
  onStartPicking,
  onCancelPicking,
}) => {
  // Available buildings and landmarks for direct selection
  const buildingsAndParks = assets.filter(
    a => a.assetType === 'building' || a.assetType === 'park'
  );

  const [selectedAvoidAsset, setSelectedAvoidAsset] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Set default initial waypoints if none selected yet
  useEffect(() => {
    if (!originPoint && buildingsAndParks.length > 0) {
      const pccoeMain = buildingsAndParks.find(b => b.id === 'asset-bg-pccoe-main') || buildingsAndParks[0];
      if (pccoeMain && pccoeMain.centroid) {
        onSetOriginPoint({
          latitude: pccoeMain.centroid[1],
          longitude: pccoeMain.centroid[0],
          name: pccoeMain.name,
        });
      }
    }
    if (!destPoint && buildingsAndParks.length > 1) {
      const sec26Market = buildingsAndParks.find(b => b.id === 'asset-bg-sec26-market') || buildingsAndParks[1];
      if (sec26Market && sec26Market.centroid) {
        onSetDestPoint({
          latitude: sec26Market.centroid[1],
          longitude: sec26Market.centroid[0],
          name: sec26Market.name,
        });
      }
    }
  }, [buildingsAndParks]);

  const handleCalculateRoute = async () => {
    if (!originPoint || !destPoint) {
      alert('Please select both Origin and Destination waypoints.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.calculateRoute({
        origin: { latitude: originPoint.latitude, longitude: originPoint.longitude },
        destination: { latitude: destPoint.latitude, longitude: destPoint.longitude },
        avoidAssetIds: selectedAvoidAsset ? [selectedAvoidAsset] : [],
      });
      onRouteCalculated(res);
    } catch (err: any) {
      alert(`Routing calculation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearRoute = () => {
    onRouteCalculated(null);
  };

  const handleSwapWaypoints = () => {
    const temp = originPoint;
    onSetOriginPoint(destPoint);
    onSetDestPoint(temp);
  };

  const handleSelectBuildingOrigin = (assetId: string) => {
    const asset = buildingsAndParks.find(b => b.id === assetId);
    if (asset && asset.centroid) {
      onSetOriginPoint({
        latitude: asset.centroid[1],
        longitude: asset.centroid[0],
        name: asset.name,
      });
    }
  };

  const handleSelectBuildingDest = (assetId: string) => {
    const asset = buildingsAndParks.find(b => b.id === assetId);
    if (asset && asset.centroid) {
      onSetDestPoint({
        latitude: asset.centroid[1],
        longitude: asset.centroid[0],
        name: asset.name,
      });
    }
  };

  const applyPresetItinerary = (preset: {
    originName: string;
    originCoords: [number, number];
    destName: string;
    destCoords: [number, number];
  }) => {
    onSetOriginPoint({
      latitude: preset.originCoords[1],
      longitude: preset.originCoords[0],
      name: preset.originName,
    });
    onSetDestPoint({
      latitude: preset.destCoords[1],
      longitude: preset.destCoords[0],
      name: preset.destName,
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2 text-cyan-400">
          <Navigation className="w-4 h-4" /> Module C: Intelligent 3D Routing
        </h2>
        <span className="text-[11px] text-slate-400">
          Interactive Building & Location Waypoint Navigation
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
        {/* Interactive Waypoint Selector Card */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 text-xs flex flex-col gap-3 shadow-md">
          <div className="flex items-center justify-between font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <MousePointerClick className="w-4 h-4 text-cyan-400" />
              Waypoint Selection
            </span>
            <button
              onClick={handleSwapWaypoints}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition flex items-center gap-1 text-[11px]"
              title="Swap Origin and Destination"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Swap</span>
            </button>
          </div>

          {/* 1. ORIGIN WAYPOINT */}
          <div className="bg-slate-900/80 border border-emerald-500/40 rounded-lg p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                <MapPin className="w-3.5 h-3.5" /> Origin (A)
              </label>
              <button
                onClick={() => onStartPicking('origin')}
                className={`text-[10px] px-2 py-0.5 rounded font-medium transition flex items-center gap-1 ${
                  pickingMode === 'origin'
                    ? 'bg-emerald-500 text-black font-bold animate-pulse'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                }`}
              >
                <MousePointerClick className="w-3 h-3" />
                {pickingMode === 'origin' ? 'Click Map Now...' : 'Pick on 3D Map'}
              </button>
            </div>

            {/* Direct Building Dropdown Selector */}
            <select
              value={buildingsAndParks.find(b => b.name === originPoint?.name)?.id || ''}
              onChange={e => handleSelectBuildingOrigin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Choose Landmark or Building --</option>
              {buildingsAndParks.map(b => (
                <option key={b.id} value={b.id}>
                  {b.assetType === 'building' ? '🏢' : '🌳'} {b.name}
                </option>
              ))}
            </select>

            {/* Display Selected Origin Point Details */}
            {originPoint && (
              <div className="text-[11px] bg-slate-950/60 p-1.5 rounded flex items-center justify-between font-mono text-slate-300">
                <span className="font-sans font-medium text-white truncate max-w-[180px]">
                  {originPoint.name}
                </span>
                <span className="text-[10px] text-emerald-400">
                  {originPoint.latitude.toFixed(4)}, {originPoint.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* 2. DESTINATION WAYPOINT */}
          <div className="bg-slate-900/80 border border-rose-500/40 rounded-lg p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 uppercase">
                <Target className="w-3.5 h-3.5" /> Destination (B)
              </label>
              <button
                onClick={() => onStartPicking('destination')}
                className={`text-[10px] px-2 py-0.5 rounded font-medium transition flex items-center gap-1 ${
                  pickingMode === 'destination'
                    ? 'bg-rose-500 text-white font-bold animate-pulse'
                    : 'bg-rose-950 text-rose-300 border border-rose-700 hover:bg-rose-900'
                }`}
              >
                <MousePointerClick className="w-3 h-3" />
                {pickingMode === 'destination' ? 'Click Map Now...' : 'Pick on 3D Map'}
              </button>
            </div>

            {/* Direct Building Dropdown Selector */}
            <select
              value={buildingsAndParks.find(b => b.name === destPoint?.name)?.id || ''}
              onChange={e => handleSelectBuildingDest(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="">-- Choose Landmark or Building --</option>
              {buildingsAndParks.map(b => (
                <option key={b.id} value={b.id}>
                  {b.assetType === 'building' ? '🏢' : '🌳'} {b.name}
                </option>
              ))}
            </select>

            {/* Display Selected Destination Point Details */}
            {destPoint && (
              <div className="text-[11px] bg-slate-950/60 p-1.5 rounded flex items-center justify-between font-mono text-slate-300">
                <span className="font-sans font-medium text-white truncate max-w-[180px]">
                  {destPoint.name}
                </span>
                <span className="text-[10px] text-rose-400">
                  {destPoint.latitude.toFixed(4)}, {destPoint.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Road closure avoidance */}
          <div className="pt-2 border-t border-slate-700/60">
            <label className="text-[11px] text-amber-400 font-medium flex items-center gap-1 mb-1">
              <AlertOctagon className="w-3.5 h-3.5" /> Simulated Road Closure Avoidance
            </label>
            <select
              value={selectedAvoidAsset}
              onChange={e => setSelectedAvoidAsset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
            >
              <option value="">No road closures (Standard shortest path)</option>
              {roads.map(r => (
                <option key={r.id} value={r.id}>
                  Close: {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCalculateRoute}
              disabled={loading || !originPoint || !destPoint}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Navigation className="w-3.5 h-3.5" />
              {loading ? 'Calculating Route...' : 'Calculate 3D Route'}
            </button>
            {activeRoute && (
              <button
                onClick={handleClearRoute}
                className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Popular Campus Routes */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 text-xs flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Quick Campus Route Presets
          </span>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() =>
                applyPresetItinerary({
                  originName: 'PCCOE Academic Complex & Admin',
                  originCoords: [73.76115, 18.65205],
                  destName: 'PCCOE Advanced Engineering Labs',
                  destCoords: [73.76210, 18.65170],
                })
              }
              className="bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 rounded p-2 text-left transition flex items-center justify-between"
            >
              <span className="text-slate-200 font-medium">Campus Quad: Main Building ➡️ Labs</span>
              <span className="text-[10px] text-cyan-400 font-mono">~180m</span>
            </button>

            <button
              type="button"
              onClick={() =>
                applyPresetItinerary({
                  originName: 'PCCOE Academic Complex & Admin',
                  originCoords: [73.76115, 18.65205],
                  destName: 'Pradhikaran Sector 26 Commercial Complex',
                  destCoords: [73.76470, 18.65100],
                })
              }
              className="bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 rounded p-2 text-left transition flex items-center justify-between"
            >
              <span className="text-slate-200 font-medium">Civic Run: Campus ➡️ Sector 26 Market</span>
              <span className="text-[10px] text-cyan-400 font-mono">~450m</span>
            </button>

            <button
              type="button"
              onClick={() =>
                applyPresetItinerary({
                  originName: 'PCCOE Central Library & Auditorium',
                  originCoords: [73.76055, 18.65245],
                  destName: 'Pradhikaran Sector 26 Public Garden',
                  destCoords: [73.76415, 18.65500],
                })
              }
              className="bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 rounded p-2 text-left transition flex items-center justify-between"
            >
              <span className="text-slate-200 font-medium">Green Corridor: Library ➡️ Sector 26 Garden</span>
              <span className="text-[10px] text-cyan-400 font-mono">~520m</span>
            </button>
          </div>
        </div>

        {/* Route Metrics Result Card */}
        {activeRoute && (
          <div className="bg-slate-800/80 border border-cyan-500/60 rounded-xl p-3.5 text-xs flex flex-col gap-3 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-cyan-300 font-semibold border-b border-slate-700/80 pb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Active Route Computed
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800 font-mono">
                {activeRoute.routingEngine}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Distance</span>
                <span className="text-lg font-bold text-white">{activeRoute.distanceMeters} m</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Est. Travel Time</span>
                <span className="text-lg font-bold text-cyan-400">
                  {Math.round(activeRoute.estimatedDurationSeconds / 60)} min
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ({activeRoute.estimatedDurationSeconds}s driving)
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
              Traversed Segments: <span className="font-mono text-cyan-300 font-bold">{activeRoute.traversedAssetIds.length} road links</span>
            </div>
            <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded">
              Route highlighted as a glowing cyan corridor draped across 3D terrain and road pavement in CesiumJS viewport.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
