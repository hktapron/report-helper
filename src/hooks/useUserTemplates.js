import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useUserTemplates = (currentUsername, reportMode) => {
  const [templates, setTemplates] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    if (!supabase || !currentUsername) return;
    setLoading(true);

    // 1. Fetch Folders
    const { data: folderData, error: folderError } = await supabase
      .from('user_folders')
      .select('*')
      .eq('user_id', currentUsername)
      .eq('mode', reportMode)
      .order('created_at', { ascending: true });

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
  }, [currentUsername]); // Removed reportMode dep - we fetch all modes now

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
    const { error } = await supabase
      .from('user_folders')
      .insert([{ name, mode: reportMode, user_id: currentUsername }]);
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
    // Note: Templates in the folder will have folder_id SET NULL due to DB constraint
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
    refreshAll: fetchAll 
  };
};
