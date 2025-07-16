import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './RegisterForm.css';
import { useNavigate } from 'react-router-dom';
import { maleSkills, femaleSkills } from '../data/skills';
import { generateUniqueId, } from '../utils';

function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [skills, setSkills] = useState([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skillOptions, setSkillOptions] = useState([]);
  const [phonePart, setPhonePart] = useState('');

  useEffect(() => {
    if (gender === 'Erkak') setSkillOptions(maleSkills);
    else if (gender === 'Ayol') setSkillOptions(femaleSkills);
    else setSkillOptions([]);
    setSkills([]); // gender o'zgarganda tanlangan skill'lar tozalanadi
  }, [gender]);

  const handleSkillChange = (e) => {
    const selected = e.target.value;
    if (selected === 'Barchasini tanlash') {
      setSkills(skills.length === skillOptions.length ? [] : skillOptions);
    } else {
      setSkills(prev =>
        prev.includes(selected)
          ? prev.filter(skill => skill !== selected)
          : [...prev, selected]
      );
    }
  };

  
const handleRegister = async () => {
  if (phonePart.length !== 9) {
    alert('❌ Telefon raqam to‘liq emas (9 raqam kerak)');
    return;
  }

  const phone = '998' + phonePart;
  const email = `${phone}@calvero.uz`;
  const password = phone;

  if (!name || !birthPlace || !birthYear || !gender || skills.length === 0) {
    alert('❌ Iltimos, barcha maydonlarni to‘ldiring.');
    return;
  }

  try {
    // 1. Telefon raqam mavjudligini tekshiramiz
    const { data: existingUser, error: checkError } = await supabase
      .from('workers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (checkError) {
      alert("❌ Server bilan xatolik: " + checkError.message);
      return;
    }

    if (existingUser) {
      // LOGIN qilamiz, avvalgi email/parol bilan
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        alert('❌ Login xatolik: ' + loginError.message);
        return;
      }

      alert('✅ Muvaffaqiyatli tizimga kirdingiz!');
      localStorage.setItem('userPhone', phone);
      navigate('/');
      return;
    }

    // Yangi foydalanuvchini roʻyxatdan oʻtkazamiz
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      // Bu yerda User already registered xatosi bo‘lishi mumkin emas,
      // chunki oldindan tekshirdik, lekin boshqa xatolarni ko‘ramiz:
      alert('❌ Ro‘yxatdan o‘tishda xatolik: ' + signUpError.message);
      return;
    }

    // workers jadvaliga yozamiz
    const { error: insertError } = await supabase.from('workers').insert([
      {
        user_id: signUpData.user?.id,
        name,
        birth_place: birthPlace + 'lik',
        birth_year: birthYear,
        gender,
        skills,
        phone,
        email,
        role: 'worker',
        custom_id: generateUniqueId()
      }
    ]);

    if (insertError) {
      alert("❌ Ma'lumotlarni yozishda xatolik: " + insertError.message);
      return;
    }

    alert("✅ Ro‘yxatdan muvaffaqiyatli o'tdingiz!");
    localStorage.setItem('userPhone', phone);
    navigate('/');

  } catch (err) {
    alert('❌ Umumiy xatolik: ' + err.message);
  }
};
  const years = Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 2025 - i);

  return (
    <div className="register-container">
      <h2>Ro‘yxatdan o‘tish</h2>

      <input type="text" placeholder="Ismingiz" value={name} onChange={e => setName(e.target.value)} required />
      <input type="text" placeholder="Tug‘ilgan joy" value={birthPlace} onChange={e => setBirthPlace(e.target.value)} required />

      <select value={birthYear} onChange={e => setBirthYear(e.target.value)} required>
        <option value="">Yoshingiz (tug'ilgan yil)</option>
        {years.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      <select value={gender} onChange={e => setGender(e.target.value)} required>
        <option value="">Jinsingiz</option>
        <option value="Erkak">Erkak</option>
        <option value="Ayol">Ayol</option>
      </select>

      <div className="checkbox-container">
        {skillOptions.map(skill => (
          <label key={skill} style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#374151',
            padding: '8px',
            borderRadius: '5px',
            color: '#ffffff',
            cursor: 'pointer',
            userSelect: 'none',
            width: '100%'
          }}>
            <input
              type="checkbox"
              value={skill}
              checked={skills.includes(skill)}
              onChange={handleSkillChange}
              style={{ marginRight: '10px', cursor: 'pointer' }}
            />
            <span>{skill}</span>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
  <span style={{ marginRight: 5, fontWeight: 'bold' }}>+998</span>
  <input
    type="text"
    placeholder="901234567"
    maxLength={9}
    value={phonePart}
    onChange={(e) => {
      const onlyNums = e.target.value.replace(/\D/g, ''); // faqat raqam
      if (onlyNums.length <= 9) setPhonePart(onlyNums);
    }}
  />
</div>
      <button type="button" onClick={handleRegister}>Ro‘yhatdan o‘tish</button>
    </div>
  );
}

export default RegisterForm;