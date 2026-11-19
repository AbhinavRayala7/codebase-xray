import React, { useState } from 'react';
import { LoginForm } from './components/auth/LoginForm';
import { TaskList } from './components/tasks/TaskList';
import { User } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold">TaskFlow Workspace</h1>
      </header>

      {!currentUser ? (
        <LoginForm onSuccess={(user) => setCurrentUser(user)} />
      ) : (
        <section>
          <p className="mb-4">Welcome back, {currentUser.name}</p>
          <TaskList />
        </section>
      )}
    </main>
  );
};

export default App;
