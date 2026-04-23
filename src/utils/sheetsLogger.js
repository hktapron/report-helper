const GAS_URL = 'https://script.google.com/macros/s/AKfycbwx_uvNzFyso1vQiPXCx0wIpJLPJ9tTzsvUSVD_ft2zr5rEY8eea3QYgOWwdT26XToJ6Q/exec';

export const logToSheets = (payload) => {
  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(payload),
    // no Content-Type header — no-cors only allows simple headers (text/plain)
    // GAS reads e.postData.contents as raw string regardless of content-type
  }).catch(() => {});
};
