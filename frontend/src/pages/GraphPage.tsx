import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Info,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';

interface GraphNode {
  id: string;
  label: string;
  type: 'CASE' | 'PERSON' | 'INCIDENT' | 'LOCATION' | 'EVIDENCE' | 'VEHICLE';
  subtitle?: string;
  data?: any;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationshipType: string;
  isVerified: boolean;
  confidenceScore: number;
  reason?: string;
  supportingEvidence?: string;
  suggestedBy?: string;
}

export const GraphPage: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const navigate = useNavigate();

  const fetchGraph = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGraphData({ verifiedOnly });
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (err) {
      console.error('Failed to load graph network:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [verifiedOnly]);

  const handleVerifyEdge = async (edgeId: string, approved: boolean) => {
    try {
      await api.verifyRelationship(edgeId, approved);
      fetchGraph();
      setSelectedEdge(null);
    } catch (e: any) {
      alert(`Error verifying link: ${e.message}`);
    }
  };

  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodes;
    const q = search.toLowerCase();
    return nodes.filter(n => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q));
  }, [nodes, search]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'CASE':
        return '#06b6d4'; // Cyan
      case 'PERSON':
        return '#f59e0b'; // Amber
      case 'EVIDENCE':
        return '#8b5cf6'; // Purple
      case 'LOCATION':
        return '#10b981'; // Emerald
      case 'INCIDENT':
        return '#ef4444'; // Red
      default:
        return '#3b82f6';
    }
  };

  return (
    <div className="relative h-[calc(100vh-7rem)] w-full rounded-xl overflow-hidden border border-graphite-800 shadow-2xl flex flex-col bg-graphite-950">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-800 bg-graphite-900/90 px-5 py-3 z-10">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
            <Share2 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 font-mono">
              MULTI-CASE RELATIONSHIP & ENTITY GRAPH
            </h1>
            <p className="text-[11px] text-slate-400">
              Interactive topological visualization connecting cases, persons, evidence, and incidents.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Search Node */}
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter node by name or ID..."
              className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1 pl-8 pr-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="rounded border-graphite-700 bg-graphite-950 text-cyan-500 focus:ring-0"
            />
            <span>Verified Links Only</span>
          </label>

          <button
            onClick={() => {
              const json = JSON.stringify({ nodes, edges }, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `CipherOps_Relationship_Graph_${Date.now()}.json`;
              a.click();
            }}
            className="flex items-center space-x-1 rounded-lg border border-graphite-700 bg-graphite-800 hover:bg-graphite-700 px-2.5 py-1 text-slate-200 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Snapshot</span>
          </button>
        </div>
      </div>

      {/* Main Graph Canvas Area */}
      <div className="flex-1 relative overflow-auto p-8 flex items-center justify-center">
        {isLoading ? (
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
            <p className="text-xs font-mono text-cyan-400">Rendering Topological Relationship Graph...</p>
          </div>
        ) : (
          <div className="w-full max-w-5xl space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
              <span className="flex items-center space-x-1.5 text-cyan-400">
                <span className="h-3 w-3 rounded-full bg-cyan-400" />
                <span>Cases</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-400">
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span>Persons</span>
              </span>
              <span className="flex items-center space-x-1.5 text-purple-400">
                <span className="h-3 w-3 rounded-full bg-purple-400" />
                <span>Evidence</span>
              </span>
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span>Locations</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-400">
                <span className="h-0.5 w-4 bg-cyan-400" />
                <span>Verified Link</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-300">
                <span className="h-0.5 w-4 bg-amber-400 border-dashed border-t" />
                <span>AI Suggested (Unreviewed)</span>
              </span>
            </div>

            {/* Interactive Grid of Nodes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => {
                    setSelectedNode(node);
                    setSelectedEdge(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedNode?.id === node.id
                      ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400'
                      : 'border-graphite-800 bg-graphite-900/80 hover:bg-graphite-850 hover:border-graphite-700'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getNodeColor(node.type) }}
                    />
                    <span className="font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      {node.type}
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-100 truncate">{node.label}</p>
                  {node.subtitle && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{node.subtitle}</p>
                  )}
                </button>
              ))}
            </div>

            {/* Relationship Edges Stream */}
            <div className="pt-4 border-t border-graphite-800">
              <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 mb-3">
                Documented & AI-Suggested Relationship Connections ({edges.length})
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {edges.map(edge => {
                  const srcNode = nodes.find(n => n.id === edge.source);
                  const tgtNode = nodes.find(n => n.id === edge.target);

                  return (
                    <div
                      key={edge.id}
                      onClick={() => {
                        setSelectedEdge(edge);
                        setSelectedNode(null);
                      }}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        selectedEdge?.id === edge.id
                          ? 'border-cyan-400 bg-cyan-950/40'
                          : edge.isVerified
                          ? 'border-graphite-800 bg-graphite-900/60 hover:bg-graphite-850'
                          : 'border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <span className="font-mono text-cyan-300 font-bold truncate">
                          {srcNode?.label || edge.source}
                        </span>
                        <span className="text-[10px] font-mono rounded bg-graphite-800 px-2 py-0.5 text-slate-300">
                          {edge.label}
                        </span>
                        <span className="font-mono text-slate-200 font-bold truncate">
                          {tgtNode?.label || edge.target}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 flex-shrink-0">
                        {edge.isVerified ? (
                          <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-bold font-mono">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-[10px] text-amber-400 font-bold font-mono">
                            <AlertCircle className="h-3 w-3" />
                            <span>AI Candidate ({Math.round(edge.confidenceScore * 100)}%)</span>
                          </span>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div className="absolute top-16 right-4 z-20 w-80 rounded-xl border border-graphite-700 bg-graphite-900/95 p-5 shadow-2xl backdrop-blur space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-graphite-800">
            <div className="flex items-center space-x-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getNodeColor(selectedNode.type) }}
              />
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                {selectedNode.type} Node
              </span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="text-sm font-bold text-slate-100">{selectedNode.label}</h3>
          {selectedNode.subtitle && (
            <p className="text-slate-400">{selectedNode.subtitle}</p>
          )}

          {selectedNode.data && (
            <div className="bg-graphite-950 p-3 rounded-lg border border-graphite-800 space-y-1 font-mono text-[11px]">
              {Object.entries(selectedNode.data).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}:</span>
                  <span className="text-slate-200 font-semibold">{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {selectedNode.type === 'CASE' && (
            <button
              onClick={() => navigate(`/cases/${selectedNode.id}`)}
              className="w-full mt-2 rounded bg-cyan-600 hover:bg-cyan-500 py-1.5 text-xs font-semibold text-graphite-950 transition-colors"
            >
              Open Full Case Dossier →
            </button>
          )}

          {selectedNode.type === 'PERSON' && (
            <button
              onClick={() => navigate(`/persons/${selectedNode.id}`)}
              className="w-full mt-2 rounded bg-amber-600 hover:bg-amber-500 py-1.5 text-xs font-semibold text-graphite-950 transition-colors"
            >
              Open Person Profile →
            </button>
          )}
        </div>
      )}

      {/* Edge Review Inspector Drawer */}
      {selectedEdge && (
        <div className="absolute top-16 right-4 z-20 w-88 rounded-xl border border-graphite-700 bg-graphite-900/95 p-5 shadow-2xl backdrop-blur space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-graphite-800">
            <span className="font-mono text-[10px] uppercase font-bold text-cyan-400">
              Relationship Inspector
            </span>
            <button onClick={() => setSelectedEdge(null)} className="text-slate-400 hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="font-bold text-slate-100">{selectedEdge.label}</p>
          <div className="rounded bg-graphite-950 p-2.5 border border-graphite-800 space-y-1 font-mono text-[11px]">
            <p className="text-slate-400">Confidence Score: <span className="text-cyan-300 font-bold">{Math.round(selectedEdge.confidenceScore * 100)}%</span></p>
            <p className="text-slate-400">Source: <span className="text-slate-200">{selectedEdge.suggestedBy || 'HUMAN_INVESTIGATOR'}</span></p>
          </div>

          {selectedEdge.reason && (
            <div className="text-slate-300 bg-graphite-950 p-2.5 rounded border border-graphite-800 text-xs">
              <span className="text-slate-500 font-mono text-[10px] block mb-0.5">Rationale:</span>
              {selectedEdge.reason}
            </div>
          )}

          {selectedEdge.supportingEvidence && (
            <div className="text-slate-300 bg-graphite-950 p-2.5 rounded border border-graphite-800 text-xs italic">
              <span className="text-slate-500 font-mono text-[10px] block mb-0.5">Supporting Evidence:</span>
              {selectedEdge.supportingEvidence}
            </div>
          )}

          {!selectedEdge.isVerified && (
            <div className="pt-2 border-t border-graphite-800 flex space-x-2">
              <button
                onClick={() => handleVerifyEdge(selectedEdge.id, true)}
                className="flex-1 rounded bg-emerald-600 hover:bg-emerald-500 py-1.5 text-xs font-semibold text-graphite-950 transition-colors"
              >
                Approve & Verify
              </button>
              <button
                onClick={() => handleVerifyEdge(selectedEdge.id, false)}
                className="flex-1 rounded bg-red-950 border border-red-800 hover:bg-red-900 py-1.5 text-xs font-semibold text-red-300 transition-colors"
              >
                Reject Link
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
