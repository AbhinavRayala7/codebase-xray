import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Terminal, Layers } from 'lucide-react';
import { api } from '../../api/client';
import { AnalysisJob } from '../../types';

interface AnalysisProgressBarProps {
  projectId: string;
  onComplete: () => void;
}

export const AnalysisProgressBar: React.FC<AnalysisProgressBarProps> = ({
  projectId,
  onComplete
}) => {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any = null;

    const pollJob = async () => {
      try {
        const j = await api.getProjectJob(projectId);
        setJob(j);
        if (j.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 800);
        } else if (j.status === 'failed') {
          clearInterval(interval);
          setError(j.log_messages[j.log_messages.length - 1] || 'Analysis failed');
        }
      } catch (err: any) {
        console.error(err);
      }
    };

    pollJob();
    interval = setInterval(pollJob, 1200);

    return () => clearInterval(interval);
  }, [projectId, onComplete]);

  if (!job) return null;

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-indigo-500/40 shadow-2xl space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            {job.status === 'completed' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : job.status === 'failed' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white capitalize">
              {job.stage.replace('_', ' ')} Stage Active
            </h4>
            <span className="text-[11px] text-slate-400">
              {job.status === 'completed'
                ? 'Analysis complete! Rendering architecture graph...'
                : 'Deep AST syntax extraction and dependency synthesis in progress...'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-bold font-mono text-indigo-400">
            {job.progress_percent}%
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${job.progress_percent}%` }}
        />
      </div>

      {/* Real-time Logs Terminal */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 max-h-24 overflow-y-auto space-y-1">
        {(job.log_messages || []).slice(-4).map((msg, idx) => (
          <div key={idx} className="truncate">
            <span className="text-indigo-400 select-none">&gt; </span>
            <span>{msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
