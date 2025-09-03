import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './ChatIcon.css';

export default function ChatIcon() {
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef(new Audio('/notification.mp3'));
  const navigate = useNavigate();

  // Telefoni aniqlash: worker yoki client
  const phone =
    localStorage.getItem('userPhone') ||
    localStorage.getItem('clientPhone') ||
    localStorage.getItem('workerPhone') || // agar eski kalit qolgan bo'lsa
    null;

  const fetchUnreadCount = useCallback(async () => {
    if (!phone) {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_phone', phone)
      .is('read', false);

    if (error) {
      console.error('Xatolik (unread count):', error);
      return;
    }

    setUnreadCount(prev => {
      const next = count || 0;
      if (next > prev) {
        audioRef.current.play().catch(e => {
          // mobil autoplay siyosati – jim qoldiramiz
          // console.log('Audio play error:', e);
        });
      }
      return next;
    });
  }, [phone]);

  // Boshlang'ich tekshirish va davriy polling
  useEffect(() => {
    fetchUnreadCount(); // ochilganda
    const interval = setInterval(fetchUnreadCount, 10000); // har 10 s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Sahifa visible/fokusga qaytsa – darhol yangilash (WebView throttling patch)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchUnreadCount();
    };
    const onFocus = () => fetchUnreadCount();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchUnreadCount]);

  // Audio autoplay ruxsatini birinchi user interaction orqali olish
  useEffect(() => {
    const enableAudio = () => {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        })
        .catch(() => {});
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
    };
    window.addEventListener('click', enableAudio);
    window.addEventListener('touchstart', enableAudio);
    return () => {
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
    };
  }, []);

  return (
    <div className="chat-icon" onClick={() => navigate('/chats')}>
      ✉️
      {unreadCount > 0 && <span className="unread-count">{unreadCount}</span>}
    </div>
  );
}