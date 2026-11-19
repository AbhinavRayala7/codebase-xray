import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  FileCode,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Bot,
  User,
  ExternalLink,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../../api/client';
import { AIInvestigationItem } from '../../types';

interface AIInvestigatorProps {
  projectId: string;
  onNavigateToFile: (filePath: string) => void;
}

export const AIInvestigator: React.FC<AIInvestigatorProps> = ({
  projectId,
  onNavigateToFile
}) => {
  const [messages, setMessages] = useState<AIInvestigationItem[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    'Explain this project architecture.',
    'Where is authentication implemented?',
    'How does data move through this application?',
    'Which files handle API requests?',
    'What might break if I change the models?'
  ];

  useEffect(() => {
    loadHistory();
  }, [projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const history = await api.getInvestigationHistory(projectId);
      if (history.length > 0) {
        setMessages(history.reverse());
      } else {
        // Send default project explanation
        handleAsk('Explain this project architecture.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAsk = async (q: string) => {
    if (!q.trim() || loading) return;
    setInputQuery('');
    setLoading(true);

    // Optimistically add user query
    const userMsg: AIInvestigationItem = {
      query: q,
      response: '',
      cited_files: [],
      cited_symbols: []
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await api.investigate(projectId, q);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = result;
        return next;
      });
    } catch (err: any) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          query: q,
          response: `Investigation Error: ${err.message || 'Unable to connect to investigation engine'}`,
          cited_files: [],
          cited_symbols: []
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex flex-col h-[750px] rounded-2xl border border-slate-800 bg-[#070a12] shadow-2xl overflow-hidden animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>AI Code Investigator</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-800/60">
                Grounding Engine
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Answers are strictly synthesized from repository AST files with exact line and path citations.
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
          Zero Hallucination Policy Active
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap">Suggested:</span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(q)}
            disabled={loading}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors text-[11px]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {messages.map((item, idx) => (
          <div key={idx} className="space-y-4">
            
            {/* User message */}
            <div className="flex items-start justify-end gap-2.5">
              <div className="max-w-xl rounded-2xl rounded-tr-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-3.5 text-xs shadow-md">
                {item.query}
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0 text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* AI Assistant response */}
            {item.response ? (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="flex-1 max-w-3xl rounded-2xl rounded-tl-sm bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
                  
                  {/* Markdown-like body display */}
                  <div className="text-xs text-slate-200 leading-relaxed space-y-3 prose-invert font-sans whitespace-pre-wrap">
                    {item.response}
                  </div>

                  {/* Uncertainty notice if present */}
                  {item.uncertainty_note && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300">
                      <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
                      <span>{item.uncertainty_note}</span>
                    </div>
                  )}

                  {/* Cited Files Footnote */}
                  {item.cited_files && item.cited_files.length > 0 && (
                    <div className="pt-3 border-t border-slate-800">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-semibold">
                        Grounded Source Citations:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.cited_files.map((cite, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => onNavigateToFile(cite.path)}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 text-left transition-colors group"
                          >
                            <div className="truncate pr-2">
                              <span className="font-mono text-[11px] text-indigo-300 group-hover:text-indigo-200 block truncate">
                                {cite.path}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {cite.reason}
                              </span>
                            </div>
                            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 text-[11px] text-slate-500">
                    <button
                      onClick={() => copyToClipboard(item.response, idx)}
                      className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                    >
                      {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIdx === idx ? 'Copied' : 'Copy Response'}</span>
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span>Scanning repository symbols and retrieving code snippets...</span>
                </div>
              </div>
            )}

          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(inputQuery);
        }}
        className="p-4 bg-slate-900/60 border-t border-slate-800 flex gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask anything about the codebase (e.g. 'Where is authentication implemented?')"
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/30"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>
      </form>

    </div>
  );
};
