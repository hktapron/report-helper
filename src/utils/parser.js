/* src/utils/parser.js */

/**
 * Format time input strings (e.g., "1430" -> "14.30").
 */
export const formatTimeInput = (val) => {
  const clean = val.replace(/[^0-9.]/g, "");
  if (/^\d{4}$/.test(clean)) {
    const hours = parseInt(clean.slice(0, 2), 10);
    const mins = parseInt(clean.slice(2), 10);
    // Validate: 00-23 hours and 00-59 minutes
    if (hours >= 0 && hours <= 23 && mins >= 0 && mins <= 59) {
      return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    }
  }
  return clean;
};

/**
 * Rules for intelligent narrative extraction.
 */
export const DIVERT_RULES = [
  { regex: /(เมื่อเวลา)\s*(\d{4}|\d{1,2}(?:[.]\d{2})?)/g, id: 'report_time' },
  { regex: /(ได้รับแจ้งจาก)\s+([^\sว่า]+)/g, id: 'informant' },
  { regex: /(เที่ยวบิน(?:ที่)?)\s+([A-Z0-9]{3,})/gi, id: 'flight_no' },
  { regex: /(คาดว่าจะถึง\s*ทภก\.\s*เวล?า?)\s*(\d{4}|\d{1,2}(?:[.]\d{2})?)/g, id: 'atc_time' },
  { regex: /(บินลงที่สนามบิน)\s+([^\s(<]+)/g, id: 'original_airport' },
  { regex: /(หลุมจอดฯ\s*หมายเลข|หมายเลข(?:\s*[:：])?)\s*(\d{1,2}[A-Z]?)/g, id: 'stand' }
];

/**
 * Rules for summary table synchronization.
 */
export const TABLE_LABELS = [
  { regex: /(เที่ยวบิน)\s*[:：]\s*([^{}\[\]\s<]+)/g, id: 'flight_no' },
  { regex: /(ทะเบียน)\s*[:：]\s*([^{}\[\]\s<]+)/g, id: 'ac_reg' },
  { regex: /(แบบอากาศยาน)\s*[:：]\s*([^{}\[\]\s<]+)/g, id: 'ac_type' },
  { regex: /(เส้นทางการบินเดิม|เส้นทางบิน)\s*[:：]\s*([^<\n\r]+)/g, id: 'route' },
  { regex: /(เวลาที่คาดว่าถึง\s*ทภก\.)\s*[:：]\s*(\d{4}|\d{1,2}(?:[.]\d{2})?)/g, id: 'atc_time' },
  { regex: /(เวลาออกจาก\s*ทภก\.)\s*[:：]\s*(\d{4}|\d{1,2}(?:[.]\d{2})?)/g, id: 'departure_time' }
];

/**
 * Hydrates a text/HTML template with sync-field spans for data binding.
 */
export const hydrateHtmlTemplate = (text) => {
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
  const applyDivertRules = (line) => {
    let l = line;
    DIVERT_RULES.forEach(rule => {
      try {
        l = l.replace(rule.regex, (match, label, val) => {
          if (!val || val.includes('<') || val.includes('{')) return match;
          let displayVal = val;
          if (['report_time', 'atc_time'].includes(rule.id)) {
            displayVal = formatTimeInput(val.trim());
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
  TABLE_LABELS.forEach(rule => {
    processed = processed.replace(rule.regex, (match, label, val) => {
      if (!val || val.includes('<')) return match;
      let displayVal = val.trim();
      if (TABLE_TIME_IDS.includes(rule.id)) {
        displayVal = formatTimeInput(displayVal);
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
