import React, { useEffect, useRef, useState } from 'react';
import './IshKerak.css';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';



function IshKerak() {
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [balance, setBalance] = useState(null);
  const [status, setStatus] = useState('offline');
  const [isListed, setIsListed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const hasReoladedRef = useRef(false);
  const navigate = useNavigate();
  const phone = localStorage.getItem('userPhone');

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
      .from("workers")
      .select("avatar_url")
      .eq("phone", phone).single();
      if (data && data.avatar_url)
        setAvatarUrl(data.avatar_url);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (timeLeft <= 1 && timeLeft > 0 && ! hasReoladedRef.current) { hasReoladedRef.current = true;
      setTimeout(() => { window.location.reload(); }, 1000);}
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft]);


  const fetchUserData = async () => {
    const { data } = await supabase.from('workers').select('*').eq('phone', phone).maybeSingle();

    console.log("Supabasedan olingan data:", data);

    if (data) {
      setUserName(data.name);
      setAvatar(data.avatar_url);
      setBalance(data.balance);
      setStatus(data.status);
      setIsListed(data.is_listed);

      if (data.status === 'online' && data.online_time) {
  const onlineTime = new Date(data.online_time).getTime(); // Supabase vaqti
  const now = Date.now(); // Hozirgi vaqt
  const timePassed = Math.floor((now - onlineTime) / 1000); // necha soniya o‘tgan

  const total = 180; // 5 soat = 18000 soniya
  const remaining = Math.max(0, total - timePassed); // qolgan vaqt

  setTimeLeft(remaining); // timer ni boshlash
  console.log("📡 Supabase online_time:", data.online_time);
  console.log("⏱️ Hisoblangan timeLeft:", remaining, "soniya");

  if (remaining > 0) { setTimeLeft(remaining); } else { setTimeLeft(0);}

  // Qo‘shimcha: Agar vaqt 0 bo‘lsa, bu yerda avtomatik statusni o‘zgartirishingiz ham mumkin (ixtiyoriy):
  // if (remaining === 0) {
  //   await supabase.from('workers').update({ status: 'offline', is_listed: false }).eq('phone', phone);
  // }
} else {
  console.log("⚠️ Ishchi hozircha online emas yoki vaqt yozilmagan.");
}
    }
  };

  const handleOnlineClick = async () => {
    let location;
    try {
      location = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((pos) => resolve(pos.coords), reject);
      });
    } catch (err) {
      alert('GPS xatosi!');
      return;
    }

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

      // Edge function chaqirish (agar kerak bo‘lsa):
      // await fetch('/functions/start-timer', { method: 'POST', body: JSON.stringify({ phone }) });
    }
  };

  const toggleListed = async () => {
    if (status !== 'online') {
      console.log("Tugma ishlamaydi: status offline");
      return;
    }
    const { error } = await supabase
      .from('workers')
      .update({ is_listed: !isListed })
      .eq('phone', phone);

    if (!error){
      setIsListed(!isListed);
    console.log("is_listed yangilandi:", !isListed);
  } else {
    console.log("is_listed yangilanmadi:", error.message);}
  };

  return (
    <div className="ishkerak-container">
      <div className="top-section">
        <img
        src={avatarUrl || "/user.png"}
        alt="Avatar"
        style={{
          width: "80px",
          heigh: "80px",
          objectFit: "cover",
          borderRadius: "50%",
          border: "2px solid white"
        }}
        onClick={() => navigate("/profil")}
        />
        <div className="user-info">
          <div className="user-name">{userName}</div>
          <button className="balance-btn">
            Balans: {balance !== null ? balance.toLocaleString() : '...'}
          </button>
        </div>
      </div>

      <div className="center-section">
        {status === 'offline' ? (
          <button className="status-btn online" onClick={handleOnlineClick}>
            ONLINEga chiqish
          </button>
        ) : (
          <button
            className={`status-btn ${isListed ? 'online' : 'band'}`}
            onClick={toggleListed}
            disabled={timeLeft <= 60}
          >
            {isListed ? 'BAND boʻlish' : 'ONLINE boʻlish'}
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

      <button
        className="logout-btn"
        onClick={() => {
          localStorage.clear();
          navigate('/');
        }}
      >
        Chiqish
      </button>
    </div>
  );
}

export default IshKerak;
