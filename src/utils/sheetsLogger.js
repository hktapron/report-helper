const GAS_URL = 'https://script.google.com/macros/s/AKfycbzgu-uNPcRxBWnNGIqgTnLaozcBcsSiTi4pZIZaQhpOlRQyEv3Zt9_r3JooSMIur2_BEA/exec';

export const logToSheets = (payload) => {
  const form = new FormData();
  form.append('data', JSON.stringify(payload));
  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: form,
  }).catch(() => {});
};
