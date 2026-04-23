const GAS_URL = 'https://script.google.com/macros/s/AKfycbzgu-uNPcRxBWnNGIqgTnLaozcBcsSiTi4pZIZaQhpOlRQyEv3Zt9_r3JooSMIur2_BEA/exec';

export const logToSheets = (payload) => {
  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(payload),
    // no Content-Type header — no-cors only allows simple headers (text/plain)
    // GAS reads e.postData.contents as raw string regardless of content-type
  }).catch(() => {});
};
