import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateUniqueId } from '../utils';
import { maleSkills, femaleSkills } from '../data/skills';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';
import './RegisterForm.css';

function RegisterForm() {
  const navigate = useNavigate();

  // OTP bosqichida LS'ga 998XXXXXXXXX sifatida saqlangan bo'lishi kerak
  const userPhoneDigits = (localStorage.getItem('userPhone') || '').replace(/\D/g, ''); // 998XXXXXXXXX

  const [name, setName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [skills, setSkills] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const availableSkills = gender === 'Erkak' ? maleSkills : gender === 'Ayol' ? femaleSkills : [];

  const toggleSkill = (skill) => {
    if (skill === 'Barchasini tanlash') {
      if (skills.length === availableSkills.length - 1) setSkills([]);
      else setSkills(availableSkills.filter((s) => s !== 'Barchasini tanlash'));
    } else {
      setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
    }
  };

  // Telefonni faqat ko'rsatish uchun formatlaymiz: +998 90 123 45 67
  const prettyPhone = (() => {
    if (!/^998\d{9}$/.test(userPhoneDigits)) return '—';
    const nine = userPhoneDigits.slice(3);
    const p = `${nine.slice(0,2)} ${nine.slice(2,5)} ${nine.slice(5,7)} ${nine.slice(7,9)}`;
    return `+998 ${p}`;
  })();

  // Email/Parol — sizning talabingiz bo‘yicha
  const email = userPhoneDigits ? `${userPhoneDigits}@calvero.work` : '';
  const password = userPhoneDigits;

  const handleRegister = async () => {
    if (!/^998\d{9}$/.test(userPhoneDigits)) {
      setStatus('❌ Telefon topilmadi. Iltimos, /otp orqali qayta urinib ko‘ring.');
      return;
    }
    if (!name || !birthPlace || !birthYear || !gender || skills.length === 0) {
      setStatus('❌ Barcha maydonlarni to‘ldiring.');
      return;
    }

    setLoading(true);
    setStatus('');
    const sessionToken = uuidv4();

    try {
      // 1) Mavjud worker’ni qidirish: avval 998…, topilmasa +998… (migratsiya uchun)
      let { data: existing, error: selErr } = await supabase
        .from('workers')
        .select('id, phone, email, custom_id, balance')
        .eq('phone', userPhoneDigits)
        .maybeSingle();

      if (!existing && !selErr) {
        const res2 = await supabase
          .from('workers')
          .select('id, phone, email, custom_id, balance')
          .eq('phone', `+${userPhoneDigits}`)
          .maybeSingle();
        existing = res2.data;
        selErr = res2.error;
      }
      if (selErr) throw selErr;

      // 2) UPDATE yoki INSERT (custom_id/balancega teginmaymiz)
      if (existing) {
        const updatePayload = {
          name,
          birth_place: birthPlace,
          birth_year: birthYear,
          gender,
          skills,
          phone: userPhoneDigits,                 // normalize -> 998XXXXXXXXX
          ...(existing.email ? {} : { email }),   // email bo'sh bo'lsa to'ldiramiz
          session_token: sessionToken,
        };
        const { error: updErr } = await supabase.from('workers').update(updatePayload).eq('id', existing.id);
        if (updErr) throw updErr;
      } else {
        const insertPayload = {
          name,
          balance: 100000,
          birth_place: birthPlace,
          birth_year: birthYear,
          gender,
          skills,
          phone: userPhoneDigits,                 // 998XXXXXXXXX
          email,
          session_token: sessionToken,
          custom_id: generateUniqueId(),          // faqat yangi yozuvga
        };
        const { error: insErr } = await supabase.from('workers').insert([insertPayload]);
        if (insErr) throw insErr;
      }

      // 3) Supabase Auth: signup (agar allaqachon bo'lsa - e'tiborsiz), keyin signin
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError && !/already|registered/i.test(signUpError.message || '')) {
        throw signUpError;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // 4) LS/Cookie va yakun — faqat digits saqlaymiz
      localStorage.setItem('userPhone', userPhoneDigits);
      localStorage.setItem('session_token', sessionToken);
      localStorage.setItem(
        'registerData',
        JSON.stringify({ name, birth_place: birthPlace, birth_year: birthYear, gender, skills, phone: userPhoneDigits, email })
      );
      localStorage.setItem('sms_verified', 'true');
      if (window.Android?.savePhone) window.Android.savePhone(userPhoneDigits);
      document.cookie = `session_token=${sessionToken}; path=/; secure; SameSite=None; max-age=${60*60*24*365}`;
      document.cookie = `userPhone=${userPhoneDigits}; path=/; secure; SameSite=None; max-age=${60*60*24*365}`;

      setStatus('✅ Ma’lumotlar saqlandi');
      navigate('/');
    } catch (err) {
      setStatus('❌ Server/Auth xatosi: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
    <div style={{ maxWidth: 450, margin: '40px auto' }}>
      <h2>📋 Ro‘yxatdan o‘tish</h2>

      {/* Telefon faqat ko‘rinadi, o‘zgartirib bo‘lmaydi */}
      <div style={{ marginBottom: 10 }}>
        <strong>Telefon:</strong> {prettyPhone}
      </div>

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
        <option value="Erkak">Erkak</option>
        <option value="Ayol">Ayol</option>
      </select>

      {gender && (
  <div className="kasblarimiz">
    <p>Kasblar:</p>
    <div className="skills-list">
      {availableSkills.map((skill) => (
        <label key={skill} className="skill-item">
          <input
            type="checkbox"
            checked={skills.includes(skill)}
            onChange={() => toggleSkill(skill)}
          />
          <span>{skill}</span>
        </label>
      ))}
    </div>
  </div>
)}

      <button onClick={handleRegister} disabled={loading}>
        {loading ? 'Yuborilmoqda…' : '✅ Ro‘yxatdan o‘tish'}
      </button>

      {status && (
        <p style={{ marginTop: 15, color: status.startsWith('✅') ? 'green' : 'red' }}>{status}</p>
      )}
    </div>
    </div>
  );
}

export default RegisterForm;