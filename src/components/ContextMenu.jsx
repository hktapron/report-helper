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
}) => {
  if (!contextMenu) return null;

  const handleRename = () => {
    const currentTitle = contextMenu.type === 'history'
      ? getSmartTitle(contextMenu.data)
      : contextMenu.data.name;
    const newName = window.prompt("เปลี่ยนชื่อเป็น:", currentTitle);
    if (newName) {
      if (contextMenu.type === 'folder') renameFolder(contextMenu.id, newName);
      else if (contextMenu.type === 'history') renameReport(contextMenu.id, newName);
      else updateTemplateName(contextMenu.id, newName);
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (window.confirm("ยืนยันการลบ?")) {
      if (contextMenu.type === 'folder') deleteFolder(contextMenu.id);
      else if (contextMenu.type === 'history') deleteReport(contextMenu.id);
      else deleteTemplate(contextMenu.id);
    }
    setContextMenu(null);
  };

  return (
    <div
      className="context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.type === 'system-template' ? (
        <div className="context-item disabled" style={{ opacity: 0.6, fontSize: '0.75rem', cursor: 'default' }}>
          ฟอร์มมาตรฐาน (อ่านอย่างเดียว)
        </div>
      ) : (
        <>
          <div className="context-item" onClick={handleRename}>
            <Edit2 size={14} /> เปลี่ยนชื่อ
          </div>
          <div className="context-item danger" onClick={handleDelete}>
            <Trash2 size={14} /> ลบทิ้ง
          </div>
        </>
      )}
    </div>
  );
};

export default ContextMenu;
