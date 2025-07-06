import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RegisterForm from './components/RegisterForm';
import IshKerak from './pages/IshKerak';
import Profil from "./pages/Profil";
import EditProfile from "./pages/EditProfile";
import IshchiKerak from "./pages/IshchiKerak";
import ClientRegister from "./pages/ClientRegister";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/ishkerak" element={<IshKerak />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/ishchi-kerak" element={<IshchiKerak />} />
        <Route path="/client-register" element={<ClientRegister />} />
        <Route path="/profile/:phone" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;