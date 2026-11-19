import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Filter,
  FileCode,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Lightbulb,
  Layers
} from 'lucide-react';
import { api } from '../../api/client';
import { HealthReportData, CodeIssueItem } from '../../types';

interface ProjectHealthProps {
  projectId: string;
  onNavigateToFile: (filePath: string) => void;
}

export const ProjectHealth: React.FC<ProjectHealthProps> = ({
  projectId,
  onNavigateToFile
}) => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<HealthReportData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  useEffect(() => {
    loadHealth();
  }, [projectId]);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealthReport(projectId);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = (report?.issues || []).filter((iss) => {
    const matchCat = selectedCategory === 'all' || iss.category === selectedCategory;
    const matchSev = selectedSeverity === 'all' || iss.severity === selectedSeverity;
    return matchCat && matchSev;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 rounded-2xl bg-slate-950/60 border border-slate-800">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <span className="text-sm font-medium text-slate-300">Auditing Code Quality & Complexity...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-emerald-400" />
          <span>Codebase Health & Maintainability</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Automated static audit of architectural anti-patterns, complexity hotspots, and maintainability risks.
        </p>
      </div>

      {/* Health Score Overview Card */}
      {report && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Score Ring / Number */}
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border shadow-lg ${
                report.health_score >= 80
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400 shadow-emerald-950/40'
                  : report.health_score >= 60
                  ? 'bg-amber-950/50 border-amber-500/50 text-amber-400 shadow-amber-950/40'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-400 shadow-rose-950/40'
              }`}>
                <span className="text-2xl font-black font-mono">{report.health_score}</span>
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">/ 100</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  {report.health_score >= 85
                    ? 'Exceptional Architectural Integrity'
                    : report.health_score >= 70
                    ? 'Good Maintainability with Minor Chokepoints'
                    : 'Architecture Refactoring Recommended'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">
                  Evaluated across circular imports, cyclomatic function complexity, file sizing thresholds, duplicate imports, and test coverage indicators.
                </p>
              </div>
            </div>

            {/* Severity Breakdown */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-center min-w-[70px]">
                <span className="text-rose-400 font-bold block text-base">{report.severity_breakdown.high}</span>
                <span className="text-[10px] text-slate-500 uppercase">High</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-center min-w-[70px]">
                <span className="text-amber-400 font-bold block text-base">{report.severity_breakdown.medium}</span>
                <span className="text-[10px] text-slate-500 uppercase">Medium</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-center min-w-[70px]">
                <span className="text-slate-300 font-bold block text-base">{report.severity_breakdown.low}</span>
                <span className="text-[10px] text-slate-500 uppercase">Low</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 py-1.5 px-3 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Issue Categories</option>
            <option value="circular_dependency">Circular Dependencies</option>
            <option value="large_file">Large Files</option>
            <option value="high_complexity">High Complexity</option>
            <option value="high_coupling">High Coupling</option>
            <option value="missing_test">Missing Tests</option>
            <option value="dead_code">Dead Code Candidates</option>
            <option value="duplicate_import">Duplicate Imports</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 py-1.5 px-3 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>

        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredIssues.length} of {report?.total_issues || 0} Findings
        </span>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <span>No issues found matching the selected filter criteria.</span>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const sevColor =
              issue.severity === 'high'
                ? 'border-rose-800/60 bg-rose-950/20 text-rose-400'
                : issue.severity === 'medium'
                ? 'border-amber-800/60 bg-amber-950/20 text-amber-400'
                : 'border-slate-800 bg-slate-950/50 text-slate-400';

            return (
              <div
                key={issue.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-3"
              >
                
                {/* Issue Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${sevColor}`}>
                      {issue.severity}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {issue.category.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      issue.is_confirmed
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {issue.is_confirmed ? 'CONFIRMED' : 'HEURISTIC'}
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigateToFile(issue.file_path)}
                    className="flex items-center gap-1 font-mono text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    <span>{issue.file_path}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white">
                  {issue.title}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {issue.description}
                </p>

                {/* Suggested Improvement */}
                {issue.suggestion && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-300">
                    <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-[11px] uppercase tracking-wider text-indigo-400">
                        Suggested Remediation:
                      </span>
                      <span>{issue.suggestion}</span>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
