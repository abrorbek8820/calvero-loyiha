import React, { useState } from 'react';
import axios from 'axios';

// API bazaviy URL – avval .env dan, bo‘lmasa hostname bo‘yicha
const API_BASE =
  (process.env.REACT_APP_API_BASE_URL && process.env.REACT_APP_API_BASE_URL.trim()) ||
  // (ixtiyoriy) agar Vite bo'lsa
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://api.calvero.work');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default function OtpForm({ onSuccess }) {
  const [digits9, setDigits9] = useState('');   // faqat 9 ta raqam
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // input: faqat raqam va 9 belgigacha
  const onChangePhone = (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 9);
    setDigits9(d);
  };

  // ko'rinish uchun "90 123 45 67" format
  const fmt = (d) => {
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

    const phone = '998' + digits9; // Eskiz/DB formati

    setLoading(true);
    setStatus('');
    try {
      const res = await api.post('/api/send-sms', { phone });
      if (res.data?.success) {
        try { localStorage.setItem('userPhone', phone); } catch {}
        setStatus('✅ Kod yuborildi');
        onSuccess?.(phone);
      } else {
        setStatus('❌ ' + (res.data?.message || 'Xatolik'));
      }
    } catch (err) {
      const msg =
        (err?.response?.data?.message) ||
        err?.message ||
        'Server bilan ulanishda xatolik';
      setStatus('❌ ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label>Telefon raqam (9 xonali):</label>
      <input
        type="tel"
        value={fmt(digits9)}
        onChange={onChangePhone}
        placeholder="90 123 45 67"
        inputMode="numeric"
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Yuborilmoqda…' : 'Kod yuborish'}
      </button>
      {!!status && <p>{status}</p>}
    </div>
  );
}