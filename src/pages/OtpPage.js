import React from "react";
import { useNavigate } from "react-router-dom";
import OtpForm from "../components/OtpForm";

export default function OtpPage() {
  const navigate = useNavigate();

  return (
    <OtpForm
      onSuccess={(phone) =>
        navigate("/verify", { state: { phone }, replace: true })
      }
    />
  );
}