import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useUserTemplates = (currentUsername, reportMode) => {
  const [templates, setTemplates] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    if (!supabase || !currentUsername) return;
    setLoading(true);

    // 1. Fetch Folders — ordered by sort_order
    const { data: folderData, error: folderError } = await supabase
      .from('user_folders')
      .select('*')
      .eq('user_id', currentUsername)
      .eq('mode', reportMode)
      .order('sort_order', { ascending: true });

    if (!folderError && folderData) {
      setFolders(folderData);
    }

    // 2. Fetch Templates (all modes - filter done in component)
    const { data: templateData, error: templateError } = await supabase
      .from('user_templates')
      .select('*')
      .eq('user_id', currentUsername)
      .order('created_at', { ascending: false });

    if (!templateError && templateData) {
      setTemplates(templateData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [currentUsername]);

  // Accept mode explicitly to avoid stale closure bug
  const saveTemplate = async (name, formData, preview, extraPreview, folderId = null, mode = reportMode) => {
    if (!supabase || !currentUsername) return;
    
    const { error } = await supabase
      .from('user_templates')
      .insert([{
        name,
        mode: mode,
        data: formData,
        preview,
        extra_preview: extraPreview,
        user_id: currentUsername,
        folder_id: folderId
      }]);

    if (!error) fetchAll();
    return { error };
  };

  const deleteTemplate = async (id) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('user_templates')
      .delete()
      .eq('id', id);

    if (!error) fetchAll();
    return { error };
  };

  const updateTemplateName = async (id, newName) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('user_templates')
      .update({ name: newName })
      .eq('id', id);

    if (!error) fetchAll();
    return { error };
  };

  const moveTemplateToFolder = async (templateId, folderId) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('user_templates')
      .update({ folder_id: folderId })
      .eq('id', templateId);

    if (!error) fetchAll();
    return { error };
  };

  // --- Folder Methods ---
  const createFolder = async (name) => {
    if (!supabase || !currentUsername) return;
    // New folder goes at the end: max sort_order + 10
    const maxOrder = folders.length > 0
      ? Math.max(...folders.map(f => f.sort_order || 0)) + 10
      : 0;
    const { error } = await supabase
      .from('user_folders')
      .insert([{ name, mode: reportMode, user_id: currentUsername, sort_order: maxOrder }]);
    if (!error) fetchAll();
    return { error };
  };

  const renameFolder = async (id, newName) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('user_folders')
      .update({ name: newName })
      .eq('id', id);
    if (!error) fetchAll();
    return { error };
  };

  const deleteFolder = async (id) => {
    if (!supabase) return;
    // Templates in the folder will have folder_id SET NULL due to DB constraint
    // Subfolders will have parent_id SET NULL (promoted to root)
    const { error } = await supabase
      .from('user_folders')
      .delete()
      .eq('id', id);
    if (!error) fetchAll();
    return { error };
  };

  const toggleFolderExpansion = async (id, currentStatus) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('user_folders')
      .update({ is_expanded: !currentStatus })
      .eq('id', id);
    if (!error) fetchAll();
    return { error };
  };

  /**
   * Move a folder:
   * - position 'inside': make dragged folder a child of target
   * - position 'before'/'after': reorder among siblings (same parent_id)
   * 
   * Safety: prevents circular references (can't drop folder into its own descendant)
   */
  const moveFolder = async (draggedId, targetId, position, currentFolders) => {
    if (!supabase || !draggedId || draggedId === targetId) return;

    // Circular reference guard: check if targetId is a descendant of draggedId
    const isDescendant = (folderId, ancestorId, allFolders) => {
      const folder = allFolders.find(f => f.id === folderId);
      if (!folder || !folder.parent_id) return false;
      if (folder.parent_id === ancestorId) return true;
      return isDescendant(folder.parent_id, ancestorId, allFolders);
    };

    if (position === 'inside' && isDescendant(targetId, draggedId, currentFolders)) {
      console.warn('Cannot create circular folder reference');
      return;
    }

    const target = currentFolders.find(f => f.id === targetId);
    if (!target) return;

    if (position === 'inside') {
      // Nest draggedId as child of targetId
      const children = currentFolders
        .filter(f => (f.parent_id || null) === targetId && f.id !== draggedId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const newSortOrder = children.length > 0
        ? Math.max(...children.map(f => f.sort_order || 0)) + 10
        : 0;
      await supabase.from('user_folders')
        .update({ parent_id: targetId, sort_order: newSortOrder })
        .eq('id', draggedId);
    } else {
      // Reorder among siblings (same parent as target)
      const newParentId = target.parent_id || null;
      const siblings = currentFolders
        .filter(f => (f.parent_id || null) === newParentId && f.id !== draggedId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      const targetIdx = siblings.findIndex(f => f.id === targetId);
      const insertAt = position === 'before' ? targetIdx : targetIdx + 1;

      // Insert dragged folder at new position and rebuild sort orders
      const reordered = [...siblings];
      reordered.splice(insertAt, 0, { id: draggedId });

      await Promise.all(
        reordered.map((f, idx) =>
          supabase.from('user_folders')
            .update({ parent_id: newParentId, sort_order: idx * 10 })
            .eq('id', f.id)
        )
      );
    }

    fetchAll();
  };

  return { 
    templates, 
    folders, 
    loading, 
    saveTemplate, 
    deleteTemplate, 
    updateTemplateName, 
    moveTemplateToFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleFolderExpansion,
    moveFolder,
    refreshAll: fetchAll 
  };
};
