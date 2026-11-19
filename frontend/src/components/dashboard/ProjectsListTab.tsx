import React from 'react';
import {
  FolderGit2,
  Trash2,
  ExternalLink,
  Plus,
  Play,
  Calendar,
  Layers,
  HeartPulse,
  FileCode2
} from 'lucide-react';
import { Project } from '../../types';

interface ProjectsListTabProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  onOpenAnalyzeModal: () => void;
}

export const ProjectsListTab: React.FC<ProjectsListTabProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onDeleteProject,
  onOpenAnalyzeModal
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Repository Workspaces</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your analyzed projects, inspect architectural graphs, or ingest new repositories.
          </p>
        </div>

        <button
          onClick={onOpenAnalyzeModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Projects Ingested</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Connect a GitHub URL, upload a project ZIP, or launch our sample fullstack project.
          </p>
          <button
            onClick={onOpenAnalyzeModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            Ingest Your First Repository
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/60 font-mono uppercase text-[10px] text-slate-400">
              <tr>
                <th className="py-3 px-4">Repository</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Primary Language</th>
                <th className="py-3 px-4">Files / Lines</th>
                <th className="py-3 px-4">Health Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {projects.map((proj) => {
                const isSelected = activeProject?.id === proj.id;
                return (
                  <tr
                    key={proj.id}
                    className={`hover:bg-slate-900/50 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-100 block">
                            {proj.name}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate max-w-xs block font-mono">
                            {proj.repository_url || 'Local Archive'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono uppercase text-[11px] text-slate-400">
                      {proj.source_type}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {proj.primary_language}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {proj.total_files} files • {proj.total_lines.toLocaleString()} lines
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span className={`w-2 h-2 rounded-full ${
                          proj.health_score >= 80 ? 'bg-emerald-400' : 'bg-amber-400'
                        }`} />
                        <span className={proj.health_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                          {proj.health_score}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        proj.status === 'completed'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : proj.status === 'analyzing'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40 animate-pulse'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                      }`}>
                        {proj.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectProject(proj)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Open'}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete project "${proj.name}"?`)) {
                              onDeleteProject(proj.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
