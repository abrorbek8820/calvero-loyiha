import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateUniqueId } from '../utils';
import { maleSkills, femaleSkills } from '../data/skills';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';

function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [birth_place, setBirthPlace] = useState('');
  const [birth_year, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [skills, setSkills] = useState([]);
  const [phonePart, setPhonePart] = useState('');
  const [status, setStatus] = useState('');

  const toggleSkill = (skill) => {
    if (skill === "Barchasini tanlash") {
      if (skills.length === availableSkills.length - 1) {
        setSkills([]);
      } else {
        setSkills(availableSkills.filter((s) => s !== "Barchasini tanlash"));
      }
    } else {
      setSkills((prev) =>
        prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
      );
    }
  };

  const availableSkills = gender === 'Erkak' ? maleSkills : gender === 'Ayol' ? femaleSkills : [];


const handleRegister = async () => {
  if (phonePart.length !== 9) {
    setStatus('❌ Telefon raqam to‘liq emas (9 raqam kerak)');
    return;
  }

  const phone = '998' + phonePart;
  const email = `${phone}@calvero.uz`;
  const password = phone;
  const sessionToken = uuidv4();

  if (!name || !birth_place || !birth_year || !gender || skills.length === 0) {
    setStatus('❌ Barcha maydonlarni to‘ldiring.');
    return;
  }localStorage.setItem('userPhone', phone);
  localStorage.setItem('is-worker', true);
  localStorage.setItem('session_token', sessionToken);

  // Supabase orqali foydalanuvchini ro‘yxatdan o‘tkazish
  const { error: signUpError } = await supabase.auth.signUp({ email, password });

  if (signUpError) {
  setStatus('❌ Auth xatosi: ' + signUpError.message);
  return;
}

const registerData = {
  name,
  birth_place: birth_place,
  birth_year: birth_year,
  gender,
  skills,
  phone,
  email,
  session_token: sessionToken,
  custom_id: generateUniqueId()
};

const { error } = await supabase.from('workers').insert([registerData]);

if (error) {
  setStatus('❌ Server xatosi: ' + error.message);
} else {
  localStorage.setItem('userPhone', phone);
  localStorage.setItem('is-worker', true);
  localStorage.setItem('session_token', sessionToken);
  localStorage.setItem('registerData', JSON.stringify(registerData));

  // ✅ Token va telefon raqamini Cookie orqali saqlash
  document.cookie = `session_token=${sessionToken}; path=/; secure; SameSite=None; max-age=${60*60*24*365}`;
  document.cookie = `userPhone=${phone}; path=/; secure; SameSite=None; max-age=${60*60*24*365}`;

  navigate('/home');
}
};




  return (
    <div style={{ maxWidth: 450, margin: '40px auto' }}>
      <h2>📋 Ro‘yxatdan o‘tish</h2>

      <input type="text" placeholder="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="text" placeholder="Tug‘ilgan joy" value={birth_place} onChange={(e) => setBirthPlace(e.target.value)} />

      <select value={birth_year} onChange={(e) => setBirthYear(e.target.value)}>
        <option value="">Tug‘ilgan yil</option>
        {Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 1950 + i).map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      <select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="">Jinsni tanlang</option>
        <option value="Erkak">Erkak</option>
        <option value="Ayol">Ayol</option>
      </select>

      {gender && (
        <div>
          <p>Kasblar:</p>
          {availableSkills.map(skill => (
            <label key={skill} style={{ display: 'inline-block', marginRight: 10 }}>
              <input
                type="checkbox"
                checked={skills.includes(skill)}
                onChange={() => toggleSkill(skill)}
              /> {skill}
            </label>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontWeight: 'bold' }}>+998</span>
        <input
          type="text"
          placeholder="901234567"
          maxLength={9}
          value={phonePart}
          onChange={(e) => {
            const onlyNums = e.target.value.replace(/\D/g, '');
            if (onlyNums.length <= 9) setPhonePart(onlyNums);
          }}
          style={{ marginLeft: 5 }}
        />
      </div>

      <button onClick={handleRegister}>✅ Ro‘yxatdan o‘tish</button>

      {status && (
        <p style={{ marginTop: 15, color: status.startsWith('✅') ? 'green' : 'red' }}>{status}</p>
      )}
    </div>
  );
}

export default RegisterForm;
