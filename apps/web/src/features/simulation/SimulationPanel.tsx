import React, { useState } from 'react';
import { SimulationScenario, Asset } from '../../types';
import { api } from '../../services/api';
import { PlayCircle, Sliders, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';

interface SimulationPanelProps {
  roads: Asset[];
  scenarios: SimulationScenario[];
  onRefresh: () => void;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  roads,
  scenarios,
  onRefresh,
}) => {
  const [scenarioName, setScenarioName] = useState<string>('Sector 26 Main Gate Resurfacing & Closure');
  const [selectedRoadId, setSelectedRoadId] = useState<string>(roads.length > 0 ? roads[0].id : '');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<SimulationScenario | null>(
    scenarios.length > 0 ? scenarios[0] : null
  );

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoadId) return;

    try {
      setSimulating(true);
      const res = await api.runSimulation({
        name: scenarioName,
        description: 'Simulated road closure and drainage infrastructure maintenance',
        closedAssetIds: [selectedRoadId],
      });
      setActiveResult(res);
      onRefresh();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2 text-emerald-400">
          <Sliders className="w-4 h-4" /> Module F: Urban Scenario Simulation
        </h2>
        <span className="text-[11px] text-slate-400">
          What-If Infrastructure Intervention & Impact Analysis
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
        {/* Scenario Config Form */}
        <form onSubmit={handleRunSimulation} className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3 text-xs flex flex-col gap-3">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" /> Configure What-If Scenario
          </span>

          <div>
            <label className="text-slate-400 block mb-1">Scenario Title</label>
            <input
              type="text"
              required
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Target Road Segment for Simulated Closure</label>
            <select
              value={selectedRoadId}
              onChange={e => setSelectedRoadId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
            >
              {roads.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.id})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={simulating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded text-xs transition flex items-center justify-center gap-1.5"
          >
            {simulating ? 'Calculating Impact Graph...' : 'Run Scenario Simulation'}
          </button>
        </form>

        {/* Results Card */}
        {activeResult?.results && (
          <div className="bg-slate-800/80 border border-emerald-500/50 rounded-lg p-3 text-xs flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div>
                <span className="text-[10px] text-emerald-400 font-mono uppercase">Simulation Output</span>
                <h3 className="text-sm font-bold text-white">{activeResult.name}</h3>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                COMPLETED
              </span>
            </div>

            <p className="text-slate-300 leading-snug bg-slate-900/60 p-2 rounded">
              {activeResult.results.resultSummary}
            </p>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-400 block">Corridor Length</span>
                <span className="text-base font-bold text-white">
                  {activeResult.results.metrics.totalClosedLengthMeters} m
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-400 block">Impacted Assets</span>
                <span className="text-base font-bold text-emerald-400">
                  {activeResult.results.metrics.adjacentImpactedAssetsCount}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-400 block">Active Grievances</span>
                <span className="text-base font-bold text-orange-400">
                  {activeResult.results.metrics.activeGrievancesImpacted}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-400 block">Detour Overhead</span>
                <span className="text-base font-bold text-cyan-400">
                  +{activeResult.results.metrics.estimatedDetourTimeMinutes} min
                </span>
              </div>
            </div>

            {/* Explicit Assumptions & Limitations */}
            <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800 flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-400" /> Explicit Modeling Assumptions:
              </span>
              <ul className="text-[10px] text-slate-400 list-disc list-inside space-y-0.5">
                {activeResult.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
