import React from 'react';
import { Layers, Plus, Compass, Sparkles, ChevronRight, Activity, Terminal } from 'lucide-react';
import { Project } from '../../types';

interface NavbarProps {
  currentProject: Project | null;
  onOpenAnalyzeModal: () => void;
  onNavigateHome: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  onOpenAnalyzeModal,
  onNavigateHome,
  activeTab
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#080b13]/80 backdrop-blur-xl px-4 sm:px-8 py-3 transition-all">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Logo & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-bold tracking-tight text-white text-base">
                CODEBASE <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">X-RAY</span>
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-widest text-slate-400 -mt-1">
                Software Intelligence
              </span>
            </div>
          </button>

          {currentProject && (
            <div className="hidden sm:flex items-center gap-2 pl-4 ml-4 border-l border-slate-800 text-xs">
              <span className="text-slate-500">Project:</span>
              <span className="font-medium text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {currentProject.name}
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-indigo-400 font-medium capitalize">{activeTab.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-900 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            Landing Page
          </button>

          <button
            onClick={onOpenAnalyzeModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg shadow-md shadow-indigo-600/25 transition-all transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Analyze New Project</span>
          </button>
        </div>

      </div>
    </header>
  );
};
