import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, Key, Lock, Users, LogOut, ChevronRight, 
  Shield, CheckCircle, AlertCircle, RefreshCw,
  Activity, Calendar, Search, User as UserIcon
} from 'lucide-react';

const AccountManagementView = ({ user, logActivity, onBack, onLogout }) => {
  const [activeTab, setActiveTab] = useState('password'); // 'password' | 'rbac' | 'logs'
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

  // Logs State
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  // Gemini State
  const [localGeminiKey, setLocalGeminiKey] = useState(() => localStorage.getItem('vtsp_gemini_key') || '');
  const [systemGeminiKey, setSystemGeminiKey] = useState('');
  const [isSystemKeyLoading, setIsSystemKeyLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'rbac' && user?.role === 'admin') {
      fetchUserList();
    }
    if (activeTab === 'logs' && user?.role === 'admin') {
      fetchLogs();
    }
    if (activeTab === 'gemini') {
      fetchSystemGeminiKey();
    }
  }, [activeTab]);

  const fetchSystemGeminiKey = async () => {
    if (!supabase) return;
    setIsSystemKeyLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'gemini_api_key')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setSystemGeminiKey(data.value);
    } catch (err) {
      console.error("Fetch system key error:", err);
    } finally {
      setIsSystemKeyLoading(false);
    }
  };

  const handleSaveLocalKey = (e) => {
    e.preventDefault();
    localStorage.setItem('vtsp_gemini_key', localGeminiKey);
    setMessage({ type: 'success', text: 'บันทึก API Key ในเครื่องนี้เรียบร้อยแล้ว' });
  };

  const handleSaveSystemKey = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'gemini_api_key', 
          value: systemGeminiKey,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
      
      // Also update local for immediate use
      localStorage.setItem('vtsp_gemini_key', systemGeminiKey);
      setLocalGeminiKey(systemGeminiKey);
      
      setMessage({ type: 'success', text: 'บันทึก API Key เข้าระบบส่วนกลางเรียบร้อยแล้ว ทุกคนในแผนกจะเริ่มใช้ Key นี้ทันที' });
      
      if (logActivity) {
        logActivity('update_system_config', 'Gemini API Key', { action: 'centralized_save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'ไม่สามารถบันทึกเข้าระบบส่วนกลางได้' });
    } finally {
      setLoading(false);
    }
  };

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

  const fetchLogs = async () => {
    if (!supabase) return;
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Fetch logs error:", err);
    } finally {
      setLogsLoading(false);
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
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      // LOG: Password change
      if (logActivity) {
        logActivity('change_password', 'User Account', { user_id: user.id });
      }

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
      const targetUser = userList.find(u => u.id === selectedUserId);
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: selectedUserId,
        new_role: selectedRole
      });

      if (error) throw error;
      
      // LOG: Role update
      if (logActivity) {
        logActivity('update_user_role', targetUser?.username || 'Unknown User', { 
          target_id: selectedUserId, 
          new_role: selectedRole 
        });
      }

      setMessage({ type: 'success', text: 'อัปเดตสิทธิ์การใช้งานเรียบร้อย' });
      fetchUserList(); // Refresh list to see updated labels
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์' });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionLabel = (action) => {
    const map = {
      create_template: 'สร้างฟอร์มใหม่',
      update_template: 'แก้ไขฟอร์ม',
      delete_custom_template: 'ลบฟอร์ม',
      hide_system_template: 'ซ่อนฟอร์มมาตรฐาน',
      delete_field: 'ลบหัวข้อกรงข้อมูล',
      update_user_role: 'ปรับระดับสิทธิ์',
      change_password: 'เปลี่ยนรหัสผ่าน'
    };
    return map[action] || action;
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
              <>
                <button 
                  className={`account-nav-item ${activeTab === 'gemini' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('gemini'); setMessage({ type: '', text: '' }); }}
                  style={navItemStyle(activeTab === 'gemini')}
                >
                  <RefreshCw size={18} /> ตั้งค่า AI (Gemini)
                  <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </button>
                <button 
                  className={`account-nav-item ${activeTab === 'rbac' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('rbac'); setMessage({ type: '', text: '' }); }}
                  style={navItemStyle(activeTab === 'rbac')}
                >
                  <Users size={18} /> จัดการสิทธิ์ (Admin)
                  <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </button>
                <button 
                  className={`account-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('logs'); setMessage({ type: '', text: '' }); }}
                  style={navItemStyle(activeTab === 'logs')}
                >
                  <Activity size={18} /> ตรวจสอบประวัติแก้ไข (Log)
                  <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </button>
              </>
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
        <div style={{ maxWidth: '1000px' }}>
          {activeTab === 'password' && (
            <div style={{ maxWidth: '600px' }}>
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

          {activeTab === 'gemini' && user?.role === 'admin' && (
            <div style={{ maxWidth: '600px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent-indigo)', marginBottom: '0.5rem' }}>
                ตั้งค่า AI (Gemini API Key)
              </h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                เพื่อให้ระบบสามารถทำรายงานภาษาอังกฤษได้ คุณต้องระบุ API Key ของ Gemini ครับ
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* System-wide Key (Admin only) */}
                {user?.role === 'admin' && (
                  <div style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid var(--accent-indigo-soft)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={18} className="text-indigo" /> ตั้งค่าส่วนกลาง (System-wide)
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Admin สามารถบันทึก Key ไว้เพื่อให้ทุกคนในแผนกใช้งานร่วมกันได้ทันทีโดยไม่ต้องกรอกเอง
                    </p>
                    <form onSubmit={handleSaveSystemKey}>
                      <div className="input-group">
                        <input 
                          type="password" 
                          value={systemGeminiKey} 
                          onChange={(e) => setSystemGeminiKey(e.target.value)} 
                          placeholder={isSystemKeyLoading ? "กำลังดึงข้อมูล..." : "กรอก API Key เพื่อใช้ทั้งระบบ..."}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
                        {loading ? 'กำลังบันทึก...' : 'บันทึกเข้าระบบส่วนกลาง (ทุกคนใช้งาน)'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Local Device Key */}
                <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={18} /> บันทึกเฉพาะเครื่องนี้ (Device-only)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    ใช้สำหรับกรณีที่ต้องการใช้ Key ส่วนตัวของคุณเอง หรือต้องการจำกัดการใช้งานแค่เบราว์เซอร์นี้
                  </p>
                  <form onSubmit={handleSaveLocalKey}>
                    <div className="input-group">
                      <input 
                        type="password" 
                        value={localGeminiKey} 
                        onChange={(e) => setLocalGeminiKey(e.target.value)} 
                        placeholder="กรอก API Key ส่วนตัวที่นี่..."
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-ghost" style={{ marginTop: '1rem', width: '100%', borderColor: 'var(--border-subtle)' }}>
                      บันทึกเฉพาะเครื่องนี้ (Local)
                    </button>
                  </form>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  ขอรับ API Key ฟรีได้ที่ <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-indigo)', textDecoration: 'underline' }}>Google AI Studio</a>
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
              </div>
            </div>
          )}

          {activeTab === 'rbac' && (
            <div style={{ maxWidth: '600px' }}>
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

          {activeTab === 'logs' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent-indigo)', margin: 0 }}>
                    ตรวจสอบประวัติแก้ไข (Log)
                  </h1>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>รายการการเปลี่ยนแปลงระบบย้อนหลัง</p>
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={fetchLogs} 
                  disabled={logsLoading}
                >
                  <RefreshCw size={16} className={logsLoading ? 'spin' : ''} style={{ marginRight: '8px' }} /> รีเฟรชข้อมูล
                </button>
              </div>

              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input 
                  type="text" 
                  placeholder="ค้นหาตามชื่อผู้ใช้, การกระทำ หรือชื่อฟอร์ม..."
                  className="search-input"
                  style={{ width: '100%', paddingLeft: '2.5rem', background: 'var(--bg-card)' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)' }}>
                      <th style={{ padding: '1rem' }}><Calendar size={14} /> วันที่/เวลา</th>
                      <th style={{ padding: '1rem' }}><UserIcon size={14} /> ผู้ใช้งาน</th>
                      <th style={{ padding: '1rem' }}>สิทธิ์</th>
                      <th style={{ padding: '1rem' }}><Activity size={14} /> การกระทำ</th>
                      <th style={{ padding: '1rem' }}>เป้าหมาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsLoading ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>กำลังโหลดข้อมูล...</td></tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>ไม่พบข้อมูลประวัติ</td></tr>
                    ) : filteredLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{log.user_name}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.7rem',
                            background: log.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                            color: log.role === 'admin' ? 'var(--accent-indigo)' : 'var(--text-muted)'
                          }}>
                            {log.role}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>{getActionLabel(log.action_type)}</td>
                        <td style={{ padding: '1rem' }}>{log.target_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
