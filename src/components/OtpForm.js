import React, { useState } from 'react';
import axios from 'axios';

function OtpForm({ onSuccess }) {
  const [digits9, setDigits9] = useState('');   // faqat 9 ta raqam
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const fmt = (s) => {
    const d = s.replace(/\D/g, '').slice(0, 9);
    const parts = [];
    if (d.length > 0) parts.push(d.slice(0, 2));
    if (d.length > 2) parts.push(d.slice(2, 5));
    if (d.length > 5) parts.push(d.slice(5, 7));
    if (d.length > 7) parts.push(d.slice(7, 9));
    return parts.join(' ');
  };

  const handleSend = async () => {
    if (digits9.length !== 9) {
      setStatus('❌ 9 xonali raqam kiriting (masalan: 90 123 45 67)');
      return;
    }
    const phone = '998' + digits9;  // Eskiz/DB formati

    setLoading(true);
    setStatus('');
    try {
      const res = await axios.post('/api/send-sms', { phone });
      if (res.data?.success) {
        try { localStorage.setItem('userPhone', phone); } catch {}
        setStatus('✅ Kod yuborildi');
        onSuccess?.(phone); // VerifyCodeForm’ga 998XXXXXXXXX ko‘rinishda beramiz
      } else {
        setStatus('❌ ' + (res.data?.message || 'Xatolik'));
      }
    } catch {
      setStatus('❌ Server bilan ulanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>📱 Telefon raqamni kiriting</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 'bold' }}>+998</span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="90 123 45 67"
          value={fmt(digits9)}
          onChange={(e) => setDigits9(e.target.value.replace(/\D/g, '').slice(0, 9))}
          style={{ flex: 1, padding: 8 }}
          disabled={loading}
        />
      </div>

      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Yuborilmoqda...' : 'Kod yuborish'}
      </button>
      <p>{status}</p>
    </div>
  );
}

export default OtpForm;