import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateUniqueId, generateRandomEmail } from '../utils';
import { maleSkills, femaleSkills } from '../data/skills';
import axios from 'axios';

function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [skills, setSkills] = useState([]);
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const availableSkills =
    gender === 'male'
      ? maleSkills
      : gender === 'female'
      ? femaleSkills
      : [];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !birthPlace || !birthYear || !gender || skills.length === 0 || !phone) {
      setStatus('❌ Iltimos, barcha maydonlarni to‘ldiring.');
      return;
    }

    const email = generateRandomEmail();
    const password = phone; // vaqtincha
    const customId = generateUniqueId();
    const userId = crypto.randomUUID(); // vaqtinchalik, keyin Supabase beradigan bo‘ladi

    try {
      // 1. SMS yuborish
      const res = await axios.post('http://localhost:5000/api/send-sms', { phone });

      if (!res.data.success) {
        setStatus('❌ SMS yuborilmadi: ' + res.data.message);
        return;
      }

      // 2. registerData ni localStorage ga saqlaymiz
      const registerData = {
        userId,
        customId,
        name,
        birthPlace,
        birthYear,
        gender,
        skills,
        phone,
        email,
        password
      };

      localStorage.setItem('registerData', JSON.stringify(registerData));
      navigate('/verify-code');

    } catch (error) {
      setStatus('❌ Server bilan ulanishda xatolik: ' + error.message);
    }
  };

  return (
    <div style={{ maxWidth: 450, margin: '40px auto' }}>
      <h2>📋 Ro‘yxatdan o‘tish</h2>
      <form onSubmit={handleSubmit}>
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
          <div style={{ margin: '10px 0' }}>
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

        <input
          type="text"
          placeholder="Telefon raqam (9989XXXXXXX)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button type="submit">📨 Kodni yuborish</button>
      </form>

      {status && <p style={{ marginTop: 15, color: status.startsWith('✅') ? 'green' : 'red' }}>{status}</p>}
    </div>
  );
}

export default RegisterForm;