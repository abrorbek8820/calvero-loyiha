import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Backend bazaviy URL (dev/production auto)
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://api.calvero.work');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default function VerifyCodeForm({ phone, onVerified }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    const clean = code.trim();
    if (!/^\d{6}$/.test(clean)) {
      setStatus('❌ 6 xonali kod kiriting');
      return;
    }

    // ✅ faqat prop orqali kelgan raqamga ruxsat (oqimni yopiq ushlab turamiz)
    const digits = String(phone || '').replace(/\D/g, '');
    if (!/^998\d{9}$/.test(digits)) {
      setStatus('❌ Telefon formati noto‘g‘ri (998XXXXXXXXX)');
      return;
    }

    setLoading(true);
    setStatus('');
    try {
      const { data } = await api.post('/api/verify-code', { phone: digits, code: clean });
      // backend: { ok:true } yoki xatoda { ok:false, reason/msg }
      if (data?.ok === true || data?.success === true) {
        setStatus('✅ Tasdiqlandi');
        if (onVerified) {
          onVerified(digits); // VerifyPage ichida replace bilan navigate qiladi
        } else {
          // ✅ fallback: brauzer tarixida verify qolmasin
          navigate('/register', { state: { phone: digits }, replace: true });
        }
      } else {
        setStatus('❌ ' + (data?.msg || data?.reason || data?.message || 'Kod noto‘g‘ri'));
      }
    } catch (e) {
      const msg =
        e?.response?.data?.msg ||
        e?.response?.data?.reason ||
        e?.response?.data?.message ||
        e?.message ||
        'Server xatosi';
      setStatus('❌ ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>🔐 SMS kodni kiriting</h2>
      <input
        type="text"               // number emas — boshidagi 0 tushib ketmasin
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleVerify(); }}
        disabled={loading}
        style={{ width: '100%', padding: 8, marginBottom: 10 }}
        autoComplete="one-time-code"
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
      </button>
      {!!status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}