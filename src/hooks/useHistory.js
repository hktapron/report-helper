import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useHistory = (currentUsername) => {
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    if (!supabase) return;

    // Filter by our custom username directly in the query
    const { data, error } = await supabase
      .from('incident_history')
      .select('*')
      .eq('user_id', currentUsername || 'unknown') // Filter by custom user_id
      .order('saved_at', { ascending: false });

    if (!error && data) {
      setHistory(data.map(item => ({
        id: item.id,
        mode: item.mode,
        templateName: item.template_name,
        preview: item.preview,
        extraPreview: item.extra_preview,
        data: item.data,
        customTitle: item.custom_title,
        isPinned: item.is_pinned,
        savedAt: item.saved_at
      })));
    }
  };

  useEffect(() => {
    if (currentUsername) {
      fetchHistory();
    }
  }, [currentUsername]);

  const saveReport = async (report) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('incident_history')
      .insert([{
        mode: report.mode,
        template_name: report.templateName,
        preview: report.preview,
        extra_preview: report.extraPreview,
        data: report.data,
        user_id: currentUsername || 'unknown'
      }]);

    if (!error) fetchHistory();
  };

  const renameReport = async (id, newTitle) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('incident_history')
      .update({ custom_title: newTitle })
      .eq('id', id);

    if (!error) fetchHistory();
  };

  const deleteReport = async (id) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('incident_history')
      .delete()
      .eq('id', id);

    if (!error) fetchHistory();
  };

  const togglePin = async (id, currentStatus) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('incident_history')
      .update({ is_pinned: !currentStatus })
      .eq('id', id);
    if (!error) fetchHistory();
  };

  return { history, saveReport, renameReport, deleteReport, togglePin, refreshHistory: fetchHistory };
};
