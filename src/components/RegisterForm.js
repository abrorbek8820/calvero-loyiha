import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './RegisterForm.css';
import { useNavigate } from 'react-router-dom';
import { maleSkills, femaleSkills } from '../data/skills';

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password: phone
    });

    if (error) {
      alert('Xatolik yuz berdi: ' + error.message);
      return;
    }

    const { error: insertError } = await supabase.from('workers').insert([
      {
        name,
        birth_place: birthPlace + 'lik',
        birth_year: birthYear,
        gender,
        skills,
        email,
        phone,
        role: 'worker',
        user_id: data.user?.id
      }
    ]);

    if (insertError) {
      alert("Ma'lumotlarni saqlashda xatolik: " + insertError.message);
    } else {
      alert("Ro‘yxatdan muvaffaqiyatli o'tdingiz!");
      localStorage.setItem('user', JSON.stringify({ name, email }));
      localStorage.setItem('userPhone', phone);
      navigate('/');
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

      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="text" placeholder="Telefon raqamingiz" value={phone} onChange={e => setPhone(e.target.value)} required />

      <button type="button" onClick={handleRegister}>Ro‘yhatdan o‘tish</button>
    </div>
  );
}

export default RegisterForm;