import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Network,
  Share2,
  Workflow,
  Sparkles,
  HeartPulse,
  FolderTree,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  hasActiveProject: boolean;
  healthScore?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  hasActiveProject,
  healthScore = 100
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, requiresProject: false },
    { id: 'projects', label: 'My Projects', icon: FolderGit2, requiresProject: false },
    { id: 'architecture', label: 'Architecture Explorer', icon: Network, requiresProject: true, badge: 'ReactFlow' },
    { id: 'dependencies', label: 'Dependency Detective', icon: Share2, requiresProject: true },
    { id: 'tracer', label: 'Execution Tracer', icon: Workflow, requiresProject: true, badge: 'AST' },
    { id: 'investigator', label: 'AI Investigator', icon: Sparkles, requiresProject: true, badge: 'AI' },
    { id: 'health', label: 'Project Health', icon: HeartPulse, requiresProject: true, score: healthScore },
    { id: 'files', label: 'File Explorer', icon: FolderTree, requiresProject: true },
    { id: 'settings', label: 'Settings', icon: Settings, requiresProject: false },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-slate-800/80 bg-[#070a12]/95 backdrop-blur-xl transition-all duration-300 ease-in-out ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Navigation items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          {!collapsed && 'Platform Capabilities'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isDisabled = item.requiresProject && !hasActiveProject;

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onTabChange(item.id)}
              disabled={isDisabled}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : isDisabled
                  ? 'opacity-40 cursor-not-allowed text-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
              
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 font-mono border border-indigo-800/50">
                      {item.badge}
                    </span>
                  )}
                  {item.id === 'health' && hasActiveProject && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      healthScore >= 80 ? 'text-emerald-400 bg-emerald-950/50' : 'text-amber-400 bg-amber-950/50'
                    }`}>
                      {healthScore}%
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-2"><ChevronLeft className="w-4 h-4" /><span>Collapse Sidebar</span></div>}
        </button>
      </div>
    </aside>
  );
};
