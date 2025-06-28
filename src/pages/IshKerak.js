import React, { useState, useEffect } from 'react'; import './IshKerak.css'; import avatar from '../assets/avatar.png'; import { supabase } from '../supabaseClient'; import { useNavigate } from 'react-router-dom';

function IshKerak() { const navigate = useNavigate();

const [status, setStatus] = useState('offline'); const [timeLeft, setTimeLeft] = useState(0); const [location, setLocation] = useState({ latitude: null, longitude: null }); const [userName, setUserName] = useState(''); const [balance, setBalance] = useState(0); const [loading, setLoading] = useState(true); const [alreadyHandled, setAlreadyHandled] = useState(false);

const handleLogout = () => { localStorage.clear(); navigate('/'); };

useEffect(() => { const fetchBalance = async () => { const { data, error } = await supabase .from('workers') .select('balance') .eq('phone', localStorage.getItem('userPhone')) .single();

if (!error && data) setBalance(data.balance);
};
fetchBalance();

}, []);

useEffect(() => { const fetchOnlineTime = async () => { const phone = localStorage.getItem("userPhone");

const { data, error } = await supabase
    .from("workers")
    .select("online_time, status")
    .eq("phone", phone)
    .maybeSingle();

  if (data?.status === "online" && data?.online_time) {
    const startTime = new Date(data.online_time).getTime();
    const now = Date.now() + (new Date().getTimezoneOffset() * 60 * 1000);
    const elapsed = Math.floor((now - startTime) / 1000);
    const remaining = 18000 - elapsed;

    if (remaining <= 0) {
      await supabase.from("workers").update({ status: "offline" }).eq("phone", phone);
      setStatus("offline");
      setTimeLeft(0);
    } else {
      setStatus("online");
      setTimeLeft(remaining);
    }
  } else {
    setStatus("offline");
    setTimeLeft(0);
  }
  setAlreadyHandled(false); // Reset
  setLoading(false);
};

fetchOnlineTime();

}, []);

useEffect(() => { navigator.geolocation.getCurrentPosition( (position) => { const { latitude, longitude } = position.coords; setLocation({ latitude, longitude }); }, (error) => { console.error('GPS xatolik:', error); } ); }, []);

useEffect(() => { if (loading || status !== 'online' || alreadyHandled) return;

const timer = setInterval(() => {
  setTimeLeft((prev) => {
    const newTime = prev - 1;
    if (newTime <= 0) {
      clearInterval(timer);
      setAlreadyHandled(true);
      setTimeout(() => {
        handleTimeout();
      }, 3000);
      return 0;
    }
    return newTime;
  });
}, 1000);

return () => clearInterval(timer);

}, [status, loading, alreadyHandled]);

useEffect(() => { const fetchUserName = async () => { const { data, error } = await supabase .from('workers') .select('name') .eq('phone', localStorage.getItem('userPhone')) .single();

if (!error && data) setUserName(data.name);
};
fetchUserName();

}, []);

const handleOnlineClick = async () => { const phone = localStorage.getItem("userPhone"); const newStatus = status === 'online' ? 'offline' : 'online';

if (status === 'online') {
  setStatus('band');
  return;
}

const { data, error } = await supabase
  .from('workers')
  .select('balance')
  .eq('phone', phone)
  .maybeSingle();

if (error || !data || data.balance < 10000) {
  alert("Balansingizda yetarli mablag‘ yo‘q.");
  return;
}

const newBalance = data.balance - 10000;

navigator.geolocation.getCurrentPosition(
  async (position) => {
    const { latitude, longitude } = position.coords;

    const { error: updateError } = await supabase
      .from('workers')
      .update({
        status: newStatus,
        latitude,
        longitude,
        online_time: new Date().toISOString(),
        balance: newBalance,
      })
      .eq('phone', phone);

    if (!updateError) {
      setBalance(newBalance);
      setStatus('online');
      setTimeLeft(18000);
      setAlreadyHandled(false);
    }
  },
  (err) => {
    console.error("GPS xatolik:", err.message);
  }
);

};

const handleTimeout = async () => { if (timeLeft > 0) return;
  const phone = localStorage.getItem("userPhone");
const { error } = await supabase
  .from('workers')
  .update({ status: 'offline' })
  .eq('phone', phone);

if (!error) setStatus('offline');

};

return ( <div className="ishkerak-container"> <div className="top-section"> <img src={avatar} alt="Avatar" className="avatar" /> <div className="user-info"> <div className="user-name">{userName}</div> <button className="balance-btn"> Balans: {balance !== null ? balance.toLocaleString() : 'Yuklanmoqda...'} </button> </div> </div>

<div className="center-section">
    <button className={`status-btn ${status === 'online' ? 'online' : 'band'}`} onClick={handleOnlineClick}>
      {status === 'online' ? 'ONLINE' : 'BAND'}
    </button>
    <div className="timer">
      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
    </div>
  </div>

  <button className="logout-btn" onClick={handleLogout}>
    Tizimdan chiqish
  </button>
</div>

); }

export default IshKerak;