import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate
} from 'react-router-dom';

import OnlineStatus from './components/OnlineStatus';
import Home from './pages/Home';
import RegisterForm from './components/RegisterForm';
import IshKerak from './pages/IshKerak';
import Profil from './pages/Profil';
import EditProfile from './pages/EditProfile';
import IshchiKerak from './pages/IshchiKerak';
import ClientRegister from './pages/ClientRegister';
import Profile from './pages/Profile';
import { AppContext } from './AppContext';

import OtpForm from './components/OtpForm';
import VerifyCodeForm from './components/VerifyCodeForm';

import { RegisterProvider } from './contexts/RegisterContext';
// ❌ Eski komponent olib tashlandi: import VerifyNewPhone from './components/VerifyNewPhone';
import Balance from './pages/Balance';
import Chat from './components/Chat/Chat';
import ChatList from './components/ChatList';
import ChatIcon from './components/ChatIcon';
import Oferta from "./components/Oferta";
import PaymeDemo from "./components/PaymeDemo";

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
  const [mode, setMode] = useState('light');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const updateLastSeen = async () => {
      const userPhone = localStorage.getItem('userPhone');
      if (!userPhone) return;
      try {
        await supabase
          .from('workers')
          .update({ last_seen: new Date().toISOString() })
          .eq('phone', userPhone);
      } catch (e) {
        // xatoni jim o'tkazamiz (log qo'shishingiz mumkin)
      }
    };

    // Ilova yuklanganda va keyin har 60 soniyada
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 60000);

    // Foydalanuvchi harakati bo'lsa ham yangilab turamiz
    const activityHandler = () => updateLastSeen();
    window.addEventListener('click', activityHandler);
    window.addEventListener('touchstart', activityHandler);
    window.addEventListener('keydown', activityHandler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', activityHandler);
      window.removeEventListener('touchstart', activityHandler);
      window.removeEventListener('keydown', activityHandler);
    };
  }, []);

  return (
    <>
    <div>
      <h1>Payme Test</h1>
      {/* AUTH qiymatini base64 qilib qo'yganingni shu yerga joylaysan */}
      <PaymeDemo auth="UGF5Y29tOlRlc3QjUGFyb2w=" />
    </div>
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
            <Route path="/offer" element={<Oferta />} />
            <Route path="/otp" element={<OtpPage setPhone={setPhone} />} />

            {/* Guard: phone yo‘q bo‘lsa verify sahifaga kirganda /otp ga qaytaradi */}
            <Route
              path="/verify-code"
              element={
                phone ? <VerifyCodeForm phone={phone} /> : <Navigate to="/otp" replace />
              }
            />

            {/* ❌ Eski route olib tashlandi: <Route path="/verify-new-phone" element={<VerifyNewPhone />} /> */}

            <Route path="/chat/:phone" element={<Chat />} />
            <Route path="/chats" element={<ChatList />} />
          </Routes>
        </Router>
      </RegisterProvider>
    </AppContext.Provider>
    </>
  );
}

export default App;