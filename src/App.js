import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RegisterForm from './pages/RegisterForm';
import IshKerak from './pages/IshKerak';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/ishkerak" element={<IshKerak />} />
      </Routes>
    </Router>
  );
}

export default App;