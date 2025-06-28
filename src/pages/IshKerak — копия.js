import React from 'react';
import './IshKerak.css';
import avatar from '../assets/avatar.png';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function IshKerak() {
  const [status, setStatus] = useState('offline');
const [timeLeft, setTimeLeft] = useState(5*60*60);
const [location, setLocation] = useState({ latitude: null, longitude: null});

useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });
    },
    (error) => {
      console.error('GPS xatolik:', error);
    }
  );
}, []);

const handleOnlineClick = async () => {
  setStatus('online');

  // Agar kerak bo‘lsa GPS qayta o‘lchansin
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });

      // Supabase'ga joylashuvni va statusni yuborish
      const { data, error } = await supabase
        .from('workers')
        .update({
          status: 'online',
          latitude,
          longitude,
          online_time: new Date().toISOString()
        })
        .eq('phone', localStorage.getItem('userPhone')); // telefon orqali aniqlaymiz

      if (error) {
        console.error('Supabase xatolik:', error);
      } else {
        console.log('Status va joylashuv yangilandi');
      }
    },
    (error) => {
      console.error('GPS xatolik:', error);
    }
  );
};

  return (
    <div className="ishkerak-container">
      <div className="top-section">
        <img src="./assets/avatar.png" alt="Avatar" className="avatar" />
        <div className="user-info">
          <div className="user-name">Ismingiz</div>
          <div className="balance-wrapper"></div>
          <button className="balance-btn">Balans: 10 000</button>
        </div>
      </div>

      <div className="center-section">
        <button className={`status-btn ${status === 'online' ? 'online' : 'band'}`}
        onClick={handleOnlineClick}
        >
          {status === 'online' ? 'BAND' : 'ONLINE'}
          </button>
        <div className="timer">5:00</div>
      </div>

      <button className="logout-btn">Tizimdan chiqish</button>
    </div>
  );
}

export default IshKerak;