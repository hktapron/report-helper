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

    if (supabase) {
      try {
        // 100% Custom Auth: Call RPC function verify_user directly
        const { data, error: rpcError } = await supabase.rpc('verify_user', { 
           p_username: username, 
           p_password: password 
        });

        if (rpcError || !data || data.length === 0 || !data[0].success) {
          setError('Username หรือ รหัสผ่านไม่ถูกต้อง');
        } else {
          onLogin(data[0]); 
        }
      } catch (err) {
        console.error('Login error:', err);
        setError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (โปรดตรวจสอบการรัน SQL Schema)');
      }
    } else {
      if (username === 'admin' && password === 'admin') {
        onLogin({ username: 'admin', display_name: 'หัวหน้างานกะ', id: 'demo' });
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
          <h1 className="app-title" style={{ justifyContent: 'center', fontSize: '1.8rem', textAlign: 'center' }}>
            ระบบจัดทำรายงานเหตุการณ์ไม่ปกติ
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1rem' }}>กรุณาเข้าสู่ระบบ</p>
        </div>
        
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>ชื่อผู้ใช้งาน (Username)</label>
            <input 
              type="text" 
              placeholder="กรอกชื่อผู้ใช้งาน..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>รหัสผ่าน (Password)</label>
            <input 
              type="password" 
              placeholder="กรอกรหัสผ่าน..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
          
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          ส่วนปฏิบัติการเขตการบิน ฝ่ายปฏิบัติการเขตการบิน<br/>
          ท่าอากาศยานภูเก็ต (Apron Control)
        </div>
      </div>
    </div>
  );
};

export default Login;
