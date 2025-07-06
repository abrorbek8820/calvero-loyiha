import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./ClientRegister.css";

export default function ClientRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone) {
      alert("Iltimos, barcha maydonlarni to‘ldiring.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("clients").insert([
      {
        name,
        phone,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      alert("Xatolik yuz berdi: " + error.message);
    } else {
      localStorage.setItem("clientPhone", phone);
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="client-register-container">
      <h2>Ro‘yxatdan o‘tish</h2>

      <input
        type="text"
        placeholder="Ismingiz"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="tel"
        placeholder="Telefon raqam"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button onClick={handleRegister} disabled={loading}>
        {loading ? "Yuklanmoqda..." : "Ro‘yxatdan o‘tish"}
      </button>
    </div>
  );
}
