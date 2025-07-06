import React, { useEffect, useState } from "react";
import "./IshchiKerak.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { maleSkills, femaleSkills } from "../data/skills";

export default function IshchiKerak() {
  const navigate = useNavigate();
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [genderFilter, setGenderFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [skillOptions, setSkillOptions] = useState([]);

  useEffect(() => {
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
    if (genderFilter === "Erkak") setSkillOptions(maleSkills.filter(skill => skill !== "Barchasini tanlash"));
    else if (genderFilter === "Ayol") setSkillOptions(femaleSkills.filter(skill => skill !== "Barchasini tanlash"));
    else setSkillOptions([...maleSkills, ...femaleSkills].filter(skill => skill !== "Barchasini tanlash"));

    setSkillFilter("");
  }, [genderFilter]);

  useEffect(() => {
    if (locationAllowed && userLocation) {
      fetchWorkers();
    }
  }, [locationAllowed, userLocation, genderFilter, skillFilter]);

  const fetchWorkers = async () => {
    let query = supabase
      .from("workers")
      .select("*, latitude, longitude")
      .eq("status", "online")
      .eq("is_listed", true);

    if (genderFilter) {
      query = query.eq("gender", genderFilter);
    }

    if (skillFilter) {
      query = query.contains("skills", [skillFilter]);
    }

    const { data, error } = await query;

    if (error) {
      alert("Xatolik yuz berdi: " + error.message);
      return;
    }

    const workersWithDistance = data.map((worker) => ({
      ...worker,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        worker.latitude,
        worker.longitude
      ).toFixed(1),
    }));

    setWorkers(workersWithDistance);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="ishchi-kerak-container">
      <div className="top-bar">
        <button className="tarix-button" onClick={() => navigate("/tarix")}>
          Tarix
        </button>
        <h2>Ishchi kerak</h2>
      </div>

      <div className="filter-section">
        <label htmlFor="gender">Jins:</label>
        <select id="gender" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="">Barchasi</option>
          <option value="Erkak">Erkak</option>
          <option value="Ayol">Ayol</option>
        </select>

        <label htmlFor="skill">Kasb:</label>
        <select id="skill" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}>
          <option value="">Barchasi</option>
          {skillOptions.map((skill, idx) => (
            <option key={idx} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>

      <div className="workers-list">
        {workers.map((worker) => (
          <div className="worker-card" key={worker.phone}
            onClick={() => navigate(`/profile/${worker.phone}`)}>
            <img src={worker.avatar_url || "/user.png"} alt="avatar" className="avatar" />
            <div className="worker-info">
              <h3>Ism: {worker.name}</h3>
              <p>Kasb: {worker.skills.join(", ")}</p>
              <p>Masofa: {worker.distance} km</p>
              <p>{worker.birth_place}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}