import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import OnlineDot from '../OnlineDot';

export default function Chat() {
  const { phone: receiver_phone } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const sender_phone = localStorage.getItem('userPhone');
  const { phone } = useParams();
  const otherPhone = phone;
  

  // Xabarlarni yuklash funksiyasi
  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .or(
        `and(sender_phone.eq.${sender_phone},receiver_phone.eq.${receiver_phone}),` +
        `and(sender_phone.eq.${receiver_phone},receiver_phone.eq.${sender_phone})`
      )
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  // Xabar yuborish funksiyasi
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('chats').insert([
      {
        sender_phone,
        receiver_phone,
        message: newMessage,
      },
    ]);

    if (!error) {
      fetchMessages(); // darhol yangilanadi
      setNewMessage('');
    } else {
      console.error('Xabar yuborishda xatolik:', error);
    }
  };

  // GPS yuborish funksiyasi
  const sendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const { error } = await supabase.from('chats').insert([
          {
            sender_phone,
            receiver_phone,
            location,
          },
        ]);

        if (!error) {
          fetchMessages(); // GPS yuborilganda darhol yangilanadi
        } else {
          console.error('GPS yuborishda xatolik:', error);
        }
      }, (error) => {
        console.error('Joylashuvni olishda xatolik:', error);
      });
    } else {
      alert('Brauzer GPS ni qo‘llab-quvvatlamaydi.');
    }
  };

  // Rasm yuborish funksiyasi
  const sendImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Rasm yuklashda xatolik:', error);
      return;
    }

    const imageUrl = supabase.storage.from('chat-images').getPublicUrl(fileName).data.publicUrl;

    const { error: insertError } = await supabase.from('chats').insert([
      {
        sender_phone,
        receiver_phone,
        image_url: imageUrl,
      },
    ]);

    if (!insertError) {
      fetchMessages(); // Rasm yuborilganda darhol yangilanadi
    } else {
      console.error('Rasm yuborishda xatolik:', insertError);
    }
  };

  const [otherLastSeen, setOtherLastSeen] = useState(null);

useEffect(() => {
  const fetchLastSeen = async () => {
    const { data, error } = await supabase
      .from('workers')
      .select('last_seen')
      .eq('phone', otherPhone)
      .single();

    if (!error && data) setOtherLastSeen(data.last_seen);
  };

  fetchLastSeen();
}, [otherPhone]);



  // Xabarlarni o‘qilgan deb belgilash
  useEffect(() => {
    const markAsRead = async () => {
      await supabase.from('chats')
        .update({ read: true })
        .eq('receiver_phone', sender_phone)
        .eq('sender_phone', receiver_phone)
        .eq('read', false);
    };

    markAsRead();
  }, [sender_phone, receiver_phone, messages]);

  // Xabarlarni interval bilan yangilash (har 4 sekundda)
  useEffect(() => {
    fetchMessages();

    const interval = setInterval(fetchMessages, 4000);

    return () => clearInterval(interval);
  }, [sender_phone, receiver_phone]);

  // Eng pastga avtomatik scroll qilish
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span>💬 Chat ({receiver_phone})</span>
        <OnlineDot lastSeen={otherLastSeen}showTime={true} />
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
  const isOwn = msg.sender_phone === sender_phone;

  const time = (() => {
    const utcDate = new Date(msg.created_at);
    const tashkentDate = new Date(utcDate.getTime() + 5 * 60 * 60 * 1000);
    return tashkentDate.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  })();

  const bubbleClass = `message-bubble ${isOwn ? 'right' : 'left'} ${
    msg.image_url || msg.location ? 'media-bubble' : ''
  }`;

  // ”9х8 Rasmli xabar
  if (msg.image_url) {
    return (
      <div key={msg.id} className={bubbleClass}>
        <img src={msg.image_url} alt="rasm" className="chat-image" />
        <div className="message-time">
          {time}
          {isOwn && (
            <span className={`check-icon ${msg.read ? 'read' : ''}`}>
  {msg.read ? '\u2713\u2713' : '\u2713'}
</span>
          )}
        </div>
      </div>
    );
  }

  // ”9Э9 Lokatsiya
  if (msg.location) {
  const geoUrl = `geo:${msg.location.lat},${msg.location.lng}?q=${msg.location.lat},${msg.location.lng}`;

  const openMapExternally = (e) => {
    e.preventDefault();
    window.location.href = geoUrl;
  };

  return (
    <a
      key={msg.id}
      href="#"
      onClick={openMapExternally}
      className={bubbleClass}
    >
      <img
        src="/assets/map-icon.png"
        alt="joylashuv"
        className="chat-image"
        style={{ width: '80px', height: '80px', borderRadius: '8px' }}
      />
      <div className="message-time">
        {time}
        {isOwn && (
          <span className={`check-icon ${msg.read ? 'read' : ''}`}>
            {msg.read ? '\u2713\u2713' : '\u2713'}
          </span>
        )}
      </div>
    </a>
  );
}
  // ”9Я5 Oddiy matnli xabar
  return (
    <div key={msg.id} className={bubbleClass}>
      {msg.message}
      <div className="message-time">
        {time}
        {isOwn && (
          <span className={`check-icon ${msg.read ? 'read' : ''}`}>
            {msg.read ? '\u2713\u2713' : '\u2713'}
          </span>
        )}
      </div>
    </div>
  );
})}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <input
          type="file"
          id="imageUpload"
          style={{ display: 'none' }}
          onChange={sendImage}
          accept="image/*"
        />

        <button className="chat-btn" onClick={() => document.getElementById('imageUpload').click()}>
          📎
        </button>

        <img
  src="/assets/send-location.png"
  alt="joylashuv yuborish"
  onClick={sendLocation}
  style={{ width: '28px', height: '28px', cursor: 'pointer', margin: '0 8px' }}
/>

        <input
          type="text"
          placeholder="Xabar yozing..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

        <button className="chat-send-btn" onClick={sendMessage}>
          ➤
        </button>
      </div>
    </div>
  );
}