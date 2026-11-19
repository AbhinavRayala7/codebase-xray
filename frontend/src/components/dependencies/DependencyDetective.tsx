import React, { useState, useEffect } from 'react';
import {
  Share2,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  Layers,
  FileCode,
  Network,
  RotateCw,
  Search,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { api } from '../../api/client';
import { DependenciesOverview, FileDependencyDetails, Project } from '../../types';

interface DependencyDetectiveProps {
  projectId: string;
  onNavigateToFile: (filePath: string) => void;
}

export const DependencyDetective: React.FC<DependencyDetectiveProps> = ({
  projectId,
  onNavigateToFile
}) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DependenciesOverview | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<FileDependencyDetails | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOverview();
  }, [projectId]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await api.getDependenciesOverview(projectId);
      setOverview(data);
      if (data.hub_modules.length > 0) {
        inspectFile(data.hub_modules[0].file_path);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inspectFile = async (filePath: string) => {
    setSelectedFile(filePath);
    setLoadingFile(true);
    try {
      const details = await api.getFileDependencies(projectId, filePath);
      setFileDetails(details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 rounded-2xl bg-slate-950/60 border border-slate-800">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <span className="text-sm font-medium text-slate-300">Auditing Dependency Topologies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-indigo-400" />
          <span>Dependency Detective</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Uncover circular imports, dependency chokepoints, high-coupling hub modules, and deep dependency chains.
        </p>
      </div>

      {/* Circular Dependencies Alert Banner */}
      {overview?.circular_dependencies && overview.circular_dependencies.length > 0 ? (
        <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-800/60 shadow-lg">
          <div className="flex items-center gap-2.5 text-rose-300 font-bold text-sm mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
            <span>{overview.circular_dependencies.length} Circular Dependency Cycles Detected</span>
          </div>
          <p className="text-xs text-rose-300/80 mb-4 leading-relaxed">
            Modules that import each other directly or transitively complicate initialization order, hinder tree-shaking, and increase refactoring fragility.
          </p>

          <div className="space-y-2">
            {overview.circular_dependencies.map((cycle, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-rose-900/50 text-xs font-mono"
              >
                {cycle.map((node, cIdx) => (
                  <React.Fragment key={cIdx}>
                    <button
                      onClick={() => inspectFile(node)}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-white border border-rose-800/40"
                    >
                      {node}
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  </React.Fragment>
                ))}
                <span className="text-rose-400 font-bold px-2 py-1 rounded bg-rose-950 border border-rose-800">
                  (Cycle Loop)
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Zero circular dependency cycles detected! Clean acyclic DAG structure maintained.</span>
        </div>
      )}

      {/* Two Column Layout: Hubs & Bottlenecks vs File Dependency Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Top Hubs and Bottlenecks */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Hub Modules Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center justify-between">
              <span>High-Coupling Hub Modules</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Risk Index</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Modules with the highest combined incoming and outgoing dependencies.
            </p>

            <div className="space-y-2">
              {overview?.hub_modules.map((hub, idx) => (
                <div
                  key={idx}
                  onClick={() => inspectFile(hub.file_path)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedFile === hub.file_path
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 font-mono truncate max-w-[220px]">
                      {hub.file_path}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                      {hub.total_connections} links
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                    <span>Role: <strong className="text-slate-300">{hub.role}</strong></span>
                    <span>•</span>
                    <span>↓ {hub.dependents_count} dependents</span>
                    <span>•</span>
                    <span>↑ {hub.dependencies_count} imports</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Architectural Bottlenecks */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-white mb-1">
              Centrality Bottlenecks
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Files that sit on the highest number of shortest dependency paths.
            </p>

            <div className="space-y-2">
              {overview?.bottlenecks.map((bot, idx) => (
                <div
                  key={idx}
                  onClick={() => inspectFile(bot.file_path)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedFile === bot.file_path
                      ? 'bg-violet-950/40 border-violet-500 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 font-mono truncate max-w-[220px]">
                      {bot.file_path}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/50">
                      Centrality: {bot.centrality_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: File-by-File Dependency Investigation Tree */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl min-h-[550px] flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
                  Dependency Tree Inspector
                </span>
                <h3 className="text-base font-bold text-white font-mono break-all mt-0.5">
                  {selectedFile || 'Select a file to investigate'}
                </h3>
              </div>

              {selectedFile && (
                <button
                  onClick={() => onNavigateToFile(selectedFile)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  View Code
                </button>
              )}
            </div>

            {loadingFile ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : fileDetails ? (
              <div className="space-y-6 flex-1">
                
                {/* 1. Files imported by this file (Outgoing) */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Files Imported By This File ({fileDetails.imports_count})</span>
                  </h4>

                  {fileDetails.imports.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500 italic">
                      Zero internal files imported (pure leaf module)
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {fileDetails.imports.map((imp, idx) => (
                        <div
                          key={idx}
                          onClick={() => inspectFile(imp.file_path)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 cursor-pointer text-xs"
                        >
                          <span className="font-mono text-slate-200 truncate pr-2">
                            {imp.file_path}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 uppercase">
                            {imp.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Files depending on this file (Incoming) */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400" />
                    <span>Files Depending On This File ({fileDetails.dependents_count})</span>
                  </h4>

                  {fileDetails.dependents.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500 italic">
                      Zero files depend on this module (possible root or orphan)
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {fileDetails.dependents.map((dep, idx) => (
                        <div
                          key={idx}
                          onClick={() => inspectFile(dep.file_path)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 cursor-pointer text-xs"
                        >
                          <span className="font-mono text-slate-200 truncate pr-2">
                            {dep.file_path}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 uppercase">
                            {dep.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : null}

          </div>
        </div>

      </div>

    </div>
  );
};
