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
import Sidebar from './components/Sidebar/Sidebar';
import ReportForm from './components/ReportForm';
import PreviewArea from './components/PreviewArea';
import CAATModal from './components/CAATModal';
import ContextMenu from './components/ContextMenu';
import MobileHeader from './components/MobileHeader';
import DemoWarning from './components/DemoWarning';

const App = () => {
  // --- Auth & Persistence ---
  const [user, setUser] = useState(null);
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
      return;
    }

    // Use service to fetch session
    getActiveSession().then(userData => {
      if (userData) setUser(userData);
    });

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
  const [activeMobileTab, setActiveMobileTab] = useState('form');
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [isLoadingCAAT, setIsLoadingCAAT] = useState(false);
  const [translatedCAAT, setTranslatedCAAT] = useState('');
  const [isCAATModalOpen, setIsCAATModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  // --- Hooks ---
  const {
    thaiPreview,
    extraPreview,
    thaiPreviewRef,
    processAndLoadItem,
    handleInputChange: previewHandleInputChange,
    resetPreview,
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

  const dynamicFields = useDynamicFields(selectedTemplate, reportMode);

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
    setSelectedTemplate(null);
    setFormData({});
    resetPreview(reportMode);
  };

  const handleSwitchMode = (newMode) => {
    setReportMode(newMode);
    setSelectedTemplate(null);
    setFormData({});
    resetPreview(newMode);
  };

  const handleSelectTemplate = (item, type = 'template') => {
    const mode = item.mode || reportMode;
    setReportMode(mode);
    const { finalHtml, savedData } = processAndLoadItem(item, type);
    setFormData(savedData);
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
    previewHandleInputChange(id, value, setFormData);
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
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, type, id, data });
  };

  // --- Route Guards ---
  if (!user) return <Login onLogin={setUser} />;
  if (!reportMode) return (
    <ModeSelector 
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
              />
            </div>

            {/* Fixed Action Bar above Tab Bar (v27 Polish) */}
            <div className="mobile-action-bar" style={{ display: 'flex', gap: '8px' }}>
               <button 
                 className="btn btn-dark" 
                 style={{ flex: 1, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', padding: '10px 0' }}
                 onClick={() => {
                   const n = window.prompt("ชื่อฟอร์มที่จะบันทึก:", selectedTemplate?.name || "");
                   if (n) {
                     const currentHtml = thaiPreviewRef.current ? thaiPreviewRef.current.innerHTML : thaiPreview;
                     saveTemplate(n, formData, currentHtml, extraPreview, selectedTemplate?.folder_id);
                     alert('บันทึกฟอร์มเรียบร้อย');
                   }
                 }}
               >
                 บันทึก
               </button>
               <button 
                 className="btn btn-outline" 
                 onClick={handleCAATTranslate}
                 disabled={isLoadingCAAT}
                 style={{ flex: 1, border: '1px solid #0ea5e9', color: '#0ea5e9', padding: '10px 0' }}
               >
                 กพท.22
               </button>
               <button 
                 className="btn btn-primary" 
                 onClick={() => {
                   const text = thaiPreviewRef.current ? thaiPreviewRef.current.innerText : thaiPreview;
                   navigator.clipboard.writeText(text);
                   historyData.saveReport({
                     mode: reportMode,
                     templateName: selectedTemplate?.name || 'กำหนดเอง',
                     preview: text,
                     data: formData,
                   });
                   alert('คัดลอกและบันทึกแล้ว');
                 }}
                 style={{ flex: 2, background: '#0ea5e9', border: 'none', padding: '10px 0' }}
               >
                 คัดลอกและบันทึก
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
        deleteTemplate={deleteTemplate}
      />
    </div>
  );
};

export default App;
