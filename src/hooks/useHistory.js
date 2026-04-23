import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logToSheets } from '../utils/sheetsLogger';

export const useHistory = (user) => {
  const userId = user?.id;
  const username = user?.username || user?.display_name || user?.email || 'Unknown';
  const userRole = user?.role || '';

  const [history, setHistory] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async (append = false) => {
    if (!supabase || !userId) return;
    setLoading(true);

    const limit = 50;
    const offset = append ? history.length : 0;

    // RLS enforces user isolation — explicit filter is belt-and-suspenders
    const { data, error } = await supabase
      .from('incident_history')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!error && data) {
      const formatted = data.map(item => ({
        id: item.id,
        mode: item.mode,
        templateName: item.template_name,
        preview: item.preview,
        extraPreview: item.extra_preview,
        data: item.data,
        customTitle: item.custom_title,
        isPinned: item.is_pinned,
        savedAt: item.saved_at
      }));

      if (append) {
        setHistory(prev => [...prev, ...formatted]);
      } else {
        setHistory(formatted);
      }
      
      setHasMore(data.length === limit);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const saveReport = async (report) => {
    if (!supabase || !userId) return;

    const { error } = await supabase
      .from('incident_history')
      .insert([{
        mode: report.mode,
        template_name: report.templateName,
        preview: report.preview,
        extra_preview: report.extraPreview,
        data: report.data,
        user_id: userId,
      }]);

    if (!error) {
      fetchHistory();
      logToSheets({
        event: 'SAVED',
        actor: username,
        actorRole: userRole,
        createdBy: username,
        mode: report.mode,
        templateName: report.templateName,
        customTitle: report.customTitle || '',
        preview: report.preview || '',
        formData: report.data || {},
      });
    }
  };

  const renameReport = async (id, newTitle) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('incident_history')
      .update({ custom_title: newTitle })
      .eq('id', id);

    if (!error) fetchHistory();
  };

  const deleteReport = async (id, item, deletedByUser) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('incident_history')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchHistory();
      const actor = deletedByUser?.username || deletedByUser?.display_name || username;
      const actorRole = deletedByUser?.role || userRole;
      logToSheets({
        event: 'DELETED',
        actor,
        actorRole,
        createdBy: item?.createdBy || '',
        mode: item?.mode || '',
        templateName: item?.templateName || item?.template_name || '',
        customTitle: item?.customTitle || '',
        preview: item?.preview || '',
        formData: item?.data || {},
      });
    }
  };

  const togglePin = async (id, currentStatus) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('incident_history')
      .update({ is_pinned: !currentStatus })
      .eq('id', id);
    if (!error) fetchHistory();
  };

  return { 
    history, 
    hasMore, 
    loading, 
    saveReport, 
    renameReport, 
    deleteReport, 
    togglePin, 
    refreshHistory: () => fetchHistory(false),
    loadMore: () => fetchHistory(true)
  };
};
