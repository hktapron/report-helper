import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { DEFAULT_INCIDENT_BODY, DEFAULT_VIOLATOR_BODY } from '../constants/templates';
import { hydrateHtmlTemplate, formatTimeInput } from '../utils/parser';

const sanitize = (html) => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

export const useHtmlPreview = () => {
  const [thaiPreview, setThaiPreview] = useState('');
  const [extraPreview, setExtraPreview] = useState('');
  const thaiPreviewRef = useRef(null);
  const isEditingPreview = useRef(false);
  const currentPreviewId = useRef(null);

  // THE REAL FIX: dangerouslySetInnerHTML does NOT update contentEditable divs after first render.
  // We MUST write to the DOM directly via ref whenever the preview content changes.
  useEffect(() => {
    if (thaiPreviewRef.current) {
      thaiPreviewRef.current.innerHTML = sanitize(thaiPreview);
    }
  }, [thaiPreview]);

  const getDefaultHtml = (mode) => {
    const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    const template = mode === 'incident' ? DEFAULT_INCIDENT_BODY : DEFAULT_VIOLATOR_BODY;
    const body = template.replace('{current_date}', dateStr);
    return hydrateHtmlTemplate(body);
  };

  /**
   * Hydrates an item (template or history) into the preview DOM.
   * Returns { finalHtml, savedData } so App.jsx can update its own state.
   */
  const processAndLoadItem = (item, type) => {
    const body = item.preview || item.content || "";
    const savedData = item.data || {};
    const hydrated = hydrateHtmlTemplate(body);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = hydrated;

    // Apply saved formData values into spans
    tempDiv.querySelectorAll('.sync-field[data-field]').forEach(s => {
      const key = s.getAttribute('data-field');
      if (savedData[key]) s.innerText = savedData[key];
    });

    const finalHtml = tempDiv.innerHTML;
    setThaiPreview(finalHtml);

    // GUARANTEED DOM write: useEffect won't fire if html hasn't changed
    if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = sanitize(finalHtml);
    isEditingPreview.current = type === 'history';
    return { finalHtml, savedData };
  };

  /**
   * Syncs a form field change to the preview DOM and state.
   * Accepts setFormData from App to avoid coupling.
   */
  const handleInputChange = (id, value, setFormData, customFieldLabels = {}) => {
    // 1. Check ID-based time fields
    const isIdTimeField = /^(report_time|atc_time|departure_time|incident_time|std|sta|atd|ata|time_\d+)$/i.test(id);
    
    // 2. Check Label-based time fields (v62 Smart Logic)
    const label = customFieldLabels[id] || '';
    const isLabelTimeField = /เวลา|time/i.test(label);

    const isTimeField = isIdTimeField || isLabelTimeField;
    
    const finalValue = isTimeField ? formatTimeInput(value) : value;
    if (thaiPreviewRef.current) {
      thaiPreviewRef.current.querySelectorAll(`.sync-field[data-field="${id}"]`).forEach(s => {
        s.innerText = finalValue || `{${id}}`;
      });
      setThaiPreview(thaiPreviewRef.current.innerHTML);
    }
    setFormData(prev => ({ ...prev, [id]: finalValue }));
  };

  /**
   * Resets the preview to the default template for the given mode.
   */
  const resetPreview = (mode) => {
    const html = getDefaultHtml(mode);
    setThaiPreview(html);
    if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = sanitize(html);
  };

  return {
    thaiPreview,
    setThaiPreview,
    extraPreview,
    setExtraPreview,
    thaiPreviewRef,
    isEditingPreview,
    currentPreviewId,
    hydrateHtmlTemplate,
    getDefaultHtml,
    processAndLoadItem,
    handleInputChange,
    resetPreview,
  };
};
