import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!supabase) {
      // Mock login if no supabase config
      if (email === 'admin' && password === 'admin') {
        onLogin({ email: 'admin' });
      } else {
        setError('Supabase not configured. Use admin/admin for demo.');
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      onLogin(data.user);
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="app-title" style={{ justifyContent: 'center' }}>
            <span>✈️</span> HKT Incident Automator
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Please sign in to continue
          </p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email / Username</label>
            <input 
              type="text" 
              placeholder="you@airport.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
