import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Auto-append domain to make it look like a username system
    const email = username.includes('@') ? username : `${username}@hkt.local`;

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setError('Username หรือ รหัสผ่านไม่ถูกต้อง');
      } else {
        onLogin(data.user);
      }
    } else {
      // Demo mode fallback
      if (username === 'admin' && password === 'admin') {
        onLogin({ email: 'admin@demo.local', id: 'demo' });
      } else {
        setError('โหมดทดลอง: ใช้ admin / admin');
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="app-title" style={{ justifyContent: 'center' }}>
            <span>✈️</span> HKT Automator
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
        </div>
        
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input 
              type="text" 
              placeholder="ใส่ชื่อผู้ใช้งาน..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="ใส่รหัสผ่าน..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}
          
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          งานควบคุมจราจรภาคพื้น (Apron Control)<br/>
          ท่าอากาศยานภูเก็ต
        </div>
      </div>
    </div>
  );
};

export default Login;
