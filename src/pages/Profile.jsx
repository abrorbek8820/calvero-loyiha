import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Profile.css';
import OnlineDot from '../components/OnlineDot';

const MAX_SKILLS = 8;

export default function Profile() {
  const { phone } = useParams();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);

  const [showAbout, setShowAbout] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  const hasUpdated = useRef(false);

  // 1) Profilga kirishlar hisoblagichi (bir marta)
  useEffect(() => {
  if (hasUpdated.current) return;
  hasUpdated.current = true;

  const incrementViews = async () => {
    const { error } = await supabase.rpc('increment_views', { user_phone: phone });
    if (error) {
      console.error("Views RPC xatoligi:", error.message);
    }
  };

  incrementViews();
}, [phone]);

  // 2) Foydalanuvchi GPS (masofa uchun)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      });
    }
  }, []);

  // 3) Worker ma'lumoti + masofa
  useEffect(() => {
    const fetchWorker = async () => {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('phone', phone)
        .single();

      if (!error && data) {
        const filteredSkills = Array.isArray(data.skills)
          ? data.skills.filter((s) => s && s.toLowerCase() !== 'barchasini tanlash')
          : [];

        const next = { ...data, skills: filteredSkills };
        setWorker(next);

        if (
          userLocation &&
          typeof data.latitude === 'number' &&
          typeof data.longitude === 'number'
        ) {
          const dist = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            data.latitude,
            data.longitude
          ).toFixed(1);
          setDistance(dist);
        }
      } else {
        console.error('Xatolik:', error);
      }
    };

    fetchWorker();
  }, [phone, userLocation]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Telefon bosilganda RPC + tel:
  const handlePhoneClick = async () => {
    if (!worker) return;
    try {
      await supabase.rpc('increment_phone_views', { user_phone: worker.phone });
    } finally {
      window.location.href = `tel:+${worker.phone}`;
    }
  };

  const openInMaps = () => {
    if (!worker?.latitude || !worker?.longitude) return;
    const q = `${worker.latitude},${worker.longitude}`;
    window.open(`https://maps.google.com/?q=${q}`, '_blank');
  };

  const getAge = () => {
    const y = Number(worker?.birth_year);
    const now = new Date().getFullYear();
    if (!y || y < 1900 || y > now) return null;
    return now - y;
  };

  if (!worker) return <div className="loading">Ma'lumotlar yuklanmoqda...</div>;

  const age = getAge();

  const skills = Array.isArray(worker.skills) ? worker.skills : [];
  const visibleSkills = showAllSkills ? skills : skills.slice(0, MAX_SKILLS);
  const restCount = Math.max(skills.length - MAX_SKILLS, 0);

  const aboutText = worker.about_text || '';
  const aboutNeedsMore = aboutText.length > 220; // taxminiy trigger

  return (
  <div className="profile-page">
    <div className="profile-container">
      <div className="profile-container framed">

      <div className="profile-header">
        <img
          src={worker.avatar_url || '/user.png'}
          alt={`${worker.name || 'Ishchi'} — avatar`}
          className="profile-avatar"
        />
        <div className="name-row">
          <h2 className="profile-name">{worker.name}</h2>
          <OnlineDot lastSeen={worker.last_seen} />
        </div>

        {/* Badges */}
        <div className="badges">
          {age && <span className="badge">🎂 {age} yosh</span>}
          {worker.gender && <span className="badge">👤 {worker.gender}</span>}
          {distance && <span className="badge">📌 Sizdan: {distance} km</span>}
        </div>

        {/* Actions (keng ekranda ko'rinadi) */}
        <div className="profile-actions">
          <button className="btn btn--primary btn-call" onClick={handlePhoneClick}>
            📞 Qo‘ng‘iroq qilish
          </button>
          <button
            className="btn btn--accent"
            onClick={() => navigate(`/chat/${worker.phone}`)}
          >
            ✉️ Xabar yozish
          </button>
          {(typeof worker.latitude === 'number' && typeof worker.longitude === 'number') ? (
            <button className="btn btn--neutral" onClick={openInMaps}>🗺 Xarita</button>
          ) : (
            <button className="btn btn--outline" disabled>🗺 Xarita</button>
          )}
        </div>
      </div>

      <div className="profile-details">
        <p>
          <strong>📞 Telefon raqami:</strong>
          <span className="phone-link" onClick={handlePhoneClick} role="link" tabIndex={0}>
            +{worker.phone}
          </span>
        </p>

        <p><strong>📍 Tug‘ilgan shahar:</strong> {worker.birth_place || '—'}</p>

        <p><strong>🛠 Kasblari:</strong></p>
        <div className="skills">
          {visibleSkills.length > 0
            ? visibleSkills.map((s, i) => <span key={i} className="skill-chip">{s}</span>)
            : <span className="badge">Ma’lumot yo‘q</span>}
          {!showAllSkills && restCount > 0 && (
            <button className="skill-chip more" onClick={() => setShowAllSkills(true)}>
              +{restCount}
            </button>
          )}
        </div>

        <p><strong>ℹ️ O‘zi haqida:</strong></p>
        <div className="about-wrapper">
          <div className={`about ${aboutNeedsMore && !showAbout ? 'clamped' : ''}`}>
            {aboutText || "Ma'lumot yo'q."}
          </div>
          {aboutNeedsMore && (
            <button className="moreless" onClick={() => setShowAbout(!showAbout)}>
              {showAbout ? 'Kamroq' : 'Ko‘proq'}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>

    {/* Sahifa pastida yopishgan CTA (mobil) */}
    <div className="page-spacer" aria-hidden="true" />
    <div className="sticky-cta">
      <button className="btn btn--primary" onClick={handlePhoneClick}>📞 Qo‘ng‘iroq</button>
      <button className="btn btn--accent" onClick={() => navigate(`/chat/${worker.phone}`)}>
        ✉️ Xabar
      </button>
      {(typeof worker.latitude === 'number' && typeof worker.longitude === 'number') ? (
        <button className="btn btn--neutral" onClick={openInMaps}>🗺 Xarita</button>
      ) : (
        <button className="btn btn--outline" disabled>🗺 Xarita</button>
      )}
    </div>
  </div>
);
}