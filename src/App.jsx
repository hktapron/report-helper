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
  Folder, FolderPlus, MoreVertical, ChevronDown, FileText, ArrowRight, Languages
} from 'lucide-react';

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vtsp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [reportMode, setReportMode] = useState(() => localStorage.getItem('vtsp_report_mode')); 

  useEffect(() => {
    if (user) localStorage.setItem('vtsp_user', JSON.stringify(user));
    else localStorage.removeItem('vtsp_user');
  }, [user]);

  useEffect(() => {
    if (reportMode) localStorage.setItem('vtsp_report_mode', reportMode);
    else localStorage.removeItem('vtsp_report_mode');
  }, [reportMode]);

  const handleLogout = () => {
    setUser(null);
    setReportMode(null);
    localStorage.removeItem('vtsp_user');
    localStorage.removeItem('vtsp_report_mode');
    window.location.reload();
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [showCAAT, setShowCAAT] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [thaiPreview, setThaiPreview] = useState('');
  const [extraPreview, setExtraPreview] = useState('');
  
  const [activeMobileTab, setActiveMobileTab] = useState('form'); 
  const [isSplitMode, setIsSplitMode] = useState(false); 
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoadingCAAT, setIsLoadingCAAT] = useState(false);
  const [translatedCAAT, setTranslatedCAAT] = useState('');
  const [isCAATModalOpen, setIsCAATModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const thaiPreviewRef = useRef(null);
  const isEditingPreview = useRef(false);

  const formatTimeInput = (val) => {
    const clean = val.replace(/[^0-9.]/g, "");
    if (/^\d{4}$/.test(clean)) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    return clean;
  };

  const hydrateHtmlTemplate = (text) => {
    if (!text) return '';
    let processed = String(text);
    
    // IDEMPOTENCY CHECK: If already has our sync spans, don't double hydrate
    if (processed.includes('sync-field')) {
      return processed; 
    }

    const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    const lines = processed.split('\n');
    if (lines.length > 2 && lines[1].includes('วันที่')) {
      lines[1] = lines[1].replace(/วันที่\s?([^\n\r<]*)/, `วันที่ ${dateStr}`);
      processed = lines.join('\n');
    }

    // STRICT HYDRATION: Only wrap what is explicitly defined as a variable
    processed = processed.replace(/\{(\w+)\}|\[(\w+)\]/g, (match, p1, p2) => {
      const id = p1 || p2;
      return `<span class="sync-field" data-field="${id}" contenteditable="false" style="color: #3b82f6; font-weight: bold;">${match}</span>`;
    });
    return processed;
  };

  const handleFullReset = () => {
    setSelectedTemplate(null);
    setFormData({});
    const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    let defaultText = reportMode === 'incident' 
      ? `รายงานเหตุการณ์ไม่ปกติ\nวันที่ ${dateStr}\n\n\n\n\n\n=============\nงานบริหารหลุมจอด (Apron Control)\nสบข.ฝปข.ทภก.\nTel. 076-351-581\n=============`
      : `รายงานผู้กระทำความผิด\nวันที่ ${dateStr}\n\nเมื่อเวลา {incident_time} น. เจ้าหน้าที่งานกะควบคุมจราจรภาคพื้น ได้ตรวจพบ {violator_name} หมายเลขบัตร {id_card} สังกัด {company} ตำแหน่ง {position}\n\nได้ ขับรถ {vehicle_type} หมายเลข {vehicle_no} ภายในเขตลานจอดอากาศยานบริเวณ {location} โดย ขับรถ \n\nสบข.ฝปข.ทภก. พิจารณาแล้ว การกระทำดังกล่าวไม่ปฏิบัติตามหลักเกณฑ์ของ ทภก. ทั้งนี้ สบข.ฝปข.ทภก. ได้ทำการยึดบัตร {violator_name} เป็นเวลา {seizure_days} วัน ตั้งแต่วันที่ {seizure_start} - {seizure_end} และแจ้งให้เข้ารับการทบทวนการอบรมการขับขี่ยานพาหนะในเขตลานจอดฯ ในวันพุธที่ {retraining_date}\n\n=============\nงานควบคุมจราจรภาคพื้น (Follow Me)\nสบข.ฝปข.ทภก.\nTel. 076-351-085\n=============`;
    const hydrated = hydrateHtmlTemplate(defaultText);
    setThaiPreview(hydrated);
    if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = hydrated;
  };

  const historyData = useHistory(user?.username);
  const { 
    history, renameReport, deleteReport, togglePin, refreshHistory 
  } = historyData;
  
  const { 
    templates: customTemplates, folders, saveTemplate, deleteTemplate, 
    updateTemplateName, createFolder, renameFolder, deleteFolder,
    toggleFolderExpansion
  } = useUserTemplates(user?.username, reportMode);

  const handleSwitchMode = (newMode) => {
    setReportMode(newMode);
    handleFullReset();
  };

  const handleSelectTemplate = (item, type = 'template') => {
    const mode = item.mode || reportMode;
    const body = item.preview || item.content || "";
    setReportMode(mode);
    setSelectedTemplate({
      id: item.id || 'custom',
      name: item.name || (type === 'history' ? 'จากประวัติ' : 'กำหนดเอง'),
      mode: mode,
      preview: body
    });
    
    const initialData = item.data || {};
    setFormData(initialData);
    
    // Initial Hydration
    let hydrated = hydrateHtmlTemplate(body);
    
    // REVERSE MAPPING FIX: Populate the hydrated HTML with saved values immediately
    if (Object.keys(initialData).length > 0) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = hydrated;
      Object.entries(initialData).forEach(([key, val]) => {
        tempDiv.querySelectorAll(`.sync-field[data-field="${key}"]`).forEach(s => {
          s.innerText = val || `{${key}}`;
        });
      });
      hydrated = tempDiv.innerHTML;
    }

    setThaiPreview(hydrated);
    if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = hydrated;
    isEditingPreview.current = type === 'history';
    setIsSidebarOpen(false);
    
    if (window.innerWidth <= 768) {
      setActiveMobileTab('preview');
    }
  };

  const dynamicFields = useMemo(() => {
    const commonFields = [
        { id: 'flight_no', label: 'เที่ยวบิน' }, { id: 'ac_reg', label: 'ทะเบียนเครื่อง' },
        { id: 'stand', label: 'หลุมจอด' }, { id: 'atc_time', label: 'เวลา (ATC)' }
    ];
    if (!selectedTemplate) {
      if (reportMode === 'incident') return commonFields;
      return [
        { id: 'incident_time', label: 'เวลาเกิดเหตุ' }, { id: 'violator_name', label: 'ชื่อผู้กระทำความผิด' },
        { id: 'id_card', label: 'หมายเลขบัตร' }, { id: 'company', label: 'สังกัด' },
        { id: 'position', label: 'ตำแหน่ง' }, { id: 'vehicle_type', label: 'ประเภทรถ' },
        { id: 'vehicle_no', label: 'หมายเลขรถ' }, { id: 'location', label: 'บริเวณ' },
        { id: 'seizure_days', label: 'วันยึดบัตร' }, { id: 'seizure_start', label: 'เริ่มยึดวันที่' },
        { id: 'seizure_end', label: 'ถึงวันที่' }, { id: 'retraining_date', label: 'วันอบรม' }
      ];
    }
    const body = selectedTemplate.preview || selectedTemplate.content || "";
    const keys = [];
    
    // 1. Text Scanning (for raw templates with {braces})
    const textOnly = body.replace(/<[^>]*>?/gm, ' '); // Use space to prevent merging words
    const braceRegex = /\{([^{}]+)\}|\[([^\[\]]+)\]/g;
    let braceMatch;
    while ((braceMatch = braceRegex.exec(textOnly)) !== null) {
      const k = braceMatch[1] || braceMatch[2];
      if (k) keys.push(k.trim());
    }

    // 2. DOM Scanning (for hydrated reports with data-field attributes)
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(body, 'text/html');
      doc.querySelectorAll('[data-field]').forEach(el => {
        const k = el.getAttribute('data-field');
        if (k) keys.push(k.trim());
      });
    } catch (e) {
      console.warn("DOMParser failed, falling back to regex", e);
      const attrRegex = /data-field=["']([^"']+)["']/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(body)) !== null) {
        keys.push(attrMatch[1].trim());
      }
    }

    const dynamic = [...new Set(keys)].map(k => ({ id: k, label: k }));
    return [...commonFields, ...dynamic];
  }, [selectedTemplate, reportMode]);

  const handleInputChange = (id, value) => {
    const isTimeField = /^(incident_time|std|sta|atd|ata|time_\d+)$/i.test(id);
    const finalValue = isTimeField ? formatTimeInput(value) : value;
    if (thaiPreviewRef.current) {
        thaiPreviewRef.current.querySelectorAll(`.sync-field[data-field="${id}"]`).forEach(s => {
            s.innerText = finalValue || `{${id}}`;
        });
        setThaiPreview(thaiPreviewRef.current.innerHTML);
    }
    setFormData(prev => ({ ...prev, [id]: finalValue }));
  };

  const handleCAATTranslate = async () => {
    if (!window.confirm("ยืนยันการทำรายงาน กพท.22?")) return;
    setIsLoadingCAAT(true);
    try {
      const text = thaiPreviewRef.current ? thaiPreviewRef.current.innerText : thaiPreview;
      const result = await translateToCAAT22(text, formData);
      setTranslatedCAAT(result);
      setIsCAATModalOpen(true);
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาดในการประมวลผล AI");
    } finally {
      setIsLoadingCAAT(false);
    }
  };

  // SEARCH LOGIC: Real-time filtering for all sidebar items
  const matchesSearch = (text) => !searchTerm || String(text).toLowerCase().includes(searchTerm.toLowerCase());

  const filteredCustomTemplates = customTemplates.filter(t => matchesSearch(t.name));
  const filteredTemplates = (templatesData || []).filter(t => t.mode === reportMode && (t.id === 'new_report' || t.id === 'violator_core')).filter(t => matchesSearch(t.name));
  const filteredHistory = history.filter(h => (h.mode || 'incident') === reportMode).filter(h => matchesSearch(getSmartTitle(h)));

  const onContextMenu = (e, type, id, data) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, type, id, data });
  };

  function getSmartTitle(h) { return h.customTitle || h.template_name || 'รายงานเหตุการณ์'; }

  if (!user) return <Login onLogin={setUser} />;
  if (!reportMode) return <ModeSelector onSelect={(m) => { setReportMode(m); handleFullReset(); }} />;

  return (
    <div className="app-container">
      <div className="mobile-header">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="app-title">{reportMode === 'incident' ? 'VTSP Incident' : 'ทภก. Violator'}</div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
           <button className="header-action-btn" style={{ fontSize: '0.65rem', width: 'auto', padding: '0 8px' }} onClick={() => handleSwitchMode(reportMode === 'incident' ? 'violator' : 'incident')} title="สลับโหมด">
              {reportMode === 'incident' ? 'ผู้กระทำความผิด' : 'เหตุการณ์ไม่ปกติ'}
           </button>
            <button className="header-action-btn" style={{ color: 'var(--accent-red)', padding: '0 4px' }} onClick={handleLogout} title="ออกจากระบบ"><User size={18} /></button>
        </div>
      </div>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} ${activeMobileTab === 'templates' ? 'mobile-active-templates' : ''} ${activeMobileTab === 'history' ? 'mobile-active-history' : ''}`}>
        <div className="sidebar-header" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div className="app-title" style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-indigo)' }}>VTSP</div>
            {window.innerWidth > 768 && (
               <button className="btn btn-mode-switch" style={{ fontSize: '10px', whiteSpace: 'nowrap' }} onClick={() => handleSwitchMode(reportMode === 'incident' ? 'violator' : 'incident')}>
                 {reportMode === 'incident' ? 'สลับรายงานผู้กระทำความผิด' : 'สลับรายงานเหตุการณ์ไม่ปกติ'}
               </button>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>User: <strong>{user.username}</strong></div>
        </div>
        <div className="search-box"><input type="text" className="search-input" placeholder="ค้นหาฟอร์มหรือประวัติ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <div className="sidebar-scroll-area">
          <div style={{ padding: '0 0.5rem' }}>
            <button className="btn btn-primary btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }} onClick={() => { handleFullReset(); if(window.innerWidth <= 768) setActiveMobileTab('form'); }}>
              <Plus size={16} /> สร้างรายงานใหม่
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
                <div className="history-title" style={{ margin: 0 }}>ฟอร์มรายงาน</div>
                <FolderPlus size={16} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => { const n = window.prompt("ชื่อฟอร์มที่จะบันทึก:"); if(n) createFolder(n); }} />
            </div>
            <div className="sidebar-folders" style={{ padding: '0.5rem 0' }}>
               {folders.map(folder => {
                 const folderTemplates = filteredCustomTemplates.filter(t => t.folder_id === folder.id);
                 if (searchTerm && folderTemplates.length === 0 && !matchesSearch(folder.name)) return null;
                 return (
                   <div key={folder.id} className="folder-item">
                     <div className="folder-header" onClick={() => toggleFolderExpansion(folder.id, folder.is_expanded)} onContextMenu={(e) => onContextMenu(e, 'folder', folder.id, folder)}>
                        <ChevronDown size={14} className={`folder-icon ${!folder.is_expanded ? 'collapsed' : ''}`} />
                        <Folder size={14} fill={folder.is_expanded ? 'var(--accent-indigo)' : 'none'} />
                        <span className="folder-name">{folder.name}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{folderTemplates.length}</span>
                     </div>
                     {(folder.is_expanded || searchTerm) && (
                       <div className="folder-content">
                         {folderTemplates.map(ct => (
                           <div key={ct.id} className="template-item" onClick={() => handleSelectTemplate(ct, 'custom')} onContextMenu={(e) => onContextMenu(e, 'template', ct.id, ct)}>
                             <FileText size={12} style={{ opacity: 0.6 }} />
                             <span style={{ fontSize: '0.8rem' }}>{ct.name}</span>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 );
               })}
               <div className="uncategorized-section">
                  <div className="history-title" style={{ paddingLeft: '1.25rem', fontSize: '0.65rem' }}>ฟอร์มทั่วไป</div>
                  {filteredTemplates.map(t => (
                    <div key={t.id} className="template-item" style={{ marginLeft: '1.25rem' }} onClick={() => handleSelectTemplate(t)}>
                      <FileText size={12} style={{ opacity: 0.6 }} />
                      <span style={{ fontSize: '0.8rem' }}>{t.name}</span>
                    </div>
                  ))}
                  {filteredCustomTemplates.filter(t => !t.folder_id).map(ct => (
                    <div key={ct.id} className="template-item" style={{ marginLeft: '1.25rem' }} onClick={() => handleSelectTemplate(ct, 'custom')} onContextMenu={(e) => onContextMenu(e, 'template', ct.id, ct)}>
                      <FileText size={12} style={{ opacity: 0.6 }} />
                      <span style={{ fontSize: '0.8rem' }}>{ct.name}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
          <div className={`history-section-wrapper ${activeMobileTab === 'templates' ? 'mobile-hidden' : ''}`}>
             <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '1rem 0.5rem' }} />
             <div className="history-section" style={{ border: 'none', paddingTop: 0, paddingBottom: '2rem' }}>
                <div className="history-title">ประวัติเหตุการณ์</div>
                {filteredHistory.filter(h => h.is_pinned).map(h => (
                  <div key={h.id} className="history-item" style={{ borderLeft: '2px solid var(--accent-indigo)' }} onClick={() => handleSelectTemplate(h, 'history')} onContextMenu={(e) => onContextMenu(e, 'history', h.id, h)}>
                    <div className="history-info"><span style={{ flex: 1, fontWeight: 'bold' }}>{getSmartTitle(h)}</span><Pin size={12} fill="var(--accent-indigo)" /></div>
                  </div>
                ))}
                {filteredHistory.filter(h => !h.is_pinned).slice(0, 20).map(h => (
                  <div key={h.id} className="history-item" onClick={() => handleSelectTemplate(h, 'history')} onContextMenu={(e) => onContextMenu(e, 'history', h.id, h)}>
                    <div className="history-info"><span style={{ flex: 1 }}>{getSmartTitle(h)}</span></div>
                  </div>
                ))}
             </div>
          </div>
          <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '1rem' }}>
             <button className="btn btn-ghost btn-full" style={{ color: 'var(--accent-red)', justifyContent: 'center' }} onClick={handleLogout}>
               <User size={16} style={{ marginRight: '8px' }} /> ออกจากระบบ
             </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {(window.innerWidth > 768 || activeMobileTab === 'form') && (
        <section className={`form-section-container ${activeMobileTab === 'form' ? 'mobile-active' : 'mobile-hidden'} ${isSplitMode ? 'split-active' : ''}`} style={window.innerWidth > 768 ? { flex: '0 0 55%' } : {}}>
          {!selectedTemplate && reportMode !== 'violator' ? (
            <div className="card empty-state-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', opacity: 0.6 }}>
               <FileText size={48} style={{ marginBottom: '1rem' }} />
               <p>กรุณาเลือกแม่แบบเพื่อเริ่มเขียนรายงาน</p>
            </div>
          ) : (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ fontSize: '0.85rem' }}>{selectedTemplate?.name || (reportMode === 'incident' ? 'รายงานเหตุการณ์' : 'รายงานผู้กระทำผิด')}</h2>
                {window.innerWidth <= 768 && (
                  <button className={`btn btn-ghost ${isSplitMode ? 'btn-active' : ''}`} style={{ fontSize: '0.65rem' }} onClick={() => setIsSplitMode(!isSplitMode)}><Pin size={16} /></button>
                )}
                <button className="btn btn-ghost" onClick={handleFullReset}><Trash2 size={16} /></button>
            </div>
            <div className="form-body" key={activeMobileTab + (selectedTemplate?.id || 'none')}>
              {dynamicFields.map(field => (
                <div key={field.id} className="form-field"><label>{field.label}</label><input type="text" value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} /></div>
              ))}
            </div>
          </div>
          )}
        </section>
        )}

        <section className={`preview-container-main ${activeMobileTab === 'preview' ? 'mobile-active' : 'mobile-hidden'}`} style={{ flex: '1' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Preview</h2>
               <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {window.innerWidth <= 768 && (
                  <button className="btn btn-mode-switch" onClick={() => setReportMode(reportMode === 'incident' ? 'violator' : 'incident')}>
                    {reportMode === 'incident' ? 'สลับผู้กระทำความผิด' : 'สลับเหตุการณ์'}
                  </button>
                )}
                <button className="btn btn-ghost" style={{ border: '1px solid var(--border-subtle)', fontSize: '11px' }} onClick={async () => { 
                  const n = window.prompt("ชื่อฟอร์มที่จะบันทึก:", selectedTemplate?.name || ""); 
                  if(n) {
                    const currentHtml = thaiPreviewRef.current ? thaiPreviewRef.current.innerHTML : thaiPreview;
                    await saveTemplate(n, formData, currentHtml, extraPreview, selectedTemplate?.folder_id); 
                    alert('บันทึกฟอร์มเรียบร้อย');
                  }
                }}>บันทึกฟอร์มรายงาน</button>
                <button className="btn btn-primary" title="ทำรายงานด้วย AI" style={{ background: 'var(--accent-indigo)', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleCAATTranslate} disabled={isLoadingCAAT}>
                   {isLoadingCAAT && <Loader2 size={16} className="animate-spin" />}
                   ทำรายงาน กพท.22
                </button>
                <button className="btn btn-primary" onClick={() => { 
                  const text = thaiPreviewRef.current ? thaiPreviewRef.current.innerText : thaiPreview;
                  navigator.clipboard.writeText(text);
                  historyData.saveReport({ mode: reportMode, templateName: selectedTemplate?.name || 'กำหนดเอง', preview: text, data: formData });
                  alert('คัดลอกและบันทึกแล้ว');
                }}><Check size={16} /> คัดลอกและบันทึก</button>
              </div>
            </div>
            <div className="preview-body-v2">
              <div ref={thaiPreviewRef} className="preview-textarea" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: thaiPreview }} style={{ whiteSpace: 'pre-wrap', minHeight: '400px' }} />
            </div>
          </div>
        </section>

        {isSplitMode && activeMobileTab === 'form' && (
           <div className="split-preview-overlay">
              <div className="card" style={{ height: '100%', borderRadius: 0, border: 'none' }}>
                 <div className="preview-body-v2" style={{ padding: '0.5rem' }}><div className="preview-textarea" dangerouslySetInnerHTML={{ __html: thaiPreview }} style={{ fontSize: '12px', background: 'transparent', padding: 0 }} /></div>
              </div>
           </div>
        )}

        <nav className="mobile-nav">
           <button className={`nav-item ${activeMobileTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveMobileTab('templates')}><Calendar size={20} /><span>ฟอร์มเหตุการณ์</span></button>
           <button className={`nav-item ${activeMobileTab === 'form' ? 'active' : ''}`} onClick={() => setActiveMobileTab('form')}><Edit2 size={20} /><span>แก้ไขข้อมูล</span></button>
           <button className={`nav-item ${activeMobileTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveMobileTab('preview')}><Sparkles size={20} /><span>Preview</span></button>
           <button className={`nav-item ${activeMobileTab === 'history' ? 'active' : ''}`} onClick={() => setActiveMobileTab('history')}><Clock size={20} /><span>ประวัติ</span></button>
        </nav>
      </main>

      {/* CAAT 22 CONFIRMATION MODAL */}
      {isCAATModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCAATModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="app-title" style={{ fontSize: '1.1rem' }}>พรีวิว: รูปแบบรายงาน กพท.22</div>
              <button className="btn btn-ghost" onClick={() => setIsCAATModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <pre className="caat-preview-text">{translatedCAAT}</pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsCAATModalOpen(false)}>ยกเลิก</button>
              <button className="btn btn-primary btn-mode-switch" onClick={() => {
                navigator.clipboard.writeText(translatedCAAT);
                historyData.saveReport({ mode: reportMode, templateName: (selectedTemplate?.name || 'กำหนดเอง') + ' (CAAT)', preview: translatedCAAT, data: formData });
                alert('คัดลอกรายงาน กพท.22 เรียบร้อยแล้ว');
                setIsCAATModalOpen(false);
              }}>ยืนยันการแปลและคัดลอก</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
          <div className="context-item" onClick={() => {
            const currentTitle = contextMenu.type === 'history' ? getSmartTitle(contextMenu.data) : contextMenu.data.name;
            const newName = window.prompt("เปลี่ยนชื่อเป็น:", currentTitle);
            if (newName) {
              if (contextMenu.type === 'folder') renameFolder(contextMenu.id, newName);
              else if (contextMenu.type === 'history') renameReport(contextMenu.id, newName);
              else updateTemplateName(contextMenu.id, newName);
            }
            setContextMenu(null);
          }}><Edit2 size={14} /> เปลี่ยนชื่อ</div>
          <div className="context-item danger" onClick={() => {
            if (window.confirm("ยืนยันการลบ?")) {
              if (contextMenu.type === 'folder') deleteFolder(contextMenu.id);
              else if (contextMenu.type === 'history') deleteReport(contextMenu.id);
              else deleteTemplate(contextMenu.id);
            }
            setContextMenu(null);
          }}><Trash2 size={14} /> ลบทิ้ง</div>
        </div>
      )}
    </div>
  );
};
export default App;
