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
  ArrowRight, History, FileText, Folder, FolderPlus, MoreVertical,
  ChevronDown
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
  
  const thaiPreviewRef = useRef(null);
  const extraPreviewRef = useRef(null);
  const isEditingPreview = useRef(false);
  const prevFormDataRef = useRef({});

  // PHASE 62: SMART TIME FORMATTER
  const formatTimeInput = (val) => {
    // Remove all non-digits and non-dots first
    const clean = val.replace(/[^0-9.]/g, "");
    // If it matches exactly 4 digits (e.g., 1942), transform to 19.42
    if (/^\d{4}$/.test(clean)) {
      return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    }
    return clean;
  };

  // PHASE 66: DYNAMIC THAI DATE HELPER
  const getCurrentThaiDate = () => {
    const date = new Date();
    const d = date.getDate();
    const m = THAI_MONTHS_SHORT[date.getMonth()];
    const y = (date.getFullYear() + 543).toString().slice(-2);
    return `${d} ${m} ${y}`;
  };

  // PHASE 59: ATOMIC LOCKING ARCHITECTURE (STRICT ADHERENCE)
  // Ensures every form field is wrapped in a protected, atomic span.
  const hydrateHtmlTemplate = (text) => {
    if (!text) return '';
    
    // 1. PHASE 66: GLOBAL AUTO-DATE INJECTION (Greedy match for Thai date formats)
    let processed = text.replace(/วันที่\s?([^\n\r]*)/g, `วันที่ ${getCurrentThaiDate()}`);

    // 2. Variable hydration ({key}, [key])
    processed = processed.replace(/\{(\w+)\}|\[(\w+)\]/g, (match, p1, p2) => {
      const id = p1 || p2;
      return `<span class="sync-field" data-field="${id}" contenteditable="false" style="color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); padding: 0 4px; border-radius: 3px; border: 1px solid rgba(59, 130, 246, 0.2); font-weight: 600; line-height: 1; cursor: default; user-select: all;">${match}</span>`;
    });

    // 3. PHASE 67/69/70: PRECISION SEQUENTIAL INDEXING (EXACT CALLBACK LOGIC)
    let counter = 1;
    processed = processed.replace(/หมายเลข\s+([^\s<{}]+)/g, (match, p1) => {
      const fieldId = `item_no_${counter++}`;
      return `หมายเลข <span class="sync-field" data-field="${fieldId}" contenteditable="false" style="color: var(--accent-blue); background: rgba(59, 130, 246, 0.15); padding: 0 4px; border-radius: 3px; border: 1px solid rgba(59, 130, 246, 0.2); font-weight: 600; line-height: 1; cursor: default; user-select: all;">${p1}</span>`;
    });
    
    return processed;
  };

  // PHASE 55/68: NUCLEAR RESET FUNCTION with MODE-BASED DEFAULTS
  const handleFullReset = () => {
    setFormData({});
    setExtraPreview('');
    setSelectedTemplate(null);
    isEditingPreview.current = false;
    prevFormDataRef.current = {};
    setShowCAAT(false);
    
    // PHASE 68/69.2: MODE-BASED INITIALIZATION (RE-MAPPED)
    let defaultText = '';
    
    if (reportMode === 'violator') {
      defaultText = `รายงานผู้กระทำความผิด\nวันที่ ${getCurrentThaiDate()}\n\nเมื่อเวลา {incident_time} น. เจ้าหน้าที่งานกะควบคุมจราจรภาคพื้น ได้ตรวจพบ {violator_name} หมายเลขบัตร {id_card} สังกัด {company} ตำแหน่ง {position}\n\nได้ ขับรถ {vehicle_type} หมายเลข {vehicle_no} ภายในเขตลานจอดอากาศยานบริเวณ {location} โดย ขับรถ \n\nสบข.ฝปข.ทภก. พิจารณาแล้ว การกระแทดังกล่าวไม่ปฏิบัติตามหลักเกณฑ์ของ ทภก. ทั้งนี้ สบข.ฝปข.ทภก. ได้ทำการยึดบัตร {violator_name} เป็นเวลา {seizure_days} วัน ตั้งแต่วันที่ {seizure_start} - {seizure_end} และแจ้งให้เข้ารับการทบทวนการอบรมการขับขี่ยานพาหนะในเขตลานจอดฯ ในวันพุธที่ {retraining_date}\n\n=============\nงานควบคุมจราจรภาคพื้น (Follow Me)\nสบข.ฝปข.ทภก.\nTel. 076-351-085\n=============`;
    } else {
      defaultText = `รายงานเหตุการณ์ไม่ปกติ\nวันที่ ${getCurrentThaiDate()}\n\n\n\n\n\n=============\nงานบริหารหลุมจอด (Apron Control)\nสบข.ฝปข.ทภก.\nTel. 076-351-581\n=============`;
    }
    
    const hydrated = hydrateHtmlTemplate(defaultText);
    setThaiPreview(hydrated);
    if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = hydrated;
  };

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

  const { 
    templates: customTemplates, 
    folders,
    saveTemplate, 
    deleteTemplate, 
    updateTemplateName,
    createFolder,
    renameFolder,
    deleteFolder,
    moveTemplateToFolder,
    toggleFolderExpansion
  } = useUserTemplates(user?.username, reportMode);

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const [renamingTemplateId, setRenamingTemplateId] = useState(null);
  const [newTemplateName, setNewTemplateName] = useState('');

  const [renamingHistoryId, setRenamingHistoryId] = useState(null);
  const [newHistoryName, setNewHistoryName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState(null);

  // Sync default template
  useEffect(() => {
    if (reportMode && Array.isArray(templatesData)) {
      const first = templatesData.find(t => t.mode === reportMode);
      if (first) {
        setSelectedTemplate(first);
        const hydrated = hydrateHtmlTemplate(first.preview || '');
        setThaiPreview(hydrated);
        // Ensure DOM is updated if ref is ready
        if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = hydrated;
      }
    }
  }, [reportMode]);

  // PHASE 69.2: FORCE RESET ON MODE SWITCH to prevent ghost fields/template leakage
  useEffect(() => {
    handleFullReset();
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

  // --- Smart Form (Dynamic Mapping) Extraction & Substitution ---
  // Extra variables from the narrative to generate the form dynamically
  const dynamicFields = useMemo(() => {
    const baseText = selectedTemplate?.content || selectedTemplate?.data?.narrative || "";
    // PHASE 66 RECOVERY: Scan BOTH template and current preview (stripped of HTML) for real-time discovery
    const cleanPreview = thaiPreview.replace(/<[^>]*>?/gm, '');
    const combinedText = baseText + " " + cleanPreview;

    // Match both {key} and [key]
    const matches = combinedText.match(/\{([^{}]+)\}|\[([^\[\]]+)\]/g) || [];
    const keys = matches.map(m => m.replace(/[\{\}\[\]]/g, ''));
    
    // PHASE 66/67/69/70: IMPLICIT "หมายเลข" DISCOVERY with SEQUENTIAL CALLBACK MATCH
    let sidebarCounter = 1;
    // We use the EXACT same logic as hydration to ensure IDs match
    const implicitMatches = combinedText.match(/หมายเลข\s+([^\s<{}]+)/g) || [];
    implicitMatches.forEach(() => {
      const fieldId = `item_no_${sidebarCounter++}`;
      if (!keys.includes(fieldId)) {
        keys.push(fieldId);
      }
    });

    const uniqueKeys = [...new Set(keys)];
    
    // Map these keys to a professional field list
    return uniqueKeys.map(key => {
      // Semantic UI Mapping
      let label = key;
      let type = 'text';
      
      if (key === 'flight_no') label = 'เที่ยวบินที่ (Flight No)';
      else if (key === 'registration') label = 'ทะเบียน (Registration)';
      else if (key === 'ac_type') label = 'แบบอากาศยาน (AC Type)';
      else if (key === 'sta') label = 'เวลาลง ทภก. (STA)';
      else if (key === 'std') label = 'เวลาออก ทภก. (STD)';
      else if (key === 'atd') label = 'เวลาออกจาก ทภก. (ATD)';
      else if (key === 'airline') label = 'สายการบิน (Airline)';
      else if (key === 'route') label = 'เส้นทางบิน (Route)';
      else if (key === 'stand_no') label = 'หลุมจอด (Stand)';
      else if (key === 'violator_name') label = 'ชื่อผู้กระทำความผิด';
      else if (key === 'incident_time') label = 'เวลาเกิดเหตุ';
      else if (key === 'id_card') label = 'หมายเลขบัตร';
      else if (key === 'company') label = 'สังกัด';
      else if (key === 'position') label = 'ตำแหน่ง';
      else if (key === 'vehicle_type') label = 'ประเภทรถ';
      else if (key === 'vehicle_no') label = 'หมายเลขรถ';
      else if (key === 'location') label = 'บริเวณ';
      else if (key === 'seizure_days') label = 'จำนวนวันยึดบัตร';
      else if (key === 'seizure_start') label = 'เริ่มยึดวันที่';
      else if (key === 'seizure_end') label = 'ถึงวันที่';
      else if (key === 'retraining_date') label = 'วันอบรมทบทวน';
      else if (key.startsWith('item_no_')) {
        const num = key.split('_')[2];
        label = `หมายเลข ${num}`;
      }
      else if (key === 'item_no') label = 'หมายเลข';
      else if (key === 'impact_list') {
        label = 'ส่งผลกระทบต่อเที่ยวบิน ดังนี้ (Impact List)';
        type = 'list';
      }
      else if (key.startsWith('time_')) {
        const num = key.split('_')[1];
        label = `ลำดับเวลาที่ ${num}`;
      }
      
      return { id: key, label: label, type: type };
    });
  }, [selectedTemplate, thaiPreview, reportMode]);

  // PHASE 60: REMOVED NUCLEAR EFFECT
  // We no longer use a generic useEffect to overwrite the Preview based on formData.
  // Instead, we use Surgical Injection + Snapshotting to preserve manual edits.

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
    // PHASE 62: CENTRALIZED TIME MASKING (CALCULATE FIRST)
    const isTimeField = /time|std|sta|atd|ata/i.test(id);
    const finalValue = isTimeField && typeof value === 'string' ? formatTimeInput(value) : value;

    // PHASE 60: THE SURGICAL SNAPSHOT
    // 1. Surgical DOM Injection (Target specific atomic spans)
    if (thaiPreviewRef.current) {
        const targetSpans = thaiPreviewRef.current.querySelectorAll(`.sync-field[data-field="${id}"]`);
        targetSpans.forEach(targetSpan => {
            targetSpan.innerText = finalValue || `{${id}}`;
            targetSpan.style.background = finalValue ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)";
        });

        // 2. State Snapshot (Capture new HTML into State so React remembers it)
        setThaiPreview(thaiPreviewRef.current.innerHTML);
    }

    setFormData(prev => {
      const newData = { ...prev, [id]: finalValue };
      
      // Smart Guessing (Pattern detection in Narrative) - only in dynamic mode
      if (!isEditingPreview.current && (id === 'narrative' || id === 'update_text')) {
        // Detect Time (HH:mm or HH.mm)
        const timeMatch = value.match(/([01]?[0-9]|2[0-3])[:.][0-5][0-9]/);
        if (timeMatch && !newData.incident_time) {
          newData.incident_time = timeMatch[0].replace('.', ':');
          // Update DOM for time immediately if guessed
          if (thaiPreviewRef.current) {
            const timeSpan = thaiPreviewRef.current.querySelector(`[data-field="incident_time"]`);
            if (timeSpan) timeSpan.textContent = newData.incident_time;
          }
        }

        // Detect Flight No (Airline Prefix + 3-4 Digits)
        const flightMatch = value.match(/[A-Z]{2,3}\s?[0-9]{3,4}/i);
        if (flightMatch && !newData.flight_no) {
          newData.flight_no = flightMatch[0].toUpperCase().replace(/\s/g, '');
          // Update DOM for flight_no immediately if guessed
          if (thaiPreviewRef.current) {
            const flightSpan = thaiPreviewRef.current.querySelector(`[data-field="flight_no"]`);
            if (flightSpan) flightSpan.textContent = newData.flight_no;
          }
        }
      }

      // Synchronize back to Ref so the data is preserved
      prevFormDataRef.current = newData;
      return newData;
    });
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
    const cleanText = thaiPreviewRef.current ? thaiPreviewRef.current.innerText : (thaiPreview || '');
    if (!cleanText) return;
    
    navigator.clipboard.writeText(cleanText);
    if (saveReport) {
      saveReport({
        mode: reportMode,
        templateName: selectedTemplate?.name || 'กำหนดเอง',
        preview: cleanText,
        extraPreview: extraPreview,
        data: formData
      });
    }
    alert('คัดลอกรายงานไทยแล้ว');
  };

  // HELPER: Unify loading for all template types to prevent state de-sync
  const loadAnyTemplate = (item, type = 'template') => {
    const mode = item.mode || reportMode || 'incident';
    
    // 1. Ensure mode is synced
    setReportMode(mode);

    // 2. Identify fields based on mode if not provided
    let fields = item.fields;
    if (!fields && Array.isArray(templatesData)) {
      const base = templatesData.find(t => t.mode === mode);
      fields = base?.fields || [];
    }

    // 3. Set standard SelectedTemplate structure
    setSelectedTemplate({
      id: item.id || (type === 'history' ? 'history' : 'custom'),
      name: item.name || (type === 'history' ? getSmartTitle(item) : 'กำหนดเอง'),
      mode: mode,
      content: item.content || item.preview || item.data?.narrative || "",
      fields: fields
    });

    // 4. Set data and unlock preview linkage
    const initialData = item.data || {};
    setFormData(initialData);
    prevFormDataRef.current = initialData; // PHASE 48 SYNC
    
    const hydrated = hydrateHtmlTemplate(item.preview || "");
    setThaiPreview(hydrated);
    if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = hydrated;
    
    setExtraPreview(item.extra_preview || "");
    isEditingPreview.current = type === 'history';
  };

  const handleSaveAsTemplate = async () => {
    const name = window.prompt("กรุณาตั้งชื่อฟอร์มนี้ (เช่น: เครื่องบินขัดข้อง, ล้อยางแตก):");
    if (name && saveTemplate) {
      // PHASE 57: DOM-BASED EXTRACTION
      // Extract clean text from DOM before template discovery
      let templateNarrative = thaiPreviewRef.current ? thaiPreviewRef.current.innerText : (thaiPreview || '');

      // 1. Precise Match: If user filled the form, use that first
      const sortedEntries = Object.entries(formData).sort((a, b) => String(b[1] || "").length - String(a[1] || "").length);
      sortedEntries.forEach(([key, value]) => {
        if (value && String(value).trim().length > 0) {
          const escapedValue = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          templateNarrative = templateNarrative.replace(new RegExp(escapedValue, 'g'), `{${key}}`);
        }
      });

      // 2. Semantic Mapping (Keyword Patterns)
      // Map keywords to standard semantic tags
      const semanticRules = [
        { kw: /(เที่ยวบิน|เที่ยวบินที่|เทียวบิน)\s?[:：]?\s?/g, tag: 'flight_no', pat: /[A-Z0-9\/]+\b/ },
        { kw: /(ทะเบียน|ทะเบียนฯ|ทะเบียนอากาศยาน|ทะเบียนและสัญชาติ)\s?[:：]?\s?/g, tag: 'registration', pat: /[A-Z0-9-]+\b/ },
        { kw: /(แบบอากาศยาน)\s?[:：]?\s?/g, tag: 'ac_type', pat: /[A-Z0-9]+\b/ },
        { kw: /(เส้นทางบิน)\s?[:：]?\s?/g, tag: 'route', pat: /[A-Z0-9 -]+\b/ },
        { kw: /(เวลาลง ทภก\.|เวลาเข้าตามตารางบิน)\s?[:：]?\s?/g, tag: 'sta', pat: /\d{1,2}[:.]\d{2}/ },
        { kw: /(เวลาออกตามตารางบิน|เวลาออกตามตาราง)\s?[:：]?\s?/g, tag: 'std', pat: /\d{1,2}[:.]\d{2}/ },
        { kw: /(เวลาออกจากทภก\.|เวลาออกจาก ทภก\.|เวลาออกจาก ทภก)\s?[:：]?\s?/g, tag: 'atd', pat: /\d{1,2}[:.]\d{2}/ },
        { kw: /(สายการบิน)\s?[:：]?\s?/g, tag: 'airline', pat: /[a-zA-Z\s]+\b/ },
        { kw: /(หลุมจอดฯ หมายเลข|หลุมจอด|หลุมจอด ฯ หมายเลข)\s?[:：]?\s?/g, tag: 'stand_no', pat: /\d+[A-Z]?\b/ },
        { kw: /(ผู้โดยสาร|จำนวนผู้โดยสาร)\s?[:：]?\s?/g, tag: 'pax', pat: /[\d+ ]+คน/ },
        { kw: /(หมายเลข)\s?[:：]?\s?/g, tag: 'item_no', pat: /[A-Z0-9-.]+\b/ },
        { kw: /(ส่งผลกระทบต่อเที่ยวบิน ดังนี้)\s?[:：]?\s?/g, tag: 'impact_list', pat: /[\s\S]+/ }
      ];

      semanticRules.forEach(rule => {
        // PHASE 62: SEPARATE TIME UNITS FROM SEMANTIC MATCHES
        const isTimeField = ['std', 'sta', 'atd', 'ata'].includes(rule.tag);
        const fullRegex = isTimeField 
          ? new RegExp(`(${rule.kw.source})(${rule.pat.source})(\\s?น\\.)?`, 'g')
          : new RegExp(`(${rule.kw.source})(${rule.pat.source})`, 'g');
          
        if (rule.tag === 'impact_list') {
           // Handle list specially - don't over-consume
           templateNarrative = templateNarrative.replace(rule.kw, `$1\n{${rule.tag}}`);
        } else if (isTimeField) {
           templateNarrative = templateNarrative.replace(fullRegex, (match, p1, p2, p3) => {
             return `${p1}{${rule.tag}}${p3 || ''}`;
           });
        } else {
           templateNarrative = templateNarrative.replace(fullRegex, `$1{${rule.tag}}`);
        }
      });

      // 3. Sequence Timing (เมื่อเวลา, ต่อมาเวลา) - PHASE 62: UNIT SEPARATION
      let timeCount = 1;
      const timeKeywords = /(เมื่อเวลา|ต่อมาเวลา|เวลา)\s?(\d{1,2}[:.]\d{2})(\s?น\.)?/g;
      templateNarrative = templateNarrative.replace(timeKeywords, (match, p1, p2, p3) => {
        return `${p1} {time_${timeCount++}}${p3 || ''}`;
      });

      // Save with blank formData to ensure it loads empty for the next use
      const { error } = await saveTemplate(name, {}, templateNarrative, extraPreview);
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

  // Drag and Drop Handlers
  const handleDragStart = (e, ct) => {
    e.dataTransfer.setData("vtsp/templateId", ct.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const templateId = e.dataTransfer.getData("vtsp/templateId");
    if (templateId && customTemplates) {
      const ct = customTemplates.find(t => t.id === templateId);
      if (ct) {
        setFormData(ct.data || {});
        const hydrated = hydrateHtmlTemplate(ct.preview || '');
        setThaiPreview(hydrated);
        if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = hydrated;
        
        setExtraPreview(ct.extra_preview || '');
        isEditingPreview.current = false;
      }
    }
  };

  const handleFolderDrop = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetFolderId(null);
    const templateId = e.dataTransfer.getData("vtsp/templateId");
    if (templateId) {
      moveTemplateToFolder(templateId, folderId);
    }
  };

  // Context Menu Handlers
  const onContextMenu = (e, type, id, data) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      type,
      id,
      data
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

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

        <div className="sidebar-scroll-area">
          {/* TOP SECTION: Actions & Custom Forms */}
          <div style={{ padding: '0 0.5rem' }}>
            <button 
              className="btn btn-primary btn-full" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}
              onClick={() => {
                const first = templatesData.find(t => t.mode === reportMode);
                handleFullReset();
                setSelectedTemplate(first);
              }}
            >
              <Plus size={16} /> สร้างรายงานใหม่
            </button>

            {/* PHASE 39: FOLDER SYSTEM */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
               <div className="history-title" style={{ margin: 0 }}>ฟอร์มรายงาน</div>
               <FolderPlus size={16} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => {
                  const name = window.prompt("ชื่อโฟลเดอร์ใหม่:");
                  if (name) createFolder(name);
               }} />
            </div>

            <div className="sidebar-folders" style={{ padding: '0.5rem 0' }}>
              {folders.map(folder => {
                const folderTemplates = customTemplates.filter(t => t.folder_id === folder.id);
                return (
                  <div key={folder.id} className="folder-item">
                    <div 
                      className={`folder-header ${dropTargetFolderId === folder.id ? 'drop-target' : ''}`}
                      onClick={() => toggleFolderExpansion(folder.id, folder.is_expanded)}
                      onContextMenu={(e) => onContextMenu(e, 'folder', folder.id, folder)}
                      onDragOver={(e) => { e.preventDefault(); setDropTargetFolderId(folder.id); }}
                      onDragLeave={() => setDropTargetFolderId(null)}
                      onDrop={(e) => handleFolderDrop(e, folder.id)}
                    >
                      <ChevronDown size={14} className={`folder-icon ${!folder.is_expanded ? 'collapsed' : ''}`} />
                      <Folder size={14} fill={folder.is_expanded ? 'var(--accent-indigo)' : 'none'} />
                      <span className="folder-name">{folder.name}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{folderTemplates.length}</span>
                    </div>
                    
                    {folder.is_expanded && (
                      <div className="folder-content">
                        {folderTemplates.length === 0 && <div className="folder-empty-text">ว่างเปล่า</div>}
                        {folderTemplates.map(ct => (
                          <div 
                            key={ct.id} 
                            className="template-item" 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, ct)}
                            onContextMenu={(e) => onContextMenu(e, 'template', ct.id, ct)}
                            onClick={() => loadAnyTemplate(ct, 'custom')}
                          >
                            <FileText size={12} style={{ opacity: 0.6 }} />
                            <span style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ct.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* General Templates (No folder) */}
              <div className="uncategorized-section">
                <div className="history-title" style={{ paddingLeft: '1.25rem', fontSize: '0.65rem' }}>ฟอร์มทั่วไป</div>
                {customTemplates.filter(t => !t.folder_id).map(ct => (
                  <div 
                    key={ct.id} 
                    className="template-item" 
                    style={{ marginLeft: '1.25rem' }}
                    draggable 
                    onDragStart={(e) => handleDragStart(e, ct)}
                    onContextMenu={(e) => onContextMenu(e, 'template', ct.id, ct)}
                    onClick={() => loadAnyTemplate(ct, 'custom')}
                  >
                    <FileText size={12} style={{ opacity: 0.6 }} />
                    <span style={{ fontSize: '0.8rem' }}>{ct.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '1rem 0.5rem' }} />

          {/* BOTTOM SECTION: History with Strict Pinning */}
          <div className="history-section" style={{ border: 'none', paddingTop: 0, paddingBottom: '2rem' }}>
            <div className="history-title">ประวัติเหตุการณ์</div>
            
            {pinnedHistory.map(item => (
              <div 
                key={item.id} 
                className="history-item" 
                style={{ borderLeft: '2px solid var(--accent-indigo)' }} 
                onContextMenu={(e) => onContextMenu(e, 'history', item.id, item)}
                onClick={() => loadAnyTemplate(item, 'history')}
              >
                <div className="history-info">
                  <span style={{ flex: 1, fontWeight: 'bold' }}>{getSmartTitle(item)}</span>
                  <Pin size={12} fill="var(--accent-indigo)" style={{ opacity: 0.6 }} />
                </div>
              </div>
            ))}
            
            {normalHistory.map(item => (
              <div 
                key={item.id} 
                className="history-item" 
                onContextMenu={(e) => onContextMenu(e, 'history', item.id, item)}
                onClick={() => loadAnyTemplate(item, 'history')}
              >
                <div className="history-info">
                  <span style={{ flex: 1 }}>{getSmartTitle(item)}</span>
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
        </div>

        <div className="mode-switcher" style={{ marginTop: 'auto', padding: '0.75rem 1rem' }}>
           <button 
             className="btn btn-primary btn-full" 
             style={{ height: '52px', fontSize: '0.9rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-blue))' }}
             onClick={() => setReportMode(reportMode === 'incident' ? 'violator' : 'incident')}
           >
              สลับเป็น: {reportMode === 'incident' ? 'รายงานผู้กระทำความผิด' : 'รายงานเหตุการณ์ไม่ปกติ'}
           </button>
        </div>
      </aside>

      <main className="main-content">
        <section 
          style={{ flex: '0 0 55%' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`card ${isDragOver ? 'drop-zone-active' : ''}`}>
            <div className="card-header">
              <h2 className="card-title">
                {selectedTemplate?.mode === 'incident' && selectedTemplate?.trigger === 'new' 
                  ? 'รายงานเหตุการณ์ไม่ปกติ' 
                  : (selectedTemplate?.name || 'กรุณาเลือกแม่แบบ')}
              </h2>
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleFullReset}>รีเซ็ต</button>
            </div>
            <div className="form-body">
              {dynamicFields.length > 0 ? (
                dynamicFields.map(field => (
                  <div key={field.id} className={`form-field ${field.type === 'list' || field.id.toLowerCase().includes('narrative') || field.id.toLowerCase().includes('update_text') ? 'full' : ''}`}>
                    <label>{field.label}</label>
                    {field.type === 'list' ? (
                      <div className="infinity-list">
                        {(Array.isArray(formData[field.id]) ? formData[field.id] : []).map((val, idx) => (
                           <input 
                              key={idx}
                              type="text" 
                              value={val || ''} 
                              placeholder={`เที่ยวบินที่ ${idx + 1}`}
                              style={{ marginBottom: '0.5rem' }}
                              onChange={(e) => {
                                const newList = [...(formData[field.id] || [])];
                                newList[idx] = e.target.value;
                                handleInputChange(field.id, newList);
                              }} 
                           />
                        ))}
                        {/* The "Next" input for growing the list */}
                        <input 
                           type="text" 
                           value="" 
                           placeholder="+ เพิ่มเที่ยวบินผลกระทบ..."
                           onChange={(e) => {
                             if (e.target.value.trim()) {
                               const newList = [...(formData[field.id] || []), e.target.value];
                               handleInputChange(field.id, newList);
                             }
                           }}
                        />
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        value={formData[field.id] || ''} 
                        onChange={(e) => handleInputChange(field.id, e.target.value)} 
                      />
                    )}
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1/-1', opacity: 0.5, textAlign: 'center', padding: '2rem' }}>
                  {isDragOver ? 'วางที่นี่เพื่อวิเคราะห์ข้อมูล...' : 'กรุณาเลือกแม่แบบหรือพิมพ์รายงานเพื่อเริ่มใช้งาน'}
                </div>
              )}
              {reportMode === 'incident' && (
                <div className="special-section full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <label className="toggle-container">
                    <input type="checkbox" checked={showCAAT} onChange={(e) => setShowCAAT(e.target.checked)} />
                    <span className="toggle-label">จัดทำรายงาน กพท.22</span>
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
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'var(--accent-indigo)' }} 
                  onClick={handleSaveAsTemplate}
                >
                  บันทึกเป็นฟอร์ม
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-indigo))' }} 
                  onClick={copyThai}
                >
                  คัดลอกและบันทึกประวัติ
                </button>
              </div>
            </div>
            <div className="preview-body-v2">
              <div 
                ref={thaiPreviewRef}
                className="preview-textarea" 
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(e) => {
                  // PHASE 61: MUTE REAL-TIME RENDER (Prevent Cursor Jump)
                  // We mark editing, but DO NOT call setThaiPreview here.
                  isEditingPreview.current = true;
                }}
                onBlur={(e) => {
                  // PHASE 61: ADAPTIVE SYNC (Sync state on focus loss)
                  setThaiPreview(e.currentTarget.innerHTML);
                  isEditingPreview.current = false;
                }}
                dangerouslySetInnerHTML={{ __html: thaiPreview }}
                style={{ whiteSpace: 'pre-wrap', minHeight: '300px' }}
              />
            </div>
            {showCAAT && reportMode === 'incident' && (
              <div className="preview-body-v2" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--accent-indigo-soft)', minHeight: '100px' }}>
                <div 
                  className="preview-textarea" 
                  style={{ color: 'var(--accent-indigo)', whiteSpace: 'pre-wrap' }} 
                  dangerouslySetInnerHTML={{ __html: extraPreview }}
                />
              </div>
            )}
          </div>
        </section>
      </main>
      {/* CUSTOM CONTEXT MENU */}
      {contextMenu && (
        <div 
          className="context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'history' && (
            <div className="context-item" onClick={() => {
              togglePin(contextMenu.id, contextMenu.data.isPinned);
              closeContextMenu();
            }}>
              <Pin size={14} fill={contextMenu.data.isPinned ? 'var(--accent-indigo)' : 'none'} /> 
              {contextMenu.data.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'}
            </div>
          )}
          
          <div className="context-item" onClick={() => {
            const currentTitle = contextMenu.type === 'history' ? getSmartTitle(contextMenu.data) : contextMenu.data.name;
            const newName = window.prompt("เปลี่ยนชื่อเป็น:", currentTitle);
            if (newName) {
              if (contextMenu.type === 'folder') renameFolder(contextMenu.id, newName);
              else if (contextMenu.type === 'history') renameReport(contextMenu.id, newName);
              else updateTemplateName(contextMenu.id, newName);
            }
            closeContextMenu();
          }}>
            <Edit2 size={14} /> เปลี่ยนชื่อ
          </div>
          <div className="context-item danger" onClick={() => {
            const typeLabel = contextMenu.type === 'folder' ? 'โฟลเดอร์' : (contextMenu.type === 'history' ? 'ประวัติ' : 'ฟอร์ม');
            if (window.confirm(`ยืนยันการลบ${typeLabel}นี้?`)) {
              if (contextMenu.type === 'folder') deleteFolder(contextMenu.id);
              else if (contextMenu.type === 'history') deleteReport(contextMenu.id);
              else deleteTemplate(contextMenu.id);
            }
            closeContextMenu();
          }}>
            <Trash2 size={14} /> ลบทิ้ง
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
