import React, { useState, useEffect } from 'react';
import { KnowledgeGraphData, Asset } from '../../types';
import { api } from '../../services/api';
import { Share2, Network, ArrowRight, Building, AlertTriangle, Users } from 'lucide-react';

interface KnowledgeGraphPanelProps {
  assets: Asset[];
  initialEntityId?: string;
  onSelectAssetById: (id: string) => void;
}

export const KnowledgeGraphPanel: React.FC<KnowledgeGraphPanelProps> = ({
  assets,
  initialEntityId,
  onSelectAssetById,
}) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    initialEntityId || (assets.length > 0 ? assets[0].id : '')
  );
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialEntityId) {
      setSelectedEntityId(initialEntityId);
    }
  }, [initialEntityId]);

  useEffect(() => {
    if (!selectedEntityId) return;
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const data = await api.getGraphNeighborhood(selectedEntityId);
        setGraphData(data);
      } catch (err: any) {
        console.error('Failed to fetch graph:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [selectedEntityId]);

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2 text-indigo-400">
          <Network className="w-4 h-4" /> Module E: Knowledge Graph
        </h2>
        <span className="text-[11px] text-slate-400">
          Relational Multi-Hop Urban Decision Support Graph
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
        {/* Entity Selector */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3 text-xs flex flex-col gap-2">
          <span className="font-semibold text-slate-300">Select Center Entity</span>
          <select
            value={selectedEntityId}
            onChange={e => setSelectedEntityId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
          >
            {assets.map(a => (
              <option key={a.id} value={a.id}>
                [{a.assetType.toUpperCase()}] {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Graph Explorer View */}
        {loading ? (
          <div className="text-xs text-slate-400 text-center py-8">Traversing graph neighborhood...</div>
        ) : graphData ? (
          <div className="flex flex-col gap-4">
            {/* Center Node Card */}
            <div className="bg-indigo-950/50 border border-indigo-700/60 rounded-lg p-3 text-xs flex flex-col gap-1.5 shadow">
              <span className="text-[10px] text-indigo-300 font-mono uppercase">Focal Node</span>
              <h3 className="text-sm font-bold text-white">
                {graphData.centerEntity?.name || graphData.centerEntity?.id || selectedEntityId}
              </h3>
              <div className="text-[11px] text-indigo-200">
                Connected Edges: {graphData.edges.length} relationships discovered
              </div>
            </div>

            {/* Neighborhood Entities */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-300 px-1">
                Connected Entities ({graphData.nodes.length - 1})
              </span>

              {graphData.nodes
                .filter(n => n.id !== selectedEntityId)
                .map(node => (
                  <div
                    key={node.id}
                    onClick={() => {
                      if (node.type === 'asset') onSelectAssetById(node.id);
                      setSelectedEntityId(node.id);
                    }}
                    className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 rounded p-2.5 text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2">
                      {node.type === 'asset' ? (
                        <Building className="w-3.5 h-3.5 text-blue-400" />
                      ) : node.type === 'grievance' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                      ) : (
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <div>
                        <span className="font-semibold text-white block">{node.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono capitalize">
                          {node.type} • {node.id}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono">Pivot &rarr;</span>
                  </div>
                ))}
            </div>

            {/* Active Relationships */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-slate-300">Semantic Graph Edges</span>
              {graphData.edges.map(e => (
                <div key={e.id} className="text-[11px] text-slate-300 flex items-center gap-1.5 py-0.5 border-b border-slate-800/80">
                  <span className="font-mono text-slate-400 truncate max-w-[90px]">{e.sourceId}</span>
                  <span className="px-1.5 py-0.2 bg-indigo-900/60 text-indigo-300 font-mono text-[9px] rounded">
                    {e.relationshipType}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="font-mono text-slate-400 truncate max-w-[90px]">{e.targetId}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Select an entity to explore graph.</div>
        )}
      </div>
    </div>
  );
};
