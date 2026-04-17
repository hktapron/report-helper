import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Search, Calendar, User, Activity } from 'lucide-react';

const UsageLogView = ({ onBack }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error) setLogs(data);
    setLoading(false);
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
    };
    return map[action] || action;
  };

  return (
    <div className="logs-view-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={20} /> ย้อนกลับ
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-indigo)' }}>ตรวจสอบประวัติการใช้งาน (Activity Logs)</h1>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="text" 
              placeholder="ค้นหาตามชื่อผู้ใช้, การกระทำ หรือชื่อฟอร์ม..."
              className="search-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={fetchLogs}>รีเฟรชข้อมูล</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}><Calendar size={14} /> วันที่/เวลา</th>
                <th style={{ padding: '1rem' }}><User size={14} /> ผู้ใช้งาน</th>
                <th style={{ padding: '1rem' }}>สิทธิ์</th>
                <th style={{ padding: '1rem' }}><Activity size={14} /> การกระทำ</th>
                <th style={{ padding: '1rem' }}>เป้าหมาย (ชื่อฟอร์ม/หัวข้อ)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
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
    </div>
  );
};

export default UsageLogView;
