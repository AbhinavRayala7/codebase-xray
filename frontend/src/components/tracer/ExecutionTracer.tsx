import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Sparkles,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  FileCode,
  Layers,
  Database,
  Globe,
  Terminal,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { TraceResult, ExecutionStep } from '../../types';

interface ExecutionTracerProps {
  projectId: string;
  onNavigateToFile: (filePath: string) => void;
}

export const ExecutionTracer: React.FC<ExecutionTracerProps> = ({
  projectId,
  onNavigateToFile
}) => {
  const [flows, setFlows] = useState<Array<{ id: string; title: string; description: string }>>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);

  useEffect(() => {
    loadFlows();
  }, [projectId]);

  const loadFlows = async () => {
    try {
      const data = await api.getSuggestedFlows(projectId);
      setFlows(data.flows);
      if (data.flows.length > 0) {
        handleTrace(data.flows[0].title);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrace = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    try {
      const res = await api.traceExecution(projectId, q);
      setTraceResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Workflow className="w-5 h-5 text-indigo-400" />
          <span>Execution Flow Tracer</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Step-by-step visual flowchart of application runtime execution paths from UI interaction to database persistence.
        </p>
      </div>

      {/* Suggested Common Flows & Search Input */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md space-y-4">
        <div>
          <span className="text-[11px] font-mono uppercase text-slate-400 block mb-2 font-semibold">
            Suggested Workflows for this Project:
          </span>
          <div className="flex flex-wrap gap-2">
            {flows.map((f) => (
              <button
                key={f.id}
                onClick={() => handleTrace(f.title)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
              >
                {f.title}
              </button>
            ))}
          </div>
        </div>

        {/* Custom trace query input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrace(query);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. How does user login work in this project?"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/30"
          >
            {loading ? 'Synthesizing Flow...' : 'Trace Path'}
          </button>
        </form>
      </div>

      {/* Verification Notice */}
      {traceResult && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>{traceResult.static_proven_steps} Statically Proven</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-amber-400 font-mono">
              <HelpCircle className="w-4 h-4" />
              <span>{traceResult.inferred_steps} Role Inferred</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Total Steps: {traceResult.total_steps}
          </span>
        </div>
      )}

      {/* Visual Execution Flowchart */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
          <span className="text-xs text-slate-400 font-medium">Matching AST definitions and route handlers...</span>
        </div>
      ) : traceResult ? (
        <div className="space-y-4 max-w-4xl mx-auto py-4">
          {traceResult.steps.map((step, idx) => (
            <React.Fragment key={idx}>
              
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg hover:border-slate-700 transition-all">
                
                {/* Step Top Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center border border-indigo-500/30">
                      {step.step_number}
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {step.title}
                    </h4>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    step.is_static_proven
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                      : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                  }`}>
                    {step.is_static_proven ? 'STATIC PROVEN' : 'INFERRED'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-8 mb-3">
                  {step.description}
                </p>

                {/* Evidence & File jump footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pl-8 pt-3 border-t border-slate-800/80 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-400 font-mono">
                    <span className="text-slate-500">Evidence:</span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-indigo-300">
                      {step.evidence_type}
                    </span>
                    {step.symbol_name && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
                        `{step.symbol_name}`
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigateToFile(step.file_path)}
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-mono text-[11px] hover:underline"
                  >
                    <span>{step.file_path}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </div>

              {/* Connecting Down Arrow between steps */}
              {idx < traceResult.steps.length - 1 && (
                <div className="flex items-center justify-center py-1">
                  <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-sm">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

            </React.Fragment>
          ))}
        </div>
      ) : null}

    </div>
  );
};
