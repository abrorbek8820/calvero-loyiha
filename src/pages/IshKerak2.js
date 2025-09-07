import React, { useEffect, useRef, useState } from 'react';
import './IshKerak.css';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet";

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
  const [loadingUser, setLoadingUser] = useState(true);
  const statusRef = useRef(status);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
  statusRef.current = status;
}, [status]);

useEffect(() => {
  const userPhone = localStorage.getItem('userPhone');
  if (!userPhone) {
    navigate('/otp'); // agar ro‘yxatdan o‘tmagan bo‘lsa registerga yo‘naltirish
  }
}, [navigate]);

useEffect(() => {
  timeLeftRef.current = timeLeft;
}, [timeLeft]);
  useEffect(() => { const mode = localStorage.getItem("mode") || "light"; document.body.classList.remove("light", "dark"); document.body.classList.add(mode); setTheme(mode); }, []);
  
  useEffect(() => {
  const checkSessionToken = async () => {
    const phone = localStorage.getItem('userPhone');
    const localToken = localStorage.getItem('session_token');

    if (!phone || !localToken) {
      localStorage.clear();
      navigate('/otp');
      return;
    }

    const { data, error } = await supabase
      .from('workers')
      .select('session_token')
      .eq('phone', phone)
      .single();

    if (error || !data || data.session_token !== localToken) {
      localStorage.clear();
      navigate('/otp');
    } else {
      fetchUserData(); // asosiy ma'lumotlarni yuklash
    }
  };

  // Faqat birinchi yuklanganda chaqiriladi
  checkSessionToken();
}, [navigate]);

  
  useEffect(() => {
  if (timeLeft <= 1 && timeLeft > 0 && !hasReloadedRef.current) {
    hasReloadedRef.current = true;

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}, [timeLeft]);


 

useEffect(() => { if (timeLeft > 0) { const interval = setInterval(() => { setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)); }, 1000); return () => clearInterval(interval); } }, [timeLeft]);



const fetchUserData = async () => {
  const userPhone = localStorage.getItem('userPhone');

  if (!userPhone) {
    navigate('/otp');
    return; // Agar telefon mavjud bo‘lmasa funksiyani to‘xtatamiz
  }

  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('phone', userPhone)
    .limit(1);

  if (error || !data || data.length === 0) {
    console.error("Foydalanuvchi topilmadi yoki xatolik:", error);
    navigate('/otp'); // Agar ma’lumot bo‘lmasa yoki xato bo‘lsa registerga yuboriladi
    return;
  }

  const userData = data[0]; // Birinchi natijani olish kerak

  console.log("UPDATE NATIJASI:", userData.status); // faqat userData mavjud bo‘lsa ishlaydi

  setUserName(userData.name);
  setAvatarUrl(userData.avatar_url);
  setBalance(userData.balance);
  setStatus(userData.status);
  setIsListed(userData.is_listed);
  setViews(userData.views || 0);
  setPhoneViews(userData.phone_views || 0);

  if (userData.status === 'online' && userData.online_time) {
    const onlineTime = new Date(userData.online_time).getTime();
    const now = Date.now();
    const timePassed = Math.floor((now - onlineTime) / 1000);
    const total = 18000;
    const remaining = Math.max(0, total - timePassed);
    setTimeLeft(remaining);
  }

  setLoadingUser(false);
};

const handleOnlineClick = async () => { let location; try { location = await new Promise((resolve, reject) => { navigator.geolocation.getCurrentPosition( pos => resolve(pos.coords), reject ); }); } catch (err) { alert('GPS xatosi!'); return; }

if (balance < 500000) {
  alert('Balans yetarli emas!');
  return;
}

const { error } = await supabase
  .from('workers')
  .update({
    balance: balance - 500000,
    status: 'online',
    is_listed: true,
    online_time: new Date().toISOString(),
    latitude: location.latitude,
    longitude: location.longitude,
  })
  .eq('phone', phone);

if (!error) {
  setBalance(balance - 500000);
  setStatus('online');
  setIsListed(true);
  setTimeLeft(18000);

  setTimeout(() => {
    fetchUserData();
  }, 300);

  
}

};

useEffect(() => {
  const interval = setInterval(() => {
    console.log("🔍 Interval: ", {
      status: statusRef.current,
      timeLeft: timeLeftRef.current
    });

    if (statusRef.current === 'online' && timeLeftRef.current > 60) {
      console.log("✅ fetchUserData chaqirildi");
      fetchUserData();
    } else {
      console.log("⛔ Skip");
    }
  }, 10000);

  return () => clearInterval(interval);
}, []);



const toggleListed = async () => {
  if (status !== 'online') return;

  const goingOnline = !isListed;

  // 1. Darhol is_listed ni yangilaymiz
  const { error: e1 } = await supabase
    .from('workers')
    .update({
      is_listed: goingOnline,
    })
    .eq('phone', phone);

  if (!e1) {
    setIsListed(goingOnline);
  } else {
    console.warn('is_listed yangilash xatosi:', e1);
    return;
  }

  // 2. Faqat band → online va timeLeft > 60 bo‘lsa, GPS fon rejimida yoziladi
  if (goingOnline && timeLeft > 60) {
    // GPS’ni UI kutmasin — faqat fon rejimida bajaramiz
    (async () => {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            (e) => reject(e),
            { enableHighAccuracy: false, maximumAge: 20000, timeout: 8000 }
          );
        });

        const { latitude, longitude } = pos.coords;

        const { error: e2 } = await supabase
          .from('workers')
          .update({
            latitude,
            longitude,
          })
          .eq('phone', phone);

        if (e2) console.warn('GPS yozishda xato:', e2);
        else console.log('📍 GPS yangilandi:', latitude, longitude);
      } catch (e) {
        console.warn('📵 GPS olish xatosi:', e?.message || e);
      }
    })(); // fon rejimi: UI kutmaydi
  }
};



return ( <><button
  className="lamp-fixed"
  onClick={() => navigate("/yorqinoma")}
  title="Foydalanish bo‘yicha yo‘riqnoma"
>
  💡
</button>
<div className="ishkerak-container">
  <Helmet>
    <meta name="robots" content="noindex, nofollow" />
  </Helmet>
  <div className="top-section">
    <img src={avatarUrl || "/user.png"}
    alt="Avatar"
    className="avatar"
    onClick={() => navigate("/profil")} />
    <div className="user-info">
      <div className="user-name">{userName}</div>
      <button
  className="balance-btn"
  onClick={() => navigate("/soqqa")}
>
  Balans: {balance !== null ? (balance / 100).toLocaleString() : '...'}
</button>
        </div>
        </div>

<div className="stats-section">
    <div className="stat-item">👁 Ko‘rildi: {views} ta</div>
    <div className="stat-item">📞 Raqam olindi: {phoneViews} ta</div>
  </div>

  <div className="center-section">
    {status === 'offline' ? (
  <button
    className={`status-btn start ${loadingUser ? 'disabled' : ''}`}
    onClick={handleOnlineClick}
    disabled={loadingUser}
  >
    {loadingUser ? 'START' : 'START'}
  </button>
) : (
  <button
    className={`status-btn ${isListed ? 'online' : 'band'}`}
    onClick={toggleListed}
    disabled={timeLeft <= 60}
  >
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
</>

); }

export default IshKerak;

