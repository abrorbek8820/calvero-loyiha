import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import OnlineStatus from './components/OnlineStatus';
import Home from './pages/Home';
import RegisterForm from './components/RegisterForm';
import IshKerak from './pages/IshKerak';
import Profil from "./pages/Profil";
import EditProfile from "./pages/EditProfile";
import IshchiKerak from "./pages/IshchiKerak";
import ClientRegister from "./pages/ClientRegister";
import Profile from "./pages/Profile";
import { AppContext } from "./AppContext";
import OtpForm from './components/OtpForm';
import VerifyCodeForm from './components/VerifyCodeForm';
import { RegisterProvider } from './contexts/RegisterContext';
import VerifyNewPhone from './components/VerifyNewPhone';
import Balance from "./pages/Balance";
import Chat from "./components/Chat/Chat";
import ChatList from "./components/ChatList";
import ChatIcon from "./components/ChatIcon";


function OtpPage({ setPhone }) {
  const navigate = useNavigate();

  return (
    <OtpForm
      onSuccess={(phone) => {
        setPhone(phone);
        navigate('/verify-code');
      }}
    />
  );
}

function App() {
  const [mode, setMode] = useState("light");
  const [phone, setPhone] = useState('');
  const [verified, setVerified] = useState(false);

  return (

    <AppContext.Provider value={{ mode, setMode }}>
      <RegisterProvider>
      <Router>
        <OnlineStatus />
        <ChatIcon />
        <Routes>
          <Route path="/balance" element={<Balance />} />
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterForm setPhone={setPhone} />} />
          <Route path="/ishkerak" element={<IshKerak />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/ishchi-kerak" element={<IshchiKerak />} />
          <Route path="/client-register" element={<ClientRegister />} />
          <Route path="/profile/:phone" element={<Profile />} />
          <Route path="/otp" element={<OtpPage setPhone={setPhone} />} />
          <Route path="/verify-code" element={<VerifyCodeForm phone={phone} />} />
          <Route path="/verify-new-phone" element={<VerifyNewPhone />} />
          <Route path="/chat/:phone" element={<Chat />} />
          <Route path="/chats" element={<ChatList />} />
        </Routes>
      </Router>
      </RegisterProvider>
    </AppContext.Provider>
  );
}

export default App;
