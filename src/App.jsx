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
  Search, Calendar, Clock, ChevronRight, User, Terminal
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
  
  const [activeMobileTab, setActiveMobileTab] = useState('form'); 
  const [isSplitMode, setIsSplitMode] = useState(false); 
  const [isTranslating, setIsTranslating] = useState(false);

  const thaiPreviewRef = useRef(null);
  const isEditingPreview = useRef(false);
  const prevFormDataRef = useRef({});

  const focusPreview = () => {
    if (thaiPreviewRef.current) {
        thaiPreviewRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(thaiPreviewRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
  };

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
  const { templates: customTemplates, folders, saveTemplate, deleteTemplate, loadAnyTemplate } = useUserTemplates(user?.username, reportMode);

  useEffect(() => { if (reportMode) handleFullReset(); }, [reportMode]);

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

  const copyThai = () => {
    const text = thaiPreviewRef.current ? thaiPreviewRef.current.innerText : thaiPreview;
    navigator.clipboard.writeText(text);
    if (historyData?.saveReport) {
      historyData.saveReport({
        mode: reportMode,
        templateName: selectedTemplate?.name || 'กำหนดเอง',
        preview: text,
        data: formData
      });
    }
    alert('คัดลอกและบันทึกแล้ว');
  };

  const internalLoadTemplate = (item, type = 'template') => {
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
  };

  const filteredTemplates = (templatesData || []).filter(t => t.mode === reportMode && (t.id === 'new_report' || t.id === 'violator_core'));
  const filteredHistory = history.filter(h => (h.mode || 'incident') === reportMode);

  if (!user) return <Login onLogin={setUser} />;
  if (!reportMode) return <ModeSelector onSelect={setReportMode} />;

  return (
    <div className="app-container">
      <div className="mobile-header">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="app-title">{reportMode === 'incident' ? 'เหตุการณ์ไม่ปกติ' : 'ผู้กระทำความผิด'}</div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
           <button className="header-action-btn" onClick={() => setReportMode(null)}><ChevronRight size={20} /></button>
           <button className="header-action-btn" style={{ color: 'var(--accent-red)' }} onClick={() => {setUser(null); setReportMode(null);}}><User size={20} /></button>
        </div>
      </div>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} ${activeMobileTab === 'templates' ? 'mobile-active-templates' : ''} ${activeMobileTab === 'history' ? 'mobile-active-history' : ''}`}>
        <div className="sidebar-header">
          <div className="app-title" style={{ color: 'var(--accent-indigo)' }}>VTSP</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>User: {user.username}</div>
        </div>
        <div className="sidebar-scroll-area">
          <div style={{ padding: '1rem' }}>
              <button className="btn btn-primary btn-full" onClick={() => {handleFullReset(); if(window.innerWidth <= 768) setActiveMobileTab('form');}}>สร้างใหม่</button>
              <div className="history-title" style={{ marginTop: '1rem' }}>ฟอร์มแนะนำ</div>
              {filteredTemplates.map(t => (
                <div key={t.id} className="template-item" onClick={() => internalLoadTemplate(t)}>
                  <Calendar size={14} /> <span>{t.name}</span>
                </div>
              ))}
              <div className="history-title" style={{ marginTop: '1rem' }}>ประวัติล่าสุด</div>
              {filteredHistory.slice(0, 10).map(h => (
                <div key={h.id} className="history-item" onClick={() => internalLoadTemplate(h, 'history')}>
                  <span>{h.customTitle || 'รายงานเหตุการณ์'}</span>
                </div>
              ))}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <section className={`form-section-container ${activeMobileTab === 'form' ? 'mobile-active' : 'mobile-hidden'} ${isSplitMode ? 'split-active' : ''}`}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">{selectedTemplate?.name || 'แก้ไขข้อมูล'}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={`btn btn-ghost ${isSplitMode ? 'btn-active' : ''}`} onClick={() => setIsSplitMode(!isSplitMode)}>
                   {isSplitMode ? 'ปิดจอคู่' : 'จอคู่ (Split)'}
                </button>
                <button className="btn btn-ghost" onClick={handleFullReset}>รีเซ็ต</button>
              </div>
            </div>
            <div className="form-body">
              {dynamicFields.map(field => (
                <div key={field.id} className="form-field">
                  <label>{field.label}</label>
                  <input type="text" value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`preview-container-main ${activeMobileTab === 'preview' ? 'mobile-active' : 'mobile-hidden'}`}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Preview</div>
              <button className="btn btn-primary" onClick={copyThai}>คัดลอก</button>
            </div>
            <div className="preview-body-v2">
              <div ref={thaiPreviewRef} className="preview-textarea" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: thaiPreview }} style={{ whiteSpace: 'pre-wrap', minHeight: '300px' }} />
            </div>
          </div>
        </section>

        {isSplitMode && activeMobileTab === 'form' && (
           <div className="split-preview-overlay">
              <div className="card" style={{ height: '100%', borderRadius: 0 }}>
                 <div className="preview-body-v2">
                    <div className="preview-textarea" dangerouslySetInnerHTML={{ __html: thaiPreview }} style={{ fontSize: '13px' }} />
                 </div>
              </div>
           </div>
        )}

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
    </div>
  );
};
export default App;
