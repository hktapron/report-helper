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
 * Hydrates a text/HTML template with sync-field spans for data binding.
 * v70: Simplified - NO MORE AUTO-MAPPING. Only explicit variable hydration.
 */
export const hydrateHtmlTemplate = (text) => {
  if (!text) return '';
  let processed = String(text);

  // IDEMPOTENCY CHECK: If already hydrated, just return as-is
  if (processed.includes('sync-field')) {
    return processed;
  }

  // Preserve the Thai Date logic for the header
  const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const lines = processed.split('\n');
  if (lines.length > 2 && lines[1].includes('วันที่')) {
    lines[1] = lines[1].replace(/วันที่\s?([^\n\r<]*)/, `วันที่ ${dateStr}`);
    processed = lines.join('\n');
  }

  // EXPLICIT VARIABLE HYDRATION ONLY ({var} and [var])
  // No more Divert Rules or Table Labels auto-guessing.
  processed = processed.replace(/\{(\w+)\}|\[(\w+)\]/g, (match, p1, p2) => {
    const id = p1 || p2;
    return `<span class="sync-field" data-field="${id}" contenteditable="false" style="color: #3b82f6; font-weight: bold;">${match}</span>`;
  });

  return processed;
};
