import React from 'react';
import { Plus, FolderPlus, User } from 'lucide-react';
import FolderTree from './FolderTree';
import HistoryList from './HistoryList';
import templatesData from '../../templates.json';

const Sidebar = ({
  user,
  reportMode,
  handleSwitchMode,
  handleLogout,
  handleFullReset,
  isSidebarOpen,
  setIsSidebarOpen,
  activeMobileTab,
  setActiveMobileTab,
  searchTerm,
  setSearchTerm,
  folderTree,
  folders,
  customTemplates,
  history,
  onSelectTemplate,
  onContextMenu,
  toggleFolderExpansion,
  moveTemplateToFolder,
  moveFolder,
  createFolder,
}) => {
  const matchesSearch = (text) =>
    !searchTerm || String(text).toLowerCase().includes(searchTerm.toLowerCase());

  const filteredCustomTemplates = customTemplates.filter(
    t => t.mode === reportMode && matchesSearch(t.name)
  );
  const filteredTemplates = (templatesData || [])
    .filter(t => t.mode === reportMode && (t.id === 'new_report' || t.id === 'violator_core'))
    .filter(t => matchesSearch(t.name));
  const filteredHistory = history
    .filter(h => (h.mode || 'incident') === reportMode)
    .filter(h => matchesSearch(h.customTitle || h.templateName || 'รายงานเหตุการณ์'));

  return (
    <aside
      className={`sidebar ${isSidebarOpen ? 'open' : ''} ${activeMobileTab === 'templates' ? 'mobile-active-templates' : ''} ${activeMobileTab === 'history' ? 'mobile-active-history' : ''}`}
    >
      <div className="sidebar-header" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div className="app-title" style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-indigo)' }}>VTSP</div>
          {window.innerWidth > 768 && (
            <button
              className="btn btn-mode-switch"
              style={{ fontSize: '10px', whiteSpace: 'nowrap' }}
              onClick={() => handleSwitchMode(reportMode === 'incident' ? 'violator' : 'incident')}
            >
              {reportMode === 'incident' ? 'สลับรายงานผู้กระทำความผิด' : 'สลับรายงานเหตุการณ์ไม่ปกติ'}
            </button>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          User: <strong>{user.username}</strong>
        </div>
      </div>

      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="ค้นหาฟอร์มหรือประวัติ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="sidebar-scroll-area">
        <div style={{ padding: '0 0.5rem' }}>
          <button
            className="btn btn-primary btn-full"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}
            onClick={() => {
              handleFullReset();
              if (window.innerWidth <= 768) setActiveMobileTab('form');
            }}
          >
            <Plus size={16} /> สร้างรายงานใหม่
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
            <div className="history-title" style={{ margin: 0 }}>ฟอร์มรายงาน</div>
            <FolderPlus
              size={16}
              style={{ cursor: 'pointer', opacity: 0.6 }}
              onClick={() => {
                const n = window.prompt("ชื่อฟอร์มที่จะบันทึก:");
                if (n) createFolder(n);
              }}
            />
          </div>

          <FolderTree
            folderTree={folderTree}
            filteredCustomTemplates={filteredCustomTemplates}
            filteredTemplates={filteredTemplates}
            searchTerm={searchTerm}
            matchesSearch={matchesSearch}
            onSelectTemplate={onSelectTemplate}
            onContextMenu={onContextMenu}
            toggleFolderExpansion={toggleFolderExpansion}
            moveTemplateToFolder={moveTemplateToFolder}
            moveFolder={moveFolder}
            folders={folders}
          />
        </div>

        <HistoryList
          filteredHistory={filteredHistory}
          onSelectTemplate={onSelectTemplate}
          onContextMenu={onContextMenu}
          activeMobileTab={activeMobileTab}
        />

        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '1rem' }}>
          <button
            className="btn btn-ghost btn-full"
            style={{ color: 'var(--accent-red)', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            <User size={16} style={{ marginRight: '8px' }} /> ออกจากระบบ
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
