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
  const [reportMode, setReportMode] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [showCAAT, setShowCAAT] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [thaiPreview, setThaiPreview] = useState('');
  const [extraPreview, setExtraPreview] = useState('');
  const isEditingPreview = useRef(false);

  // useHistory with robust fallback
  const historyData = useHistory(user?.username);
  const history = historyData?.history || [];
  const saveReport = historyData?.saveReport;
  const renameReport = historyData?.renameReport;
  const deleteReport = historyData?.deleteReport;
  const togglePin = historyData?.togglePin;

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Sync default template
  useEffect(() => {
    if (reportMode && Array.isArray(templatesData)) {
      const first = templatesData.find(t => t.mode === reportMode);
      if (first) setSelectedTemplate(first);
    }
    setIsSidebarOpen(false);
  }, [reportMode]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [selectedTemplate]);

  // Form initialization
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

  // Preview Logic
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

  // Memoized lists
  const filteredTemplates = useMemo(() => {
    if (!Array.isArray(templatesData)) return [];
    const term = (searchTerm || '').toLowerCase();
    return templatesData.filter(t => 
      t.mode === reportMode && 
      (t.id === 'new_report' || t.id === 'violator_core') &&
      (t.name.toLowerCase().includes(term) || (t.content || '').toLowerCase().includes(term))
    );
  }, [searchTerm, reportMode]);

  const filteredHistory = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return history.filter(item => {
      const modeMatch = (item.mode || 'incident') === reportMode;
      if (!modeMatch) return false;
      if (!term) return true;
      
      const contentMatch = (item.preview || '').toLowerCase().includes(term);
      const titleMatch = (item.customTitle || '').toLowerCase().includes(term);
      const flightMatch = (item.data?.flight_no || '').toLowerCase().includes(term);
      return contentMatch || titleMatch || flightMatch;
    });
  }, [history, reportMode, searchTerm]);

  const pinnedHistory = filteredHistory.filter(h => h.isPinned);
  const normalHistory = filteredHistory.filter(h => !h.isPinned);

  const handleInputChange = (id, value) => {
    setFormData(prev => {
      const newData = { ...prev, [id]: value };
      
      // Smart Guessing (Pattern detection in Narrative)
      if (id === 'narrative' || id === 'update_text') {
        // Detect Time (HH:mm or HH.mm)
        const timeMatch = value.match(/([01]?[0-9]|2[0-3])[:.][0-5][0-9]/);
        if (timeMatch && !newData.incident_time) {
          newData.incident_time = timeMatch[0].replace('.', ':');
        }

        // Detect Flight No (Airline Prefix + 3-4 Digits)
        const flightMatch = value.match(/[A-Z]{2,3}\s?[0-9]{3,4}/i);
        if (flightMatch && !newData.flight_no) {
          newData.flight_no = flightMatch[0].toUpperCase().replace(/\s/g, '');
        }
      }

      return newData;
    });
    
    // Resume dynamic linking even for history items once user starts editing
    isEditingPreview.current = false;
  };

  const getSmartTitle = (item) => {
    if (!item) return 'ไม่มีชื่อ';
    if (item.customTitle) return item.customTitle;
    const text = item.preview || '';
    const segments = text.split(/[\. \nม]/).filter(s => s && s.trim().length > 5);
    if (segments.length > 0) {
      const title = segments[0].trim();
      return title.length > 30 ? title.substring(0, 30) + '...' : title;
    }
    return 'รายงานใหม่';
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

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // prevent activating the item
    if (window.confirm("คุณต้องการลบประวัตินี้ใช่หรือไม่? (ไม่สามารถกู้คืนได้)")) {
      if (deleteReport) await deleteReport(id);
      if (formData.id === id) setFormData({}); // clear form if deleting active element
    }
  };

  const exportToCSV = () => {
    if (!filteredHistory.length) {
      alert("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    const headers = ["Date", "Time", "Flight No", "Stand", "Thai Narrative", "English Narrative"];
    const rows = filteredHistory.map(item => [
      new Date(item.created_at).toLocaleDateString("en-GB"),
      item.data?.incident_time || "",
      item.data?.flight_no || "",
      item.data?.stand_no || item.data?.return_stand || "",
      `"${(item.preview || "").replace(/"/g, '""')}"`,
      `"${(item.extraPreview || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `VTSP_Reports_${reportMode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return <Login onLogin={setUser} />;
  if (!reportMode) return <ModeSelector onSelect={setReportMode} />;

  return (
    <div className="app-container">
      <div className="mobile-header">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="app-title" style={{ fontSize: '1.1rem' }}>
          {reportMode === 'incident' ? 'รายงานเหตุการณ์ไม่ปกติ' : 'รายงานผู้กระทำความผิด'}
        </div>
      </div>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="app-title" style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--accent-blue)' }}>
            VTSP Report Helper
          </div>
          <div className="app-title" style={{ fontSize: '1.25rem', opacity: 0.9 }}>
            {reportMode === 'incident' ? 'รายงานเหตุการณ์ไม่ปกติ' : 'รายงานผู้กระทำความผิด'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
             <span>ผู้ใช้งาน: <strong>{user.username}</strong></span>
             <span style={{ cursor: 'pointer', color: 'var(--accent-pink)', fontWeight: '600' }} onClick={() => {setUser(null); setReportMode(null);}}>ออกจากระบบ</span>
          </div>
        </div>
        
        <div className="search-box">
          <input 
            type="text" 
            className="search-input" 
            placeholder="ค้นหาแม่แบบ/ประวัติ..." 
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
              {t.trigger && <div className="template-trigger">เริ่มใหม่</div>}
            </div>
          ))}

          {pinnedHistory.length > 0 && (
            <>
              <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 'bold' }}>📌 รายการปักหมุด</div>
              {pinnedHistory.map(item => (
                <div key={item.id} className={`template-item ${formData.id === item.id ? 'active' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => {
                  setReportMode(item.mode || 'incident');
                  const t = templatesData.find(x => x.name === item.templateName);
                  setSelectedTemplate(t || templatesData.find(x => x.mode === (item.mode || 'incident')));
                  setFormData({ ...item.data, id: item.id });
                  setThaiPreview(item.preview || '');
                  isEditingPreview.current = false; // Allow re-linking
                }}>
                  <div className="template-name" style={{ flex: 1 }}>{getSmartTitle(item)}</div>
                  <div 
                    title="เลิกปักหมุด"
                    style={{ cursor: 'pointer', zIndex: 10, padding: '0.2rem 0.5rem', marginLeft: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '4px', fontSize: '0.9rem' }} 
                    onClick={(e) => { e.stopPropagation(); togglePin && togglePin(item.id, item.isPinned); }}
                  >📌</div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="history-section" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div className="history-title" style={{ padding: 0 }}>ประวัติ</div>
            <button className="btn btn-ghost" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', borderColor: 'rgba(56, 189, 248, 0.3)' }} onClick={exportToCSV}>
              📥 Export CSV
            </button>
          </div>
          {normalHistory.map(item => (
            <div key={item.id} className="history-item" onClick={() => {
              setReportMode(item.mode || 'incident');
              const t = templatesData.find(x => x.name === item.templateName);
              setSelectedTemplate(t || templatesData.find(x => x.mode === (item.mode || 'incident')));
              setFormData(item.data || {});
              setThaiPreview(item.preview || '');
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
                    <span style={{ cursor: 'pointer', opacity: 0.5, marginLeft: '0.5rem', fontSize: '1.1rem' }} onClick={(e) => { e.stopPropagation(); togglePin && togglePin(item.id, item.isPinned); }} title="ปักหมุด">📍</span>
                    <span style={{ cursor: 'pointer', opacity: 0.5, marginLeft: '0.5rem', fontSize: '1.1rem' }} onClick={(e) => startRename(e, item)} title="เปลี่ยนชื่อ">✎</span>
                    <span style={{ cursor: 'pointer', opacity: 0.5, marginLeft: '0.5rem', fontSize: '1.1rem', color: 'var(--accent-pink)' }} onClick={(e) => handleDelete(e, item.id)} title="ลบประวัติ">🗑️</span>
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
            <h2 className="card-title">{selectedTemplate?.name || 'กรุณาเลือกแม่แบบ'}</h2>
            {selectedTemplate && (
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setFormData({})}>รีเซ็ต</button>
            )}
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
        </section>

        <section className="preview-container">
          <div className="card" style={{ flex: 1.2 }}>
            <div className="card-header">
              <h2 className="card-title">Preview (Thai)</h2>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={copyThai} disabled={!selectedTemplate}>คัดลอกและบันทึก</button>
            </div>
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
                <h2 className="card-title">CAAT-22 (ENG)</h2>
                <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => navigator.clipboard.writeText(extraPreview)}>คัดลอก</button>
              </div>
              <div className="preview-body-v2">
                <textarea className="preview-textarea" value={extraPreview} readOnly style={{ color: 'var(--accent-blue)' }} />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
