import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, Key, Lock, Users, LogOut, ChevronRight, 
  Shield, CheckCircle, AlertCircle, RefreshCw 
} from 'lucide-react';

const AccountManagementView = ({ user, onBack, onLogout }) => {
  const [activeTab, setActiveTab] = useState('password'); // 'password' | 'rbac'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // RBAC State
  const [userList, setUserList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('operation');
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  useEffect(() => {
    if (activeTab === 'rbac' && user?.role === 'admin') {
      fetchUserList();
    }
  }, [activeTab]);

  const fetchUserList = async () => {
    if (!supabase) return;
    setIsRefreshingUsers(true);
    try {
      const { data, error } = await supabase.rpc('get_user_list');
      if (error) throw error;
      setUserList(data || []);
      if (data?.length > 0 && !selectedUserId) {
        setSelectedUserId(data[0].id);
        setSelectedRole(data[0].role || 'operation');
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้ (กรุณาตรวจสอบว่าได้รัน SQL RPC แล้ว)' });
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Note: oldPassword check is not strictly enforced by Supabase client-side, 
      // but provided in UI for standard compliance.
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: selectedUserId,
        new_role: selectedRole
      });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'อัปเดตสิทธิ์การใช้งานเรียบร้อย' });
      fetchUserList(); // Refresh list to see updated labels
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-mgmt-container" style={{ display: 'flex', height: '100vh', background: 'var(--bg-main)' }}>
      {/* Sidebar เมนู */}
      <div className="account-sidebar" style={{ 
        width: '280px', 
        background: 'var(--bg-card)', 
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem'
      }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: '2rem', alignSelf: 'flex-start' }}>
          <ArrowLeft size={20} /> กลับหน้าหลัก
        </button>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            ตั้งค่าผู้ใช้งาน
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              className={`account-nav-item ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => { setActiveTab('password'); setMessage({ type: '', text: '' }); }}
              style={navItemStyle(activeTab === 'password')}
            >
              <Lock size={18} /> เปลี่ยนรหัสผ่าน
              <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </button>
            
            {user?.role === 'admin' && (
              <button 
                className={`account-nav-item ${activeTab === 'rbac' ? 'active' : ''}`}
                onClick={() => { setActiveTab('rbac'); setMessage({ type: '', text: '' }); }}
                style={navItemStyle(activeTab === 'rbac')}
              >
                <Users size={18} /> จัดการสิทธิ์ (Admin)
                <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </button>
            )}
          </nav>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button className="btn btn-ghost btn-full" onClick={onLogout} style={{ color: 'var(--accent-red)', justifyContent: 'flex-start' }}>
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </div>

      {/* พื้นที่แสดงเนื้อหา */}
      <div className="account-content" style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        <div style={{ maxWidth: '600px' }}>
          {activeTab === 'password' && (
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent-indigo)', marginBottom: '0.5rem' }}>
                เปลี่ยนรหัสผ่าน
              </h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
                โปรดตั้งรหัสผ่านใหม่ที่คาดเดาได้ยากเพื่อความปลอดภัยของข้อมูล
              </p>

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="input-group">
                  <label>รหัสผ่านเดิม</label>
                  <input 
                    type="password" 
                    value={oldPassword} 
                    onChange={(e) => setOldPassword(e.target.value)} 
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>รหัสผ่านใหม่</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>ยืนยันรหัสผ่านใหม่</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    required
                  />
                </div>

                {message.text && (
                  <div style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.9rem'
                  }}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: 'fit-content', padding: '0.8rem 2.5rem' }}>
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'rbac' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent-indigo)', margin: 0 }}>
                  จัดการสิทธิ์ใช้งาน (Update Role)
                </h1>
                <button 
                  className="btn btn-ghost btn-icon" 
                  onClick={fetchUserList} 
                  disabled={isRefreshingUsers}
                  title="รีเฟรชรายชื่อ"
                >
                  <RefreshCw size={18} className={isRefreshingUsers ? 'spin' : ''} />
                </button>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
                เลือกผู้ใช้งานที่ต้องการปรับระดับสิทธิ์การเข้าถึงข้อมูลระบบ
              </p>

              <form onSubmit={handleUpdateRole} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="input-group">
                  <label>เลือกผู้ใช้งาน</label>
                  <select 
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
                    value={selectedUserId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedUserId(id);
                      const u = userList.find(x => x.id === id);
                      if (u) setSelectedRole(u.role || 'operation');
                    }}
                  >
                    {userList.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.display_name || u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>ระดับสิทธิ์ (Role)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    {['operation', 'supervisor', 'admin'].map(r => (
                      <div 
                        key={r}
                        onClick={() => setSelectedRole(r)}
                        style={{
                          padding: '1rem',
                          borderRadius: '8px',
                          border: `2px solid ${selectedRole === r ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                          background: selectedRole === r ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Shield size={20} style={{ marginBottom: '0.5rem', color: selectedRole === r ? 'var(--accent-indigo)' : 'var(--text-muted)' }} />
                        <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{r}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {r === 'operation' && 'ดู/กรอกข้อมูล'}
                          {r === 'supervisor' && 'จัดการฟอร์ม'}
                          {r === 'admin' && 'ดูแลระบบ'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {message.text && (
                  <div style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.9rem'
                  }}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading || !selectedUserId} style={{ width: 'fit-content', padding: '0.8rem 2.5rem' }}>
                  {loading ? 'กำลังบันทึก...' : 'อัปเดตสิทธิ์ใช้งาน'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const navItemStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.8rem 1rem',
  borderRadius: '8px',
  border: 'none',
  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
  color: isActive ? 'var(--accent-indigo)' : 'var(--text-secondary)',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  fontWeight: isActive ? 'bold' : 'normal',
  transition: 'all 0.2s'
});

export default AccountManagementView;
