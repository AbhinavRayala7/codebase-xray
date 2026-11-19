import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Folder,
  FolderOpen,
  FileCode,
  Search,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  FileText
} from 'lucide-react';
import { api } from '../../api/client';
import { FileTreeNode, FileDetails } from '../../types';

interface FileExplorerProps {
  projectId: string;
  initialFilePath?: string | null;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  projectId,
  initialFilePath
}) => {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(initialFilePath || null);
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'server']));

  useEffect(() => {
    loadTree();
  }, [projectId]);

  useEffect(() => {
    if (initialFilePath) {
      loadFile(initialFilePath);
    }
  }, [initialFilePath]);

  const loadTree = async () => {
    setLoadingTree(true);
    try {
      const data = await api.getFilesTree(projectId);
      setTree(data.tree);

      // Auto-select first file if none selected
      if (!selectedFile && data.tree.length > 0) {
        const findFirstFile = (nodes: FileTreeNode[]): string | null => {
          for (const n of nodes) {
            if (!n.is_directory) return n.path;
            if (n.children) {
              const res = findFirstFile(n.children);
              if (res) return res;
            }
          }
          return null;
        };
        const first = findFirstFile(data.tree);
        if (first) {
          loadFile(first);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTree(false);
    }
  };

  const loadFile = async (path: string) => {
    setSelectedFile(path);
    setLoadingContent(true);
    try {
      const [details, contentRes] = await Promise.all([
        api.getFileDetails(projectId, path),
        api.getFileContent(projectId, path)
      ]);
      setFileDetails(details);
      setFileContent(contentRes.content);
    } catch (err) {
      console.error(err);
      setFileContent('// Error loading file content from disk.');
    } finally {
      setLoadingContent(false);
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Recursive tree renderer
  const renderTree = (nodes: FileTreeNode[]) => {
    return (
      <div className="space-y-0.5">
        {nodes.map((node) => {
          if (node.is_directory) {
            const isExpanded = expandedFolders.has(node.path);
            return (
              <div key={node.path}>
                <button
                  onClick={() => toggleFolder(node.path)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-left text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="font-mono truncate">{node.name}</span>
                </button>

                {isExpanded && node.children && (
                  <div className="pl-4 border-l border-slate-800/80 ml-3">
                    {renderTree(node.children)}
                  </div>
                )}
              </div>
            );
          } else {
            const isSelected = selectedFile === node.path;
            const matchesSearch =
              !searchFilter ||
              node.name.toLowerCase().includes(searchFilter.toLowerCase());

            if (!matchesSearch) return null;

            return (
              <button
                key={node.path}
                onClick={() => loadFile(node.path)}
                className={`w-full flex items-center justify-between px-2 py-1 rounded text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <FileCode className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="font-mono truncate">{node.name}</span>
                </div>
                {node.role && (
                  <span className="text-[9px] font-mono uppercase px-1 rounded bg-slate-900 text-slate-500">
                    {node.role}
                  </span>
                )}
              </button>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-indigo-400" />
          <span>Project File Explorer & Code Inspector</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Browse repository directory hierarchy, inspect syntax-highlighted source code, and navigate related imports/exports.
        </p>
      </div>

      {/* Main 3-Column Interface: Tree (Left) | Code Viewer (Center) | Metadata (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[750px]">
        
        {/* 1. Left Column: Hierarchical Directory Tree */}
        <div className="lg:col-span-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col overflow-hidden">
          <span className="text-xs font-bold text-slate-200 mb-2">Workspace Tree</span>
          
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter files..."
              className="w-full pl-7 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {loadingTree ? (
              <div className="text-xs text-slate-500 text-center py-8">Loading directory tree...</div>
            ) : (
              renderTree(tree)
            )}
          </div>
        </div>

        {/* 2. Middle Column: Source Code Viewer */}
        <div className="lg:col-span-6 rounded-2xl bg-[#070a12] border border-slate-800 flex flex-col overflow-hidden shadow-xl">
          
          {/* File bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/80 text-xs">
            <div className="flex items-center gap-2 truncate">
              <FileCode className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="font-mono text-slate-200 font-semibold truncate">
                {selectedFile || 'Select a file'}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Code text area with line numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/80">
            {loadingContent ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                Loading source content...
              </div>
            ) : fileContent ? (
              <div className="table w-full">
                {fileContent.split('\n').map((line, idx) => (
                  <div key={idx} className="table-row hover:bg-slate-900/60 transition-colors">
                    <span className="table-cell pr-4 text-right select-none text-slate-600 font-mono text-[11px] w-10">
                      {idx + 1}
                    </span>
                    <span className="table-cell whitespace-pre font-mono text-slate-200 text-xs">
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 italic">No file selected.</div>
            )}
          </div>

        </div>

        {/* 3. Right Column: File Metadata & Relationship Inspector */}
        <div className="lg:col-span-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col overflow-y-auto space-y-4">
          <span className="text-xs font-bold text-slate-200 block border-b border-slate-800 pb-2">
            File Metadata & AST Insights
          </span>

          {fileDetails ? (
            <div className="space-y-4 text-xs">
              
              {/* Properties Grid */}
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Language</span>
                  <span className="text-slate-200 font-semibold">{fileDetails.language}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Lines</span>
                  <span className="text-slate-200 font-semibold">{fileDetails.line_count}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Role</span>
                  <span className="text-indigo-400 font-semibold uppercase">{fileDetails.role}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Size</span>
                  <span className="text-slate-200 font-semibold">{(fileDetails.file_size / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              {/* Exported Functions / Classes */}
              <div>
                <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Exported Symbols ({fileDetails.exports.length})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {fileDetails.exports.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">No named exports</span>
                  ) : (
                    fileDetails.exports.map((e, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-200 truncate">
                        {e.name} <span className="text-slate-500 text-[10px]">({e.kind})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Imported Modules with Click-To-Open */}
              <div>
                <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Imported Dependencies ({fileDetails.imports.length})
                </span>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {fileDetails.imports.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">No imports</span>
                  ) : (
                    fileDetails.imports.map((imp, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center justify-between"
                      >
                        <span className="truncate pr-1">{imp.source}</span>
                        {imp.is_external ? (
                          <span className="text-[9px] uppercase px-1 rounded bg-slate-900 text-slate-500">pkg</span>
                        ) : (
                          <span className="text-[9px] uppercase px-1 rounded bg-indigo-950 text-indigo-400">internal</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-6">
              Select a file to inspect AST properties
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
