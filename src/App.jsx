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
  Folder, FolderPlus, MoreVertical, ChevronDown, FileText, ArrowRight
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
  
  // MOBILE 2.0: NAVIGATION STATE
  const [activeMobileTab, setActiveMobileTab] = useState('form'); 
  const [isSplitMode, setIsSplitMode] = useState(false); 
  const [isTranslating, setIsTranslating] = useState(false);
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
    const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    const lines = processed.split('\n');
    if (lines.length > 2 && lines[1].includes('วันที่')) {
      lines[1] = lines[1].replace(/วันที่\s?([^\n\r<]*)/, `วันที่ ${dateStr}`);
      processed = lines.join('\n');
    }
    let counter = 1;
    processed = processed.replace(/หมายเลข\s+(?!\{)([^\s<]+)/g, () => `หมายเลข {item_no_${counter++}}`);
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
  const history = historyData?.history || [];
  const { 
    templates: customTemplates, folders, saveTemplate, deleteTemplate, 
    updateTemplateName, createFolder, renameFolder, deleteFolder,
    toggleFolderExpansion, renameReport, deleteReport, togglePin
  } = useUserTemplates(user?.username, reportMode);

  useEffect(() => { if (user) handleFullReset(); }, [reportMode]);

  const dynamicFields = useMemo(() => {
    if (!selectedTemplate) {
      if (reportMode === 'incident') return [];
      return [
        { id: 'incident_time', label: 'เวลาเกิดเหตุ' }, { id: 'violator_name', label: 'ชื่อผู้กระทำความผิด' },
        { id: 'id_card', label: 'หมายเลขบัตร' }, { id: 'company', label: 'สังกัด' },
        { id: 'position', label: 'ตำแหน่ง' }, { id: 'vehicle_type', label: 'ประเภทรถ' },
        { id: 'vehicle_no', label: 'หมายเลขรถ' }, { id: 'location', label: 'บริเวณ' },
        { id: 'seizure_days', label: 'วันยึดบัตร' }, { id: 'seizure_start', label: 'เริ่มยึดวันที่' },
        { id: 'seizure_end', label: 'ถึงวันที่' }, { id: 'retraining_date', label: 'วันอบรม' }
      ];
    }
    let textToParse = (selectedTemplate.preview || selectedTemplate.content || "").replace(/<[^>]*>?/gm, '');
    const keys = [];
    let match;
    const regex = /\{([^{}]+)\}|\[([^\[\]]+)\]/g;
    while ((match = regex.exec(textToParse)) !== null) keys.push(match[1] || match[2]);
    return [...new Set(keys)].map(k => ({ id: k, label: k }));
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

  const loadAnyTemplate = (item, type = 'template') => {
    const mode = item.mode || reportMode;
    setReportMode(mode);
    setSelectedTemplate({
      id: item.id || 'custom',
      name: item.name || (type === 'history' ? 'จากประวัติ' : 'กำหนดเอง'),
      mode: mode,
      content: item.content || item.preview || ""
    });
    setFormData(item.data || {});
    const hydrated = hydrateHtmlTemplate(item.preview || item.content || "");
    setThaiPreview(hydrated);
    if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = hydrated;
    isEditingPreview.current = type === 'history';
    setIsSidebarOpen(false);
  };

  const getSmartTitle = (h) => h.customTitle || h.template_name || 'รายงานเหตุการณ์';
  
  const onContextMenu = (e, type, id, data) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, type, id, data });
  };

  const filteredTemplates = (templatesData || []).filter(t => t.mode === reportMode && (t.id === 'new_report' || t.id === 'violator_core'));
  const filteredHistory = history.filter(h => (h.mode || 'incident') === reportMode);
  const pinnedHistory = filteredHistory.filter(h => h.is_pinned);
  const normalHistory = filteredHistory.filter(h => !h.is_pinned);

  if (!user) return <Login onLogin={setUser} />;
  if (!reportMode) return <ModeSelector onSelect={setReportMode} />;

  return (
    <div className="app-container">
      {/* MOBILE HEADER */}
      <div className="mobile-header">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="app-title">{reportMode === 'incident' ? 'VTSP Incident' : 'ทภก. Violator'}</div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
           <button className="header-action-btn" onClick={() => setReportMode(null)} title="สลับโหมด"><ArrowRight size={20} /></button>
           <button className="header-action-btn" style={{ color: 'var(--accent-red)' }} onClick={() => {setUser(null); setReportMode(null);}} title="ออกจากระบบ"><User size={20} /></button>
        </div>
      </div>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} ${activeMobileTab === 'templates' ? 'mobile-active-templates' : ''} ${activeMobileTab === 'history' ? 'mobile-active-history' : ''}`}>
        <div className="sidebar-header" style={{ padding: '1.5rem 1rem' }}>
          <div className="app-title" style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-indigo)' }}>VTSP</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>User: <strong>{user.username}</strong></div>
        </div>
        
        <div className="search-box">
          <input type="text" className="search-input" placeholder="ค้นหาฟอร์มหรือประวัติ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="sidebar-scroll-area">
          <div style={{ padding: '0 0.5rem' }}>
            <button className="btn btn-primary btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }} onClick={() => { handleFullReset(); if(window.innerWidth <= 768) setActiveMobileTab('form'); }}>
              <Plus size={16} /> สร้างรายงานใหม่
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
                <div className="history-title" style={{ margin: 0 }}>ฟอร์มรายงาน</div>
                <FolderPlus size={16} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => { const n = window.prompt("ชื่อโฟลเดอร์ใหม่:"); if(n) createFolder(n); }} />
            </div>

            <div className="sidebar-folders" style={{ padding: '0.5rem 0' }}>
               {/* FOLDERS & CUSTOM TEMPLATES */}
               {folders.map(folder => {
                 const folderTemplates = customTemplates.filter(t => t.folder_id === folder.id);
                 return (
                   <div key={folder.id} className="folder-item">
                     <div className="folder-header" onClick={() => toggleFolderExpansion(folder.id, folder.is_expanded)}>
                        <ChevronDown size={14} className={`folder-icon ${!folder.is_expanded ? 'collapsed' : ''}`} />
                        <Folder size={14} fill={folder.is_expanded ? 'var(--accent-indigo)' : 'none'} />
                        <span className="folder-name">{folder.name}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{folderTemplates.length}</span>
                     </div>
                     {folder.is_expanded && (
                       <div className="folder-content">
                         {folderTemplates.map(ct => (
                           <div key={ct.id} className="template-item" onClick={() => loadAnyTemplate(ct, 'custom')} onContextMenu={(e) => onContextMenu(e, 'template', ct.id, ct)}>
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
                    <div key={t.id} className="template-item" style={{ marginLeft: '1.25rem' }} onClick={() => loadAnyTemplate(t)}>
                      <FileText size={12} style={{ opacity: 0.6 }} />
                      <span style={{ fontSize: '0.8rem' }}>{t.name}</span>
                    </div>
                  ))}
                  {customTemplates.filter(t => !t.folder_id).map(ct => (
                    <div key={ct.id} className="template-item" style={{ marginLeft: '1.25rem' }} onClick={() => loadAnyTemplate(ct, 'custom')} onContextMenu={(e) => onContextMenu(e, 'template', ct.id, ct)}>
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
                {pinnedHistory.map(h => (
                  <div key={h.id} className="history-item" style={{ borderLeft: '2px solid var(--accent-indigo)' }} onClick={() => loadAnyTemplate(h, 'history')} onContextMenu={(e) => onContextMenu(e, 'history', h.id, h)}>
                    <div className="history-info"><span style={{ flex: 1, fontWeight: 'bold' }}>{getSmartTitle(h)}</span><Pin size={12} fill="var(--accent-indigo)" /></div>
                  </div>
                ))}
                {normalHistory.slice(0, 20).map(h => (
                  <div key={h.id} className="history-item" onClick={() => loadAnyTemplate(h, 'history')} onContextMenu={(e) => onContextMenu(e, 'history', h.id, h)}>
                    <div className="history-info"><span style={{ flex: 1 }}>{getSmartTitle(h)}</span></div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="mode-switcher" style={{ marginTop: 'auto', padding: '0.75rem 1rem' }}>
           <button className="btn btn-primary btn-full" style={{ height: '52px' }} onClick={() => setReportMode(reportMode === 'incident' ? 'violator' : 'incident')}>
              สลับเป็น: {reportMode === 'incident' ? 'รายงานผู้ปฏิบัติผิด' : 'รายงานเหตุการณ์ไม่ปกติ'}
           </button>
        </div>
      </aside>

      <main className="main-content">
        <section className={`form-section-container ${activeMobileTab === 'form' ? 'mobile-active' : 'mobile-hidden'} ${isSplitMode ? 'split-active' : ''}`} style={{ flex: '0 0 55%' }}>
          <div className="card">
            <div className="card-header" style={{ padding: '0.5rem 1rem' }}>
              <h2 className="card-title" style={{ fontSize: '0.85rem' }}>{selectedTemplate?.name || 'แก้ไขข้อมูล'}</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className={`btn btn-ghost ${isSplitMode ? 'btn-active' : ''}`} style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border-subtle)' }} onClick={() => setIsSplitMode(!isSplitMode)}>
                   {isSplitMode ? 'ปิดจอคู่' : 'จอคู่ (Split)'}
                </button>
                <button className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={handleFullReset}>รีเซ็ต</button>
              </div>
            </div>
            <div className="form-body">
              {dynamicFields.map(field => (
                <div key={field.id} className="form-field">
                  <label>{field.label}</label>
                  <input type="text" value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} />
                </div>
              ))}
              {dynamicFields.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>กรุณาเลือกแม่แบบเริ่มใช้งาน</div>}
            </div>
          </div>
        </section>

        <section className={`preview-container-main ${activeMobileTab === 'preview' ? 'mobile-active' : 'mobile-hidden'}`} style={{ flex: '1' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Preview</h2>
              <button className="btn btn-primary" onClick={() => { 
                const text = thaiPreviewRef.current ? thaiPreviewRef.current.innerText : thaiPreview;
                navigator.clipboard.writeText(text);
                historyData.saveReport({ mode: reportMode, templateName: selectedTemplate?.name || 'กำหนดเอง', preview: text, data: formData });
                alert('คัดลอกและบันทึกแล้ว');
              }}><Check size={16} /> คัดลอกและบันทึก</button>
            </div>
            <div className="preview-body-v2">
              <div ref={thaiPreviewRef} className="preview-textarea" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: thaiPreview }} style={{ whiteSpace: 'pre-wrap', minHeight: '400px' }} />
            </div>
          </div>
        </section>

        {isSplitMode && activeMobileTab === 'form' && (
           <div className="split-preview-overlay">
              <div className="card" style={{ height: '100%', borderRadius: 0, border: 'none' }}>
                 <div className="preview-body-v2" style={{ padding: '0.5rem' }}>
                    <div className="preview-textarea" dangerouslySetInnerHTML={{ __html: thaiPreview }} style={{ fontSize: '12px', background: 'transparent', padding: 0 }} />
                 </div>
              </div>
           </div>
        )}

        {/* BOTTOM NAV (MOBILE ONLY) */}
        <nav className="mobile-nav">
           <button className={`nav-item ${activeMobileTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveMobileTab('templates')}>
              <Calendar size={20} /><span>ฟอร์มเหตุการณ์</span>
           </button>
           <button className={`nav-item ${activeMobileTab === 'form' ? 'active' : ''}`} onClick={() => setActiveMobileTab('form')}>
              <Edit2 size={20} /><span>แก้ไขข้อมูล</span>
           </button>
           <button className={`nav-item ${activeMobileTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveMobileTab('preview')}>
              <Sparkles size={20} /><span>Preview</span>
           </button>
           <button className={`nav-item ${activeMobileTab === 'history' ? 'active' : ''}`} onClick={() => setActiveMobileTab('history')}>
              <Clock size={20} /><span>ประวัติ</span>
           </button>
        </nav>
      </main>

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
