import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function Chat() {
  const { phone: receiver_phone } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const [isOnline, setIsOnline] = useState(false);

useEffect(() => {
  const fetchStatus = async () => {
    const { data } = await supabase
      .from('workers')
      .select('is_online')
      .eq('phone', receiver_phone)
      .single();

    setIsOnline(data?.is_online);
  };

  fetchStatus();

  const channel = supabase
    .channel('online-status')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'workers', filter: `phone=eq.${receiver_phone}` },
      (payload) => {
        setIsOnline(payload.new.is_online);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [receiver_phone]);

  const sender_phone = localStorage.getItem('userPhone');

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('realtime-chats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .or(
        `and(sender_phone.eq.${sender_phone},receiver_phone.eq.${receiver_phone}),and(sender_phone.eq.${receiver_phone},receiver_phone.eq.${sender_phone})`
      )
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('chats').insert([
      {
        sender_phone,
        receiver_phone,
        message: newMessage,
      },
    ]);

    if (error) console.error('Xatolik:', error);
    else setNewMessage('');
  };

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

        if (error) {
          console.error('GPS yuborishda xatolik:', error);
        } else {
          console.log('GPS muvaffaqiyatli yuborildi:', location);
        }
      }, (error) => {
        console.error('Joylashuvni olishda xatolik:', error);
      });
    } else {
      alert("Sizning brauzeringiz GPS-ni qo'llab-quvvatlamaydi.");
    }
  };

  const sendImage = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = `${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from('chat-images')
    .upload(fileName, file);

  if (error) {
    console.error('Rasm yuklashda xatolik:', error);
    return;
  }

  const imageUrl = supabase.storage
    .from('chat-images')
    .getPublicUrl(fileName).data.publicUrl;

  const { error: insertError } = await supabase.from('chats').insert([
    {
      sender_phone,
      receiver_phone,
      image_url: imageUrl,
    },
  ]);

  if (insertError) {
    console.error('Rasmni yuborishda xatolik:', insertError);
  }
};

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
  <div className="chat-container">
    <div className="chat-header">
      <span>💬 Chat ({receiver_phone})</span>
      <span
      style={{
        marginLeft: '10px',
        color: isOnline ? 'lightgreen' : 'gray',
        fontSize: '14px',
      }}
      >
      ● {isOnline ? 'Online' : 'Offline'}
  </span>
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
            <img
              src={msg.image_url}
              alt="Yuborilgan rasm"
              style={{ maxWidth: '100%', borderRadius: '10px' }}
            />
            <div className="message-time">
              {new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
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
            style={{ textDecoration: 'underline' }}
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
              {new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
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

      <button
        className="chat-btn"
        onClick={() => document.getElementById('imageUpload').click()}
      >
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