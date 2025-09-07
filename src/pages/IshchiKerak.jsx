import React, { useEffect, useRef, useState } from "react";
import "./IshchiKerak.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { maleSkills, femaleSkills } from "../data/skills";
import OnlineDot from "../components/OnlineDot";

// ---- Geo helper: tez + kesh + fon yangilash
function getCachedCoords(maxAgeMs = 60_000) {
  try {
    const s = localStorage.getItem("lastLocation");
    if (!s) return null;
    const obj = JSON.parse(s);
    if (Date.now() - obj.ts > maxAgeMs) return null;
    return obj.coords;
  } catch {
    return null;
  }
}

function getPositionFast({ quickTimeout = 5000, preciseTimeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    // 1) Agar kesh bo'lsa, darhol qaytaramiz (UI tez ochilsin)
    const cached = getCachedCoords(120_000); // 2 daqiqa ichida bo'lsa mayli
    if (cached) resolve(cached);

    // 2) Tez (taxminiy) urinish
    let resolved = false;
    const onQuick = (p) => {
      if (!resolved) {
        resolved = true;
        const coords = { latitude: p.coords.latitude, longitude: p.coords.longitude };
        localStorage.setItem("lastLocation", JSON.stringify({ ts: Date.now(), coords }));
        resolve(coords);
      }
    };
    const onQuickErr = () => {
      // tez urinish muvaffaqiyatsiz bo'lsa ham, precise keladi
      if (!cached) {
        // hech bo'lmaganda reject qilmaysiz, precise kelsin
      }
    };

    navigator.geolocation.getCurrentPosition(onQuick, onQuickErr, {
      enableHighAccuracy: false,
      timeout: quickTimeout,
      maximumAge: 120_000, // 2 daqiqa oldingi natija ham mayli
    });

    // 3) Aniqlik yuqori urinish (fon rejimida)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const coords = { latitude: p.coords.latitude, longitude: p.coords.longitude };
        localStorage.setItem("lastLocation", JSON.stringify({ ts: Date.now(), coords }));
        // agar tezda allaqachon resolve qilingan bo'lsa — UI ni yangilab yuborish uchun event return qiling
        if (!resolved) {
          resolved = true;
          resolve(coords);
        }
      },
      () => {
        if (!resolved && !cached) reject(new Error("GPS permission/timeout"));
      },
      { enableHighAccuracy: true, timeout: preciseTimeout, maximumAge: 0 }
    );
  });
}

export default function IshchiKerak() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState("light");
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const [genderFilter, setGenderFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [skillOptions, setSkillOptions] = useState([]);

  const [workers, setWorkers] = useState([]);
  const [visibleCount, setVisibleCount] = useState(30);
  const [loading, setLoading] = useState(true);
  const [geoWarning, setGeoWarning] = useState("");

  const pollingRef = useRef(null);
  const lastFetchRef = useRef(0);

  // ---- Start-up: tema, clientPhone, geoni olish
  useEffect(() => {
    setTheme(localStorage.getItem("mode") === "dark" ? "dark" : "light");

    const clientPhone = localStorage.getItem("clientPhone");
    if (!clientPhone) {
      navigate("/client-register");
      return;
    }

    if (!navigator.geolocation) {
      setGeoWarning("Brauzeringiz GPS qo'llab-quvvatlamaydi");
      return;
    }

    // GPS’ni tez olish (kesh + tez/aniq)
    getPositionFast()
      .then((coords) => {
        setUserLocation(coords);
        setLocationAllowed(true);
      })
      .catch(() => {
        setGeoWarning("Iltimos, GPS ruxsatini bering yoki GPSni yoqing.");
        setLocationAllowed(false);
      });
  }, [navigate]);

  // ---- Filterlarga qarab kasb ro'yxati
  useEffect(() => {
    if (genderFilter === "Erkak") {
      setSkillOptions(maleSkills.filter((s) => s !== "Barchasini tanlash"));
    } else if (genderFilter === "Ayol") {
      setSkillOptions(femaleSkills.filter((s) => s !== "Barchasini tanlash"));
    } else {
      setSkillOptions(
        [...maleSkills, ...femaleSkills].filter((s) => s !== "Barchasini tanlash")
      );
    }
    setSkillFilter("");
  }, [genderFilter]);

  // ---- Ishchilarni olish (debouncega o'xshash himoya bilan)
  const fetchWorkers = async (showLoading = true) => {
    if (!userLocation) return;

    const now = Date.now();
    // 800 ms ichida ketma-ket fetchlardan saqla
    if (now - lastFetchRef.current < 800) return;
    lastFetchRef.current = now;

    if (showLoading) setLoading(true);

    const { data, error } = await supabase.rpc("fetch_workers_conditional_js", {
      client_lat: userLocation.latitude,
      client_lon: userLocation.longitude,
      radius_km: 10,
      min_worker_count: 5,
      filter_gender: genderFilter || null,
      filter_skill: skillFilter || null,
    });

    if (error) {
      console.error(error);
      // alert bilan bloklamaymiz
      setLoading(false);
      return;
    }

    // Frontendda minimal tekshiruv (RPC allaqachon filtrlayapti)
    const sorted = (data || []).map((w) => ({
      ...w,
      distance: Number(w.distance / 1000).toFixed(1), // metr -> km
    }));

    setWorkers(sorted);
    if (showLoading) setLoading(false);
  };

  // ---- Birinchi yuklash va polling
  useEffect(() => {
    if (!locationAllowed || !userLocation) return;

    // Birinchi yuklash
    fetchWorkers(true);

    // Polling: har 10 s yangilash (faqat joy va filter o'zgarmasa ham)
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => fetchWorkers(false), 10_000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationAllowed, userLocation, genderFilter, skillFilter]);

  return (
    <div className={`ishchi-kerak-container ${theme === "dark" ? "dark-mode" : ""}`}>
      <div className="fixed-header">
        <div className="logo">🏗️ Calvero</div>

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

      {geoWarning && (
        <div className="geo-warning">
          {geoWarning}
        </div>
      )}

      <div className="scrollable-workers">
        {loading ? (
          <div className="spinner-wrapper">
            <div className="spinner"></div>
            <p>🔎 Qidirilmoqda...</p>
          </div>
        ) : workers.length === 0 ? (
          <p className="text-center p-4 text-xl">
            💔 Hozirda barcha ishchilar band! Iltimos, keyinroq urinib ko‘ring!
          </p>
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
                  <h3 className="worker-name">
                    {worker.name}
                    <OnlineDot lastSeen={worker.last_seen} />
                  </h3>
                  <p className="worker-skill">{worker.skills?.[0]}</p>
                  <p className="worker-distance">Sizdan {worker.distance} km</p>
                  <p className="worker-location">{worker.birth_place}lik</p>
                </div>
              </div>
            ))}

            {visibleCount < workers.length && (
              <div className="text-center">
                <button
                  className="load-more-btn"
                  onClick={() => setVisibleCount((v) => v + 30)}
                >
                  ⬇️ Yana ko‘rsatish
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}