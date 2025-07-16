import React, { useState } from 'react'; import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import Home from './pages/Home'; import RegisterForm from './components/RegisterForm'; import IshKerak from './pages/IshKerak'; import Profil from "./pages/Profil"; import EditProfile from "./pages/EditProfile"; import IshchiKerak from "./pages/IshchiKerak"; import ClientRegister from "./pages/ClientRegister"; import Profile from "./pages/Profile"; import { AppContext } from "./AppContext"; import OtpForm from './components/OtpForm'; import VerifyCodeForm from './components/VerifyCodeForm';

function OtpPage({ setPhone }) { const navigate = useNavigate();

return ( <OtpForm onSuccess={(phone) => { setPhone(phone); navigate('/verify-code'); }} /> ); }

function App() { const [mode, setMode] = useState("light"); const [phone, setPhone] = useState(''); const [verified, setVerified] = useState(false);

return ( <AppContext.Provider value={{ mode, setMode }}> <Router> <Routes> <Route path="/" element={<Home />} /> <Route path="/register" element={<RegisterForm setPhone={setPhone} />} /> <Route path="/ishkerak" element={<IshKerak />} /> <Route path="/profil" element={<Profil />} /> <Route path="/edit-profile" element={<EditProfile />} /> <Route path="/ishchi-kerak" element={<IshchiKerak />} /> <Route path="/client-register" element={<ClientRegister />} /> <Route path="/profile/:phone" element={<Profile />} />

<Route
        path="/otp"
        element={<OtpPage setPhone={setPhone} />}
      />

      <Route
        path="/verify-code"
        element={<VerifyCodeForm phone={phone} onVerified={() => setVerified(true)} />}
      />
    </Routes>
  </Router>
</AppContext.Provider>

); }

export default App;

