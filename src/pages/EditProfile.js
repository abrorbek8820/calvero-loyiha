import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { maleSkills, femaleSkills } from "../data/skills";
import "./EditProfile.css";

export default function EditProfile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [skills, setSkills] = useState([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skillOptions, setSkillOptions] = useState([]);

  const userPhone = localStorage.getItem("userPhone");

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (gender === "Erkak") setSkillOptions(maleSkills);
    else if (gender === "Ayol") setSkillOptions(femaleSkills);
  }, [gender]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .eq("phone", userPhone)
      .single();

    if (error) {
      alert("Xatolik yuz berdi: " + error.message);
      return;
    }

    setName(data.name);
    setBirthPlace(data.birth_place.replace("lik", ""));
    setBirthYear(data.birth_year);
    setGender(data.gender);
    setSkills(data.skills);
    setEmail(data.email);
    setPhone(data.phone);
  };

  const handleSkillChange = (e) => {
    const selected = e.target.value;
    if (selected === "Barchasini tanlash") {
      setSkills(skills.length === skillOptions.length ? [] : skillOptions);
    } else {
      setSkills((prev) =>
        prev.includes(selected)
          ? prev.filter((skill) => skill !== selected)
          : [...prev, selected]
      );
    }
  };

  const updateProfile = async () => {
    const { error } = await supabase
      .from("workers")
      .update({
        name,
        birth_place: birthPlace + "lik",
        birth_year: birthYear,
        gender,
        skills,
        email,
      })
      .eq("phone", userPhone);

    if (error) {
      alert("Yangilashda xatolik: " + error.message);
      return;
    }

    alert("Profil muvaffaqiyatli yangilandi!");
    navigate("/profil");
  };

  const years = Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 2025 - i);

  return (
    <div className="edit-profile-container">
      <h2>Profilni tahrirlash</h2>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ismingiz"
      />
      <input
        type="text"
        value={birthPlace}
        onChange={(e) => setBirthPlace(e.target.value)}
        placeholder="Tug‘ilgan joy"
      />

      <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="">Jinsingiz</option>
        <option value="Erkak">Erkak</option>
        <option value="Ayol">Ayol</option>
      </select>

      <div className="skills-checkbox-container">
        {skillOptions.map((skill) => (
          <label key={skill}>
            <input
              type="checkbox"
              value={skill}
              checked={skills.includes(skill)}
              onChange={handleSkillChange}
            />
            {skill}
          </label>
        ))}
      </div>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <input type="text" value={phone} disabled placeholder="Telefon raqamingiz" />

      <button onClick={updateProfile}>Yangilash</button>
    </div>
  );
}