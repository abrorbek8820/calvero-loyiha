// PhoneVerification.jsx
import React, { useState } from 'react';
import OtpForm from './OtpForm';
import VerifyCodeForm from './VerifyCodeForm';

export default function PhoneVerification() {
  const [phone, setPhone] = useState(null);
  const [verified, setVerified] = useState(false);

  if (verified) return <p>✅ Telefon tasdiqlandi: {phone}</p>;
  if (!phone) return <OtpForm onSuccess={setPhone} />; // OtpForm sizda tayyor 

  return <VerifyCodeForm phone={phone} onVerified={() => setVerified(true)} />;
}