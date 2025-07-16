import React, { useEffect, useState } from 'react'; import { useNavigate } from 'react-router-dom'; import { supabase } from '../supabaseClient'; import axios from 'axios';

function VerifyNewPhone() { const navigate = useNavigate(); const [code, setCode] = useState(''); const [editData, setEditData] = useState(null); const [status, setStatus] = useState(''); const [loading, setLoading] = useState(false);

useEffect(() => { const stored = localStorage.getItem('editData'); if (stored) { setEditData(JSON.parse(stored)); } else { setStatus('❌ Maʼlumotlar topilmadi. Iltimos, qaytadan urinib ko‘ring.'); } }, []);

const handleVerify = async () => { if (!editData || !editData.newPhone || !editData.oldPhone) { setStatus('❌ Saqlangan maʼlumotlar to‘liq emas.'); return; }

if (code.length !== 6) {
  setStatus('❌ 6 xonali kodni kiriting.');
  return;
}

const { newPhone, oldPhone, name, birthPlace, birthYear, gender, skills } = editData;
const newEmail = `${newPhone}@calvero.uz`;
const newPassword = newPhone;

setLoading(true);
setStatus('');

try {
  // 1. SMS kodni tekshiramiz
  const res = await axios.post('https://calvero-work-sms-backend.onrender.com/api/verify-code', { phone: newPhone, code });

  if (!res.data.success) {
    setStatus('❌ Kod noto‘g‘ri yoki eskirgan: ' + res.data.message);
    setLoading(false);
    return;
  }

  // 2. Workers jadvalini yangilaymiz
  const { error: updateError } = await supabase
    .from('workers')
    .update({
      phone: newPhone,
      email: newEmail,
      name,
      birth_place: birthPlace + 'lik',
      birth_year: birthYear,
      gender,
      skills,
    })
    .eq('phone', oldPhone);

  if (updateError) {
    setStatus("❌ Jadval yangilanishida xatolik: " + updateError.message);
    return;
  }

  // 3. Avval login bo‘lamiz
  await supabase.auth.signInWithPassword({
    email: `${oldPhone}@calvero.uz`,
    password: oldPhone,
  });

  // 4. Supabase auth.users dagi email va parolni yangilaymiz
  const { error: authUpdateError } = await supabase.auth.updateUser({
    email: newEmail,
    password: newPassword,
  });

  if (authUpdateError) {
    setStatus("❌ Auth ma'lumotlarni yangilashda xatolik: " + authUpdateError.message);
    return;
  }

  // 5. localStorage yangilash + tozalash
  localStorage.setItem('userPhone', newPhone);
  localStorage.removeItem('editData');

  setStatus('✅ Raqam va login maʼlumotlari yangilandi!');
  setTimeout(() => navigate('/profil'), 1500);

} catch (err) {
  setStatus('❌ Server xatolik: ' + err.message);
} finally {
  setLoading(false);
}

};

return ( <div style={{ maxWidth: 400, margin: '50px auto', textAlign: 'center' }}> <h2>📲 Raqamni tasdiqlang</h2> <p>Yangi raqamingizga yuborilgan 6 xonali kodni kiriting:</p>

<input
    type="text"
    placeholder="123456"
    value={code}
    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
    maxLength={6}
    style={{ padding: 10, width: '100%', textAlign: 'center', fontSize: 16 }}
  />

  <button onClick={handleVerify} disabled={loading} style={{ marginTop: 15 }}>
    {loading ? '⏳ Tekshirilmoqda...' : '✅ Tasdiqlash'}
  </button>

  {status && (
    <p style={{ marginTop: 20, color: status.startsWith('✅') ? 'green' : 'red' }}>
      {status}
    </p>
  )}
</div>

); }

export default VerifyNewPhone;