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

    try {
      if (!supabase) {
        // Fallback to Demo mode if Supabase is missing
        if (username === 'admin' && password === 'admin') {
          onLogin({ id: 'demo', username: 'admin', display_name: 'Administrator (Demo)' });
        } else {
          setError('ฐานข้อมูลไม่ได้เชื่อมต่อ (Missing Config). กรุณาใช้ admin / admin สำหรับโหมดทดลอง');
        }
      } else {
        const email = `${username.trim()}@vtsp.internal`;
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError || !data?.user) {
          setError('Username หรือ รหัสผ่านไม่ถูกต้อง');
        } else {
          const u = data.user;
          const userEmail = u?.email || '';
          const fallback = userEmail.includes('@') ? userEmail.split('@')[0] : 'User';
          
          onLogin({
            id: u.id,
            username: u.user_metadata?.username || fallback,
            display_name: u.user_metadata?.display_name || fallback,
          });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="app-title" style={{ justifyContent: 'center', fontSize: '1.6rem', textAlign: 'center', whiteSpace: 'nowrap', marginBottom: '2.5rem' }}>
            ระบบจัดทำรายงานเหตุการณ์ไม่ปกติ
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem', marginBottom: '2rem', fontSize: '1.1rem' }}>กรุณาเข้าสู่ระบบ</p>
        </div>
        
        <form className="login-form" onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="input-group">
            <label style={{ marginBottom: '0.5rem', display: 'block' }}>ชื่อผู้ใช้งาน (Username)</label>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label style={{ marginBottom: '0.5rem', display: 'block' }}>รหัสผ่าน (Password)</label>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>{error}</div>}
          
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{ marginTop: '3.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.8', opacity: 0.8 }}>
          งานบริการเขตการบิน ส่วนปฏิบัติการเขตการบิน<br/>
          ฝ่ายปฏิบัติการเขตการบิน ท่าอากาศยานภูเก็ต (Apron Control)
        </div>
      </div>
    </div>
  );
};

export default Login;
