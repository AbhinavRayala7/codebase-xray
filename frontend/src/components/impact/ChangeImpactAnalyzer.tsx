import React, { useState, useEffect } from 'react';
import {
  Zap,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  FileCode,
  Globe,
  HelpCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { ChangeImpactResult, FileTreeNode } from '../../types';

interface ChangeImpactAnalyzerProps {
  projectId: string;
  onNavigateToFile: (filePath: string) => void;
}

export const ChangeImpactAnalyzer: React.FC<ChangeImpactAnalyzerProps> = ({
  projectId,
  onNavigateToFile
}) => {
  const [fileList, setFileList] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [impactResult, setImpactResult] = useState<ChangeImpactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      const data = await api.getFilesTree(projectId);
      const paths: string[] = [];
      const traverse = (nodes: FileTreeNode[]) => {
        for (const n of nodes) {
          if (!n.is_directory) {
            paths.push(n.path);
          } else if (n.children) {
            traverse(n.children);
          }
        }
      };
      traverse(data.tree);
      setFileList(paths);
      if (paths.length > 0) {
        // Pick a service or model file as default
        const candidate = paths.find((p) => p.includes('service') || p.includes('model') || p.includes('client')) || paths[0];
        analyzeImpact(candidate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const analyzeImpact = async (path: string) => {
    setSelectedFile(path);
    setLoading(true);
    try {
      const res = await api.getChangeImpact(projectId, path);
      setImpactResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = fileList.filter((f) =>
    f.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>Change Impact Blast Radius</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Evaluate what might be affected before you edit or refactor a module: direct, indirect, and downstream API impacts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: File Picker list */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col h-[600px]">
          <span className="text-xs font-bold text-slate-200 mb-2">Select File To Refactor</span>
          
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search source files..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredFiles.map((f) => (
              <button
                key={f}
                onClick={() => analyzeImpact(f)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono truncate transition-colors ${
                  selectedFile === f
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={f}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Blast Radius Report */}
        <div className="lg:col-span-8 space-y-6">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[500px] rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-3" />
              <span className="text-xs text-slate-400 font-medium">Traversing transitive dependency graph...</span>
            </div>
          ) : impactResult ? (
            <div className="space-y-6">
              
              {/* Blast Radius Score Meter */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950 border border-slate-800 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                      Blast Radius Score
                    </span>
                    <h3 className="text-xl font-bold text-white font-mono break-all mt-1">
                      {impactResult.target_file}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Risk Index</span>
                      <span className={`text-2xl font-bold font-mono ${
                        impactResult.risk_score > 60
                          ? 'text-rose-400'
                          : impactResult.risk_score > 25
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}>
                        {impactResult.risk_score} / 100
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400">
                  <HelpCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>
                    Static impact maps reachable dependent modules. Runtime breakage depends on internal interface stability.
                  </span>
                </div>
              </div>

              {/* Three Impact Tiers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Direct Impact */}
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                      Direct Impact
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {impactResult.direct_impact.length} files
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Immediate consumers directly importing this file.
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {impactResult.direct_impact.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No direct dependents</span>
                    ) : (
                      impactResult.direct_impact.map((f, idx) => (
                        <div
                          key={idx}
                          onClick={() => onNavigateToFile(f.file_path)}
                          className="text-[11px] font-mono text-rose-300 bg-slate-950 p-2 rounded truncate border border-rose-900/30 cursor-pointer hover:border-rose-500"
                          title={f.file_path}
                        >
                          {f.file_path}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Indirect Impact */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Indirect Impact
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {impactResult.indirect_impact.length} files
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Modules depending on direct consumers (2 hops away).
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {impactResult.indirect_impact.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No indirect dependents</span>
                    ) : (
                      impactResult.indirect_impact.map((f, idx) => (
                        <div
                          key={idx}
                          onClick={() => onNavigateToFile(f.file_path)}
                          className="text-[11px] font-mono text-amber-300 bg-slate-950 p-2 rounded truncate border border-amber-900/30 cursor-pointer hover:border-amber-500"
                          title={f.file_path}
                        >
                          {f.file_path}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Potential Impact */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      Potential Impact
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {impactResult.potential_impact.length} files
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Transitive consumers across outer layers (3+ hops).
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {impactResult.potential_impact.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No downstream consumers</span>
                    ) : (
                      impactResult.potential_impact.map((f, idx) => (
                        <div
                          key={idx}
                          onClick={() => onNavigateToFile(f.file_path)}
                          className="text-[11px] font-mono text-indigo-300 bg-slate-950 p-2 rounded truncate border border-indigo-900/30 cursor-pointer hover:border-indigo-500"
                          title={f.file_path}
                        >
                          {f.file_path}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Related API Routes & Tests */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Downstream API Routes Exposed ({impactResult.affected_routes.length})</span>
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {impactResult.affected_routes.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No direct API endpoints affected</span>
                    ) : (
                      impactResult.affected_routes.map((r, idx) => (
                        <div key={idx} className="text-[11px] font-mono text-emerald-300 bg-slate-950 p-1.5 rounded truncate">
                          {r}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Regression Test Suites Required ({impactResult.affected_tests.length})</span>
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {impactResult.affected_tests.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No affected automated tests identified</span>
                    ) : (
                      impactResult.affected_tests.map((t, idx) => (
                        <div key={idx} className="text-[11px] font-mono text-cyan-300 bg-slate-950 p-1.5 rounded truncate">
                          {t}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : null}

        </div>

      </div>

    </div>
  );
};
