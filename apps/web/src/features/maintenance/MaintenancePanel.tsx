import React, { useState } from 'react';
import { RiskPrediction, Asset } from '../../types';
import { api } from '../../services/api';
import { ShieldAlert, Activity, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';

interface MaintenancePanelProps {
  predictions: RiskPrediction[];
  assets: Asset[];
  onRefresh: () => void;
  onSelectAssetById: (id: string) => void;
}

export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({
  predictions,
  assets,
  onRefresh,
  onSelectAssetById,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);

  const handlePredict = async () => {
    if (!selectedAssetId) return;
    try {
      setEvaluating(true);
      await api.predictAssetRisk(selectedAssetId);
      onRefresh();
    } catch (err: any) {
      alert(`Prediction failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2 text-rose-400">
          <ShieldAlert className="w-4 h-4" /> Module D: Predictive Maintenance
        </h2>
        <span className="text-[11px] text-slate-400">
          Interpretable Asset Risk Scoring & Inspection Priority
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
        {/* On-demand Predictor Card */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3 text-xs flex flex-col gap-2.5">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Run Infrastructure Risk Evaluation
          </span>
          <select
            value={selectedAssetId}
            onChange={e => setSelectedAssetId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
          >
            <option value="">Select infrastructure asset to evaluate...</option>
            {assets.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.assetType})
              </option>
            ))}
          </select>
          <button
            onClick={handlePredict}
            disabled={!selectedAssetId || evaluating}
            className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold py-1.5 rounded text-xs transition"
          >
            {evaluating ? 'Analyzing contributing factors...' : 'Evaluate Predictive Risk'}
          </button>
        </div>

        {/* Risk Predictions List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Asset Risk Registry</span>
            <span>{predictions.length} Evaluated</span>
          </div>

          {predictions.map(p => {
            const asset = assets.find(a => a.id === p.assetId);
            const isCritical = p.riskCategory === 'CRITICAL' || p.riskCategory === 'HIGH';

            return (
              <div
                key={p.id}
                onClick={() => onSelectAssetById(p.assetId)}
                className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 rounded-lg p-3 text-xs cursor-pointer transition flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-100">{asset?.name || p.assetId}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">{p.assetId}</span>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      p.riskCategory === 'CRITICAL'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : p.riskCategory === 'HIGH'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : p.riskCategory === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {p.riskCategory} ({p.riskScore}/100)
                  </span>
                </div>

                {/* Contributing factors preview */}
                {p.featureSummary && (
                  <div className="bg-slate-900/70 p-2 rounded text-[11px] text-slate-300 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-medium">Model Rationale:</span>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>Base: {p.featureSummary.condition_rating_base ?? p.featureSummary.conditionStatus}</div>
                      <div>Penalty: {p.featureSummary.complaint_penalty ?? 'N/A'}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/50 pt-1">
                  <span>Model: {p.modelName}</span>
                  {p.isSynthetic && (
                    <span className="text-purple-400 font-medium">LABELED SYNTHETIC</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
