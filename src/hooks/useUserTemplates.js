import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useUserTemplates = (currentUsername, reportMode) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    if (!supabase || !currentUsername) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('user_templates')
      .select('*')
      .eq('user_id', currentUsername)
      .eq('mode', reportMode)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [currentUsername, reportMode]);

  const saveTemplate = async (name, formData, preview, extraPreview) => {
    if (!supabase || !currentUsername) return;
    
    const { error } = await supabase
      .from('user_templates')
      .insert([{
        name,
        mode: reportMode,
        data: formData,
        preview,
        extra_preview: extraPreview,
        user_id: currentUsername
      }]);

    if (!error) fetchTemplates();
    return { error };
  };

  const deleteTemplate = async (id) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('user_templates')
      .delete()
      .eq('id', id);

    if (!error) fetchTemplates();
    return { error };
  };

  const updateTemplateName = async (id, newName) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('user_templates')
      .update({ name: newName })
      .eq('id', id);

    if (!error) fetchTemplates();
    return { error };
  };

  return { templates, loading, saveTemplate, deleteTemplate, updateTemplateName, refreshTemplates: fetchTemplates };
};
