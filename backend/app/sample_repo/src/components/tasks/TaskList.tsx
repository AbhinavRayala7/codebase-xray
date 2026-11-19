import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Task } from '../../types';
import { TaskCard } from './TaskCard';

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getTasks().then(data => {
      setTasks(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="space-y-3">
      {tasks.map(t => (
        <TaskCard key={t.id} task={t} onUpdate={(updated) => {}} />
      ))}
    </div>
  );
};
