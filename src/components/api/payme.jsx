// src/api/payme.js

// 1) Backend API manziling
const API_URL = "https://api.calvero.work";

// 2) Paycom Basic Auth (TEST)
//   Bu — "Paycom:&o1cGusyR#IuRFVTuzOXSehhvXgEhSRsxffW" ning base64 ko‘rinishi
//   Hech narsani o'zgartirmang, aynan shu satr bo'lsin:
const AUTH = "UGF5Y29tOiZvMWNHdXN5UiNJdVJGVlR1ek9YU2VoaHZYZ0VoU1JzeGZmVw==";

export async function callPayme(method, params) {
  const r = await fetch(`${API_URL}/payme/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${AUTH}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });

  // agar tarmoq xatosi bo'lsa (CORS/SSL) fetch xato tashlaydi
  let data = null;
  try { data = await r.json(); } catch (e) { throw new Error("Network/JSON error"); }

  if (data.error) {
    throw new Error(`${data.error.code}: ${data.error.message}`);
  }
  return data.result;
}