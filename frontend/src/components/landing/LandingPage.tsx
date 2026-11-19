import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  Sparkles,
  Network,
  Share2,
  Workflow,
  HeartPulse,
  FolderTree,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Zap,
  Cpu,
  GitBranch,
  Search,
  Code2,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onStartAnalysis: () => void;
  onExploreFeatures: () => void;
  onTrySample: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnalysis,
  onExploreFeatures,
  onTrySample
}) => {
  const [activePreview, setActivePreview] = useState<'arch' | 'tracer' | 'ai' | 'health'>('arch');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Mock nodes for hero interactive graph
  const heroNodes = [
    { id: 'client', name: 'LoginForm.tsx', type: 'component', x: 12, y: 35, color: '#38bdf8' },
    { id: 'api_client', name: 'client.ts', type: 'service', x: 38, y: 25, color: '#f59e0b' },
    { id: 'route', name: 'routes_auth.py', type: 'api_route', x: 65, y: 30, color: '#10b981' },
    { id: 'auth_srv', name: 'auth_service.py', type: 'service', x: 62, y: 68, color: '#f59e0b' },
    { id: 'db_model', name: 'User (DB)', type: 'model', x: 88, y: 55, color: '#ec4899' },
  ];

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 sm:px-12 max-w-7xl mx-auto text-center">
        
        {/* Release Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-md shadow-lg shadow-indigo-950/50">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Next-Gen Software Intelligence Platform</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">AST-Grounded Architecture</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Understand Any Codebase. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
            Instantly.
          </span>
        </h1>

        {/* Supporting text */}
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Explore architecture, trace execution flows, uncover dependencies, and investigate your code with AI-powered software intelligence.
        </p>

        {/* Action CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartAnalysis}
            className="flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/45 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Analyze Your Repository</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onTrySample}
            className="flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl backdrop-blur-md transition-all hover:text-white"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span>Try Sample Project</span>
          </button>
        </div>

        {/* Interactive Architecture Graph Illustration */}
        <div className="mt-16 max-w-5xl mx-auto relative rounded-2xl border border-slate-800/80 bg-slate-950/70 shadow-2xl shadow-indigo-950/40 p-6 backdrop-blur-xl overflow-hidden">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-slate-400">interactive_architecture_graph.xray</span>
            </div>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/50">
              Hover nodes to trace data flow
            </span>
          </div>

          {/* Graph Canvas */}
          <div className="relative h-72 sm:h-80 w-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center">
            
            {/* SVG Connecting Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <line x1="16%" y1="40%" x2="42%" y2="30%" stroke="url(#edgeGrad)" strokeWidth="2" strokeDasharray="4" className="animate-pulse" />
              <line x1="42%" y1="30%" x2="68%" y2="35%" stroke="url(#edgeGrad)" strokeWidth="2" strokeDasharray="4" className="animate-pulse" />
              <line x1="68%" y1="35%" x2="65%" y2="72%" stroke="url(#edgeGrad)" strokeWidth="2" />
              <line x1="65%" y1="72%" x2="90%" y2="60%" stroke="url(#edgeGrad)" strokeWidth="2" />
            </svg>

            {/* Interactive Nodes */}
            {heroNodes.map((node) => {
              const isHovered = hoveredNode === node.id;
              return (
                <div
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 ${
                    isHovered ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <div
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-slate-900/95 border backdrop-blur-md shadow-lg"
                    style={{
                      borderColor: isHovered ? node.color : 'rgba(255,255,255,0.12)',
                      boxShadow: isHovered ? `0 0 20px ${node.color}55` : '0 4px 12px rgba(0,0,0,0.4)'
                    }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: node.color }} />
                    <span className="font-mono text-xs font-medium text-slate-200">{node.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {node.type}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Micro bottom status info */}
            <div className="absolute bottom-3 left-4 text-[11px] font-mono text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Frontend Layer
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                API Route Handlers
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                Data Persistence
              </span>
            </div>

          </div>
        </div>

      </section>

      {/* Product Feature Highlights */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-semibold">
            Engineered For Deep Codebase Intelligence
          </h2>
          <p className="mt-2 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Stop Guessing How Unknown Repos Work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-indigo-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Interactive Architecture Explorer</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Real-time interactive React Flow graph mapping entrypoints, services, components, and controllers with cycle warnings and node inspection.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-violet-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Workflow className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Execution Tracer</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Trace request trajectories from UI click to API endpoints, database interactions, and response payloads with static-proven labels.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-cyan-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Source-Grounded AI Investigator</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Ask complex architectural questions. Every answer cites exact file paths, exported symbols, line numbers, and actual code snippets.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-pink-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Dependency Detective</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Detect circular dependencies, high-centrality chokepoints, hub modules, and deep dependency chains before they break production.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-amber-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Change Impact Blast Radius</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Calculate direct, indirect, and potential blast radius for any modified file, revealing affected API routes and downstream tests.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-emerald-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Codebase Health Scoring</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Audit for cyclomatic complexity, oversized files, missing test suites, orphan dead code, and duplicate imports with action suggestions.
            </p>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-t border-slate-800/80 bg-slate-950/40 rounded-3xl my-8">
        <div className="text-center mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-semibold">
            Seamless Workflow
          </h2>
          <p className="mt-2 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            From Raw Repository To Total Clarity In 4 Steps
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 relative">
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-1 rounded border border-indigo-900/60">
              STEP 01
            </span>
            <h4 className="mt-4 text-base font-semibold text-white">Ingest Repository</h4>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Provide any public GitHub URL, upload a local ZIP archive, or launch our sample fullstack project.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 relative">
            <span className="text-xs font-mono font-bold text-violet-400 bg-violet-950/80 px-2 py-1 rounded border border-violet-900/60">
              STEP 02
            </span>
            <h4 className="mt-4 text-base font-semibold text-white">AST Parsing Engine</h4>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Multi-language AST extractors parse imports, exports, functions, classes, and framework signals without running untrusted code.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 relative">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-900/60">
              STEP 03
            </span>
            <h4 className="mt-4 text-base font-semibold text-white">Graph Synthesis</h4>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              NetworkX computes directed dependency topologies, simple cycle loops, betweenness centrality, and blast radius metrics.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 relative">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-900/60">
              STEP 04
            </span>
            <h4 className="mt-4 text-base font-semibold text-white">Interactive Investigation</h4>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Explore dynamic diagrams, trace execution stories, and interrogate the AI assistant with verifiable citations.
            </p>
          </div>

        </div>
      </section>

      {/* Technology Support */}
      <section className="py-16 px-6 sm:px-12 max-w-7xl mx-auto text-center border-t border-slate-800/80">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-8">
          Extensible Parser Support For Modern Stacks
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm font-medium text-slate-300">
          {['TypeScript', 'JavaScript', 'Python', 'Java', 'React', 'FastAPI', 'Next.js', 'Spring Boot', 'SQLAlchemy'].map((tech) => (
            <div key={tech} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 transition-colors">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>{tech}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 px-6 sm:px-12 max-w-5xl mx-auto text-center my-12 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-2xl shadow-indigo-950/60">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Ready to See Beyond the Code?
        </h2>
        <p className="mt-4 text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Accelerate code reviews, onboard into new repositories in minutes, and refactor with total architectural confidence.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartAnalysis}
            className="flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-105"
          >
            <span>Analyze Your Repository</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onTrySample}
            className="px-6 py-3.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-colors"
          >
            Launch Instant Demo
          </button>
        </div>
      </section>

    </div>
  );
};
