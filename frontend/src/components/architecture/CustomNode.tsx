import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  FileCode,
  Layers,
  Workflow,
  Sparkles,
  AlertCircle,
  Database,
  Globe,
  Settings,
  CheckCircle2,
  Box
} from 'lucide-react';
import { ReactFlowNodeData } from '../../types';

const roleIcons: Record<string, React.FC<any>> = {
  entry: Sparkles,
  component: Layers,
  api_route: Globe,
  service: Workflow,
  controller: Settings,
  model: Database,
  utility: Box,
  config: Settings,
  test: CheckCircle2,
  module: FileCode
};

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ReactFlowNodeData;
  const Icon = roleIcons[nodeData.role] || FileCode;

  return (
    <div
      className={`relative min-w-[200px] max-w-[260px] rounded-xl border bg-slate-900/95 p-3 shadow-xl backdrop-blur-md transition-all duration-200 ${
        selected
          ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-105 z-30'
          : 'border-slate-800/90 hover:border-slate-700 hover:scale-[1.02]'
      }`}
      style={{
        boxShadow: selected ? `0 0 25px ${nodeData.color}40` : undefined
      }}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-400 !border-slate-800 hover:!bg-indigo-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-indigo-500 !border-slate-800 hover:!bg-cyan-400"
      />

      {/* Top Tag & Indicator */}
      <div className="flex items-center justify-between gap-1 mb-1.5 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: nodeData.color }}
          />
          <span className="font-mono uppercase tracking-wider text-slate-400">
            {nodeData.role}
          </span>
        </div>

        {nodeData.isCircular && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 font-mono text-[9px]">
            <AlertCircle className="w-2.5 h-2.5" />
            CYCLE
          </span>
        )}
      </div>

      {/* Node Title & File Path */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-white"
          style={{ backgroundColor: `${nodeData.color}25`, color: nodeData.color }}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="truncate">
          <span className="text-xs font-semibold text-slate-100 block truncate" title={nodeData.label}>
            {nodeData.label}
          </span>
          <span className="text-[10px] text-slate-500 font-mono truncate block" title={nodeData.filePath}>
            {nodeData.filePath}
          </span>
        </div>
      </div>

      {/* Metrics footer */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
        <span>{nodeData.lineCount} lines</span>
        <div className="flex items-center gap-2">
          <span title="Incoming dependents (in-degree)" className="hover:text-indigo-300">
            ↓{nodeData.inDegree}
          </span>
          <span title="Outgoing imports (out-degree)" className="hover:text-indigo-300">
            ↑{nodeData.outDegree}
          </span>
        </div>
      </div>
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
