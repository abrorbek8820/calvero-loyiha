// src/api/payme.js

// API manzil — backend server
const API_URL = "https://api.calvero.work";

// Paycom test auth (base64 qilib yozilgan)
// Misol: echo -n "Paycom:TEST_PAROL" | base64
const AUTH = "UGF5Y29tOlRlc3QjUGFyb2w=";

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

  const data = await r.json();
  if (data.error) {
    throw new Error(`${data.error.code}: ${data.error.message}`);
  }
  return data.result; // result qaytadi
}