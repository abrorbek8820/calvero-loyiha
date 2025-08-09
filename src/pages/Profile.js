import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Profile.css';
import OnlineDot from '../components/OnlineDot';

export default function Profile() {
  const { phone } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const hasUpdated = useRef(false);

  // 1) profilga kirishlar hisoblagichi
  useEffect(() => {
    if (hasUpdated.current) return;
    hasUpdated.current = true;
    supabase.rpc('increment_views', { user_phone: phone });
  }, [phone]);

  // 2) foydalanuvchi GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    }
  }, []);

  // 3) worker ma'lumoti + masofa
  useEffect(() => {
    const fetchWorker = async () => {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('phone', phone)
        .single();

      if (!error && data) {
        const filteredSkills = Array.isArray(data.skills)
          ? data.skills.filter((skill) => skill && skill.toLowerCase() !== 'barchasini tanlash')
          : [];

        const next = { ...data, skills: filteredSkills };
        setWorker(next);

        if (userLocation && data.latitude && data.longitude) {
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

  return (
    <div className="profile-container">
      <button className="back-button" onClick={() => navigate(-1)}>Ortga</button>

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

        {/* Badges: masofa, yosh */}
        <div className="badges">
          {distance && <span className="badge">📌 Sizdan: {distance} km</span>}
          {age && <span className="badge">🎂 {age} yosh</span>}
          {worker.gender && <span className="badge">👤 {worker.gender}</span>}
        </div>

        {/* Asosiy amallar */}
        <div className="profile-actions">
          <button className="action-button primary" onClick={handlePhoneClick}>
            📞 Qo‘ng‘iroq qilish
          </button>
          <button className="chat-button" onClick={() => navigate(`/chat/${worker.phone}`)}>
            ✉️ Xabar yozish
          </button>
          {worker.latitude && worker.longitude && (
            <button className="action-button" onClick={openInMaps}>
              🗺 Xarita
            </button>
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
        <p><strong>📍 Tug‘ilgan shahar:</strong> {worker.birth_place || "—"}</p>

        <p><strong>🛠 Kasblari:</strong></p>
        <div className="skills">
          {(worker.skills && worker.skills.length > 0)
            ? worker.skills.map((s, i) => <span key={i} className="skill-chip">{s}</span>)
            : <span className="badge">Ma’lumot yo‘q</span>}
        </div>

        <p style={{ marginTop: 12 }}>
          <strong>ℹ️ O‘zi haqida:</strong> {worker.about_text || "Ma'lumot yo'q."}
        </p>
      </div>
    </div>
  );
}