import React from 'react';
import { AnalyticsOverview } from '../../types';
import { LayoutDashboard, Database, ShieldCheck, AlertCircle, BarChart3, Building, FileCheck } from 'lucide-react';

interface DashboardOverviewProps {
  analytics: AnalyticsOverview | null;
  onRefresh: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  analytics,
  onRefresh,
}) => {
  if (!analytics) {
    return <div className="p-4 text-xs text-slate-400">Loading operational analytics...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2 text-blue-400">
            <LayoutDashboard className="w-4 h-4" /> Module G: Decision Support
          </h2>
          <span className="text-[11px] text-slate-400">
            Real-Time Database Operational Metrics & Data Quality
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
        {/* Grounding & Engine Banner */}
        <div className="bg-slate-800/70 border border-slate-700/80 rounded-lg p-3 text-xs flex flex-col gap-2 shadow">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" /> Geospatial Database Engine
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono px-1.5 py-0.5 rounded">
              ONLINE
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-300">
            {analytics.databaseEngine}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Target: {analytics.studyAreaName}
          </div>
        </div>

        {/* High-Level Inventory Metrics */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block text-[10px] uppercase font-medium">Mapped Assets</span>
            <span className="text-xl font-bold text-white mt-1 block">{analytics.totalAssets}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {analytics.breakdown.buildings} Buildings • {analytics.breakdown.roads} Roads
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block text-[10px] uppercase font-medium">High Risk Assets</span>
            <span className="text-xl font-bold text-rose-400 mt-1 block">
              {analytics.riskSummary.highOrCriticalCount}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              of {analytics.riskSummary.totalPredictions} Evaluated
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block text-[10px] uppercase font-medium">Open Grievances</span>
            <span className="text-xl font-bold text-orange-400 mt-1 block">
              {analytics.grievances.open}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {analytics.grievances.total} Total Reports
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block text-[10px] uppercase font-medium">Resolved Issues</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">
              {analytics.grievances.resolved}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Verified Field Fixes</span>
          </div>
        </div>

        {/* Data Quality & Height Completeness */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3 text-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-amber-400" /> 3D Building Height Completeness
            </span>
            <span className="text-amber-400 font-mono text-[11px]">
              {analytics.heightIntegrity.estimatedPercentage}% Estimated
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${100 - analytics.heightIntegrity.estimatedPercentage}%` }}
              title="Verified Heights"
            />
            <div
              className="bg-amber-500 h-full"
              style={{ width: `${analytics.heightIntegrity.estimatedPercentage}%` }}
              title="Estimated Fallback Heights"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
            <div>Verified Tagged: {analytics.heightIntegrity.verifiedCount}</div>
            <div>Estimated Visual: {analytics.heightIntegrity.estimatedCount}</div>
          </div>
          <p className="text-[10px] text-slate-400 italic">
            Non-negotiable rule compliance: estimated visual heights are never treated as engineering ground truth.
          </p>
        </div>

        {/* License & Provenance Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 flex flex-col gap-1.5">
          <span className="font-semibold text-slate-200">Data Attribution & Legal Compliance:</span>
          <div>Source: OpenStreetMap Contributors</div>
          <div>License: Open Database License (ODbL) 1.0</div>
          <div>Reference: Pimpri Chinchwad College of Engineering (OSM Way 177084644)</div>
          <div className="text-[10px] text-purple-400 mt-1">
            * Operational demonstration tickets and condition ratings include labeled synthetic benchmark records.
          </div>
        </div>
      </div>
    </div>
  );
};
