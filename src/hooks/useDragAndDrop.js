import { useState } from 'react';

export const useDragAndDrop = ({ moveTemplateToFolder, moveFolder, folders }) => {
  const [dropIndicator, setDropIndicator] = useState(null); // { folderId, position: 'before'|'inside'|'after' }

  const handleFolderDragOver = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let position;
    if (y < rect.height * 0.3) position = 'before';
    else if (y > rect.height * 0.7) position = 'after';
    else position = 'inside';
    setDropIndicator({ folderId, position });
  };

  const handleFolderDrop = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setDropIndicator(null);
    const dragType = e.dataTransfer.getData('drag-type');
    if (dragType === 'template') {
      const tid = e.dataTransfer.getData('text/template-id');
      if (tid) moveTemplateToFolder(tid, folder.id);
    } else if (dragType === 'folder') {
      const fid = e.dataTransfer.getData('folder-id');
      if (!fid || fid === folder.id) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      let position;
      if (y < rect.height * 0.3) position = 'before';
      else if (y > rect.height * 0.7) position = 'after';
      else position = 'inside';
      moveFolder(fid, folder.id, position, folders);
    }
  };

  return { dropIndicator, setDropIndicator, handleFolderDragOver, handleFolderDrop };
};
