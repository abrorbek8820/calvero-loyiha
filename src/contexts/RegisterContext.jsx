import React, { createContext, useContext, useState } from 'react';

const RegisterContext = createContext();

export const RegisterProvider = ({ children }) => {
  const [registerData, setRegisterData] = useState(null);
  const [verifyId, setVerifyId] = useState(null);

  return (
    <RegisterContext.Provider value={{ registerData, setRegisterData, verifyId, setVerifyId }}>
      {children}
    </RegisterContext.Provider>
  );
};

export const useRegister = () => useContext(RegisterContext);