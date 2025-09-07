import React, { useState, useEffect } from "react";
import axios from "axios";
import "./otp.css";
import { useNavigate } from "react-router-dom";

// API bazaviy URL – avval .env dan, bo‘lmasa hostname bo‘yicha
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL &&
    import.meta.env.VITE_API_BASE_URL.trim()) ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://api.calvero.work");

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export default function OtpForm({ onSuccess }) {
  const navigate = useNavigate();
  const [digits9, setDigits9] = useState(""); // faqat 9 ta raqam
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("offerAccepted") === "true") ||
      false
  );

  // input: faqat raqam va 9 belgigacha
  const onChangePhone = (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 9);
    setDigits9(d);
  };

  // ko‘rinish uchun "90 123 45 67"
  const fmt = (d) => {
    const parts = [];
    if (d.length > 0) parts.push(d.slice(0, 2));
    if (d.length > 2) parts.push(d.slice(2, 5));
    if (d.length > 5) parts.push(d.slice(5, 7));
    if (d.length > 7) parts.push(d.slice(7, 9));
    return parts.join(" ");
  };

  const handleSend = async () => {
    if (digits9.length !== 9) {
      setStatus("❌ 9 xonali raqam kiriting (masalan: 90 123 45 67)");
      return;
    }
    const phone = "998" + digits9; // Eskiz formati

    setLoading(true);
    setStatus("");
    try {
      const { data } = await api.post("/api/send-sms", { phone });
      // backend: { ok:true } yoki { ok:false, msg:"..." }
      if (data?.ok === true || data?.success === true) {
        setStatus("✅ Kod yuborildi");
        onSuccess?.(phone);
      } else {
        setStatus("❌ " + (data?.msg || data?.message || "Xatolik"));
      }
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Server bilan ulanishda xatolik";
      setStatus("❌ " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      setAccepted(localStorage.getItem("offerAccepted") === "true");
    } catch {}
  }, []);

  const onToggleAccept = (e) => {
    const v = e.target.checked;
    setAccepted(v);
    try {
      localStorage.setItem("offerAccepted", v ? "true" : "false");
    } catch {}
  };

  return (
    <div className="raqam-bloki">
      <label>Telefon raqamingizni kiriting:</label>

      <div className="raqam">
        <label>+998</label>
        <input
          type="tel"
          value={fmt(digits9)}
          onChange={onChangePhone}
          placeholder="90 123 45 67"
          inputMode="numeric"
        />
      </div>

      <button onClick={handleSend} disabled={loading || !accepted}>
        {loading ? "Yuborilmoqda…" : "Kod yuborish"}
      </button>

      <div className="shartlari" style={{ marginTop: 12 }}>
        <label style={{ display: "block", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={onToggleAccept}
            style={{ marginRight: 8, verticalAlign: "middle" }}
          />
          Men{" "}
          <button
            type="button"
            onClick={() => navigate("/offer")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#3961cdff",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            ommaviy oferta shartlari
          </button>{" "}
          bilan tanishib chiqdim va qabul qilaman!
        </label>
      </div>

      {!!status && (
        <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{status}</p>
      )}
    </div>
  );
}