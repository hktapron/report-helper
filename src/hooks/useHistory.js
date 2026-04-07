import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useHistory = () => {
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    if (supabase) {
      // If we have Supabase, try to fetch from DB
      const { data, error } = await supabase
        .from('incident_history')
        .select('*')
        .order('saved_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setHistory(data.map(item => ({
          id: item.id,
          templateName: item.template_name,
          preview: item.preview_thai,
          extraPreview: item.preview_extra,
          data: item.form_data,
          savedAt: item.saved_at
        })));
        return;
      }
    }

    // Fallback to localStorage
    const saved = localStorage.getItem('hkt_incident_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const saveReport = async (report) => {
    const newEntry = {
      ...report,
      id: Date.now(),
      savedAt: new Date().toISOString()
    };
    
    // Save to local for immediate feedback
    const newHistoryList = [newEntry, ...history].slice(0, 50);
    setHistory(newHistoryList);
    localStorage.setItem('hkt_incident_history', JSON.stringify(newHistoryList));

    // Save to Supabase if available
    if (supabase) {
      const { error } = await supabase.from('incident_history').insert([{
        template_name: report.templateName,
        preview_thai: report.preview,
        preview_extra: report.extraPreview,
        form_data: report.data,
        user_id: report.userId,
        saved_at: newEntry.savedAt
      }]);
      if (error) console.error('Supabase save error:', error);
    }
  };

  const deleteReport = async (id) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('hkt_incident_history', JSON.stringify(newHistory));

    if (supabase) {
      const { error } = await supabase.from('incident_history').delete().eq('id', id);
      if (error) console.error('Supabase delete error:', error);
    }
  };

  return { history, saveReport, deleteReport, refreshHistory: fetchHistory };
};
