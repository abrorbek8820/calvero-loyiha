import React, { useState } from 'react';
import axios from 'axios';

function OtpForm({ onSuccess }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!/^998\d{9}$/.test(phone)) {
      setStatus('❌ Telefon raqam noto‘g‘ri formatda (998XXXXXXXXX)');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const res = await axios.post('/api/send-sms', {
        phone,
      });

      if (res.data.success) {
        setStatus('✅ Kod yuborildi');
        onSuccess(phone); // Kod yuborilgan telefon raqamni VerifyCodeForm'ga yuboramiz
      } else {
        setStatus('❌ Xatolik: ' + res.data.message);
      }
    } catch (err) {
      setStatus('❌ Server bilan ulanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>📱 Telefon raqamni kiriting</h2>
      <input
        type="text"
        placeholder="998901234567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Yuborilmoqda...' : 'Kod yuborish'}
      </button>
      <p>{status}</p>
    </div>
  );
}

export default OtpForm;