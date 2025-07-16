import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import axios from 'axios';

function VerifyCodeForm() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [registerData, setRegisterData] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const stored = localStorage.getItem('registerData');
    if (stored) {
      setRegisterData(JSON.parse(stored));
    } else {
      setStatus('❌ Maʼlumotlar topilmadi. Iltimos, qaytadan urinib ko‘ring.');
    }
  }, []);

  const handleVerify = async () => { if (!registerData || !registerData.phone) { setStatus('❌ Telefon raqam topilmadi.'); return; }

if (code.length !== 6) { setStatus('❌ 6 xonali kodni kiriting.'); return; }

const { phone, email, password, customId, name, birthPlace, birthYear, gender, skills, sessionToken } = registerData;

setLoading(true); setStatus('');

try { const res = await axios.post('/api/verify-code', { phone, code });

if (!res.data.success) {
  setStatus('❌ Noto‘g‘ri kod: ' + res.data.message);
  setLoading(false);
  return;
}

// 2. Avval signIn qilishga harakat qilamiz
const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (!loginError && loginData?.user) {
  // 🔐 session tokenni yangilaymiz
  await supabase.from('workers')
    .update({ session_token: sessionToken })
    .eq('phone', phone);

  setStatus('✅ Tizimga muvaffaqiyatli kirdingiz!');
  localStorage.setItem('userPhone', phone);
  localStorage.setItem('session_token', sessionToken);
  localStorage.removeItem('registerData');
  setTimeout(() => navigate('/'), 1500);
  return;
}

// 3. Agar login bo‘lmadi — yangi foydalanuvchi yaratamiz
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email,
  password
});

if (signUpError) {
  setStatus('❌ Ro‘yxatdan o‘tishda xatolik: ' + signUpError.message);
  setLoading(false);
  return;
}

// 4. Workers jadvaliga yozamiz
const { error: insertError } = await supabase.from('workers').insert([
  {
    user_id: signUpData.user?.id,
    custom_id: customId,
    name,
    birth_place: birthPlace + 'lik',
    birth_year: birthYear,
    gender,
    skills,
    phone,
    email,
    role: 'worker',
    session_token: sessionToken
  }
]);

if (insertError) {
  setStatus("❌ Ma'lumotlarni yozishda xatolik: " + insertError.message);
  return;
}

setStatus('✅ Ro‘yxatdan muvaffaqiyatli o‘tildi!');
localStorage.setItem('userPhone', phone);
localStorage.setItem('session_token', sessionToken);
localStorage.removeItem('registerData');
setTimeout(() => navigate('/'), 1500);

} catch (err) { setStatus('❌ Server bilan xatolik: ' + err.message); } finally { setLoading(false); } };

return (

  <div style={{ maxWidth: 400, margin: '50px auto', textAlign: 'center' }}>
    <h2>🔐 Tasdiqlash kodi</h2>
    <p>Telefon raqamingizga yuborilgan 6 xonali kodni kiriting:</p><input
  type="text"
  placeholder="123456"
  value={code}
  maxLength={6}
  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
  style={{ width: '100%', padding: 10, marginBottom: 10, textAlign: 'center' }}
/>

<button onClick={handleVerify} disabled={loading}>
  {loading ? '⏳ Tekshirilmoqda...' : '✅ Kodni tasdiqlash'}
</button>

{status && (
  <p style={{ marginTop: 15, color: status.startsWith('✅') ? 'green' : 'red' }}>{status}</p>
)}

  </div>
);
}

export default VerifyCodeForm;