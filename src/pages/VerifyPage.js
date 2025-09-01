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

  // VerifyCodeForm ichida navigate('/register', { state: { phone } }) qilamiz
  return <VerifyCodeForm phone={phone} />;
}