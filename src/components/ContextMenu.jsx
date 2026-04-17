import React from 'react';
import { Edit2, Trash2, Plus, Link } from 'lucide-react';

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
  handleRenameField,
  handleDeleteField,
  handleStartNewMapping,
  handleConnectMapping,
  onAddField,
  mappingFieldId,
  setMappingFieldId,
}) => {
  if (!contextMenu) return null;

  // SYSTEM TEMPLATE IDs that cannot be deleted/renamed
  const SYSTEM_IDS = ['new_report', 'apu_technical', 'violator_core'];
  const isSystem = typeof contextMenu.id === 'string' && SYSTEM_IDS.includes(contextMenu.id);

  const handleRename = () => {
    if (contextMenu.type === 'field') {
      handleRenameField(contextMenu.id);
    } else {
      if (contextMenu.type === 'template') {
        const isActuallySystem = ['new_report'].includes(contextMenu.id); // Only block rename for absolute core
        if (isActuallySystem) {
          alert("ไม่สามารถเปลี่ยนชื่อฟอร์มมาตรฐานได้");
          setContextMenu(null);
          return;
        }
      }

      const currentTitle = contextMenu.type === 'history'
        ? getSmartTitle(contextMenu.data)
        : contextMenu.data.name;
      const newName = window.prompt("เปลี่ยนชื่อเป็น:", currentTitle);
      if (newName) {
        if (contextMenu.type === 'folder') renameFolder(contextMenu.id, newName);
        else if (contextMenu.type === 'history') renameReport(contextMenu.id, newName);
        else if (contextMenu.type === 'template') updateTemplateName(contextMenu.id, newName);
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
        else if (contextMenu.type === 'template') deleteTemplate(contextMenu.id);
      }
    }
    setContextMenu(null);
  };

  const handleAction = (action) => {
    if (action === 'mapping') {
      if (mappingFieldId) {
        handleConnectMapping({
          text: contextMenu.selection,
          range: contextMenu.selectionRange
        });
      } else {
        handleStartNewMapping({
          text: contextMenu.selection,
          range: contextMenu.selectionRange
        });
      }
    } else if (action === 'copy') {
      document.execCommand('copy');
    } else if (action === 'paste') {
      document.execCommand('paste');
    } else if (action === 'selectAll') {
      document.execCommand('selectAll');
    }
    setContextMenu(null);
  };

  const canModify = user?.role === 'supervisor' || user?.role === 'admin';

  if (contextMenu.type === 'field') {
    return (
      <div
        className="context-menu"
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        {canModify && (
          <div className="context-item" onClick={handleRename}>
            <Edit2 size={14} /> เปลี่ยนชื่อ
          </div>
        )}
        <div className={`context-item ${mappingFieldId === contextMenu.id ? 'active-mapping' : ''}`} onClick={() => { setMappingFieldId(mappingFieldId === contextMenu.id ? null : contextMenu.id); setContextMenu(null); }} style={{ color: 'var(--accent-indigo)', fontWeight: 'bold' }}>
          <Plus size={14} /> {mappingFieldId === contextMenu.id ? 'ยกเลิกการเพิ่มจุดจับคู่' : 'เพิ่มการจับคู่'}
        </div>
        {canModify && (
          <div className="context-item danger" onClick={handleDelete}>
            <Trash2 size={14} /> ลบทิ้ง
          </div>
        )}
      </div>
    );
  }

  if (contextMenu.type === 'preview') {
    const isConnectingMapping = !!mappingFieldId;
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
        {contextMenu.selection && (
          <div className="context-item highlight" onClick={() => handleAction('mapping')} style={{ color: 'var(--accent-indigo)', fontWeight: 'bold', borderTop: '1px solid var(--border-subtle)' }}>
            <Link size={14} /> {isConnectingMapping ? 'เชื่อมข้อมูลกับหัวข้อนี้' : 'Mapping'}
          </div>
        )}
      </div>
    );
  }

  if (contextMenu.type === 'form') {
    return (
      <div
        className="context-menu"
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        {canModify ? (
          <div className="context-item highlight" onClick={() => { onAddField(); setContextMenu(null); }} style={{ color: 'var(--accent-indigo)', fontWeight: 'bold' }}>
            <Plus size={14} /> เพิ่มหัวข้อใหม่
          </div>
        ) : (
          <div className="context-item disabled" style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '0.75rem', padding: '0.8rem' }}>
            ไม่มีสิทธิ์เพิ่มหัวข้อใหม่
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
      {canModify && (
        <div className="context-item" onClick={handleRename}>
          <Edit2 size={14} /> เปลี่ยนชื่อ
        </div>
      )}
      {canModify && (
        <div className="context-item danger" onClick={handleDelete}>
          <Trash2 size={14} /> ลบทิ้ง
        </div>
      )}
      {!canModify && (
        <div className="context-item disabled" style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '0.75rem', padding: '0.8rem' }}>
          เฉพาะ Supervisor/Admin ที่จัดการฟอร์มได้
        </div>
      )}
    </div>
  );
};

export default ContextMenu;
