import { useState, useEffect, useRef } from 'react';

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
      thaiPreviewRef.current.innerHTML = thaiPreview;
    }
  }, [thaiPreview]);

  const formatTimeInput = (val) => {
    const clean = val.replace(/[^0-9.]/g, "");
    if (/^\d{4}$/.test(clean)) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    return clean;
  };

  const hydrateHtmlTemplate = (text) => {
    if (!text) return '';
    let processed = String(text);

    // IDEMPOTENCY CHECK: If already hydrated, just return as-is
    if (processed.includes('sync-field')) {
      return processed;
    }

    const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    const lines = processed.split('\n');
    if (lines.length > 2 && lines[1].includes('วันที่')) {
      lines[1] = lines[1].replace(/วันที่\s?([^\n\r<]*)/, `วันที่ ${dateStr}`);
      processed = lines.join('\n');
    }

    // 1. SMART NARRATIVE LOGIC
    // RULE: Skip lines starting with รายงาน or วันที่ (header/date lines)
    const divertRules = [
      { regex: /(เมื่อเวลา)\s*(\d{4}|\d{1,2}(?:[.]\d{2})?)/g, id: 'report_time' },
      { regex: /(ได้รับแจ้งจาก)\s+([^\sว่า]+)/g, id: 'informant' },
      { regex: /(เที่ยวบิน(?:ที่)?)\s+([A-Z0-9]{3,})/gi, id: 'flight_no' },
      { regex: /(คาดว่าจะถึง\s*ทภก\.\s*เวล?า?)\s*(\d{4}|\d{1,2}(?:[.]\d{2})?)/g, id: 'atc_time' },
      { regex: /(บินลงที่สนามบิน)\s+([^\s(<]+)/g, id: 'original_airport' },
      { regex: /(หลุมจอดฯ\s*หมายเลข|หมายเลข(?:\s*[:：])?)\s*(\d{1,2}[A-Z]?)/g, id: 'stand' }
    ];

    const applyDivertRules = (line) => {
      let l = line;
      divertRules.forEach(rule => {
        try {
          l = l.replace(rule.regex, (match, label, val) => {
            if (!val || val.includes('<') || val.includes('{')) return match;
            let displayVal = val;
            if (['report_time', 'atc_time'].includes(rule.id)) {
              const t = val.trim();
              displayVal = /^\d{4}$/.test(t) ? `${t.slice(0, 2)}.${t.slice(2)}` : t;
            }
            return match.replace(val, `<span class="sync-field" data-field="${rule.id}" contenteditable="false" style="color: #3b82f6; font-weight: bold;">${displayVal}</span>`);
          });
        } catch(e) { console.warn(`Rule ${rule.id} error:`, e); }
      });
      return l;
    };

    const headerPattern = /^\s*(รายงาน|วันที่)/;
    processed = processed.split('\n').map(line =>
      headerPattern.test(line) ? line : applyDivertRules(line)
    ).join('\n');

    // 2. SUMMARY TABLE LOGIC
    const TABLE_TIME_IDS = ['atc_time', 'departure_time'];
    const tableLabels = [
      { regex: /(เที่ยวบิน)\s*[:：]\s*([^{}\[\]\s<]+)/g, id: 'flight_no' },
      { regex: /(ทะเบียน)\s*[:：]\s*([^{}\[\]\s<]+)/g, id: 'ac_reg' },
      { regex: /(แบบอากาศยาน)\s*[:：]\s*([^{}\[\]\s<]+)/g, id: 'ac_type' },
      { regex: /(เส้นทางการบินเดิม|เส้นทางบิน)\s*[:：]\s*([^<\n\r]+)/g, id: 'route' },
      { regex: /(เวลาที่คาดว่าถึง\s*ทภก\.)\s*[:：]\s*(\d{4}|\d{1,2}(?:[.]\d{2})?)/g, id: 'atc_time' },
      { regex: /(เวลาออกจาก\s*ทภก\.)\s*[:：]\s*(\d{4}|\d{1,2}(?:[.]\d{2})?)/g, id: 'departure_time' }
    ];

    tableLabels.forEach(rule => {
      processed = processed.replace(rule.regex, (match, label, val) => {
        if (!val || val.includes('<')) return match;
        let displayVal = val.trim();
        if (TABLE_TIME_IDS.includes(rule.id)) {
          if (/^\d{4}$/.test(displayVal)) displayVal = `${displayVal.slice(0, 2)}.${displayVal.slice(2)}`;
        }
        return match.replace(val, `<span class="sync-field" data-field="${rule.id}" contenteditable="false" style="color: #3b82f6; font-weight: bold;">${displayVal}</span>`);
      });
    });

    // 3. EXPLICIT VARIABLE HYDRATION ({var} and [var])
    processed = processed.replace(/\{(\w+)\}|\[(\w+)\]/g, (match, p1, p2) => {
      const id = p1 || p2;
      return `<span class="sync-field" data-field="${id}" contenteditable="false" style="color: #3b82f6; font-weight: bold;">${match}</span>`;
    });

    return processed;
  };

  const getDefaultHtml = (mode) => {
    const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    const text = mode === 'incident'
      ? `รายงานเหตุการณ์ไม่ปกติ\nวันที่ ${dateStr}\n\n\n\n\n\n=============\nงานบริหารหลุมจอด (Apron Control)\nสบข.ฝปข.ทภก.\nTel. 076-351-581\n=============`
      : `รายงานผู้กระทำความผิด\nวันที่ ${dateStr}\n\nเมื่อเวลา {incident_time} น. เจ้าหน้าที่งานกะควบคุมจราจรภาคพื้น ได้ตรวจพบ {violator_name} หมายเลขบัตร {id_card} สังกัด {company} ตำแหน่ง {position}\n\nได้ ขับรถ {vehicle_type} หมายเลข {vehicle_no} ภายในเขตลานจอดอากาศยานบริเวณ {location} โดย ขับรถ \n\nสบข.ฝปข.ทภก. พิจารณาแล้ว การกระทำดังกล่าวไม่ปฏิบัติตามหลักเกณฑ์ของ ทภก. ทั้งนี้ สบข.ฝปข.ทภก. ได้ทำการยึดบัตร {violator_name} เป็นเวลา {seizure_days} วัน ตั้งแต่วันที่ {seizure_start} - {seizure_end} และแจ้งให้เข้ารับการทบทวนการอบรมการขับขี่ยานพาหนะในเขตลานจอดฯ ในวันพุธที่ {retraining_date}\n\n=============\nงานควบคุมจราจรภาคพื้น (Follow Me)\nสบข.ฝปข.ทภก.\nTel. 076-351-085\n=============`;
    return hydrateHtmlTemplate(text);
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
    if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = finalHtml;
    isEditingPreview.current = type === 'history';
    return { finalHtml, savedData };
  };

  /**
   * Syncs a form field change to the preview DOM and state.
   * Accepts setFormData from App to avoid coupling.
   */
  const handleInputChange = (id, value, setFormData) => {
    const isTimeField = /^(report_time|atc_time|departure_time|incident_time|std|sta|atd|ata|time_\d+)$/i.test(id);
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
    if (thaiPreviewRef.current) thaiPreviewRef.current.innerHTML = html;
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
