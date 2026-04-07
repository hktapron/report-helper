import React, { useState, useEffect, useMemo, useRef } from 'react';
import templatesData from './templates.json';
import { useHistory } from './hooks/useHistory';
import { generateCAAT22 } from './utils/translator';
import Login from './Login';
import ModeSelector from './components/ModeSelector';
import { supabase } from './supabaseClient';

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const App = () => {
  const [user, setUser] = useState(null);
  const [reportMode, setReportMode] = useState(null); // 'incident' or 'violator'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [showCAAT, setShowCAAT] = useState(false);
  
  // Mobile state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [thaiPreview, setThaiPreview] = useState('');
  const [extraPreview, setExtraPreview] = useState('');
  const isEditingPreview = useRef(false);

  // useHistory with custom user_id handling
  const historyData = useHistory(user?.username) || { history: [] };
  const history = historyData.history || [];
  const { saveReport, renameReport } = historyData;

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Set default template when mode changes
  useEffect(() => {
    if (reportMode && Array.isArray(templatesData)) {
      const first = templatesData.find(t => t.mode === reportMode);
      if (first) setSelectedTemplate(first);
    }
    setIsSidebarOpen(false); // Close sidebar on mode switch
  }, [reportMode]);

  // Close sidebar on template selection
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [selectedTemplate]);

  // Initialize form with defaults
  useEffect(() => {
    if (selectedTemplate && selectedTemplate.fields) {
      const defaults = {};
      selectedTemplate.fields.forEach(field => {
        if (field.default === 'today') {
          const date = new Date();
          if (field.type === 'date') {
            defaults[field.id] = date.toISOString().split('T')[0];
          } else {
            const d = date.getDate().toString().padStart(2, '0');
            const m = THAI_MONTHS_SHORT[date.getMonth()];
            const y = (date.getFullYear() + 543).toString().slice(-2);
            defaults[field.id] = `${d} ${m} ${y}`;
          }
        } else if (field.default) {
          defaults[field.id] = field.default;
        } else {
          defaults[field.id] = '';
        }
      });
      setFormData(defaults);
      isEditingPreview.current = false;
    }
  }, [selectedTemplate]);

  // Violator Date Logic
  useEffect(() => {
    if (reportMode === 'violator' && selectedTemplate?.id === 'violator_core' && formData.seizure_start) {
      const startDate = new Date(formData.seizure_start);
      const days = parseInt(formData.seizure_days || 0);

      if (!isNaN(startDate.getTime()) && days > 0) {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (days - 1));
        const seizure_end = `${endDate.getDate()} ${THAI_MONTHS_SHORT[endDate.getMonth()]} ${(endDate.getFullYear() + 543).toString().slice(-2)}`;

        const retDate = new Date(endDate);
        retDate.setDate(endDate.getDate() + 1);
        const retraining_date = `${retDate.getDate()} ${THAI_MONTHS_SHORT[retDate.getMonth()]} ${(retDate.getFullYear() + 543).toString().slice(-2)}`;
        const retraining_day = THAI_DAYS[retDate.getDay()];

        if (formData.seizure_end !== seizure_end || formData.retraining_day !== retraining_day) {
          setFormData(prev => ({ ...prev, seizure_end, retraining_date, retraining_day }));
        }
      }
    }
  }, [formData.seizure_start, formData.seizure_days, reportMode, selectedTemplate]);

  // Update Thai Preview
  useEffect(() => {
    if (!isEditingPreview.current && selectedTemplate) {
      let text = selectedTemplate.content || '';
      Object.entries(formData).forEach(([key, value]) => {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `[${key}]`);
      });
      
      if (text.includes('{date}')) {
        const dObj = reportMode === 'violator' ? new Date(formData.seizure_start || new Date()) : new Date();
        if (!isNaN(dObj.getTime())) {
          const d = dObj.getDate();
          const m = THAI_MONTHS_SHORT[dObj.getMonth()];
          const y = (dObj.getFullYear() + 543).toString().slice(-2);
          text = text.replace('{date}', `${d} ${m} ${y}`);
        }
      }
      setThaiPreview(text);
    }
  }, [formData, selectedTemplate, reportMode]);

  useEffect(() => {
    let text = '';
    if (showCAAT) text += generateCAAT22(formData);
    setExtraPreview(text);
  }, [formData, showCAAT]);

  const filteredTemplates = useMemo(() => {
    if (!Array.isArray(templatesData)) return [];
    return templatesData.filter(t => 
      t.mode === reportMode && 
      (
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.trigger?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.content?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, reportMode]);

  const filteredHistory = useMemo(() => {
    return Array.isArray(history) ? history.filter(item => (item.mode || 'incident') === reportMode) : [];
  }, [history, reportMode]);

  const handleInputChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    isEditingPreview.current = false;
  };

  const getSmartTitle = (item) => {
    if (item.customTitle) return item.customTitle;
    const text = item.preview || '';
    const segments = text.split(/[\. \nม]/).filter(s => s.trim().length > 5);
    if (segments.length > 0) {
      const title = segments[0].trim();
      return title.length > 30 ? title.substring(0, 30) + '...' : title;
    }
    return 'กำหนดเอง';
  };

  const copyThai = () => {
    if (!thaiPreview) return;
    navigator.clipboard.writeText(thaiPreview);
    if (saveReport) {
      saveReport({
        mode: reportMode,
        templateName: selectedTemplate?.name || 'กำหนดเอง',
        preview: thaiPreview,
        extraPreview: extraPreview,
        data: formData
      });
    }
    alert('คัดลอกรายงานไทยแล้ว');
  };

  const startRename = (e, item) => {
    e.stopPropagation();
    setRenamingId(item.id);
    setRenameValue(item.customTitle || getSmartTitle(item));
  };

  const submitRename = async (e) => {
    e.preventDefault();
    if (renameReport && renamingId) await renameReport(renamingId, renameValue);
    setRenamingId(null);
  };

  const handleLogout = () => {
    setUser(null);
    setReportMode(null);
  };

  if (!user) return <Login onLogin={setUser} />;
  if (!reportMode) return <ModeSelector onSelect={setReportMode} />;

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="app-title" style={{ fontSize: '1.1rem' }}>
          {reportMode === 'incident' ? 'รายงานเหตุการณ์ไม่ปกติ' : 'รายงานผู้กระทำความผิด'}
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="app-title" style={{ fontSize: '1.2rem' }}>
            {reportMode === 'incident' ? 'รายงานเหตุการณ์ไม่ปกติ' : 'รายงานผู้กระทำความผิด'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
             <span>ผู้ใช้งาน: <strong>{user.username}</strong></span>
             <span style={{ cursor: 'pointer', color: 'var(--accent-pink)', fontWeight: '600' }} onClick={handleLogout}>ออกจากระบบ</span>
          </div>
        </div>
        
        <div className="search-box">
          <input 
            type="text" 
            className="search-input" 
            placeholder="ค้นหาแม่แบบ/เนื้อหา..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="template-list">
          {filteredTemplates.map(t => (
            <div 
              key={t.id} 
              className={`template-item ${selectedTemplate?.id === t.id ? 'active' : ''}`}
              onClick={() => setSelectedTemplate(t)}
            >
              <div className="template-name">{t.name}</div>
              {t.trigger && <div className="template-trigger">Keyword: :{t.trigger}</div>}
            </div>
          ))}
        </div>

        <div className="history-section" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="history-title">ประวัติ</div>
          {filteredHistory.map(item => (
            <div key={item.id} className="history-item" onClick={() => {
              setReportMode(item.mode || 'incident');
              const t = templatesData.find(x => x.name === item.templateName);
              setSelectedTemplate(t || templatesData.find(x => x.mode === (item.mode || 'incident')));
              setFormData(item.data);
              setThaiPreview(item.preview);
              isEditingPreview.current = true;
            }}>
              <div className="history-info">
                {renamingId === item.id ? (
                  <form onSubmit={submitRename} style={{ flex: 1, display: 'flex' }}>
                    <input 
                      autoFocus
                      className="search-input" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                      value={renameValue} 
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => setRenamingId(null)}
                    />
                  </form>
                ) : (
                  <>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSmartTitle(item)}</span>
                    <span style={{ cursor: 'pointer', opacity: 0.5, marginLeft: '0.5rem' }} onClick={(e) => startRename(e, item)}>✎</span>
                    <span className="history-date" style={{ marginLeft: '0.5rem' }}>
                      {new Date(item.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mode-switcher">
           <button className="btn btn-ghost btn-full" style={{ fontSize: '0.85rem', borderColor: 'var(--accent-blue)' }} onClick={() => setReportMode(reportMode === 'incident' ? 'violator' : 'incident')}>
              สลับไปที่: {reportMode === 'incident' ? 'รายงานผู้กระทำความผิด' : 'รายงานเหตุการณ์ไม่ปกติ'}
           </button>
        </div>
      </aside>

      <main className="main-content">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">แก้ไขฟอร์ม: {selectedTemplate?.name || 'เลือกแม่แบบ'}</h2>
          </div>
          <div className="form-body">
            {selectedTemplate?.fields?.map(field => (
              <div key={field.id} className={`form-field ${field.type === 'textarea' ? 'full' : ''}`}>
                <label>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea rows={3} value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} />
                ) : (
                  <input 
                    type={field.type} 
                    value={formData[field.id] || ''} 
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    readOnly={field.readOnly}
                  />
                )}
              </div>
            ))}

            {reportMode === 'incident' && (
              <div className="special-section" style={{ gridColumn: '1 / -1' }}>
                <label className="toggle-container">
                  <input type="checkbox" checked={showCAAT} onChange={(e) => setShowCAAT(e.target.checked)} />
                  <span className="toggle-label">ต้องการรายงาน กพท.22 (ภาษาอังกฤษ)</span>
                </label>
              </div>
            )}
          </div>
          <div className="actions" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={copyThai} disabled={!selectedTemplate}>คัดลอกและบันทึก</button>
            <button className="btn btn-ghost" onClick={() => setFormData({})}>รีเซ็ต</button>
          </div>
        </section>

        <section className="preview-container">
          <div className="card" style={{ flex: 1.2 }}>
            <div className="card-header"><h2 className="card-title">Preview (Thai)</h2></div>
            <div className="preview-body-v2">
              <textarea 
                className="preview-textarea" 
                value={thaiPreview} 
                onChange={(e) => { setThaiPreview(e.target.value); isEditingPreview.current = true; }} 
              />
            </div>
          </div>

          {(extraPreview && reportMode === 'incident') && (
            <div className="card" style={{ flex: 0.8 }}>
              <div className="card-header">
                <h2 className="card-title">CAAT-22 Report</h2>
                <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => navigator.clipboard.writeText(extraPreview)}>Copy</button>
              </div>
              <div className="preview-body-v2">
                <textarea className="preview-textarea" value={extraPreview} readOnly style={{ color: 'var(--accent-blue)', fontSize: '0.9rem' }} />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
