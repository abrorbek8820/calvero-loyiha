import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Profil.css";

export default function Profil() {
  const navigate = useNavigate();
  const phone = localStorage.getItem("userPhone");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("light");

  // Rejimni body class orqali olish
  useEffect(() => {
    const bodyClass = document.body.classList.contains("dark") ? "dark" : "light";
    setMode(bodyClass);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        alert("Siz login qilmagansiz, qaytadan kiring!");
        navigate("/login");
      }
    });
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("workers")
        .select("name, about_text, avatar_url")
        .eq("phone", phone)
        .single();

      if (data) {
        setName(data.name || "");
        setAbout(data.about_text || "");
        setAvatarUrl(data.avatar_url || "");
      } else if (error) {
        console.error("Ma'lumot olishda xatolik:", error.message);
      }

      setLoading(false);
    };
    fetchData();
  }, [phone]);

  const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileExt = file.name.split(".").pop();
  const newFilePath = `${phone}-${Date.now()}.${fileExt}`; // yangi nom, har doim farqli

  // Eski faylni o‘chirish
  if (avatarUrl) {
    const oldFileName = avatarUrl.split("/").pop();
    await supabase.storage.from("avatars").remove([oldFileName]);
  }

  // Yangi faylni yuklash
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(newFilePath, file);

  if (uploadError) {
    alert("Rasm yuklashda xatolik: " + uploadError.message);
    return;
  }

  // Public URL olish
  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(newFilePath);

  const publicUrl = publicUrlData.publicUrl;

  // Supabase bazasida avatar URL yangilash
  const { error: updateError } = await supabase
    .from("workers")
    .update({ avatar_url: publicUrl })
    .eq("phone", phone);

  if (updateError) {
    alert("URL saqlashda xatolik: " + updateError.message);
  } else {
    setAvatarUrl(publicUrl); // UI yangilanishi uchun
  }
};

  const handleAboutSave = async () => {
    const { error } = await supabase
      .from("workers")
      .update({ about_text: about })
      .eq("phone", phone);

    if (error) {
      alert("Ma'lumotlarni saqlashda xatolik: " + error.message);
    } else {
      alert("Ma'lumot muvaffaqiyatli saqlandi.");
    }
  };

  const handleLogout = async () => {
    const confirm = window.confirm(
      "Tizimdan chiqsangiz balansdagi mablag‘ yo‘qoladi. Chiqishni istaysizmi?"
    );
    if (!confirm) return;

    localStorage.removeItem("userPhone");
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading)
    return <p className="text-white text-center mt-10">Yuklanmoqda...</p>;

  return (
    <div className={`profil-container ${mode === "dark" ? "dark-mode" : "light-mode"}`}>
      <div className="profil-card">
        <div className="avatar-wrapper">
          <label className="relative cursor-pointer">
            <img src={avatarUrl || "/user.png"} alt="Avatar" className="avatar-img" />
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <span className="change-text">O‘zgartirish</span>
          </label>
        </div>

        <div className="info-box">
          <label>Ism:</label>
          <p>{name}</p>
        </div>
        <div className="info-box">
          <label>O‘zingiz haqingizda:</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="O‘zingiz haqingizda qisqacha yozing..."
          ></textarea>
          <button onClick={handleAboutSave} className="save-button">
            Saqlash
          </button>
        </div>

        <div className="button-group">
          <button onClick={() => navigate("/edit-profile")} className="edit-button">
            Tahrirlash
          </button>
          <button onClick={handleLogout} className="logout-button">
            Chiqish
          </button>
        </div>
      </div>
    </div>
  );
}