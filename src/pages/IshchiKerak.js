import React, { useEffect, useState } from "react"; import "./IshchiKerak.css"; import { useNavigate } from "react-router-dom"; import { supabase } from "../supabaseClient"; import { maleSkills, femaleSkills } from "../data/skills";
import OnlineDot from '../components/OnlineDot';

export default function IshchiKerak() { const navigate = useNavigate(); const [locationAllowed, setLocationAllowed] = useState(false); const [workers, setWorkers] = useState([]); const [userLocation, setUserLocation] = useState(null); const [genderFilter, setGenderFilter] = useState(""); const [skillFilter, setSkillFilter] = useState(""); const [skillOptions, setSkillOptions] = useState([]); const [visibleCount, setVisibleCount] = useState(30); const [loading, setLoading] = useState(true); const [theme, setTheme] = useState("light");

useEffect(() => { const savedMode = localStorage.getItem("mode");
  setTheme(savedMode === "dark" ? "dark" : "light");

const clientPhone = localStorage.getItem("clientPhone");
if (!clientPhone) {
  navigate("/client-register");
  return;
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationAllowed(true);
    },
    () => {
      alert("Iltimos, GPS ni yoqing!");
      navigate("/");
    }
  );
} else {
  alert("Brauzeringiz GPS qo‘llab-quvvatlamaydi!");
  navigate("/");
}

}, [navigate]);

useEffect(() => {
  if (locationAllowed && userLocation) fetchWorkers();

  const interval = setInterval(() => {
    if (locationAllowed && userLocation) fetchWorkers(false);
  }, 10000); // har 10 soniyada yangilaydi

  return () => clearInterval(interval);
}, [locationAllowed, userLocation, genderFilter, skillFilter]);

useEffect(() => { if (genderFilter === "Erkak") setSkillOptions(maleSkills.filter((skill) => skill !== "Barchasini tanlash")); else if (genderFilter === "Ayol") setSkillOptions(femaleSkills.filter((skill) => skill !== "Barchasini tanlash")); else setSkillOptions( [...maleSkills, ...femaleSkills].filter((skill) => skill !== "Barchasini tanlash") );

setSkillFilter("");

}, [genderFilter]);

useEffect(() => { if (locationAllowed && userLocation) fetchWorkers(); }, [locationAllowed, userLocation, genderFilter, skillFilter]);

const calculateDistance = (lat1, lon1, lat2, lon2) => { const R = 6371; const dLat = ((lat2 - lat1) * Math.PI) / 180; const dLon = ((lon2 - lon1) * Math.PI) / 180; const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2); const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c; };

const fetchWorkers = async (showLoading = true) => {
  if (showLoading) setLoading(true);

  const { data, error } = await supabase.rpc("fetch_workers_conditional_js", {
  client_lat: userLocation.latitude,
  client_lon: userLocation.longitude,
  radius_km: 10,
  min_worker_count: 5,
  filter_gender: genderFilter || null,
  filter_skill: skillFilter || null
});

  if (error) {
    alert("Xatolik yuz berdi: " + error.message);
    if (showLoading) setLoading(false);
    return;
  }

  // Frontend filtrlar: jins va kasb
  const filtered = data.filter((worker) => {
    if (genderFilter && worker.gender !== genderFilter) return false;
    if (skillFilter && !worker.skills.includes(skillFilter)) return false;
    return true;
  });

  const sorted = filtered.map((w) => ({
    ...w,
    distance: Number(w.distance / 1000).toFixed(1), // metr -> km
  }));

  setWorkers(sorted);
  if (showLoading) setLoading(false);
};

return (
  <div className={`ishchi-kerak-container ${theme === "dark" ? "dark-mode" : ""}`}>

    {/* Qotib turadigan logo va filterlar */}
    <div className="fixed-header">
      <div className="logo">🛠️ Calvero</div>

      <div className="filter-section">
        <select id="gender" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="">Jins: Barchasi</option>
          <option value="Erkak">Erkak</option>
          <option value="Ayol">Ayol</option>
        </select>

        <select id="skill" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}>
          <option value="">Kasb: Barchasi</option>
          {skillOptions.map((skill, idx) => (
            <option key={idx} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Scroll bo‘ladigan ishchilar ro‘yxati */}
    <div className="scrollable-workers">
      {loading ? (
  <div className="spinner-wrapper">
    <div className="spinner"></div>
    <p>🔎 Qidirilmoqda...</p>
  </div>
) : workers.length === 0 ? (
  <p className="text-center p-4 text-xl">❌ Xozirda barcha ishchilar band! Iltimos, keyinroq urunib ko'ring!</p>
) : (
        <>
          {workers.slice(0, visibleCount).map((worker) => (
            <div
              className="worker-card"
              key={worker.phone}
              onClick={() => navigate(`/profile/${worker.phone}`)}
            > 
              <img src={worker.avatar_url || "/user.png"} alt="avatar" className="avatari" />
              
              <div className="worker-info">
                <h3 className="worker-name">{worker.name}<OnlineDot lastSeen={worker.last_seen} /> </h3>
                <p className="worker-skill">{worker.skills[0]}</p>
                <p className="worker-distance">Sizdan {worker.distance} km</p>
                <p className="worker-location">{worker.birth_place}lik</p>
                
              </div>
            </div>
          ))}

          {visibleCount < workers.length && (
            <div className="text-center">
              <button className="load-more-btn" onClick={() => setVisibleCount(visibleCount + 30)}>
                🔽 Yana ko‘rsatish
              </button>
            </div>
          )}
        </>
      )}
    </div>
  </div>
); }

