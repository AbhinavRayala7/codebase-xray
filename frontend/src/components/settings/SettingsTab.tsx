import React from 'react';
import {
  Settings,
  ShieldCheck,
  Cpu,
  Key,
  HardDrive,
  Info,
  Layers,
  Heart,
  CheckCircle2
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>System & Engine Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure security boundaries, view AI model credentials status, and review engine parameters.
        </p>
      </div>

      {/* Security & Sandbox Status */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Security & Ingestion Safeguards</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase">ZIP Path Traversal</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Zip-Slip Protection Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase">Execution Mode</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Static AST Analysis (No Code Executed)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase">Max ZIP File Limit</span>
            <span className="text-slate-200 font-semibold mt-0.5 block">50 Megabytes</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase">Max File Count</span>
            <span className="text-slate-200 font-semibold mt-0.5 block">2,500 Source Files</span>
          </div>
        </div>
      </div>

      {/* AI Credentials Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-violet-400" />
          <span>AI Intelligence Engine Status</span>
        </h3>
        <p className="text-xs text-slate-400">
          Codebase X-Ray uses a dual-engine architecture: a high-precision deterministic local AST reasoning engine, backed by optional cloud LLM providers (Gemini, OpenAI). Secret keys are kept strictly on the backend and never exposed in client bundles.
        </p>

        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-slate-200 block">Local Grounded Reasoning Engine</span>
              <span className="text-[11px] text-slate-400">Deterministic AST symbol mapping & citation extractor</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              ALWAYS READY
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-slate-200 block">Gemini API / OpenAI API</span>
              <span className="text-[11px] text-slate-400">Configured via backend .env (GEMINI_API_KEY, OPENAI_API_KEY)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              CONFIGURABLE
            </span>
          </div>
        </div>
      </div>

      {/* Product & Attribution Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/30 to-slate-900 border border-indigo-500/20 shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-white">CODEBASE X-RAY</span>
            <span className="text-slate-500 mx-2">—</span>
            <span className="text-xs text-indigo-300">See Beyond the Code.</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Designed and built with modern fullstack architecture, React Flow canvas, NetworkX dependency topologies, and AST language parsers.
        </p>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Author & Creator</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> by Abhi
          </span>
        </div>
      </div>

    </div>
  );
};
