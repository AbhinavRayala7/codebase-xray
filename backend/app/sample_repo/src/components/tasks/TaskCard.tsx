import React from 'react';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate }) => {
  return (
    <div className="border border-slate-800 p-3 rounded bg-slate-950">
      <h4 className="font-semibold text-slate-200">{task.title}</h4>
      <p className="text-sm text-slate-400">{task.description}</p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300">{task.status}</span>
        <span className="text-slate-500 font-mono">{task.priority}</span>
      </div>
    </div>
  );
};
