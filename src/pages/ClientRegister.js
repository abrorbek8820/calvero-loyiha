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

  const email = `1-${phone}@calvero.work`;
  const defaultPassword = phone;

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: defaultPassword,
  });

  if (signInError) {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: defaultPassword,
    });

    if (signUpError) {
      alert("Roʻyxatdan oʻtishda xatolik: " + signUpError.message);
      setLoading(false);
      return;
    }
  }

  const { data: existingClient, error: selectError } = await supabase
    .from("clients")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (!existingClient) {
    const { error: insertError } = await supabase.from("clients").insert([
      {
        name,
        phone,
        email,
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      alert("Clientsga yozishda xatolik: " + insertError.message);
      setLoading(false);
      return;
    }
  }

  localStorage.setItem("clientPhone", phone);
  localStorage.setItem("is-worker", 'false');

  if (window.Android && window.Android.savePhone) {
  window.Android.savePhone(phone);
}

  setLoading(false);
  navigate("/");
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