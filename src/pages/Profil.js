import React, { useEffect, useState, useRef } from "react";
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
  const fileInputRef = useRef(null);
  const [theme, setTheme] = useState("light");

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

  const phone = localStorage.getItem("userPhone");

  // 1️⃣ Workers jadvalidagi session_token'ni tozalash
  if (phone) {
    try {
      await supabase
        .from("workers")
        .update({ session_token: null })
        .eq("phone", phone);
    } catch (e) {
      console.warn("❌ Workers jadvalidan tokenni tozalashda xato:", e.message);
    }
  }

  // 2️⃣ Supabase Auth sessiyadan chiqish
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("❌ Supabase auth signOut xato:", e.message);
  }

  // 3️⃣ LocalStorage tozalash
  localStorage.removeItem("userPhone");
  localStorage.removeItem("session_token");
  localStorage.removeItem("session_checked");

  // 4️⃣ Foydalanuvchini chiqarib yuborish
  navigate("/");
};

  if (loading)
    return <p className="text-white text-center mt-10">Yuklanmoqda...</p>;

  return (
  <div className="profil-container">
    <div className="profil-content">
      
      {/* Avatar va ism */}
      <div className="avatar-block">
  <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
    <img
      src={avatarUrl || "/user.png"}
      alt="Avatar"
      className="avatar-img"
    />
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleAvatarChange}
      className="hidden"
    />
  </div>
  <h2 className="profil-name">{name || "Ishchi"}</h2>
</div>

      {/* O‘zingiz haqingizda */}
      <div className="info-section">
        <label className="info-label">O‘zingiz haqingizda</label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="O‘zingiz haqingizda qisqacha yozing..."
          className="about-input"
        />
      </div>
    </div>

    {/* Pastki tugmalar */}
    <div className="profil-actions">
      <button onClick={handleAboutSave} className="action-button save">💾 Saqlash</button>
      <button onClick={() => navigate("/edit-profile")} className="action-button edit">✏️ Tahrirlash</button>
      <button onClick={handleLogout} className="action-button logout">🚪 Chiqish</button>
      <button onClick={() => navigate("/delete")} className="action-button delete">🗑️ Akkauntni o‘chirish</button>
    </div>
  </div>
);
}