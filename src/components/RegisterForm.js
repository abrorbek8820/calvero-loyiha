// src/components/RegisterForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateUniqueId } from '../utils';
import { maleSkills, femaleSkills } from '../data/skills';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';
import './RegisterForm.css';

function RegisterForm() {
  const navigate = useNavigate();
  const location = useLocation();

  // Telefon faqat Verify sahifasidan state orqali keladi: 998XXXXXXXXX
  const userPhoneDigits = (location.state?.phone || '').replace(/\D/g, '');

  const [name, setName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [skills, setSkills] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const availableSkills =
    gender === 'Erkak' ? maleSkills : gender === 'Ayol' ? femaleSkills : [];

  const toggleSkill = (skill) => {
    if (skill === 'Barchasini tanlash') {
      if (skills.length === availableSkills.length - 1) {
        setSkills([]);
      } else {
        setSkills(availableSkills.filter((s) => s !== 'Barchasini tanlash'));
      }
    } else {
      setSkills((prev) =>
        prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
      );
    }
  };

  // Telefonni ko‘rinish uchun formatlaymiz: +998 90 123 45 67
  const prettyPhone = (() => {
    if (!/^998\d{9}$/.test(userPhoneDigits)) return '—';
    const nine = userPhoneDigits.slice(3);
    const p = `${nine.slice(0, 2)} ${nine.slice(2, 5)} ${nine.slice(5, 7)} ${nine.slice(7, 9)}`;
    return `+998 ${p}`;
  })();

  // Email/Parol (telefon asosida)
  const email = userPhoneDigits ? `${userPhoneDigits}@calvero.work` : '';
  const password = userPhoneDigits;

  // Guard: Verify'dan kelmagan bo‘lsa /otp ga qaytar
  useEffect(() => {
    if (!/^998\d{9}$/.test(userPhoneDigits)) {
      navigate('/otp', { replace: true });
    }
  }, [userPhoneDigits, navigate]);

  // Guard paytida hech narsa chizmaslik
  if (!/^998\d{9}$/.test(userPhoneDigits)) {
    return null;
  }

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

      // 2) UPDATE yoki INSERT (custom_id/balance'ga tegmaymiz)
      if (existing) {
        const updatePayload = {
          name,
          birth_place: birthPlace,
          birth_year: birthYear,
          gender,
          skills,
          phone: userPhoneDigits, // normalize
          ...(existing.email ? {} : { email }),
          session_token: sessionToken,
        };
        const { error: updErr } = await supabase
          .from('workers')
          .update(updatePayload)
          .eq('id', existing.id);
        if (updErr) throw updErr;
      } else {
        const insertPayload = {
          name,
          balance: 10000000, // boshlang‘ich bonus (agar shunday siyosat bo‘lsa)
          birth_place: birthPlace,
          birth_year: birthYear,
          gender,
          skills,
          phone: userPhoneDigits,
          email,
          session_token: sessionToken,
          custom_id: await generateUniqueId(1, 'workers'),
        };
        const { error: insErr } = await supabase
          .from('workers')
          .insert([insertPayload]);
        if (insErr) throw insErr;
      }

      // 3) Supabase Auth: signup (agar allaqachon bo‘lsa - e’tiborsiz), keyin signin
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError && !/(already|registered|exists)/i.test(signUpError.message || '')) {
        throw signUpError;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      // 4) LS/Cookie va yakun — faqat tasdiqlangandan keyin saqlaymiz
      try {
        localStorage.setItem('userPhone', userPhoneDigits);
        localStorage.setItem('session_token', sessionToken);
        localStorage.setItem(
          'registerData',
          JSON.stringify({
            name,
            birth_place: birthPlace,
            birth_year: birthYear,
            gender,
            skills,
            phone: userPhoneDigits,
            email,
          })
        );
        localStorage.setItem('sms_verified', 'true');
      } catch {}

      if (window.Android?.savePhone) {
        try { window.Android.savePhone(userPhoneDigits); } catch {}
      }

      // Cookie — faqat HTTPS’da ishlaydi (prod)
      document.cookie = `session_token=${sessionToken}; path=/; secure; SameSite=None; max-age=${60 * 60 * 24 * 365}`;
      document.cookie = `userPhone=${userPhoneDigits}; path=/; secure; SameSite=None; max-age=${60 * 60 * 24 * 365}`;

      setStatus('✅ Ma’lumotlar saqlandi');
      navigate('/home', { replace: true });
    } catch (err) {
      setStatus('❌ Server/Auth xatosi: ' + (err?.message || 'Noma’lum xato'));
    } finally {
      setLoading(false);
    }
  };

  const formIncomplete =
    !name || !birthPlace || !birthYear || !gender || skills.length === 0;

  return (
    <div className="register-container">
      <div style={{ maxWidth: 450, margin: '40px auto' }}>
        <h2>📋 Ro‘yxatdan o‘tish</h2>

        {/* Telefon faqat ko‘rinadi, o‘zgartirib bo‘lmaydi */}
        <div style={{ marginBottom: 10 }}>
          <strong>Telefon:</strong> {prettyPhone}
        </div>

        <input
          type="text"
          placeholder="Ismingiz"
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
          {Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 1950 + i).map(
            (year) => (
              <option key={year} value={year}>
                {year}
              </option>
            )
          )}
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

        <button onClick={handleRegister} disabled={loading || formIncomplete}>
          {loading ? 'Yuborilmoqda…' : '✅ Ro‘yxatdan o‘tish'}
        </button>

        {status && (
          <p
            style={{
              marginTop: 15,
              color: status.startsWith('✅') ? 'green' : 'red',
            }}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

export default RegisterForm;