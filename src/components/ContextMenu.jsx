import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const getSmartTitle = (h) => h.customTitle || h.template_name || 'รายงานเหตุการณ์';

const ContextMenu = ({
  contextMenu,
  setContextMenu,
  renameFolder,
  renameReport,
  updateTemplateName,
  deleteFolder,
  deleteReport,
  deleteTemplate,
  mappingFieldId,
  handleRenameField,
  handleDeleteField,
  handleStartMapping,
  handleExecuteMapping,
  customFieldLabels,
}) => {
  if (!contextMenu) return null;

  const handleRename = () => {
    if (contextMenu.type === 'field') {
      handleRenameField(contextMenu.id);
    } else {
      const currentTitle = contextMenu.type === 'history'
        ? getSmartTitle(contextMenu.data)
        : contextMenu.data.name;
      const newName = window.prompt("เปลี่ยนชื่อเป็น:", currentTitle);
      if (newName) {
        if (contextMenu.type === 'folder') renameFolder(contextMenu.id, newName);
        else if (contextMenu.type === 'history') renameReport(contextMenu.id, newName);
        else updateTemplateName(contextMenu.id, newName);
      }
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (contextMenu.type === 'field') {
      handleDeleteField(contextMenu.id);
    } else {
      if (window.confirm("ยืนยันการลบ?")) {
        if (contextMenu.type === 'folder') deleteFolder(contextMenu.id);
        else if (contextMenu.type === 'history') deleteReport(contextMenu.id);
        else deleteTemplate(contextMenu.id);
      }
    }
    setContextMenu(null);
  };

  const handleAction = (action) => {
    if (action === 'mapping') {
      handleExecuteMapping();
    } else if (action === 'copy') {
      document.execCommand('copy');
    } else if (action === 'paste') {
      document.execCommand('paste');
    } else if (action === 'selectAll') {
      document.execCommand('selectAll');
    }
    setContextMenu(null);
  };

  if (contextMenu.type === 'field') {
    return (
      <div
        className="context-menu"
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="context-item" onClick={handleRename}>
          <Edit2 size={14} /> เปลี่ยนชื่อ
        </div>
        <div className="context-item" onClick={() => { handleStartMapping(contextMenu.id); setContextMenu(null); }}>
          <Edit2 size={14} /> จับคู่ข้อความ
        </div>
        <div className="context-item danger" onClick={handleDelete}>
          <Trash2 size={14} /> ลบทิ้ง
        </div>
      </div>
    );
  }

  if (contextMenu.type === 'preview') {
    return (
      <div
        className="context-menu"
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="context-item" onClick={() => handleAction('selectAll')}>
          Select all
        </div>
        <div className="context-item" onClick={() => handleAction('copy')}>
          Copy
        </div>
        <div className="context-item" onClick={() => handleAction('paste')}>
          Paste
        </div>
        {mappingFieldId && contextMenu.selection && (
          <div className="context-item highlight" onClick={() => handleAction('mapping')} style={{ color: 'var(--accent-indigo)', fontWeight: 'bold', borderTop: '1px solid var(--border-subtle)' }}>
            Mapping ({customFieldLabels[mappingFieldId] || mappingFieldId})
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-item" onClick={handleRename}>
        <Edit2 size={14} /> เปลี่ยนชื่อ
      </div>
      <div className="context-item danger" onClick={handleDelete}>
        <Trash2 size={14} /> ลบทิ้ง
      </div>
    </div>
  );
};

export default ContextMenu;
