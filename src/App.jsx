import React, { useState, useEffect, useMemo } from 'react';
import { Edit2, Clock, Calendar, User } from 'lucide-react';

import { supabase } from './supabaseClient';
import { useHistory } from './hooks/useHistory';
import { useUserTemplates } from './hooks/useUserTemplates';
import { useHtmlPreview } from './hooks/useHtmlPreview';
import { useDynamicFields } from './hooks/useDynamicFields';
import { translateToCAAT22 } from './utils/translator';

import Login from './Login';
import ModeSelector from './components/ModeSelector';
import Sidebar from './components/Sidebar/Sidebar';
import DynamicForm from './components/DynamicForm';
import ReportPreview from './components/ReportPreview';
import CAATModal from './components/CAATModal';
import ContextMenu from './components/ContextMenu';

// Normalise a Supabase auth user → app user object
const formatAuthUser = (authUser) => ({
  id: authUser.id,
  username: authUser.user_metadata?.username || authUser.email.split('@')[0],
  display_name: authUser.user_metadata?.display_name || authUser.email.split('@')[0],
});

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
      // Demo mode: restore from localStorage
      const saved = localStorage.getItem('vtsp_user');
      if (saved) setUser(JSON.parse(saved));
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(formatAuthUser(session.user));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? formatAuthUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
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
    if (supabase) await supabase.auth.signOut();
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
    if (window.innerWidth <= 768) {
      setActiveMobileTab('form');
    }
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
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="app-title">{reportMode === 'incident' ? 'VTSP Incident' : 'ทภก. Violator'}</div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="header-action-btn"
            style={{ color: 'var(--accent-red)', padding: '0 4px' }}
            onClick={handleLogout}
            title="ออกจากระบบ"
          >
            <User size={18} />
          </button>
        </div>
      </div>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar
        user={user}
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
        <section className={`${activeMobileTab === 'form' ? 'mobile-visible' : ''}`}>
          <DynamicForm
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

        <section className={`${activeMobileTab === 'form' || activeMobileTab === 'preview' ? 'mobile-visible' : ''}`}>
          <ReportPreview
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

        <nav className="mobile-nav" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
      </main>

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
