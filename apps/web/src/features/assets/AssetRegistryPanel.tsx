import React, { useState } from 'react';
import { Asset, User } from '../../types';
import { api } from '../../services/api';
import { Building, MapPin, Activity, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface AssetRegistryPanelProps {
  assets: Asset[];
  selectedAsset: Asset | null;
  onSelectAsset: (asset: Asset | null) => void;
  onRefresh: () => void;
  currentUser?: User | null;
  onOpenAuthorityLogin?: () => void;
}

export const AssetRegistryPanel: React.FC<AssetRegistryPanelProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  onRefresh,
  currentUser,
  onOpenAuthorityLogin,
}) => {
  const isAuthority = currentUser?.role === 'AUTHORITY_ADMIN' || currentUser?.role === 'CAMPUS_AUTHORITY';
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  const filteredAssets = assets.filter(a => {
    if (filterType !== 'all' && a.assetType !== filterType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStatusChange = async (newStatus: any) => {
    if (!selectedAsset) return;
    try {
      setUpdating(true);
      await api.updateAssetCondition(selectedAsset.id, newStatus);
      onRefresh();
    } catch (err: any) {
      alert(`Error updating asset status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2 text-blue-400">
            <Building className="w-4 h-4" /> Module A: Asset Registry
          </h2>
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
            {filteredAssets.length} Assets
          </span>
        </div>

        {/* Search & Filter */}
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search assets by name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-1 overflow-x-auto text-xs pb-1">
            {['all', 'road', 'building', 'park'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded capitalize transition ${
                  filterType === t
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Split into Details view (if selected) and List view */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {selectedAsset ? (
          <div className="bg-slate-800/70 border border-blue-500/40 rounded-lg p-3.5 flex flex-col gap-3 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  {selectedAsset.assetType}
                </span>
                <h3 className="text-sm font-semibold text-white mt-1.5 leading-snug">
                  {selectedAsset.name}
                </h3>
              </div>
              <button
                onClick={() => onSelectAsset(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-700 rounded"
              >
                Back to list
              </button>
            </div>

            {selectedAsset.description && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2 rounded">
                {selectedAsset.description}
              </p>
            )}

            {/* Technical Specifications */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2 rounded">
                <span className="text-slate-400 block text-[10px]">Asset ID</span>
                <span className="font-mono text-slate-200 text-[11px] truncate block" title={selectedAsset.id}>
                  {selectedAsset.id}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <span className="text-slate-400 block text-[10px]">Criticality</span>
                <span className="font-medium text-amber-400">{selectedAsset.criticality}</span>
              </div>

              {selectedAsset.assetType === 'building' && (
                <div className="bg-slate-900/60 p-2 rounded col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Visual Extrusion Height</span>
                    {selectedAsset.heightIsEstimated ? (
                      <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-800 px-1 rounded">
                        Estimated Fallback
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-1 rounded">
                        Verified Tag
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold text-blue-400 mt-0.5">
                    {selectedAsset.heightM} m
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Source: {selectedAsset.heightSource}
                  </span>
                </div>
              )}

              {selectedAsset.assetType === 'road' && selectedAsset.metadata?.length_m && (
                <div className="bg-slate-900/60 p-2 rounded col-span-2">
                  <span className="text-slate-400 text-[10px]">Road Length</span>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {selectedAsset.metadata.length_m} m
                  </div>
                </div>
              )}
            </div>

            {/* Condition Status & Administrative Edit */}
            <div className="border-t border-slate-700/60 pt-3">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Infrastructure Condition Status</span>
                {updating && <span className="text-[10px] text-blue-400 animate-pulse">Updating...</span>}
              </label>

              {isAuthority ? (
                <div>
                  <div className="text-[10px] text-emerald-400 mb-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Authorized Editor: {currentUser?.displayName}
                  </div>
                  <select
                    value={selectedAsset.conditionStatus}
                    disabled={updating}
                    onChange={e => handleStatusChange(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-600/80 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="EXCELLENT">EXCELLENT (Newly Constructed / Resurfaced)</option>
                    <option value="GOOD">GOOD (Satisfactory Operability)</option>
                    <option value="FAIR">FAIR (Minor Surface Wear)</option>
                    <option value="DEGRADED">DEGRADED (Structural Wear / Potholes)</option>
                    <option value="CRITICAL">CRITICAL (Emergency Intervention Required)</option>
                  </select>
                </div>
              ) : (
                <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{selectedAsset.conditionStatus}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                      OFFICIAL RECORD
                    </span>
                  </div>
                  {onOpenAuthorityLogin && (
                    <button
                      type="button"
                      onClick={onOpenAuthorityLogin}
                      className="text-[10px] text-blue-400 hover:text-blue-300 underline text-left mt-0.5"
                    >
                      Sign In as Authority to alter condition status
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Data Provenance Details */}
            <div className="text-[10px] text-slate-400 bg-slate-900/70 p-2 rounded border border-slate-800">
              <span className="font-semibold text-slate-300 block mb-0.5">Provenance & License:</span>
              <div>Data Source: {selectedAsset.dataSource}</div>
              {selectedAsset.sourceUrl && (
                <a
                  href={selectedAsset.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline block truncate mt-0.5"
                >
                  Source Link
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-400 px-1">
              Select an asset on the 3D map or browse the inventory below:
            </div>
            {filteredAssets.map(a => (
              <div
                key={a.id}
                onClick={() => onSelectAsset(a)}
                className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded p-2.5 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-medium text-white flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        a.conditionStatus === 'CRITICAL'
                          ? 'bg-red-500'
                          : a.conditionStatus === 'DEGRADED'
                          ? 'bg-orange-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    {a.name}
                  </div>
                  <div className="text-[11px] text-slate-400 capitalize mt-0.5">
                    {a.assetType} • {a.conditionStatus}
                  </div>
                </div>
                <span className="text-[10px] text-blue-400 font-mono">Inspect &rarr;</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
