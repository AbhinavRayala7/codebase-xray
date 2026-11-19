import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { User } from '../../types';

interface LoginFormProps {
  onSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiClient.login({ email, password });
      onSuccess(data.user);
    } catch (err) {
      console.error('Login failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-900 rounded-lg">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Authenticating...' : 'Sign In'}
      </button>
    </form>
  );
};
