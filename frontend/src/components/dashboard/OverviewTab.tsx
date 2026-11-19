import React from 'react';
import {
  FolderGit2,
  FileCode2,
  Share2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Play,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Project, GlobalStats } from '../../types';

interface OverviewTabProps {
  stats: GlobalStats;
  recentProjects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onOpenAnalyzeModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  recentProjects,
  activeProject,
  onSelectProject,
  onOpenAnalyzeModal,
  onNavigateTab
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950 border border-slate-800/80 shadow-xl">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-semibold">
            Codebase X-Ray Dashboard
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            Software Intelligence Overview
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time static code analysis, AST topological graphs, execution flow tracing, and change blast radius across your repositories.
          </p>
        </div>

        <button
          onClick={onOpenAnalyzeModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Analyze New Project</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Total Analyzed Projects</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.total_projects}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active repository workspaces</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Files Analyzed</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <FileCode2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.total_files.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Parsed via language ASTs</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Active Project Code Files</span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {activeProject ? activeProject.total_files : 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {activeProject ? activeProject.name : 'No project selected'}
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Issues & Bottlenecks</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.total_issues}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Flagged for architecture review</span>
        </div>

      </div>

      {/* Active Project Highlight Card */}
      {activeProject ? (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950 border border-indigo-500/30 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Currently Exploring
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{activeProject.name}</h3>
              <p className="text-xs text-slate-400 max-w-xl">
                {activeProject.description || `Source: ${activeProject.source_type.toUpperCase()} • ${activeProject.total_lines.toLocaleString()} lines of code`}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigateTab('architecture')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                <span>Architecture Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('tracer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <span>Execution Tracer</span>
              </button>
              <button
                onClick={() => onNavigateTab('investigator')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>AI Investigator</span>
              </button>
            </div>

          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Primary Language</span>
              <span className="font-semibold text-slate-200">{activeProject.primary_language}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Health Score</span>
              <span className={`font-semibold font-mono ${
                activeProject.health_score >= 80 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {activeProject.health_score} / 100
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Frameworks</span>
              <span className="font-semibold text-slate-200">
                {(activeProject.frameworks || []).slice(0, 3).join(', ') || 'Standard'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Total Source Files</span>
              <span className="font-semibold text-slate-200 font-mono">{activeProject.total_files} files</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
          <Layers className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-white">No Active Project Selected</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Select a recently analyzed project below or click "+ Analyze New Project" to ingest a repository.
          </p>
        </div>
      )}

      {/* Recently Analyzed Projects Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recently Analyzed Projects</h3>
          <button
            onClick={() => onNavigateTab('projects')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            View all projects →
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            No projects analyzed yet. Click "+ Analyze New Project" to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.slice(0, 6).map((proj) => {
              const isSelected = activeProject?.id === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900/90 border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-100 truncate pr-2">
                      {proj.name}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      proj.status === 'completed'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : proj.status === 'analyzing'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40 animate-pulse'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                    }`}>
                      {proj.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <span>{proj.primary_language}</span>
                    <span>•</span>
                    <span>{proj.total_files} files</span>
                    <span>•</span>
                    <span className="font-mono">{proj.health_score}% health</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <span className="capitalize">{proj.source_type}</span>
                    <span className="text-indigo-400 hover:underline flex items-center gap-1">
                      {isSelected ? 'Active Workspace' : 'Inspect Project →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
