import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './ChatList.css';
import { Trash2 } from 'lucide-react';
import OnlineDot from '../components/OnlineDot';

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [unreadChats, setUnreadChats] = useState([]);
  const userPhone = localStorage.getItem('userPhone');
  const navigate = useNavigate();

  const getLastSeen = async (phone) => {
  const { data, error } = await supabase
    .from('workers')
    .select('last_seen')
    .eq('phone', phone)
    .single();

  if (error) return null;
  return data.last_seen;
};

  const fetchChats = async () => {
  const { data, error } = await supabase
    .from('chats')
    .select('id, sender_phone, receiver_phone, message, read, created_at')
    .or(`sender_phone.eq.${userPhone},receiver_phone.eq.${userPhone}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    setChats([]);
    return;
  }

  const uniqueChats = {};
  const unreadSet = new Set();

  for (const chat of data) {
    const otherPhone = chat.sender_phone === userPhone ? chat.receiver_phone : chat.sender_phone;

    if (!uniqueChats[otherPhone]) {
      const lastSeen = await getLastSeen(otherPhone); // ✅ qo‘shildi

      uniqueChats[otherPhone] = {
        id: chat.id,
        phone: otherPhone,
        last_seen: lastSeen, // ✅ saqlaymiz
      };
    }

    if (chat.receiver_phone === userPhone && !chat.read) {
      unreadSet.add(chat.id);
    }
  }

  setChats(Object.values(uniqueChats));
  setUnreadChats([...unreadSet]);
};

  const handleDeleteChat = async (phone) => {
  const isConfirmed = window.confirm('Ushbu raqam bilan bogʻliq barcha chatlarni oʻchirishni xohlaysizmi?');
  if (!isConfirmed) return;

  const { error } = await supabase
    .from('chats')
    .delete()
    .or(`sender_phone.eq.${phone},receiver_phone.eq.${phone}`);

  if (error) {
    alert(`Xatolik yuz berdi: ${error.message}`);
  } else {
    alert('Barcha yozishmalar muvaffaqiyatli oʻchirildi.');
    fetchChats();
  }
};

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [userPhone]);

  return (
  <div className="chat-list-container">
    <h2>📥 Chatlar</h2>
    {chats.length > 0 ? (
      chats.map(chat => (
        <div key={chat.id} className={`chat-item ${unreadChats.includes(chat.id) ? 'unread' : ''}`}>
          <div onClick={() => navigate(`/chat/${chat.phone}`)} style={{ flex: 1, cursor: 'pointer' }}>
            👤 {chat.phone} <OnlineDot lastSeen={chat.last_seen} />
            {unreadChats.includes(chat.id) && '🔴'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteChat(chat.phone);
            }}
            className="delete-btn"
          >
            <Trash2 size={20} />
          </button>
        </div>
      ))
    ) : (
      <p>Chatlar mavjud emas.</p>
    )}
  </div>
);
}
