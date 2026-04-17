import React, { useState, useEffect, useMemo } from 'react';
import { Edit2, Clock, Calendar, User } from 'lucide-react';

import { supabase } from './supabaseClient';
import { formatAuthUser, getActiveSession, signOut } from './services/supabase';
import { useHistory } from './hooks/useHistory';
import { useUserTemplates } from './hooks/useUserTemplates';
import { useHtmlPreview } from './hooks/useHtmlPreview';
import { useDynamicFields } from './hooks/useDynamicFields';
import { translateToCAAT22 } from './utils/translator';
import { APP_VERSION } from './constants/templates';

import Login from './Login';
import ModeSelector from './components/ModeSelector';
import UsageLogView from './components/UsageLogView';
import AccountManagementView from './components/AccountManagementView';
import Sidebar from './components/Sidebar/Sidebar';
import ReportForm from './components/ReportForm';
import PreviewArea from './components/PreviewArea';
import CAATModal from './components/CAATModal';
import ContextMenu from './components/ContextMenu';
import MobileHeader from './components/MobileHeader';
import DemoWarning from './components/DemoWarning';
import SaveTemplateModal from './components/SaveTemplateModal';
import FieldNamingModal from './components/FieldNamingModal';

const App = () => {
  // --- Auth & Persistence ---
  const [user, setUser] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [reportMode, setReportMode] = useState(() => {
    const saved = localStorage.getItem('vtsp_report_mode');
    return (saved === 'incident' || saved === 'violator') ? saved : null;
  });

  // Restore Supabase session on mount; listen for auth changes
  useEffect(() => {
    if (!supabase) {
      // demo mode: restore from localstorage
      const saved = localStorage.getItem('vtsp_user');
      if (saved) setUser(JSON.parse(saved));
      setIsLoadingSession(false);
      return;
    }

    // Use service to fetch session
    getActiveSession().then(userData => {
      if (userData) setUser(userData);
      setIsLoadingSession(false);
    }).catch(() => setIsLoadingSession(false));

    // Close context menu on any click (v27 FIX)
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? formatAuthUser(session.user) : null);
    });

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // Demo mode only: persist user to localStorage
  useEffect(() => {
    if (supabase) return;
    if (user) localStorage.setItem('vtsp_user', JSON.stringify(user));
    else localStorage.removeItem('vtsp_user');
  }, [user]);

  useEffect(() => {
    if (reportMode) localStorage.setItem('vtsp_report_mode', reportMode);
    else localStorage.removeItem('vtsp_report_mode');
  }, [reportMode]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setReportMode(null);
    localStorage.removeItem('vtsp_report_mode');
    localStorage.removeItem('vtsp_user');
    window.location.reload();
  };

  // --- UI State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAccountViewOpen, setIsAccountViewOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('form');
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [isLoadingCAAT, setIsLoadingCAAT] = useState(false);
  const [translatedCAAT, setTranslatedCAAT] = useState('');
  const [isCAATModalOpen, setIsCAATModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [mappingFieldId, setMappingFieldId] = useState(null);
  const [customFieldLabels, setCustomFieldLabels] = useState(() => {
    const saved = localStorage.getItem('vtsp_custom_labels');
    return saved ? JSON.parse(saved) : {};
  });
  const [manualFields, setManualFields] = useState([]);
  const [saveModalData, setSaveModalData] = useState({ isOpen: false, currentName: '', folderId: null, templateId: null });
  const [isFieldNamingModalOpen, setIsFieldNamingModalOpen] = useState(false);
  const [pendingMappingSelection, setPendingMappingSelection] = useState(null);
  const [hiddenTemplateIds, setHiddenTemplateIds] = useState(() => {
    const saved = localStorage.getItem('vtsp_hidden_templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [hiddenFieldIds, setHiddenFieldIds] = useState(() => {
    const saved = localStorage.getItem('vtsp_hidden_fields');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist hidden templates/fields
  useEffect(() => {
    localStorage.setItem('vtsp_hidden_templates', JSON.stringify(hiddenTemplateIds));
  }, [hiddenTemplateIds]);
  useEffect(() => {
    localStorage.setItem('vtsp_hidden_fields', JSON.stringify(hiddenFieldIds));
  }, [hiddenFieldIds]);

  // Persist custom labels
  useEffect(() => {
    localStorage.setItem('vtsp_custom_labels', JSON.stringify(customFieldLabels));
  }, [customFieldLabels]);

  // --- Hooks ---
  const {
    thaiPreview,
    setThaiPreview,
    extraPreview,
    thaiPreviewRef,
    processAndLoadItem,
    handleInputChange: previewHandleInputChange,
    resetPreview,
    getDefaultHtml,
  } = useHtmlPreview();

  const historyData = useHistory(user?.id);
  const { history, renameReport, deleteReport } = historyData;

  const {
    templates: customTemplates,
    folders,
    saveTemplate,
    deleteTemplate,
    updateTemplateName,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleFolderExpansion,
    moveTemplateToFolder,
    moveFolder,
  } = useUserTemplates(user?.id, reportMode);
  
  const logActivity = async (action, target, details = {}) => {
    if (!supabase || !user) return;
    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_name: user.username || user.display_name,
        role: user.role,
        action_type: action,
        target_name: target,
        details: details
      });
    } catch (e) { console.error("Logging failed:", e); }
  };

  const rawDynamicFields = useDynamicFields(selectedTemplate, reportMode, manualFields, customFieldLabels);
  const dynamicFields = useMemo(() => 
    rawDynamicFields.filter(f => !hiddenFieldIds.includes(f.id)),
    [rawDynamicFields, hiddenFieldIds]
  );

  // Build hierarchical folder tree from flat list (memoized)
  const folderTree = useMemo(() => {
    const activeFolders = folders.filter(f => f.mode === reportMode);
    const sorted = [...activeFolders].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const nodeMap = {};
    sorted.forEach(f => { nodeMap[f.id] = { ...f, children: [] }; });
    const roots = [];
    sorted.forEach(f => {
      if (f.parent_id && nodeMap[f.parent_id]) {
        nodeMap[f.parent_id].children.push(nodeMap[f.id]);
      } else {
        roots.push(nodeMap[f.id]);
      }
    });
    return roots;
  }, [folders, reportMode]);

  // --- Actions ---
  const handleFullReset = () => {
    initBlankReport(reportMode);
    setMappingFieldId(null);
  };

  const handleSwitchMode = (newMode) => {
    setReportMode(newMode);
    initBlankReport(newMode);
    setMappingFieldId(null);
  };

  const initBlankReport = (mode) => {
    const defaultHtml = getDefaultHtml(mode);
    setThaiPreview(defaultHtml);
    setFormData({});
    setManualFields([]);
    setSelectedTemplate({
      id: `blank_${mode}_${Date.now()}`,
      name: mode === 'incident' ? 'รายงานเหตุการณ์ (กำหนดเอง)' : 'รายงานผู้กระทำความผิด (กำหนดเอง)',
      mode,
      preview: defaultHtml,
    });
  };

  // Initial load: Prepare a blank report but ONLY if mode is already known
  useEffect(() => {
    if (user && reportMode && !selectedTemplate) {
      initBlankReport(reportMode);
    }
  }, [user, reportMode]);

  const handleDeleteTemplate = async (templateId) => {
    const isSystem = !(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(templateId));
    if (isSystem) {
      setHiddenTemplateIds(prev => [...new Set([...prev, templateId])]);
      logActivity('hide_system_template', templateId);
    } else {
      await deleteTemplate(templateId);
      logActivity('delete_custom_template', templateId);
    }
    
    // Clear selection if deleted
    if (selectedTemplate?.id === `template_${templateId}`) {
      setSelectedTemplate(null);
      setFormData({});
      resetPreview(reportMode);
    }
  };

  const handleSelectTemplate = (item, type = 'template') => {
    const mode = item.mode || reportMode;
    setReportMode(mode);
    const { finalHtml, savedData } = processAndLoadItem(item, type);
    setFormData(savedData);
    
    // Clear mapping state when changing templates to prevent cross-linking
    setMappingFieldId(null);

    // If it's a blank template, clear manual fields to ensure clean slate
    if (item.id === 'blank') {
      setManualFields([]);
    }

    setSelectedTemplate({
      id: `${type}_${item.id || 'new'}_${Date.now()}`,
      name: item.name || item.customTitle || item.templateName || (type === 'history' ? 'จากประวัติ' : 'กำหนดเอง'),
      mode,
      preview: finalHtml,
    });
    setIsSidebarOpen(false);
    // Auto-jump to "Data Entry" tab on mobile
    setActiveMobileTab('form');
  };

  const handleInputChange = (id, value) => {
    previewHandleInputChange(id, value, setFormData, customFieldLabels);
  };

  const handleAddField = () => {
    const label = window.prompt("ชื่อหัวข้อที่ต้องการเพิ่ม:");
    if (!label) return;
    const id = `custom_${Date.now()}`;
    setCustomFieldLabels(prev => ({ ...prev, [id]: label }));
    setManualFields(prev => [...prev, id]);
  };

  const handleDeleteField = (id) => {
    if (!window.confirm(`ยืนยันการลบหัวข้อ "${customFieldLabels[id] || id}"?`)) return;
    
    // Hide from form
    setHiddenFieldIds(prev => [...new Set([...prev, id])]);
    setManualFields(prev => prev.filter(fid => fid !== id));
    logActivity('delete_field', customFieldLabels[id] || id);
    
    // Remove from mapping in HTML
    if (thaiPreviewRef.current) {
      // THE FIX: Target ALL sync-field spans with the matching data-field
      const selector = `.sync-field[data-field="${id}"]`;
      thaiPreviewRef.current.querySelectorAll(selector).forEach(el => {
        const text = el.innerText;
        el.outerHTML = text; // Keep text, remove span
      });
      setThaiPreview(thaiPreviewRef.current.innerHTML);
    }
    
    // Clean up formData
    setFormData(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    
    if (mappingFieldId === id) setMappingFieldId(null);
  };

  const handleRenameField = (id) => {
    const oldLabel = customFieldLabels[id] || id;
    const newLabel = window.prompt("เปลี่ยนชื่อเป็น:", oldLabel);
    if (newLabel && newLabel !== oldLabel) {
      setCustomFieldLabels(prev => ({ ...prev, [id]: newLabel }));
    }
  };

  const handleStartMapping = (id) => {
    setMappingFieldId(id);
    // Silent mode - no alert per user request
  };

  const handleConfirmFieldNaming = (name) => {
    if (!pendingMappingSelection || !name) return;

    const fieldId = `custom_${Date.now()}`;
    
    // 1. Add to labels and manual fields
    setCustomFieldLabels(prev => ({ ...prev, [fieldId]: name }));
    setManualFields(prev => [...prev, fieldId]);

    // 2. Wrap in HTML
    if (thaiPreviewRef.current && pendingMappingSelection.range) {
      const range = pendingMappingSelection.range;
      const span = document.createElement('span');
      span.className = 'sync-field';
      span.dataset.field = fieldId;
      span.innerText = pendingMappingSelection.text;
      
      range.deleteContents();
      range.insertNode(span);
      
      setThaiPreview(thaiPreviewRef.current.innerHTML);
    }

    setIsFieldNamingModalOpen(false);
    setPendingMappingSelection(null);
  };

  const handleConnectMapping = (selection) => {
    if (!selection || !mappingFieldId) return;

    if (thaiPreviewRef.current && selection.range) {
      const range = selection.range;
      const span = document.createElement('span');
      span.className = 'sync-field';
      span.dataset.field = mappingFieldId;
      span.innerText = selection.text;
      
      range.deleteContents();
      range.insertNode(span);
      
      setThaiPreview(thaiPreviewRef.current.innerHTML);
    }
  };

  const handleSaveTemplateChoice = async (type, newNameFromModal) => {
    const { currentName, folderId, templateId } = saveModalData;
    let targetName = currentName;
    let targetTemplateId = null;

    if (type === 'saveNew') {
      if (!newNameFromModal) return;
      targetName = newNameFromModal;
    } else {
      // Overwrite
      targetTemplateId = templateId;
    }

    const currentHtml = thaiPreviewRef.current ? thaiPreviewRef.current.innerHTML : thaiPreview;
    const { error } = await saveTemplate(targetName, formData, currentHtml, extraPreview, folderId, reportMode, targetTemplateId);

    if (!error) {
      logActivity(type === 'overwrite' ? 'update_template' : 'create_template', targetName);
      // Silent close - no alert per user request
      setSaveModalData({ ...saveModalData, isOpen: false });
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
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

  const onContextMenu = (e, type, id, data) => {
    // RBAC: Operations cannot use mapping features
    if (user?.role === 'operation') return;

    e.preventDefault();
    const selection = window.getSelection();
    const selectionText = selection?.toString();
    
    setContextMenu({ 
      x: e.pageX, 
      y: e.pageY, 
      type, 
      id, 
      data,
      selection: selectionText,
      selectionRange: selectionText && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    });
  };

  // --- Route Guards ---
  if (isLoadingSession) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--accent-indigo)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          <div style={{ fontWeight: '700', letterSpacing: '2px' }}>VTSP STATION LOADING...</div>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLogin={setUser} />;
  
  if (isAccountViewOpen) {
    return (
      <div className="app-container">
        <AccountManagementView 
          user={user} 
          logActivity={logActivity}
          onBack={() => setIsAccountViewOpen(false)} 
          onLogout={handleLogout}
        />
      </div>
    );
  }

  if (reportMode === 'logs') {
    return (
      <div className="app-container">
        <UsageLogView onBack={() => setReportMode(null)} />
      </div>
    );
  }

  if (!reportMode) return (
    <ModeSelector 
      user={user}
      onSelect={(m) => { 
        setReportMode(m); 
        resetPreview(m); 
        if (window.innerWidth <= 768) setActiveMobileTab('templates');
      }} 
    />
  );

  return (
    <div className="app-container">
      <DemoWarning show={!supabase} />
      <MobileHeader 
        reportMode={reportMode} 
        onMenuToggle={() => setIsSidebarOpen(true)}
        onProfileToggle={() => setIsAccountViewOpen(true)}
        onLogout={handleLogout}
        hasWarning={!supabase}
      />

      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar
        user={user}
        className="pc-sidebar"
        reportMode={reportMode}
        handleSwitchMode={handleSwitchMode}
        toggleAccountView={() => setIsAccountViewOpen(true)}
        handleLogout={handleLogout}
        handleFullReset={handleFullReset}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeMobileTab={activeMobileTab}
        setActiveMobileTab={setActiveMobileTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        folderTree={folderTree}
        folders={folders}
        customTemplates={customTemplates}
        hiddenTemplateIds={hiddenTemplateIds}
        history={history}
        onSelectTemplate={handleSelectTemplate}
        onContextMenu={onContextMenu}
        toggleFolderExpansion={toggleFolderExpansion}
        moveTemplateToFolder={moveTemplateToFolder}
        moveFolder={moveFolder}
        createFolder={createFolder}
      />

      <main className={`main-content ${isSplitMode && activeMobileTab === 'form' ? 'split-active' : ''}`}>
        {/* MOBILE UNIFIED FORM LAYOUT (v26) */}
        {window.innerWidth <= 768 && activeMobileTab === 'form' ? (
          <div className="mobile-unified-container">
            <div className="preview-scroll-zone">
              <PreviewArea
                thaiPreviewRef={thaiPreviewRef}
                thaiPreview={thaiPreview}
                activeMobileTab={activeMobileTab}
                reportMode={reportMode}
                handleSwitchMode={handleSwitchMode}
                isLoadingCAAT={isLoadingCAAT}
                onCAATTranslate={handleCAATTranslate}
                saveTemplate={saveTemplate}
                saveReport={historyData.saveReport}
                selectedTemplate={selectedTemplate}
                formData={formData}
                extraPreview={extraPreview}
                isSplitMode={isSplitMode}
                setSaveModalData={setSaveModalData}
              />
            </div>
            
            <div className="divider-line" />
            
            <div className="form-scroll-zone">
              <ReportForm
                selectedTemplate={selectedTemplate}
                reportMode={reportMode}
                dynamicFields={dynamicFields}
                formData={formData}
                onInputChange={handleInputChange}
                onReset={handleFullReset}
                activeMobileTab={activeMobileTab}
                setActiveMobileTab={setActiveMobileTab}
                isSplitMode={isSplitMode}
                setIsSplitMode={setIsSplitMode}
                thaiPreview={thaiPreview}
                onAddField={handleAddField}
                onContextMenu={onContextMenu}
                mappingFieldId={mappingFieldId}
              />
            </div>

            {/* Fixed Action Bar above Tab Bar (v27 Polish) */}
            <div className="mobile-action-bar">
               <button 
                 className="btn btn-dark" 
                 onClick={() => {
                   const idParts = selectedTemplate?.id?.split('_') || [];
                   const isCustom = idParts[0] === 'custom' || idParts[0] === 'template';
                   const originalUuid = isCustom ? idParts[1] : null;

                   setSaveModalData({
                     isOpen: true,
                     currentName: selectedTemplate?.name || '',
                     folderId: selectedTemplate?.folder_id,
                     templateId: (isCustom && originalUuid !== 'new') ? originalUuid : null
                   });
                 }}
               >
                 บันทึก
               </button>
               <button 
                 className="btn btn-primary" 
                 onClick={handleCAATTranslate}
                 disabled={isLoadingCAAT}
               >
                 แปลภาษา
               </button>
               <button 
                 className="btn btn-outline" 
                 onClick={() => {
                   const text = thaiPreviewRef.current ? thaiPreviewRef.current.innerText : thaiPreview;
                   navigator.clipboard.writeText(text);
                   historyData.saveReport({
                     mode: reportMode,
                     templateName: selectedTemplate?.name || 'กำหนดเอง',
                     preview: text,
                     data: formData,
                   });
                   alert('คัดลอกและเก็บประวัติแล้ว');
                 }}
               >
                 คัดลอกและเก็บประวัติ
               </button>
            </div>
          </div>
        ) : (
          <>
            <section className={`pc-form-section ${activeMobileTab === 'form' ? 'mobile-visible' : ''}`}>
              <ReportForm
                selectedTemplate={selectedTemplate}
                reportMode={reportMode}
                dynamicFields={dynamicFields}
                formData={formData}
                onInputChange={handleInputChange}
                onReset={handleFullReset}
                activeMobileTab={activeMobileTab}
                setActiveMobileTab={setActiveMobileTab}
                isSplitMode={isSplitMode}
                setIsSplitMode={setIsSplitMode}
                thaiPreview={thaiPreview}
                onAddField={handleAddField}
                onContextMenu={onContextMenu}
                mappingFieldId={mappingFieldId}
              />
            </section>

            <section className={`pc-preview-section ${activeMobileTab === 'preview' ? 'mobile-visible' : ''}`}>
              <PreviewArea
                thaiPreviewRef={thaiPreviewRef}
                thaiPreview={thaiPreview}
                activeMobileTab={activeMobileTab}
                reportMode={reportMode}
                handleSwitchMode={handleSwitchMode}
                isLoadingCAAT={isLoadingCAAT}
                onCAATTranslate={handleCAATTranslate}
                saveTemplate={saveTemplate}
                saveReport={historyData.saveReport}
                selectedTemplate={selectedTemplate}
                formData={formData}
                extraPreview={extraPreview}
                isSplitMode={isSplitMode}
                onContextMenu={onContextMenu}
                setSaveModalData={setSaveModalData}
              />
            </section>
          </>
        )}
      </main>

      {/* MOBILE TAB BAR (Always at bottom on mobile) */}
      {window.innerWidth <= 768 && (
        <nav className="mobile-nav">
          <button
            className={`nav-item ${activeMobileTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveMobileTab('templates')}
          >
            <Calendar size={20} /><span>ฟอร์มเหตุการณ์</span>
          </button>
          <button
            className={`nav-item ${activeMobileTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveMobileTab('form')}
          >
            <Edit2 size={20} /><span>กรอกข้อมูล</span>
          </button>
        </nav>
      )}

      <CAATModal
        isOpen={isCAATModalOpen}
        onClose={() => setIsCAATModalOpen(false)}
        translatedCAAT={translatedCAAT}
        onConfirm={() => {
          navigator.clipboard.writeText(translatedCAAT);
          historyData.saveReport({
            mode: reportMode,
            templateName: (selectedTemplate?.name || 'กำหนดเอง') + ' (CAAT)',
            preview: translatedCAAT,
            data: formData,
          });
          alert('คัดลอกรายงาน กพท.22 เรียบร้อยแล้ว');
          setIsCAATModalOpen(false);
        }}
      />

      <ContextMenu
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        renameFolder={renameFolder}
        renameReport={renameReport}
        updateTemplateName={updateTemplateName}
        deleteFolder={deleteFolder}
        deleteReport={deleteReport}
        deleteTemplate={handleDeleteTemplate}
        onSelectTemplate={handleSelectTemplate}
        onContextMenu={onContextMenu}
        user={user}
        mappingFieldId={mappingFieldId}
        setMappingFieldId={setMappingFieldId}
        handleRenameField={handleRenameField}
        handleDeleteField={handleDeleteField}
        handleStartMapping={handleStartMapping}
        handleStartNewMapping={(sel) => {
          setPendingMappingSelection(sel);
          setIsFieldNamingModalOpen(true);
        }}
        handleConnectMapping={handleConnectMapping}
        customFieldLabels={customFieldLabels}
        onAddField={handleAddField}
      />

      <SaveTemplateModal 
        isOpen={saveModalData.isOpen}
        onClose={() => setSaveModalData({ ...saveModalData, isOpen: false })}
        currentName={saveModalData.currentName}
        onOverwrite={() => handleSaveTemplateChoice('overwrite')}
        onSaveNew={(name) => handleSaveTemplateChoice('saveNew', name)}
      />

      <FieldNamingModal
        isOpen={isFieldNamingModalOpen}
        onClose={() => setIsFieldNamingModalOpen(false)}
        onConfirm={handleConfirmFieldNaming}
      />
    </div>
  );
};

export default App;
