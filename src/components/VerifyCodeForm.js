import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function VerifyCodeForm({ phone, onVerified }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toPlus998 = (p) => {
    const d = String(p).replace(/\D/g, '');
    if (d.startsWith('998')) return '+' + d;      // 998XXXXXXXXX -> +998XXXXXXXXX
    if (d.length === 9)   return '+998' + d;      // 9 xonali bo'lsa
    return '+' + d;
  };

  const handleVerify = async () => {
  const clean = code.trim();
  if (!/^\d{6}$/.test(clean)) {
    setStatus('❌ 6 xonali kod kiriting');
    return;
  }
  if (!phone) {
    setStatus('❌ Telefon raqam topilmadi');
    return;
  }

  // Har doim 998XXXXXXXXX formatga keltiramiz
  const digits = String(phone).replace(/\D/g, '');
  if (!/^998\d{9}$/.test(digits)) {
    setStatus('❌ Telefon formati noto‘g‘ri (998XXXXXXXXX)');
    return;
  }

  setLoading(true);
  setStatus('');
  try {
    // Backendga ham 998XXXXXXXXX yuboramiz
    const res = await axios.post('/api/verify-code', { phone: digits, code: clean });
    if (res.data?.success) {
      try { localStorage.setItem('userPhone', digits); } catch {}
      setStatus('✅ Tasdiqlandi');
      if (typeof onVerified === 'function') onVerified(digits);
      else navigate('/register'); // 2-qadam
    } else {
      setStatus('❌ ' + (res.data?.message || 'Kod noto‘g‘ri'));
    }
  } catch (e) {
    setStatus('❌ ' + (e.response?.data?.message || e.message || 'Server xatosi'));
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>🔐 SMS kodni kiriting</h2>
      <input
        type="text"
        inputMode="numeric"
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={loading}
        style={{ width: '100%', padding: 8, marginBottom: 10 }}
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
      </button>
      <p>{status}</p>
    </div>
  );
}