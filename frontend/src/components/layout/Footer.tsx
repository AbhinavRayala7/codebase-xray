import React from 'react';
import { Layers, Shield, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#060911]/90 backdrop-blur-md py-6 px-6 sm:px-12 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold tracking-wider text-slate-200">CODEBASE X-RAY</span>
            <span className="text-slate-600 mx-2">—</span>
            <span className="text-slate-400">See Beyond the Code.</span>
          </div>
        </div>

        {/* Creator Credit strictly adhering to Section 16 */}
        <div className="flex items-center gap-1.5 font-medium text-slate-300 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
          <span>Made with</span>
          <span className="text-rose-500 text-sm animate-pulse">♥</span>
          <span>by</span>
          <span className="text-indigo-400 font-semibold tracking-wide">Abhi</span>
        </div>

        {/* Status indicator & Links */}
        <div className="flex items-center gap-4 text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 -ml-3" />
            <span className="text-slate-400">AI Engine Online</span>
          </span>
          <span className="text-slate-700">|</span>
          <span>v1.0.0 Production</span>
        </div>

      </div>
    </footer>
  );
};
