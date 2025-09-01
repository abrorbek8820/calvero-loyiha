import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { maleSkills, femaleSkills } from '../data/skills';
import '../pages/EditProfile.css';

function EditProfile() {
  const navigate = useNavigate();

  const [userPhone, setUserPhone] = useState(localStorage.getItem('userPhone') || '');
  const [name, setName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState(''); // 'Erkak' | 'Ayol'
  const [skills, setSkills] = useState([]);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const toLocalizedGender = (g) => {
    if (!g) return '';
    const v = String(g).toLowerCase();
    if (v === 'male' || v === 'erkak') return 'Erkak';
    if (v === 'female' || v === 'ayol') return 'Ayol';
    return '';
  };

  const skillsForGender = (g) => (g === 'Erkak' ? maleSkills : g === 'Ayol' ? femaleSkills : []);

  useEffect(() => {
    if (!userPhone) {
      navigate('/register');
      return;
    }

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
      setBirthPlace((data.birth_place || '').replace(/lik$/i, '') || '');
      setBirthYear(data.birth_year || '');

      const localized = toLocalizedGender(data.gender);
      setGender(localized);

      const rawSkills = Array.isArray(data.skills) ? data.skills : [];
      setSkills(rawSkills.filter((s) => skillsForGender(localized).includes(s)));

      setEmail(data.email || '');
    };

    fetchData();
  }, [userPhone, navigate]);

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setSkills((prev) => prev.filter((s) => skillsForGender(newGender).includes(s)));
    setStatus("Jins o‘zgardi. Kasblar ro‘yxati yangi jinsga moslashtirildi.");
    setTimeout(() => setStatus(''), 2500);
  };

  const updateProfile = async () => {
    if (!name || !birthPlace || !birthYear || !gender || skills.length === 0) {
      alert('❌ Barcha maydonlarni to‘ldiring.');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('workers')
      .update({
        name,
        birth_place: `${birthPlace}lik`,
        birth_year: birthYear,
        gender,           // 'Erkak' | 'Ayol'
        skills,
        email,
      })
      .eq('phone', userPhone);

    if (error) {
      alert('❌ Yangilashda xatolik: ' + error.message);
    } else {
      alert('✅ Profil muvaffaqiyatli yangilandi!');
      navigate('/home', { replace: true });
    }

    setLoading(false);
  };

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const availableSkills = skillsForGender(gender);

  // --- Yangi: "Barchasini tanlash" tugmasi logikasi
  const areAllSelected =
    availableSkills.length > 0 &&
    availableSkills.every((s) => skills.includes(s));

  const handleSelectAll = () => {
    if (!gender) return; // jins tanlanmagan bo'lsa hech narsa qilmang
    if (areAllSelected) {
      // Hammasi tanlangan bo‘lsa — bekor qilamiz
      setSkills([]);
    } else {
      // Aks holda — shu jinsga tegishli barcha kasblarni tanlaymiz
      setSkills([...availableSkills]);
    }
  };
  // ---

  return (
    <div className="edit-profile-container">
      <h2>✏️ Profilni tahrirlash</h2>

      <input
        type="text"
        placeholder="Ism"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="text"
        placeholder="Tug‘ilgan joy"
        value={birthPlace}
        onChange={(e) => setBirthPlace(e.target.value)}
      />

      <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
        <option value="">Tug‘ilgan yil</option>
        {Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 1950 + i).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <select value={gender} onChange={(e) => handleGenderChange(e.target.value)}>
        <option value="">Jinsni tanlang</option>
        <option value="Erkak">Erkak</option>
        <option value="Ayol">Ayol</option>
      </select>

      {gender && (
        <div>
          <div className="skills-header">
            <p>Kasblar:</p>
            <button
              type="button"
              className="select-all-btn"
              onClick={handleSelectAll}
              disabled={availableSkills.length === 0}
              title={
                availableSkills.length === 0
                  ? 'Bu jins uchun kasblar ro‘yxati yo‘q'
                  : areAllSelected
                  ? 'Hammasini bekor qilish'
                  : 'Barchasini tanlash'
              }
            >
              {areAllSelected ? '🔄 Hammasini bekor qilish' : '✅ Barchasini tanlash'}
            </button>
          </div>

          {availableSkills.map((skill) => (
            <label key={skill} className="skillan-checkbox">
              <input
                type="checkbox"
                checked={skills.includes(skill)}
                onChange={() => toggleSkill(skill)}
              />{' '}
              {skill}
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

      {status && <p className="status-message">{status}</p>}
    </div>
  );
}

export default EditProfile;