import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Search,
  Filter,
  Maximize2,
  Minimize2,
  X,
  FileCode,
  Layers,
  Sparkles,
  Share2,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { CustomNode } from './CustomNode';
import { api } from '../../api/client';
import { ArchitectureData, ReactFlowNodeData } from '../../types';

const nodeTypes = {
  codeNode: CustomNode,
};

interface ArchitectureExplorerProps {
  projectId: string;
  onNavigateToFile: (filePath: string) => void;
}

export const ArchitectureExplorer: React.FC<ArchitectureExplorerProps> = ({
  projectId,
  onNavigateToFile
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archData, setArchData] = useState<ArchitectureData | null>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedNodeData, setSelectedNodeData] = useState<ReactFlowNodeData | null>(null);
  const [connectedNodes, setConnectedNodes] = useState<{ imports: string[]; dependents: string[] }>({
    imports: [],
    dependents: []
  });

  const loadArchitecture = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getArchitecture(projectId);
      setArchData(data);

      const flowNodes = data.nodes.map((n) => ({
        ...n,
        type: 'codeNode',
      }));

      const flowEdges = data.edges.map((e) => ({
        ...e,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: e.data?.isCircular ? '#ef4444' : '#64748b',
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err: any) {
      setError(err.message || 'Failed to load architecture diagram');
    } finally {
      setLoading(false);
    }
  }, [projectId, setNodes, setEdges]);

  useEffect(() => {
    loadArchitecture();
  }, [loadArchitecture]);

  // Handle node selection for inspector drawer
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nData = node.data as unknown as ReactFlowNodeData;
      setSelectedNodeData(nData);

      // Find direct imports (outgoing edges) and dependents (incoming edges)
      const imports = edges
        .filter((e) => e.source === node.id)
        .map((e) => e.target);
      const dependents = edges
        .filter((e) => e.target === node.id)
        .map((e) => e.source);

      setConnectedNodes({ imports, dependents });
    },
    [edges]
  );

  // Filter nodes based on search query & role
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const d = node.data as unknown as ReactFlowNodeData;
      const matchesSearch =
        !searchQuery ||
        d.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.filePath.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        selectedRoleFilter === 'all' || d.role === selectedRoleFilter;

      return {
        ...node,
        hidden: !(matchesSearch && matchesRole),
      };
    });
  }, [nodes, searchQuery, selectedRoleFilter]);

  const uniqueRoles = useMemo(() => {
    if (!archData) return [];
    const roles = new Set(archData.nodes.map((n) => n.data.role));
    return Array.from(roles);
  }, [archData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[650px] rounded-2xl bg-slate-950/60 border border-slate-800">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <span className="text-sm font-medium text-slate-300">Generating AST Architecture Topology...</span>
        <span className="text-xs text-slate-500 mt-1">Resolving package paths and directed cycles</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] rounded-2xl bg-rose-950/20 border border-rose-800/40 p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-400 mb-3" />
        <h3 className="text-base font-semibold text-rose-200">Failed to render architecture</h3>
        <p className="text-xs text-rose-400/80 mt-1 mb-4">{error}</p>
        <button
          onClick={loadArchitecture}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-900/60 text-white hover:bg-rose-800"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-[720px] rounded-2xl border border-slate-800/80 bg-[#070a12] shadow-2xl overflow-hidden flex flex-col">
      
      {/* Top Filter & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md z-20">
        
        {/* Left: Search input */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter nodes by filename / path..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Role Filter dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Architectural Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Metrics & Actions */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>{archData?.summary.total_nodes} Nodes</span>
            <span>•</span>
            <span>{archData?.summary.total_edges} Edges</span>
            {archData?.summary.cycles_count ? (
              <>
                <span>•</span>
                <span className="text-rose-400 font-bold">
                  {archData.summary.cycles_count} Circular Cycles
                </span>
              </>
            ) : null}
          </div>

          <button
            onClick={loadArchitecture}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reload Diagram"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Main React Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.2}
          maxZoom={2}
          className="bg-[#070a12]"
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 fill-slate-300 shadow-xl" />
          <MiniMap
            nodeColor={(node: any) => node.data?.color || '#94a3b8'}
            maskColor="rgba(8, 11, 18, 0.85)"
            className="!bg-slate-950 !border-slate-800 rounded-lg overflow-hidden"
          />
        </ReactFlow>

        {/* Node Inspector Drawer */}
        {selectedNodeData && (
          <div className="absolute top-4 right-4 bottom-4 w-80 rounded-2xl bg-slate-950/95 border border-slate-800 p-5 shadow-2xl backdrop-blur-xl z-30 flex flex-col animate-fade-in overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: selectedNodeData.color }}
                />
                <span className="font-mono text-xs uppercase text-slate-400">
                  {selectedNodeData.role}
                </span>
              </div>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* File info */}
            <div className="space-y-3 flex-1">
              <div>
                <h4 className="text-sm font-bold text-white break-all">
                  {selectedNodeData.label}
                </h4>
                <span className="text-[11px] font-mono text-slate-400 block mt-0.5 break-all">
                  {selectedNodeData.filePath}
                </span>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Lines</span>
                  <span className="text-slate-200 font-semibold">{selectedNodeData.lineCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Language</span>
                  <span className="text-slate-200 font-semibold">{selectedNodeData.language}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Imports (↑)</span>
                  <span className="text-slate-200 font-semibold">{selectedNodeData.outDegree}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Dependents (↓)</span>
                  <span className="text-slate-200 font-semibold">{selectedNodeData.inDegree}</span>
                </div>
              </div>

              {/* Exports / Functions */}
              {selectedNodeData.exports && selectedNodeData.exports.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Exported Symbols ({selectedNodeData.exports.length})
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {selectedNodeData.exports.map((exp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-900/40"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Dependents */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Dependent Files ({connectedNodes.dependents.length})
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {connectedNodes.dependents.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">No incoming dependents</span>
                  ) : (
                    connectedNodes.dependents.map((dep, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded truncate border border-slate-800/80"
                        title={dep}
                      >
                        {dep}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Jump to File Action */}
            <div className="pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => onNavigateToFile(selectedNodeData.filePath)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Open in Source Viewer</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
