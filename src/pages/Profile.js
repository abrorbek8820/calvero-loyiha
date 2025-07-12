import React, { useEffect, useRef, useState } from 'react'; import { useParams, useNavigate } from 'react-router-dom'; import { supabase } from '../supabaseClient'; import './Profile.css';

export default function Profile() { const { phone } = useParams(); const navigate = useNavigate(); const [worker, setWorker] = useState(null); const [userLocation, setUserLocation] = useState(null); const [distance, setDistance] = useState(null); const hasUpdated = useRef(false);

useEffect(() => { if (hasUpdated.current) return; hasUpdated.current = true;

const increaseViews = async () => {
  await supabase.rpc('increment_views', { user_phone: phone });
};

increaseViews();

}, [phone]);

useEffect(() => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((position) => { setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, }); }); } }, []);

useEffect(() => { const fetchWorker = async () => { const { data, error } = await supabase .from('workers') .select('*') .eq('phone', phone) .single();

if (!error) {
    const filteredSkills = data.skills.filter(skill => skill.toLowerCase() !== 'barchasini tanlash');
    setWorker({ ...data, skills: filteredSkills });

    if (userLocation) {
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

const calculateDistance = (lat1, lon1, lat2, lon2) => { const R = 6371; const dLat = ((lat2 - lat1) * Math.PI) / 180; const dLon = ((lon2 - lon1) * Math.PI) / 180; const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2); const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c; };

const handlePhoneClick = async () => { await supabase.rpc('increment_phone_views', { user_phone: worker.phone }); window.location.href = `tel:${worker.phone}`; };

if (!worker) return <div className="loading">Ma'lumotlar yuklanmoqda...</div>;

return ( <div className="profile-container" style={{ backgroundColor: '#121212', color: '#ffffff' }}> <button className="back-button" onClick={() => navigate(-1)}>Ortga</button>

<div className="profile-header">
    <img
      src={worker.avatar_url || '/user.png'}
      alt="avatar"
      className="profile-avatar"
    />
    <h2 className="profile-name">{worker.name}</h2>
  </div>

  <div className="profile-details">
    <p className="phone-link" onClick={handlePhoneClick}>
      <strong>📞 Telefon raqami:</strong> {worker.phone}
    </p>
    <p><strong>👤 Jinsi:</strong> {worker.gender}</p>
    <p><strong>🎂 Tug‘ilgan yil:</strong> {worker.birth_year}</p>
    <p><strong>📍 Tug‘ilgan shahar:</strong> {worker.birth_place}</p>
    <p><strong>🛠️ Kasblari:</strong> {worker.skills.join(', ')}</p>
    <p><strong>ℹ️ O‘zi haqida:</strong> {worker.about_text || "Ma'lumot yo'q."}</p>
    {distance && <p><strong>📌 Sizdan:</strong> {distance} km uzoqlikda</p>}
  </div>
</div>

); }

