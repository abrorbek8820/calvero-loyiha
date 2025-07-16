import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateUniqueId } from '../utils';
import { maleSkills, femaleSkills } from '../data/skills';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [skills, setSkills] = useState([]);
  const [phonePart, setPhonePart] = useState('');
  const [status, setStatus] = useState('');

  const toggleSkill = (skill) => {
    setSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const availableSkills =
    gender === 'male' ? maleSkills : gender === 'female' ? femaleSkills : [];

  const handleRegister = async () => { if (phonePart.length !== 9) { setStatus('❌ Telefon raqam to‘liq emas (9 raqam kerak)'); return; }

const phone = '998' + phonePart; const email = `${phone}@calvero.uz`; const password = phone; const sessionToken = uuidv4();

localStorage.setItem('session_token', sessionToken);

if (!name || !birthPlace || !birthYear || !gender || skills.length === 0) { setStatus('❌ Barcha maydonlarni to‘ldiring.'); return; }

try { const { data } = await axios.post('calvero-work-sms-backend.onrender.com/api/send-sms', { phone });

if (!data.success) {
  setStatus('❌ SMS yuborilmadi: ' + data.message);
  return;
}

const registerData = {
  name,
  birthPlace,
  birthYear,
  gender,
  skills,
  phone,
  email,
  password,
  sessionToken, // 🔐 session tokenni ham yuboramiz
  customId: generateUniqueId()
};

localStorage.setItem('registerData', JSON.stringify(registerData));
navigate('/verify-code');

} catch (err) { setStatus('❌ Server xatosi: ' + err.message); } };

  return (
    <div style={{ maxWidth: 450, margin: '40px auto' }}>
      <h2>📋 Ro‘yxatdan o‘tish</h2>

      <input type="text" placeholder="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="text" placeholder="Tug‘ilgan joy" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} />

      <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
        <option value="">Tug‘ilgan yil</option>
        {Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 1950 + i).map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      <select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="">Jinsni tanlang</option>
        <option value="male">Erkak</option>
        <option value="female">Ayol</option>
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

      <button onClick={handleRegister}>📨 Kodni yuborish</button>

      {status && (
        <p style={{ marginTop: 15, color: status.startsWith('✅') ? 'green' : 'red' }}>{status}</p>
      )}
    </div>
  );
}

export default RegisterForm;