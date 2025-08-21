// src/api/payme.js
const API_URL = import.meta.env.VITE_API_URL || "https://api.calvero.work";

export async function callPayme(method, params, auth) {
  const r = await fetch(`${API_URL}/payme/callback`, {  // ✅ lokal yoki prod
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
  });
  const data = await r.json();
  if (data.error) throw new Error(`${data.error.code}: ${data.error.message}`);
  return data.result;
}