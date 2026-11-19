import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Shield,
  Loader2,
  Sparkles
} from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);
import { api } from '../../api/client';
import { AnalysisJob } from '../../types';

interface AnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisStarted: (projectId: string) => void;
}

export const AnalyzeModal: React.FC<AnalyzeModalProps> = ({
  isOpen,
  onClose,
  onAnalysisStarted
}) => {
  const [tab, setTab] = useState<'sample' | 'github' | 'zip'>('sample');
  const [githubUrl, setGithubUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim().startsWith('https://github.com/')) {
      setError('Please provide a valid GitHub repository URL (e.g. https://github.com/owner/repo)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzeGitHub(githubUrl.trim(), customName.trim() || undefined);
      onAnalysisStarted(res.project_id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start GitHub analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a ZIP file to upload.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadZip(selectedFile, customName.trim() || undefined);
      onAnalysisStarted(res.project_id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload ZIP archive');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzeSample();
      onAnalysisStarted(res.project_id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to launch sample project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Analyze New Repository</h3>
              <p className="text-xs text-slate-400">Select an ingestion source for deep AST intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 p-2 m-4 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-medium">
          <button
            onClick={() => { setTab('sample'); setError(null); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              tab === 'sample'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Instant Demo</span>
          </button>

          <button
            onClick={() => { setTab('github'); setError(null); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              tab === 'github'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub URL</span>
          </button>

          <button
            onClick={() => { setTab('zip'); setError(null); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              tab === 'zip'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload ZIP</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 pt-2">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: INSTANT SAMPLE PROJECT */}
          {tab === 'sample' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-indigo-300">TaskFlow Fullstack (Ready)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    Bundled Architecture
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real multi-tier architecture containing TypeScript React UI, FastAPI Python endpoints, services, database models, and unit tests.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] font-mono text-slate-300">
                  <span className="bg-slate-800 px-2 py-0.5 rounded">FastAPI</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded">React 18</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded">TypeScript</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded">SQLAlchemy</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded">Pytest</span>
                </div>
              </div>

              <button
                onClick={handleSampleSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{loading ? 'Analyzing Sample Repository...' : 'Launch Instant Analysis'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: GITHUB URL */}
          {tab === 'github' && (
            <form onSubmit={handleGitHubSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Public GitHub Repository URL
                </label>
                <div className="relative">
                  <GithubIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/facebook/react or https://github.com/tiangolo/fastapi"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Project Label (Optional)
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. My NextGen Project"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Code is analyzed purely statically in an isolated local sandbox.</span>
              </div>

              <button
                type="submit"
                disabled={loading || !githubUrl.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GithubIcon className="w-4 h-4" />}
                <span>{loading ? 'Retrieving Repository...' : 'Clone & Analyze Repository'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: ZIP UPLOAD */}
          {tab === 'zip' && (
            <form onSubmit={handleZipSubmit} className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-900/40"
              >
                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <span className="text-sm font-semibold text-white">{selectedFile.name}</span>
                    <span className="block text-xs text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Click to browse or drop repository ZIP here
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Max file size: 50MB. Safe Zip Slip validation active.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Project Label (Optional)
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Local Microservices"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{loading ? 'Uploading & Parsing...' : 'Upload & Analyze Project'}</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
