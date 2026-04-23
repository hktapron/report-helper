const GAS_URL = 'https://script.google.com/macros/s/AKfycbx9U_QsIf4X8W8U7LAxxROE-Rwy3yInKJ4GlwvMPYKWUMHl49bi0l7eRQ2mDXyKCJzl7A/exec';

export const logToSheets = (payload) => {
  const fd = payload.formData || {};
  // Send only metadata — preview/formData are already in Supabase
  // Thai text expands 3x on encodeURIComponent so keep payload tiny
  const slim = {
    event:        payload.event || 'SAVED',
    actor:        payload.actor || '',
    actorRole:    payload.actorRole || '',
    createdBy:    payload.createdBy || '',
    mode:         payload.mode || '',
    templateName: (payload.templateName || '').substring(0, 80),
    customTitle:  (payload.customTitle  || '').substring(0, 80),
    stand:    fd.stand    || fd.stand_no    || '',
    airline:  fd.airline  || '',
    flight:   fd.flight_no || fd.flight    || '',
    time:     fd.incident_time || fd.report_time || fd.time || '',
  };
  fetch(`${GAS_URL}?data=${encodeURIComponent(JSON.stringify(slim))}`, {
    mode: 'no-cors',
  }).catch(() => {});
};
