import React from 'react';
import { Folder, ChevronDown, FileText } from 'lucide-react';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

const FolderTree = ({
  folderTree,
  filteredCustomTemplates,
  filteredTemplates,
  searchTerm,
  matchesSearch,
  onSelectTemplate,
  onContextMenu,
  toggleFolderExpansion,
  moveTemplateToFolder,
  moveFolder,
  folders,
}) => {
  const { dropIndicator, setDropIndicator, handleFolderDragOver, handleFolderDrop } = useDragAndDrop({
    moveTemplateToFolder,
    moveFolder,
    folders,
  });

  const renderFolderItem = (folder, depth = 0) => {
    const folderTemplates = filteredCustomTemplates.filter(t => t.folder_id === folder.id);
    const totalCount = folderTemplates.length + (folder.children?.length || 0);
    if (searchTerm && totalCount === 0 && !matchesSearch(folder.name)) return null;
    const indicator = dropIndicator?.folderId === folder.id ? dropIndicator.position : null;

    return (
      <div key={folder.id} className="folder-item" style={{ marginLeft: depth > 0 ? 10 : 0 }}>
        {indicator === 'before' && (
          <div style={{ height: 2, background: 'var(--accent-indigo)', borderRadius: 1, margin: '1px 0' }} />
        )}
        <div
          className="folder-header"
          draggable
          onDragStart={(e) => {
            if (window.innerWidth <= 768) { e.preventDefault(); return; }
            e.dataTransfer.setData('drag-type', 'folder');
            e.dataTransfer.setData('folder-id', folder.id);
            e.dataTransfer.effectAllowed = 'move';
            e.stopPropagation();
          }}
          onDragEnd={() => setDropIndicator(null)}
          onDragOver={(e) => handleFolderDragOver(e, folder.id)}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropIndicator(null); }}
          onDrop={(e) => handleFolderDrop(e, folder)}
          onClick={() => toggleFolderExpansion(folder.id, folder.is_expanded)}
          onContextMenu={(e) => onContextMenu(e, 'folder', folder.id, folder)}
          style={{ outline: indicator === 'inside' ? '2px dashed var(--accent-indigo)' : 'none', cursor: 'grab' }}
        >
          <ChevronDown size={14} className={`folder-icon ${!folder.is_expanded ? 'collapsed' : ''}`} />
          <Folder size={14} fill={folder.is_expanded ? 'var(--accent-indigo)' : 'none'} />
          <span className="folder-name">{folder.name}</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{folderTemplates.length}</span>
        </div>
        {indicator === 'after' && (
          <div style={{ height: 2, background: 'var(--accent-indigo)', borderRadius: 1, margin: '1px 0' }} />
        )}
        {(folder.is_expanded || searchTerm) && (
          <div className="folder-content">
            {folder.children?.map(child => renderFolderItem(child, depth + 1))}
            {folderTemplates.map(ct => (
              <div
                key={ct.id}
                className="template-item"
                draggable
                onDragStart={(e) => {
                  if (window.innerWidth <= 768) { e.preventDefault(); return; }
                  e.dataTransfer.setData('drag-type', 'template');
                  e.dataTransfer.setData('text/template-id', ct.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => onSelectTemplate(ct, 'custom')}
                onContextMenu={(e) => onContextMenu(e, 'template', ct.id, ct)}
                style={{ cursor: 'grab' }}
              >
                <FileText size={12} style={{ opacity: 0.6 }} />
                <span style={{ fontSize: '0.8rem' }}>{ct.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar-folders" style={{ padding: '0.5rem 0' }}>
      {folderTree.map(f => renderFolderItem(f))}

      {/* Uncategorized drop zone */}
      <div
        className="uncategorized-section"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          e.currentTarget.style.outline = '2px dashed var(--accent-indigo)';
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.style.outline = '';
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.outline = '';
          const dragType = e.dataTransfer.getData('drag-type');
          if (dragType === 'template') {
            const tid = e.dataTransfer.getData('text/template-id');
            if (tid) moveTemplateToFolder(tid, null);
          } else if (dragType === 'folder') {
            const fid = e.dataTransfer.getData('folder-id');
            if (fid) moveFolder(fid, null, null, folders);
          }
        }}
      >
        <div className="history-title" style={{ paddingLeft: '1.25rem', fontSize: '0.65rem' }}>ฟอร์มทั่วไป</div>
        {filteredTemplates.map(t => (
          <div
            key={t.id}
            className="template-item"
            style={{ marginLeft: '1.25rem' }}
            onClick={() => onSelectTemplate(t)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(e, 'system-template', t.id, t);
            }}
          >
            <FileText size={12} style={{ opacity: 0.6 }} />
            <span style={{ fontSize: '0.8rem' }}>{t.name}</span>
          </div>
        ))}
        {filteredCustomTemplates.filter(t => !t.folder_id).map(ct => (
          <div
            key={ct.id}
            className="template-item"
            style={{ marginLeft: '1.25rem', cursor: 'grab' }}
            draggable
            onDragStart={(e) => {
              if (window.innerWidth <= 768) { e.preventDefault(); return; }
              e.dataTransfer.setData('drag-type', 'template');
              e.dataTransfer.setData('text/template-id', ct.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => onSelectTemplate(ct, 'custom')}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(e, 'template', ct.id, ct);
            }}
          >
            <FileText size={12} style={{ opacity: 0.6 }} />
            <span style={{ fontSize: '0.8rem' }}>{ct.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderTree;
