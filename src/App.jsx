import React, { useState, useEffect, useMemo, useRef } from 'react';
import templatesData from './templates.json';
import { useHistory } from './hooks/useHistory';
import { translateToCAAT22 } from './utils/translator';
import Login from './Login';
import ModeSelector from './components/ModeSelector';
import { supabase } from './supabaseClient';
import { useUserTemplates } from './hooks/useUserTemplates';
import { 
  Trash2, Pin, Save, Plus, Edit2, Check, Sparkles, Loader2, 
  Search, Calendar, Clock, ChevronRight, User, Terminal, 
  ArrowRight, History 
} from 'lucide-react';

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

  const [isTranslating, setIsTranslating] = useState(false);

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

  const { templates: customTemplates, saveTemplate, deleteTemplate, updateTemplateName } = useUserTemplates(user?.username, reportMode);

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const [renamingTemplateId, setRenamingTemplateId] = useState(null);
  const [newTemplateName, setNewTemplateName] = useState('');

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

  // --- Smart Form (Auto-map) Substitution Engine ---
  useEffect(() => {
    if (selectedTemplate && reportMode && !isEditingPreview.current) {
      // 1. Source the base text from the original template narrative structure
      // we use template data to ensure we are always replacing fresh brackets.
      let text = selectedTemplate?.data?.narrative || selectedTemplate?.content || '';
      
      const now = new Date();
      const d = now.getDate();
      const m = THAI_MONTHS_SHORT[now.getMonth()];
      const y = (now.getFullYear() + 543).toString().slice(-2);
      const vtspDate = `${d} ${m} ${y}`;
      
      // Replace {date} and [date]
      text = text.replace(/\{date\}|\[date\]/g, vtspDate);

      // 2. Comprehensive Variable Mapping (The "10+ Keys")
      const mapping = {
        incident_time: formData.incident_time || '[incident_time]',
        airline: formData.airline || '[airline]',
        flight_no: formData.flight_no || '[flight_no]',
        registration: formData.registration || '[registration]',
        ac_type: formData.ac_type || '[ac_type]',
        route: formData.route || '[route]',
        std_sta: formData.std_sta || '[std_sta]',
        ata: formData.ata || formData.atd || '[ata]',
        stand_no: formData.stand_no || formData.return_stand || '[stand_no]'
      };

      // 3. Perform dynamic replacement for both {key} and [key] formats
      Object.entries(mapping).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}|\\[${key}\\]`, 'g');
        const cleanValue = value ? value.toString() : `[${key}]`;
        text = text.replace(regex, cleanValue);
      });

      // 4. Fallback for any other custom fields defined in custom templates
      Object.entries(formData).forEach(([key, value]) => {
        if (!mapping[key] && key !== 'narrative' && key !== 'update_text') {
          const regex = new RegExp(`\\{${key}\\}|\\[${key}\\]`, 'g');
          if (value) text = text.replace(regex, value);
        }
      });

      setThaiPreview(text);
    }
  }, [formData, selectedTemplate, reportMode]);

  const handleTranslate = async () => {
    if (!thaiPreview) return;
    setIsTranslating(true);
    try {
      const result = await translateToCAAT22(thaiPreview, formData);
      setExtraPreview(result);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsTranslating(false);
    }
  };

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
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.saved_at || b.savedAt) - new Date(a.saved_at || a.savedAt);
      });
  }, [history, reportMode, searchTerm]);

  const pinnedHistory = filteredHistory.filter(h => h.is_pinned || h.isPinned);
  const normalHistory = filteredHistory.filter(h => !h.is_pinned && !h.isPinned);

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
    <div className="app-container">
      <div className="mobile-header">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="app-title" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          {reportMode === 'incident' ? 'Incident Report' : 'Violator Report'}
        </div>
      </div>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ padding: '1.5rem 1rem' }}>
          <div className="app-title" style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-indigo)', letterSpacing: '-0.02em' }}>
            VTSP
          </div>
          <div className="app-title" style={{ fontSize: '1.1rem', fontWeight: '600', opacity: 0.8 }}>
            Report Helper
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
             User: <strong>{user.username}</strong> | <span style={{ cursor: 'pointer', color: 'var(--accent-red)' }} onClick={() => {setUser(null); setReportMode(null);}}>Logout</span>
          </div>
        </div>
        
        <div className="search-box">
          <input 
            type="text" 
            className="search-input" 
            placeholder="ค้นหา..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* TOP SECTION: Actions & Custom Forms */}
        <div style={{ padding: '0 1rem' }}>
          <button 
            className="btn btn-primary btn-full" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => {
              const first = templatesData.find(t => t.mode === reportMode);
              setSelectedTemplate(first);
              setFormData({});
              isEditingPreview.current = false;
            }}
          >
            <Plus size={16} /> สร้างรายงานใหม่
          </button>

          {customTemplates && customTemplates.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div className="history-title" style={{ color: 'var(--accent-indigo)', opacity: 0.8, fontSize: '0.7rem' }}>แม่แบบฟอร์มของฉัน</div>
              {customTemplates.map(ct => (
                <div 
                  key={ct.id} 
                  className="template-item" 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', borderLeft: '2px solid var(--accent-indigo-soft)' }}
                  onClick={() => {
                    if (renamingTemplateId === ct.id) return;
                    setFormData(ct.data || {});
                    setThaiPreview(ct.preview || '');
                    setExtraPreview(ct.extra_preview || '');
                    isEditingPreview.current = true;
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1 }}>
                    <Save size={12} style={{ opacity: 0.6 }} />
                    {renamingTemplateId === ct.id ? (
                      <input 
                        className="search-input"
                        style={{ padding: '2px 4px', fontSize: '0.75rem', height: 'auto', margin: 0 }}
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateTemplateName(ct.id, newTemplateName);
                            setRenamingTemplateId(null);
                          }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="template-name" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{ct.name}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {renamingTemplateId === ct.id ? (
                      <Check 
                        size={12} 
                        style={{ cursor: 'pointer', color: 'var(--accent-indigo)' }} 
                        onClick={(e) => { e.stopPropagation(); updateTemplateName(ct.id, newTemplateName); setRenamingTemplateId(null); }}
                      />
                    ) : (
                      <Edit2 
                        size={12} 
                        style={{ cursor: 'pointer', opacity: 0.3 }} 
                        onClick={(e) => { e.stopPropagation(); setRenamingTemplateId(ct.id); setNewTemplateName(ct.name); }}
                      />
                    )}
                    <Trash2 
                      size={12} 
                      className="delete-icon"
                      style={{ cursor: 'pointer', opacity: 0.3 }} 
                      onClick={(e) => { e.stopPropagation(); if(window.confirm("ลบฟอร์มนี้?")) deleteTemplate(ct.id); }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '1rem 0.5rem' }} />

        {/* BOTTOM SECTION: History with Strict Pinning */}
        <div className="history-section" style={{ border: 'none', paddingTop: 0, flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
          <div className="history-title">ประวัติรายการ</div>
          
          {pinnedHistory.map(item => (
            <div key={item.id} className="history-item" style={{ borderLeft: '2px solid var(--accent-indigo)' }} onClick={() => {
              setReportMode(item.mode || 'incident');
              setFormData(item.data || {});
              setThaiPreview(item.preview || '');
              isEditingPreview.current = true;
            }}>
              <div className="history-info">
                 <span style={{ flex: 1 }}>{getSmartTitle(item)}</span>
                 <Pin size={14} fill="var(--accent-indigo)" style={{ opacity: 0.8 }} onClick={(e) => { e.stopPropagation(); togglePin(item.id, true); }} />
              </div>
            </div>
          ))}
          
          {normalHistory.map(item => (
            <div key={item.id} className="history-item" onClick={() => {
              setReportMode(item.mode || 'incident');
              setFormData(item.data || {});
              setThaiPreview(item.preview || '');
              isEditingPreview.current = true;
            }}>
              <div className="history-info">
                <span style={{ flex: 1 }}>{getSmartTitle(item)}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Pin size={14} style={{ opacity: 0.4 }} onClick={(e) => { e.stopPropagation(); togglePin(item.id, false); }} />
                  <Trash2 size={14} style={{ opacity: 0.4, color: 'var(--accent-red)' }} onClick={(e) => handleDelete(e, item.id)} />
                </div>
              </div>
              <div className="history-date">{formatRelativeTime(item.saved_at || item.savedAt)}</div>
            </div>
          ))}

          {hasMore && (
            <button className="btn btn-ghost btn-full" style={{ fontSize: '0.75rem' }} onClick={loadMore}>
              โหลดเพิ่ม...
            </button>
          )}
        </div>

        <div className="mode-switcher" style={{ marginTop: 'auto', padding: '1rem' }}>
           <button className="btn btn-ghost btn-full" onClick={() => setReportMode(reportMode === 'incident' ? 'violator' : 'incident')}>
              สลับเป็น: {reportMode === 'incident' ? 'ผู้กระทำความผิด' : 'รายงานเหตุการณ์'}
           </button>
        </div>
      </aside>

      <main className="main-content">
        <section style={{ flex: '0 0 55%' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{selectedTemplate?.name || 'กรุณาเลือกแม่แบบ'}</h2>
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setFormData({})}>รีเซ็ต</button>
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
                <div className="special-section" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="toggle-container">
                    <input type="checkbox" checked={showCAAT} onChange={(e) => setShowCAAT(e.target.checked)} />
                    <span className="toggle-label">Thai CAAT-22 Report (English)</span>
                  </label>
                  {showCAAT && (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.5rem' }} 
                      onClick={handleTranslate}
                      disabled={isTranslating || !thaiPreview}
                    >
                      {isTranslating ? <Loader2 size={14} className="animate-spin" /> : null}
                      {isTranslating ? 'กำลังแปลภาษา...' : 'ยืนยันแปลภาษา'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="preview-container" style={{ flex: '0 0 45%' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Preview</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={handleSaveAsTemplate}>บันทึกฟอร์ม</button>
                <button className="btn btn-primary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={copyThai}>คัดลอกและบันทึก</button>
              </div>
            </div>
            <div className="preview-body-v2">
              <textarea 
                className="preview-textarea" 
                value={thaiPreview} 
                onChange={(e) => { setThaiPreview(e.target.value); isEditingPreview.current = true; }} 
              />
            </div>
            {showCAAT && reportMode === 'incident' && (
              <div className="preview-body-v2" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--accent-indigo-soft)', minHeight: '100px' }}>
                <textarea 
                  className="preview-textarea" 
                  value={extraPreview} 
                  readOnly 
                  style={{ color: 'var(--accent-indigo)' }} 
                  placeholder={isTranslating ? "กำลังประมวลผลการแปลโดย AI..." : "กดปุ่ม 'แปลภาษาด้วย AI' เพื่อสร้างรายงานภาษาอังกฤษ"}
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
