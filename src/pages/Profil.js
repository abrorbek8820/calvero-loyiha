import React, { useEffect, useState } from "react"; import { useNavigate } from "react-router-dom"; import { supabase } from "../supabaseClient"; import "./Profil.css";

export default function Profil() { const navigate = useNavigate(); const phone = localStorage.getItem("userPhone"); const [avatarUrl, setAvatarUrl] = useState(""); const [name, setName] = useState(""); const [about, setAbout] = useState(""); const [loading, setLoading] = useState(true);

useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => { if (!session) { alert("Siz login qilmagansiz, qaytadan kiring!"); navigate('/login'); } }); }, [navigate]);

useEffect(() => { const fetchData = async () => { const { data, error } = await supabase .from("workers") .select("name, about_text, avatar_url") .eq("phone", phone) .single();

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

const handleAvatarChange = async (e) => { const file = e.target.files[0]; if (!file) return;

const fileExt = file.name.split(".").pop();
const filePath = `${phone}.${fileExt}`;

const { error: uploadError } = await supabase.storage
  .from("avatars")
  .upload(filePath, file, { cacheControl: "3600", upsert: true });

if (uploadError) {
  alert("Rasm yuklashda xatolik: " + uploadError.message);
  return;
}

const { data: publicUrlData } = supabase.storage
  .from("avatars")
  .getPublicUrl(filePath);

const publicUrl = publicUrlData.publicUrl;

const { error: updateError } = await supabase
  .from("workers")
  .update({ avatar_url: publicUrl })
  .eq("phone", phone);

if (updateError) {
  alert("URL saqlashda xatolik: " + updateError.message);
} else {
  setAvatarUrl(publicUrl);
}

};

const handleAboutSave = async () => { const { error } = await supabase .from("workers") .update({ about_text: about }) .eq("phone", phone);

if (error) {
  alert("Ma'lumotlarni saqlashda xatolik: " + error.message);
} else {
  alert("Ma'lumot muvaffaqiyatli saqlandi.");
}

};

if (loading) return <p className="text-white text-center mt-10">Yuklanmoqda...</p>;

return ( <div className="profil-container"> <div className="avatar-wrapper"> <label className="relative cursor-pointer"> <img src={avatarUrl || "/user.png"} alt="Avatar" /> <input
type="file"
accept="image/*"
onChange={handleAvatarChange}
className="hidden"
/> <span>O‘zgartirish</span> </label> </div>

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

  <button onClick={() => navigate("/edit-profile")} className="edit-button">
    Tahrirlash
  </button>
</div>

); }

