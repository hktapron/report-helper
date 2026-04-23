const GAS_URL = 'https://script.google.com/macros/s/AKfycbx9U_QsIf4X8W8U7LAxxROE-Rwy3yInKJ4GlwvMPYKWUMHl49bi0l7eRQ2mDXyKCJzl7A/exec';

export const logToSheets = (payload) => {
  // Use GET + URL params — POST body gets dropped on GAS redirect
  const data = encodeURIComponent(JSON.stringify({
    ...payload,
    preview: payload.preview ? payload.preview.replace(/<[^>]*>/g, ' ').trim().substring(0, 300) : '',
  }));
  fetch(`${GAS_URL}?data=${data}`, { mode: 'no-cors' }).catch(() => {});
};
