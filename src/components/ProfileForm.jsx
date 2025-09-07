import React, { useState, useEffect } from 'react'; import { supabase } from '../supabaseClient'; import { useNavigate } from 'react-router-dom'; import './RegisterForm.css';

function ProfileForm() { const navigate = useNavigate(); const phone = localStorage.getItem('userPhone'); const [name, setName] = useState(''); const [birthYear, setBirthYear] = useState(''); const [gender, setGender] = useState(''); const [skills, setSkills] = useState([]); const [localPhone, setLocalPhone] = useState(''); const [loading, setLoading] = useState(true);

const maleSkills = [ "Universal usta", "Elektrik", "Santexnik", "Molyar", "Eshik-rom", "Kafel ustasi", "Svarchik", "G‘isht ustasi", "Beton ustasi", "Tom ustasi", "Duradgor", "Suvoqchi", "Quduq ustasi", "Yuk ortuvchi (pogruzchik)", "Boshqa kasblar", "Dala ishlari", "Xar qanday ish (mardikor)" ];

const femaleSkills = [ "Hamshira", "Enaga", "Oshpaz", "Qariya qarovch (sidelka)", "Tozalovchi", "Idish-tovoq yuvuvchi", "Boshqa kasblar", "Dala ishlari" ];

const skillOptions = gender === 'Erkak' ? maleSkills : gender === 'Ayol' ? femaleSkills : [];

useEffect(() => { const fetchData = async () => { const { data, error } = await supabase.from('workers').select('*').eq('phone', phone).single(); if (data) { setName(data.name || ''); setBirthYear(data.birth_year || ''); setGender(data.gender || ''); setSkills(data.skills || []); setLocalPhone(data.phone?.slice(4) || ''); } setLoading(false); }; fetchData(); }, [phone]);

const handleSkillChange = (e) => { const selected = e.target.value; setSkills(prev => prev.includes(selected) ? prev.filter(skill => skill !== selected) : [...prev, selected] ); };

const handleSave = async (e) => { e.preventDefault(); const fullPhone = '+998' + localPhone;

const { error } = await supabase.from('workers')
  .update({
    name,
    birth_year: birthYear,
    gender,
    skills,
    phone: fullPhone
  })
  .eq('phone', phone);

if (error) {
  alert("Xatolik: " + error.message);
} else {
  alert("Ma'lumotlar yangilandi!");
  localStorage.setItem('user', JSON.stringify({ name, phone: fullPhone }));
  localStorage.setItem('userPhone', fullPhone);

  if (window.Android && window.Android.savePhone) {
  window.Android.savePhone(fullPhone); // ilovaga yangi raqam uzatiladi
}
  navigate('/');
}

};

if (loading) return <p className="text-white text-center mt-10">Yuklanmoqda...</p>;

return ( <div className="register-container"> <h2>Ma’lumotlarni o‘zgartirish</h2> <form onSubmit={handleSave}> <input type="text" placeholder="Ismingiz" value={name} onChange={e => setName(e.target.value)} required />

<input type="number" placeholder="Tug‘ilgan yil" value={birthYear} onChange={e => setBirthYear(e.target.value)} required />

    <select value={gender} onChange={e => setGender(e.target.value)} required>
      <option value="">Jinsingiz</option>
      <option value="Erkak">Erkak</option>
      <option value="Ayol">Ayol</option>
    </select>

    <div className="checkbox-container">
  {skillOptions.map((skill) => (
    <label key={skill} className="checkbox-label">
      <input
        type="checkbox"
        value={skill}
        checked={skills.includes(skill)}
        onChange={handleSkillChange}
      />
      <span className="checkbox-text">{skill}</span>
    </label>
  ))}
</div>

    <div className="phone-wrapper">
      <span className="prefix">+998</span>
      <input
        type="tel"
        placeholder="90 123 45 67"
        value={localPhone}
        onChange={e => {
          const cleaned = e.target.value.replace(/\D/g, '');
          setLocalPhone(cleaned.slice(0, 9));
        }}
        required
      />
    </div>

    <button type="submit">Saqlash</button>
  </form>
</div>

); }

export default ProfileForm;

