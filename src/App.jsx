import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate
} from 'react-router-dom';

import OnlineStatus from './components/OnlineStatus.jsx';
import Home from './pages/Home.jsx';
import HomeDom from './pages/HomeDom.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import IshKerak from './pages/IshKerak.jsx';
import Profil from './pages/Profil.jsx';
import EditProfile from './pages/EditProfile.jsx';
import IshchiKerak from './pages/IshchiKerak.jsx';
import ClientRegister from './pages/ClientRegister.jsx';
import Profile from './pages/Profile.jsx';
import { AppContext } from './AppContext.jsx';

import OtpForm from './components/OtpForm.jsx';
import VerifyCodeForm from './components/VerifyCodeForm.jsx';

import { RegisterProvider } from './contexts/RegisterContext.jsx';
// ❌ Eski komponent olib tashlandi: import VerifyNewPhone from './components/VerifyNewPhone';
import Balance from './pages/Balance.jsx';
import Chat from './components/Chat/Chat.jsx';
import ChatList from './components/ChatList.jsx';
import ChatIcon from './components/ChatIcon.jsx';
import Oferta from "./components/Oferta.jsx";
import PaymeDemo from "./components/PaymeDemo.jsx";
import Delete from "./pages/Delete.jsx";
import Yoriqnoma from "./components/Yoriqnoma.jsx";
import ProtectedLayout from "./layouts/ProtectedLayout.jsx";
import OtpPage from "./pages/OtpPage.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";
import { HelmetProvider } from 'react-helmet-async';

/*function OtpPage({ setPhone }) {
  const navigate = useNavigate();
  return (
    <OtpForm
      onSuccess={(phone) => {
        setPhone(phone);
        navigate('/verify-code');
      }}
    />
  );
}*/

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
    <HelmetProvider>
    <AppContext.Provider value={{ mode, setMode }}>
      <RegisterProvider>
        <Router>
          <OnlineStatus />
          <Routes>
  {/* Public sahifalar — konvertsiz */}
  <Route path="/home" element={<Home />} />
  <Route path="/" element={<HomeDom />} />
  <Route path="/register" element={<RegisterForm setPhone={setPhone} />} />
  <Route path="/client-register" element={<ClientRegister />} />
  {/*<Route path="/otp" element={<OtpPage setPhone={setPhone} />} />
  <Route path="/verify-code" element={phone ? <VerifyCodeForm phone={phone} /> : <Navigate to="/otp" replace />} />*/}
  <Route path="/offer" element={<Oferta />} />
  <Route path="/payme-test" element={<PaymeDemo />} />
  <Route path="/delete" element={<Delete />} />
  <Route path="/verify" element={<VerifyPage />} />
  <Route path="/otp" element={<OtpPage />} />

  {/* Protected sahifalar — konvert bilan */}
  <Route element={<ProtectedLayout />}>
  <Route path="/soqqa" element={<Balance />} />
    <Route path="/ishkerak" element={<IshKerak />} />
    <Route path="/profil" element={<Profil />} />
    <Route path="/edit-profile" element={<EditProfile />} />
    <Route path="/ishchi-kerak" element={<IshchiKerak />} />
    <Route path="/profile/:phone" element={<Profile />} />
    <Route path="/chat/:phone" element={<Chat />} />
    <Route path="/chats" element={<ChatList />} />
    <Route path="/yoriqnoma" element={<Yoriqnoma />} />
  </Route>
</Routes>
        </Router>
      </RegisterProvider>
    </AppContext.Provider>
    </HelmetProvider>
    
  );
}

export default App;