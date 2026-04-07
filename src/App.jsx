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
  const [templates, setTemplates] = useState(templatesData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [showCAAT, setShowCAAT] = useState(false);
  
  const [thaiPreview, setThaiPreview] = useState('');
  const [extraPreview, setExtraPreview] = useState('');
  const isEditingPreview = useRef(false);

  const historyData = useHistory() || { history: [] };
  const history = historyData.history || [];
  const saveReport = historyData.saveReport;

  // Auth Handling
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  // Filter templates: Deep Search (Name, Trigger, AND Content)
  const filteredTemplates = useMemo(() => {
    if (!Array.isArray(templates)) return [];
    return templates.filter(t => 
      t.mode === reportMode && 
      (
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.trigger?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.content?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, templates, reportMode]);

  // Set default template when mode changes
  useEffect(() => {
    if (reportMode && templates.length > 0) {
      const first = templates.find(t => t.mode === reportMode);
      if (first) setSelectedTemplate(first);
    }
  }, [reportMode]);

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

  // Update Extra Preview
  useEffect(() => {
    let text = '';
    if (showCAAT) text += generateCAAT22(formData);
    setExtraPreview(text);
  }, [formData, showCAAT]);

  const handleInputChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    isEditingPreview.current = false;
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
        data: formData,
        userId: user?.id
      });
    }
    alert('คัดลอกรายงานไทยแล้ว');
  };

  const copyExtra = () => {
     if (!extraPreview) return;
     navigator.clipboard.writeText(extraPreview);
     alert('คัดลอกรายงานพิเศษแล้ว');
  };

  // Fixed Rename Logic: Sync with current selection
  const renameTemplate = (id, newName) => {
    setTemplates(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, name: newName } : t);
      // Ensure if we rename the active template, it updates the view
      if (selectedTemplate?.id === id) {
        setSelectedTemplate({ ...selectedTemplate, name: newName });
      }
      return updated;
    });
  };

  const filteredHistory = useMemo(() => {
    return Array.isArray(history) ? history.filter(item => (item.mode || 'incident') === reportMode) : [];
  }, [history, reportMode]);

  const loadFromHistory = (item) => {
    setReportMode(item.mode || 'incident');
    const template = templates.find(t => t.name === item.templateName) || templates.find(t => t.mode === (item.mode || 'incident'));
    setSelectedTemplate(template);
    setFormData(item.data);
    setThaiPreview(item.preview);
    isEditingPreview.current = true;
  };

  if (!user) return <Login onLogin={setUser} />;
  if (!reportMode) return <ModeSelector onSelect={setReportMode} />;

  return (
    <div className="app-container">
      {/* Sidebar - Localized */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="app-title" style={{ cursor: 'pointer' }} onClick={() => setReportMode(null)}>
            <span>✈️</span> {reportMode === 'incident' ? 'รายงานเหตุการณ์ไม่ปกติ' : 'รายงานผู้กระทำความผิด'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
             ผู้ใช้งาน: {user.email} | <span style={{ cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => setReportMode(null)}>สลับโหมด</span>
          </div>
        </div>
        
        <div className="search-box">
          <input 
            type="text" 
            className="search-input" 
            placeholder="ค้นหา (ชื่อแม่แบบ หรือ เนื้อหาในพรีวิว)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="template-list">
          {filteredTemplates.map(t => (
            <div 
              key={t.id} 
              className={`template-item ${selectedTemplate?.id === t.id ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="template-name" onClick={() => setSelectedTemplate(t)} style={{ flex: 1, cursor: 'pointer' }}>{t.name}</div>
                <button 
                  className="btn btn-ghost" 
                  style={{ padding: '0.2rem', fontSize: '0.7rem', marginLeft: '0.5rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const n = prompt('เปลี่ยนชื่อเรียกของฟอร์มนี้:', t.name);
                    if (n) renameTemplate(t.id, n);
                  }}
                >
                  ✎
                </button>
              </div>
              {t.trigger && <div className="template-trigger">คีย์หลัก: :{t.trigger}</div>}
            </div>
          ))}
        </div>

        <div className="history-section" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="history-title">ประวัติการรายงาน ({reportMode === 'incident' ? 'อุบัติการณ์' : 'ความผิด'})</div>
          {filteredHistory.map(item => (
            <div key={item.id} className="history-item" onClick={() => loadFromHistory(item)}>
              <div className="history-info">
                <span>{item.data.flight_no || item.data.violator_name || 'กำหนดเอง'}</span>
                <span className="history-date">{new Date(item.savedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">แก้ไขฟอร์ม: {selectedTemplate?.name || 'กรุณาเลือกแม่แบบ'}</h2>
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
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}

            {reportMode === 'incident' && (
              <div className="special-section">
                <label className="toggle-container">
                  <input type="checkbox" checked={showCAAT} onChange={(e) => setShowCAAT(e.target.checked)} />
                  <span className="toggle-label">ต้องการรายงาน กพท.22 (ภาษาอังกฤษ)</span>
                </label>
              </div>
            )}
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={copyThai} disabled={!selectedTemplate}>คัดลอกและบันทึก</button>
            <button className="btn btn-ghost" onClick={() => setFormData({})}>รีเซ็ตฟอร์ม</button>
          </div>
        </section>

        <section className="preview-container">
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header"><h2 className="card-title">พรีวิว - [แก้ไขเนื้อหาที่ต้องการในช่องนี้ได้]</h2></div>
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
                <h2 className="card-title">รายงานฉบับภาษาอังกฤษ (English)</h2>
                <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => navigator.clipboard.writeText(extraPreview)}>คัดลอกภาษาอังกฤษ</button>
              </div>
              <div className="preview-body-v2">
                <textarea className="preview-textarea" value={extraPreview} readOnly />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
