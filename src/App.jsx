import React, { useState, useEffect, useMemo, useRef } from 'react';
import templatesData from './templates.json';
import { useHistory } from './hooks/useHistory';
import { generateCAAT22 } from './utils/translator';
import Login from './Login';
import ModeSelector from './components/ModeSelector';
import { supabase } from './supabaseClient';
import { useUserTemplates } from './hooks/useUserTemplates';
import { Trash2, Pin, Save, Plus } from 'lucide-react';

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
  const hasMore = historyData?.hasMore;
  const loadingHistory = historyData?.loading;
  const loadMore = historyData?.loadMore;

  // Custom Templates Hook
  const { templates: customTemplates, saveTemplate, deleteTemplate } = useUserTemplates(user?.username, reportMode);

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
    return history
      .filter(item => {
        const modeMatch = (item.mode || 'incident') === reportMode;
        if (!modeMatch) return false;
        if (!term) return true;
        
        const contentMatch = (item.preview || '').toLowerCase().includes(term);
        const titleMatch = (item.customTitle || '').toLowerCase().includes(term);
        const flightMatch = (item.data?.flight_no || '').toLowerCase().includes(term);
        return contentMatch || titleMatch || flightMatch;
      })
      .sort((a, b) => {
        // Sort by Pinned First, then by Date
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.savedAt) - new Date(a.savedAt);
      });
  }, [history, reportMode, searchTerm]);

  // Note: pinnedHistory and normalHistory are no longer needed as separate constants 
  // because we sort them together in filteredHistory as requested.

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

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'เมื่อครู่นี้';
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHr < 24) return `${diffHr} ชม. ที่แล้ว`;
    if (diffDay === 1) return 'เมื่อวานนี้';
    if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
    return date.toLocaleDateString('en-GB');
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

  const handleSaveAsTemplate = async () => {
    const name = window.prompt("กรุณาตั้งชื่อฟอร์มนี้ (เช่น: เครื่องบินขัดข้อง, ล้อยางแตก):");
    if (name && saveTemplate) {
      const { error } = await saveTemplate(name, formData, thaiPreview, extraPreview);
      if (!error) {
        alert("บันทึกฟอร์มเรียบร้อยแล้ว");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + (error.message || "โปรดตรวจสอบ SQL Migration"));
        console.error("Save template error:", error);
      }
    }
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
    <div className="app-container" style={{ flexDirection: 'column' }}>
      {/* Unified Enterprise Header */}
      <header className="enterprise-header" style={{ 
        height: '64px', 
        borderBottom: '1px solid var(--border-subtle)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        position: 'relative',
        zIndex: 20
      }}>
        {/* Left Side: Logo & Workspace Title */}
        <div style={{ position: 'absolute', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '8px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px' }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em' }}>VTSP Report Helper</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>ฝ่ายปฏิบัติการเขตการบิน</span>
          </div>
        </div>

        {/* Center: Mode Indicator */}
        <div className="report-mode-badge" style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)', 
          padding: '4px 12px', 
          borderRadius: '99px',
          fontSize: '0.85rem',
          fontWeight: '700',
          color: 'var(--accent-indigo)'
        }}>
          {reportMode === 'incident' ? '🚨 รายงานเหตุการณ์ไม่ปกติ' : '⚖️ รายงานผู้กระทำความผิด'}
        </div>

        {/* Right Side: User Controls */}
        <div style={{ position: 'absolute', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>{user.username}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => {setUser(null); setReportMode(null);}}>Sign Out</div>
          </div>
        </div>
      </header>

      {/* Main 3-Column Workspace */}
      <div className="workspace-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: '280px 1fr 1fr', 
        height: 'calc(100vh - 64px)',
        overflow: 'hidden'
      }}>
        
        {/* Column 1: Navigator (Templates & History) */}
        <aside className="sidebar" style={{ height: 'auto', borderRight: '1px solid var(--border-subtle)' }}>
          <div className="search-box">
             <input 
              type="text" 
              className="search-input" 
              placeholder="ค้นหาแม่แบบ/ประวัติ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sidebar-content" style={{ flex: 1, overflowY: 'auto' }}>
            {/* Template Action */}
            <div style={{ padding: '0 1rem 0.5rem' }}>
              <button 
                className="btn btn-primary btn-full" 
                style={{ justifyContent: 'center', gap: '0.5rem', display: 'flex', alignItems: 'center' }}
                onClick={() => setFormData({})}
              >
                <Plus size={16} /> สร้างรายงานใหม่
              </button>
            </div>

            {/* Custom Templates (Template Manager) */}
            <div className="template-list">
              <div className="section-title" style={{ padding: '1rem 0.5rem 0.5rem', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                แม่แบบฟอร์มของฉัน
              </div>
              {customTemplates && customTemplates.map(ct => (
                <div 
                  key={ct.id} 
                  className="template-item" 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => {
                    setFormData(ct.data || {});
                    setThaiPreview(ct.preview || '');
                    setExtraPreview(ct.extra_preview || '');
                    isEditingPreview.current = true;
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={14} style={{ color: 'var(--accent-indigo)' }} />
                    <div className="template-name">{ct.name}</div>
                  </div>
                  <Trash2 
                    size={14} 
                    className="delete-icon"
                    style={{ cursor: 'pointer', opacity: 0.4 }} 
                    onClick={(e) => { e.stopPropagation(); if(window.confirm("ลบฟอร์มนี้?")) deleteTemplate(ct.id); }}
                  />
                </div>
              ))}
              {(!customTemplates || customTemplates.length === 0) && (
                <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>ยังไม่มีแม่แบบฟอร์ม</div>
              )}
            </div>

            {/* History List (Pinned Items first) */}
            <div className="history-list" style={{ padding: '1rem 0.5rem' }}>
              <div className="section-title" style={{ padding: '0.5rem', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>ประวัติรายการ</span>
                <span style={{ cursor: 'pointer' }} onClick={exportToCSV}>CSV</span>
              </div>
              {filteredHistory.map(item => (
                <div key={item.id} className={`history-item ${formData.id === item.id ? 'active' : ''}`} onClick={() => {
                  setReportMode(item.mode || 'incident');
                  const t = templatesData.find(x => x.name === item.templateName);
                  setSelectedTemplate(t || templatesData.find(x => x.mode === (item.mode || 'incident')));
                  setFormData({ ...item.data, id: item.id });
                  setThaiPreview(item.preview || '');
                  isEditingPreview.current = true;
                }}>
                  <div className="history-info">
                     {renamingId === item.id ? (
                      <form onSubmit={submitRename} style={{ flex: 1, display: 'flex' }}>
                        <input autoFocus className="search-input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={() => setRenamingId(null)} />
                      </form>
                    ) : (
                      <>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSmartTitle(item)}</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <span 
                            style={{ cursor: 'pointer', color: item.isPinned ? 'var(--accent-gold)' : 'var(--text-muted)' }} 
                            onClick={(e) => { e.stopPropagation(); togglePin && togglePin(item.id, item.isPinned); }}
                          >
                            <Pin size={14} fill={item.isPinned ? "var(--accent-gold)" : "none"} />
                          </span>
                          <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={(e) => handleDelete(e, item.id)}><Trash2 size={14} /></span>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>{formatRelativeTime(item.savedAt)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
             <button className="btn btn-ghost btn-full" style={{ fontSize: '0.75rem' }} onClick={() => setReportMode(reportMode === 'incident' ? 'violator' : 'incident')}>
                สลับเป็น: {reportMode === 'incident' ? 'รายงานผู้กระทำความผิด' : 'รายงานเหตุการณ์ไม่ปกติ'}
             </button>
          </div>
        </aside>

        {/* Column 2: Editor (Form) */}
        <section className="editor-column" style={{ overflowY: 'auto', padding: '1.5rem', background: '#0d0d10' }}>
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header">
              <h2 className="card-title">{selectedTemplate?.name || 'กรุณาเลือกแม่แบบ'}</h2>
              <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => setFormData({})}>ล้างข้อมูล</button>
            </div>
            <div className="form-body">
              {selectedTemplate?.fields?.map(field => (
                <div key={field.id} className={`form-field ${field.type === 'textarea' ? 'full' : ''}`}>
                  <label>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea rows={4} value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} />
                  ) : (
                    <input type={field.type} value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} readOnly={field.readOnly} />
                  )}
                </div>
              ))}

              {reportMode === 'incident' && (
                <div className="special-section" style={{ gridColumn: '1 / -1' }}>
                  <label className="toggle-container">
                    <input type="checkbox" checked={showCAAT} onChange={(e) => setShowCAAT(e.target.checked)} />
                    <span className="toggle-label">แสดงรายงาน กพท.22 (ภาษาอังกฤษ)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Column 3: Previews */}
        <section className="preview-column" style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-dark)' }}>
           {/* Thai Preview */}
           <div className="card" style={{ flex: 'none', minHeight: '400px' }}>
              <div className="card-header">
                <h2 className="card-title">Preview (Thai)</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost" onClick={handleSaveAsTemplate} title="บันทึกเป็นแม่แบบฟอร์ม">💾 บันทึกแม่แบบ</button>
                  <button className="btn btn-primary" onClick={copyThai}>บันทึกประวัติ</button>
                </div>
              </div>
              <div style={{ flex: 1, padding: '1.5rem', display: 'flex' }}>
                <textarea 
                  className="sarabun-preview" 
                  value={thaiPreview} 
                  onChange={(e) => { setThaiPreview(e.target.value); isEditingPreview.current = true; }}
                  style={{ flex: 1, background: 'transparent', border: 'none', resize: 'none', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
           </div>

           {/* CAAT-22 Preview (Conditional) */}
           {(extraPreview && reportMode === 'incident') && (
             <div className="card" style={{ flex: 'none', minHeight: '300px' }}>
                <div className="card-header">
                  <h2 className="card-title">CAAT-22 (ENG)</h2>
                  <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => navigator.clipboard.writeText(extraPreview)}>คัดลอก</button>
                </div>
                <div style={{ flex: 1, padding: '1.5rem', display: 'flex' }}>
                  <textarea 
                    className="sarabun-preview" 
                    value={extraPreview} 
                    readOnly 
                    style={{ flex: 1, background: 'transparent', border: 'none', resize: 'none', color: 'var(--accent-indigo)', outline: 'none' }}
                  />
                </div>
             </div>
           )}
        </section>

      </div>
    </div>
  );
};

export default App;
