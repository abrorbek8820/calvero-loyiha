import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useRegister } from '../contexts/RegisterContext';

function SmsVerify() {
  const { registerData, verifyId } = useRegister();
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!registerData || !registerData.phone) {
      alert("Ma'lumotlar topilmadi. Qayta urinib ko‘ring.");
      navigate('/register');
      return;
    }

    const res = await fetch('https://localhost:5000/api/verify-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: registerData.phone, code })
    });

    const result = await res.json();

    if (result.success) {
      const { name, birthPlace, birthYear, gender, skills, phone } = registerData;

      const { error } = await supabase.from('workers').insert([{
        name,
        birth_place: birthPlace + 'lik',
        birth_year: birthYear,
        gender,
        skills,
        phone,
        role: 'worker'
      }]);

      if (error) {
        alert("Supabase saqlashda xatolik: " + error.message);
      } else {
        alert("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        localStorage.setItem('userPhone', phone);
        navigate('/');
      }
    } else {
      alert("Kod noto‘g‘ri yoki muddati tugagan.");
    }
  };

  return (
    <div className="register-container">
      <h2>SMS kodni kiriting</h2>
      <input
        type="text"
        placeholder="Kod"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleVerify}>Tasdiqlash</button>
    </div>
  );
}

export default SmsVerify;