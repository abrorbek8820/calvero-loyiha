import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VerifyCodeForm from "../components/VerifyCodeForm";

export default function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state?.phone || "").replace(/\D/g, "");

  useEffect(() => {
    if (!/^998\d{9}$/.test(phone)) {
      navigate("/otp", { replace: true });
    }
  }, [phone, navigate]);

  if (!/^998\d{9}$/.test(phone)) return null;

  return (
    <VerifyCodeForm
      phone={phone}
      onVerified={(p) =>
        navigate("/register", { state: { phone: p }, replace: true })
      }
    />
  );
}