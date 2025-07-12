import React, { useEffect, useRef, useState } from 'react'; import './IshKerak.css'; import { supabase } from '../supabaseClient'; import { useNavigate } from 'react-router-dom';

function IshKerak() {
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [balance, setBalance] = useState(null);
  const [status, setStatus] = useState('offline');
  const [isListed, setIsListed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [views, setViews] = useState(0);
  const [phoneViews, setPhoneViews] = useState(0);
  const hasReloadedRef = useRef(false);
  const navigate = useNavigate();
  const phone = localStorage.getItem('userPhone');
  const [theme, setTheme] = useState('light');
  
  useEffect(() => { const mode = localStorage.getItem("mode") || "light"; document.body.classList.remove("light", "dark"); document.body.classList.add(mode); setTheme(mode); }, []);
  useEffect(() => { fetchUserData(); }, []);
  useEffect(() => { if (timeLeft <= 1 && timeLeft > 0 && !hasReloadedRef.current) { hasReloadedRef.current = true; setTimeout(() => window.location.reload(), 1000); } }, [timeLeft]);
  

 

useEffect(() => { if (timeLeft > 0) { const interval = setInterval(() => { setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)); }, 1000); return () => clearInterval(interval); } }, [timeLeft]);



const fetchUserData = async () => { const { data } = await supabase .from('workers') .select('*') .eq('phone', phone) .maybeSingle();

if (data) {
  setUserName(data.name);
  setAvatarUrl(data.avatar_url);
  setBalance(data.balance);
  setStatus(data.status);
  setIsListed(data.is_listed);
  setViews(data.views || 0);
  setPhoneViews(data.phone_views || 0);

  if (data.status === 'online' && data.online_time) {
    const onlineTime = new Date(data.online_time).getTime();
    const now = Date.now();
    const timePassed = Math.floor((now - onlineTime) / 1000);
    const total = 180;
    const remaining = Math.max(0, total - timePassed);
    setTimeLeft(remaining);
  }
}

};

const handleOnlineClick = async () => { let location; try { location = await new Promise((resolve, reject) => { navigator.geolocation.getCurrentPosition( pos => resolve(pos.coords), reject ); }); } catch (err) { alert('GPS xatosi!'); return; }

if (balance < 10000) {
  alert('Balans yetarli emas!');
  return;
}

const { error } = await supabase
  .from('workers')
  .update({
    balance: balance - 10000,
    status: 'online',
    is_listed: true,
    online_time: new Date().toISOString(),
    latitude: location.latitude,
    longitude: location.longitude,
  })
  .eq('phone', phone);

if (!error) {
  setBalance(balance - 10000);
  setStatus('online');
  setIsListed(true);
  setTimeLeft(180);
}

};

const toggleListed = async () => { if (status !== 'online') return;

const { error } = await supabase
  .from('workers')
  .update({ is_listed: !isListed })
  .eq('phone', phone);

if (!error) {
  setIsListed(!isListed);
}

};

return ( <div className="ishkerak-container"> <div className="top-section"> <img src={avatarUrl || "/user.png"} alt="Avatar" className="avatar" onClick={() => navigate("/profil")} /> <div className="user-info"> <div className="user-name">{userName}</div> <button className="balance-btn"> Balans: {balance !== null ? balance.toLocaleString() : '...'} </button> </div> </div>

<div className="stats-section">
    <div className="stat-item">👁 Ko‘rildi: {views} ta</div>
    <div className="stat-item">📞 Raqam olindi: {phoneViews} ta</div>
  </div>

  <div className="center-section">
    {status === 'offline' ? (
      <button className="status-btn start" onClick={handleOnlineClick}>
        START
      </button>
    ) : (
      <button className={`status-btn ${isListed ? 'online' : 'band'}`} onClick={toggleListed} disabled={timeLeft <= 60}>
        {isListed ? 'ONLINE' : 'BAND'}
      </button>
    )}

    {status === 'online' && (
      <div className="timer">
        {`${Math.floor(timeLeft / 3600)}:${Math.floor((timeLeft % 3600) / 60)
          .toString()
          .padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}
      </div>
    )}
  </div>
</div>

); }

export default IshKerak;

