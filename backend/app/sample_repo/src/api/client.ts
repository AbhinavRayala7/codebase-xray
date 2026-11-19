import { Task, User } from '../types';

export const apiClient = {
  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  async getTasks(): Promise<Task[]> {
    const res = await fetch('/api/tasks');
    return res.json();
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    return res.json();
  }
};
