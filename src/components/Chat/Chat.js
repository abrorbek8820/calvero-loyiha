import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function Chat() {
  const { phone: receiver_phone } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const sender_phone = localStorage.getItem('userPhone');

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
      </div>

      <div className="chat-messages">
        {messages.map((msg) =>
          msg.image_url ? (
            <div
              key={msg.id}
              className={`message-bubble ${
                msg.sender_phone === sender_phone ? 'right' : 'left'
              }`}
            >
              <img src={msg.image_url} alt="rasm" className="chat-image" />
              <div className="message-time">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ) : msg.location ? (
            <a
              key={msg.id}
              href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`message-bubble ${
                msg.sender_phone === sender_phone ? 'right' : 'left'
              }`}
            >
              📍 Joylashuvni ochish
            </a>
          ) : (
            <div
              key={msg.id}
              className={`message-bubble ${
                msg.sender_phone === sender_phone ? 'right' : 'left'
              }`}
            >
              {msg.message}
              <div className="message-time">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )
        )}
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

        <button className="chat-btn" onClick={sendLocation}>
          📍
        </button>

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