const GAS_URL = 'https://script.google.com/macros/s/AKfycbx9U_QsIf4X8W8U7LAxxROE-Rwy3yInKJ4GlwvMPYKWUMHl49bi0l7eRQ2mDXyKCJzl7A/exec';

export const logToSheets = (payload) => {
  const params = new URLSearchParams();
  params.append('data', JSON.stringify(payload));
  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: params,
  }).catch(() => {});
};
