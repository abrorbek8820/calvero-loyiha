import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './ChatIcon.css';

export default function ChatIcon() {
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef(new Audio('/notification.mp3'));
  const navigate = useNavigate();
  const userPhone = localStorage.getItem('userPhone');

  const fetchUnreadCount = async () => {
    const { count, error } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_phone', userPhone)
      .is('read', false);

    if (error) {
      console.error('Xatolik:', error);
      return;
    }

    setUnreadCount(prevCount => {
      if (count > prevCount) {
        audioRef.current.play().catch(e => {
          console.error('Audio play error:', e);
        });
      }
      return count || 0;
    });
  };

  useEffect(() => {
    fetchUnreadCount(); // birinchi ochilganda tekshiradi

    const interval = setInterval(fetchUnreadCount, 10000); // har 10 soniyada tekshiradi

    return () => clearInterval(interval);
  }, [userPhone]);

  // Audio autoplay uchun foydalanuvchi interaksiyasi talab qilinadi
  useEffect(() => {
    const enableAudio = () => {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause(); // autoplay uchun ruxsat olinganidan so'ng to'xtatiladi
          audioRef.current.currentTime = 0; // audio boshiga qaytariladi
          console.log('Audio ruxsati muvaffaqiyatli olindi.');
        })
        .catch((e) => {
          console.log('Audio autoplay uchun ruxsat berilmadi:', e);
        });

      window.removeEventListener('click', enableAudio);
    };

    window.addEventListener('click', enableAudio);

    return () => window.removeEventListener('click', enableAudio);
  }, []);

  return (
    <div className="chat-icon" onClick={() => navigate('/chats')}>
      ✉️
      {unreadCount > 0 && <span className="unread-count">{unreadCount}</span>}
    </div>
  );
}
