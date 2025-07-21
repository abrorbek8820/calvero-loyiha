import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './ChatList.css';

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [unreadChats, setUnreadChats] = useState([]);
  const userPhone = localStorage.getItem('userPhone');
  const navigate = useNavigate();

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from('chats')
      .select('sender_phone, receiver_phone, read, created_at')
      .or(`sender_phone.eq.${userPhone},receiver_phone.eq.${userPhone}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const phoneSet = new Set();
    const unreadSet = new Set();

    data.forEach(chat => {
      const otherPhone = chat.sender_phone === userPhone ? chat.receiver_phone : chat.sender_phone;
      phoneSet.add(otherPhone);

      if (chat.receiver_phone === userPhone && !chat.read) {
        unreadSet.add(otherPhone);
      }
    });

    setChats([...phoneSet]);
    setUnreadChats([...unreadSet]);
  };

  useEffect(() => {
    fetchChats(); // birinchi yuklash

    const interval = setInterval(fetchChats, 10000); // 10 soniyalik yangilash

    return () => clearInterval(interval);
  }, [userPhone]);

  return (
    <div className="chat-list-container">
      <h2>📥 Chatlar</h2>
      {chats.length === 0 && <p>Hozircha chat mavjud emas.</p>}
      {chats.map(phone => (
        <div key={phone} className={`chat-item ${unreadChats.includes(phone) ? 'unread' : ''}`} onClick={() => navigate(`/chat/${phone}`)}>
          👤 {phone} {unreadChats.includes(phone) && '🔴'}
        </div>
      ))}
    </div>
  );
}