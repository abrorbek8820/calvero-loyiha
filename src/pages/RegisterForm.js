import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './RegisterForm.css';
import { useNavigate } from 'react-router-dom';

function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [skills, setSkills] = useState([]);
  const [phone, setPhone] = useState('');

  const handleSkillChange = (e) => {
    const selected = e.target.value;
    setSkills(prev =>
      prev.includes(selected)
        ? prev.filter(skill => skill !== selected)
        : [...prev, selected]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullPhone = '+998' + phone;

    const { data, error } = await supabase
      .from('workers') // Supabase jadval nomi
      .insert([
        {
          name,
          birth_year: birthYear,
          gender,
          skills,
          phone: fullPhone,
          role: 'worker'
        }
      ]);

    if (error) {
      alert("Xatolik: " + error.message);
    } else {
      alert("Ro‘yxatdan o‘tildi!");
      console.log("Ma’lumot yuborildi:", data);
       localStorage.setItem('user', JSON.stringify({ name, phone }));
       localStorage.setItem('userPhone', fullPhone);
      navigate('/');
    }
  };

  const maleSkills = [
    "Universal usta", "Elektrik", "Santexnik", "Molyar", "Eshik-rom",
    "Kafel ustasi", "Svarchik", "G‘isht ustasi", "Beton ustasi",
    "Tom ustasi", "Duradgor", "Suvoqchi", "Quduq ustasi",
    "Yuk ortuvchi (pogruzchik)", "Boshqa kasblar", "Dala ishlari",
    "Xar qanday ish (mardikor)"
  ];

  const femaleSkills = [
    "Hamshira", "Enaga", "Oshpaz", "Qariya qarovch (sidelka)",
    "Tozalovchi", "Idish-tovoq yuvuvchi", "Boshqa kasblar", "Dala ishlari"
  ];

  const skillOptions = gender === 'Erkak' ? maleSkills : gender === 'Ayol' ? femaleSkills : [];

  return (
    <div className="register-container">
      <h2>Ro‘yxatdan o‘tish</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Ismingiz" value={name} onChange={e => setName(e.target.value)} required />

        <input type="tel" plaseholder="Telefon raqam" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <input type="number" placeholder="Tug‘ilgan yil" value={birthYear} onChange={e => setBirthYear(e.target.value)} required />

        <select value={gender} onChange={e => setGender(e.target.value)} required>
          <option value="">Jinsingiz</option>
          <option value="Erkak">Erkak</option>
          <option value="Ayol">Ayol</option>
        </select>

        <div
         className="checkbox-group">
          <label>Kasblar:</label>
          <div
          className="cheskbox-container">
          {skillOptions.map(skill => (
            <label key={skill}
              className="checkbox-label">
              <input
                type="checkbox"
                value={skill}
                checked={skills.includes(skill)}
                onChange={handleSkillChange}
              />
              {skill}
            </label>
          ))}
          </div>
        </div>

        <div className="phone-wrapper">
          <span className="prefix">+998</span>
          <input
            type="tel"
            placeholder="90 123 45 67"
            value={phone}
            onChange={e => {
              const cleaned = e.target.value.replace(/\D/g, '');
              setPhone(cleaned.slice(0, 9));
            }}
            required
          />
        </div>

        <button type="submit">Ro‘yxatdan o‘tish</button>
      </form>
    </div>
  );
}

export default RegisterForm;