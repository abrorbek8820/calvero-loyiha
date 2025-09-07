import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VerifyCodeForm from "../components/VerifyCodeForm";

export default function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state?.phone || "").replace(/\D/g, "");

  useEffect(() => {
    // 1) Agar allaqachon login bo'lgan bo'lsa (register tugagan bo'lsa) → /home
    try {
      const st = localStorage.getItem("session_token");
      const up = localStorage.getItem("userPhone");
      if (st && up) {
        navigate("/home", { replace: true });
        return;
      }
    } catch {}

    // 2) Verify sahifasiga faqat OTP'dan kelgan telefon bilan kirish mumkin
    if (!/^998\d{9}$/.test(phone)) {
      navigate("/otp", { replace: true });
    }
  }, [phone, navigate]);

  if (!/^998\d{9}$/.test(phone)) return null;

  // MUHIM: VerifyCodeForm ichida /register ga o‘tganda ham replace:true borligiga ishonch hosil qil
  return (
    <VerifyCodeForm
      phone={phone}
      onVerified={(p) =>
        navigate("/register", { state: { phone: p }, replace: true })
      }
    />
  );
}