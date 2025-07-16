import React, { useEffect, useState } from 'react'; import { useNavigate } from 'react-router-dom'; import { supabase } from '../supabaseClient'; import { maleSkills, femaleSkills } from '../data/skills'; import '../pages/EditProfile.css';

function EditProfile() { const navigate = useNavigate(); const [userPhone, setUserPhone] = useState(localStorage.getItem('userPhone') || ''); const [name, setName] = useState(''); const [birthPlace, setBirthPlace] = useState(''); const [birthYear, setBirthYear] = useState(''); const [gender, setGender] = useState(''); const [skills, setSkills] = useState([]); const [email, setEmail] = useState(''); const [status, setStatus] = useState(''); const [loading, setLoading] = useState(false);

useEffect(() => { if (!userPhone) { navigate('/register'); return; }

const fetchData = async () => {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('phone', userPhone)
    .single();

  if (error || !data) {
    navigate('/register');
    return;
  }

  setName(data.name || '');
  setBirthPlace(data.birth_place?.replace('lik', '') || '');
  setBirthYear(data.birth_year || '');
  setGender(data.gender || '');
  setSkills(data.skills || []);
  setEmail(data.email || '');
};

fetchData();

}, [userPhone, navigate]);

const updateProfile = async () => { if (!name || !birthPlace || !birthYear || !gender || skills.length === 0) { alert('❌ Barcha maydonlarni to‘ldiring.'); return; }

setLoading(true);

const { error } = await supabase
  .from('workers')
  .update({
    name,
    birth_place: birthPlace + 'lik',
    birth_year: birthYear,
    gender,
    skills,
    email
  })
  .eq('phone', userPhone);

if (error) {
  alert('❌ Yangilashda xatolik: ' + error.message);
} else {
  alert('✅ Profil muvaffaqiyatli yangilandi!');
  navigate('/profil');
}

setLoading(false);

};

const toggleSkill = (skill) => { setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill] ); };

const availableSkills = gender === 'male' ? maleSkills : gender === 'female' ? femaleSkills : [];

return ( <div className="edit-profile-container"> <h2>✏️ Profilni tahrirlash</h2>

<input type="text" placeholder="Ism" value={name} onChange={(e) => setName(e.target.value)} />
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
        <label key={skill} className="skill-checkbox">
          <input
            type="checkbox"
            checked={skills.includes(skill)}
            onChange={() => toggleSkill(skill)}
          /> {skill}
        </label>
      ))}
    </div>
  )}

  <div className="readonly-phone">
    <label>Telefon raqam:</label>
    <input type="text" value={`+${userPhone}`} readOnly />
  </div>

  <button onClick={updateProfile} disabled={loading}>
    {loading ? '⏳ Saqlanmoqda...' : '💾 Saqlash'}
  </button>

  {status && (
    <p className="status-message">{status}</p>
  )}
</div>

); }

export default EditProfile;