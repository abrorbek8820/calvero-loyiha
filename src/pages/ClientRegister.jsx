import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./ClientRegister.css";

export default function ClientRegister() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998 "); // UI uchun formatlangan qiymat
  const [accepted, setAccepted] = useState(
    localStorage.getItem("offerAccepted") === "true"
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // +998 ni saqlab, foydalanuvchidan faqat 9 raqam qabul qilish
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/[^\d]/g, ""); // faqat raqamlar
    if (!val.startsWith("998")) val = "998";        // doim 998
    const digits = val.slice(3, 12);                // 998 dan keyingi 9 raqam

    const p1 = digits.slice(0, 2);
    const p2 = digits.slice(2, 5);
    const p3 = digits.slice(5, 7);
    const p4 = digits.slice(7, 9);

    let formatted = "+998 ";
    if (p1) formatted += p1;
    if (p2) formatted += " " + p2;
    if (p3) formatted += " " + p3;
    if (p4) formatted += " " + p4;

    setPhone(formatted);
  };

  const onToggleAccept = (e) => {
    const v = e.target.checked;
    setAccepted(v);
    localStorage.setItem("offerAccepted", v ? "true" : "false");
  };

  // Foydali helperlar
  const uz9 = () => phone.replace(/\D/g, "").slice(3); // faqat 9 raqam
  const full998 = () => "998" + uz9();                  // 998 + 9 raqam

  const handleRegister = async () => {
    if (!name.trim() || uz9().length !== 9) {
      alert("Iltimos, ism va 9 xonali telefon raqamini to‘ldiring.");
      return;
    }
    if (!accepted) {
      alert("Iltimos, ommaviy ofertani qabul qiling.");
      return;
    }

    setLoading(true);
    setStatus("");

    const fullPhone = full998(); // 998901234567
    const email = `1-${fullPhone}@calvero.work`;
    const defaultPassword = fullPhone;

    try {
      // 1) Mavjud bo'lsa signin, bo'lmasa signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: defaultPassword,
      });
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: defaultPassword,
        });
        if (signUpError) throw signUpError;
      }

      // 2) clients jadvalida bor-yo'qligini tekshirish
      const { data: existingClient, error: selectErr } = await supabase
        .from("clients")
        .select("id")
        .eq("client_phone", fullPhone)
        .maybeSingle();
      if (selectErr) throw selectErr;

      // 3) Yo'q bo'lsa qo'shamiz
      if (!existingClient) {
        const { error: insertError } = await supabase.from("clients").insert([
          {
            name,
            client_phone: fullPhone,
            email,
            created_at: new Date().toISOString(),
          },
        ]);
        if (insertError) throw insertError;
      }

      localStorage.setItem("clientPhone", fullPhone);
      setStatus("Muvaffaqiyatli ro'yxatdan o'tildi ✅");
      navigate("/home", { replace: true });
    } catch (e) {
      const msg = e?.message || "Noma'lum xatolik";
      console.error(e);
      alert("Xatolik: " + msg);
      setStatus("Xatolik: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    loading || !accepted || !name.trim() || uz9().length !== 9;

  return (
    <div className="client-register-container">
      <h2>Ro‘yxatdan o‘tish</h2>

      <input
        type="text"
        placeholder="Ismingiz"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="raqam-uz">
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="90 123 45 67"
          inputMode="numeric"
          maxLength={17}               // +998 90 123 45 67 (17 ta belgi)
          className="phone-input"
          aria-label="Telefon raqam (+998 bilan)"
        />
      </div>

      <div className="oferta-accept">
        <label className="oferta-label">
          <input type="checkbox" checked={accepted} onChange={onToggleAccept} />
          <span>
             Men{" "}
            <button
              type="button"
              className="oferta-link"
              onClick={() => navigate("/offer")}
            >
              ommaviy oferta shartlari
            </button>{" "}
            bilan tanishib chiqdim va qabul qilaman.
          </span>
        </label>
      </div>

      <button onClick={handleRegister} disabled={isDisabled}>
        {loading ? "Yuklanmoqda..." : "Ro‘yxatdan o‘tish"}
      </button>

      {status && <p className="status">{status}</p>}
    </div>
  );
}