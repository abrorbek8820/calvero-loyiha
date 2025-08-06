import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import OnlineDot from '../OnlineDot';

export default function Chat() {
  const navigate = useNavigate();
  const { phone: otherPhone } = useParams();

  const sender_phone = localStorage.getItem('userPhone') || localStorage.getItem('clientPhone');
  const receiver_phone = otherPhone;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [otherLastSeen, setOtherLastSeen] = useState(null);

  // Redirect to register if sender not available
  useEffect(() => {
    if (!sender_phone) {
      navigate("/register");
    }
  }, [sender_phone]);

  // Fetch chat messages
  const fetchMessages = async () => {
    if (!sender_phone || !receiver_phone) return;

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .or(
        `and(sender_phone.eq.${sender_phone},receiver_phone.eq.${receiver_phone}),and(sender_phone.eq.${receiver_phone},receiver_phone.eq.${sender_phone})`
      )
      .order("created_at", { ascending: true });

    if (!error) setMessages(data || []);
    else console.error("Xabarlarni olishda xatolik:", error);
  };

  // Send text message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('chats').insert([
      { sender_phone, receiver_phone, message: newMessage }
    ]);

    if (!error) {
      fetchMessages();
      setNewMessage('');
    } else {
      console.error('Xabar yuborishda xatolik:', error);
    }
  };

  // Send location
  const sendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        const { error } = await supabase.from('chats').insert([
          { sender_phone, receiver_phone, location }
        ]);

        if (!error) fetchMessages();
        else console.error('GPS yuborishda xatolik:', error);
      });
    } else {
      alert('Brauzer GPS ni qo‘llab-quvvatlamaydi.');
    }
  };

  // Send image
  const sendImage = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = `${Date.now()}_${file.name}`;
  console.log("Yuklanayotgan fayl:", fileName);

  const { data, error } = await supabase.storage
    .from('chat-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('📛 Fayl yuklanmadi:', error);
    return;
  }

  const imageUrl = supabase.storage
    .from('chat-images')
    .getPublicUrl(fileName).data.publicUrl;

  console.log("📸 Image URL:", imageUrl);

  const { error: insertError } = await supabase.from('chats').insert([
    {
      sender_phone,
      receiver_phone,
      image_url: imageUrl,
    },
  ]);

  if (insertError) {
    console.error('📛 Chatga yozishda xatolik:', insertError);
  } else {
    console.log("✅ Rasm yuborildi");
    fetchMessages();
  }
};

  // Fetch receiver's last seen
  useEffect(() => {
    const fetchLastSeen = async () => {
      let { data, error } = await supabase
        .from('workers')
        .select('last_seen')
        .eq('phone', receiver_phone)
        .maybeSingle();

      if (!data) {
        const clientResult = await supabase
          .from('clients')
          .select('last_seen')
          .eq('client_phone', receiver_phone)
          .maybeSingle();

        if (clientResult?.data) data = clientResult.data;
      }

      if (data) setOtherLastSeen(data.last_seen);
    };

    fetchLastSeen();
  }, [receiver_phone]);

  // Mark messages as read
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

  // Auto-refresh messages
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [sender_phone, receiver_phone]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span>💬 Chat ({receiver_phone})</span>
        <OnlineDot lastSeen={otherLastSeen} showTime={true} />
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
          const isOwn = msg.sender_phone === sender_phone;
          const time = new Date(new Date(msg.created_at).getTime() + 5 * 60 * 60 * 1000)
            .toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });

          const bubbleClass = `message-bubble ${isOwn ? 'right' : 'left'} ${
            msg.image_url || msg.location ? 'media-bubble' : ''
          }`;

          if (msg.image_url) {
            return (
              <div key={msg.id} className={bubbleClass}>
                <img src={msg.image_url} alt="rasm" className="chat-image" />
                <div className="message-time">{time}{isOwn && <span className={`check-icon ${msg.read ? 'read' : ''}`}>{msg.read ? '✓✓' : '✓'}</span>}</div>
              </div>
            );
          }

          if (msg.location) {
            const mapsUrl = `https://maps.google.com/?q=${msg.location.lat},${msg.location.lng}`;
            return (
              <a key={msg.id} href={mapsUrl} onClick={(e) => { e.preventDefault(); window.open(mapsUrl, '_blank') || (window.location.href = mapsUrl); }} className={bubbleClass}>
                <img src="/assets/map-icon.png" alt="joylashuv" className="chat-image" style={{ width: '80px', height: '80px', borderRadius: '8px' }} />
                <div className="message-time">{time}{isOwn && <span className={`check-icon ${msg.read ? 'read' : ''}`}>{msg.read ? '✓✓' : '✓'}</span>}</div>
              </a>
            );
          }

          return (
            <div key={msg.id} className={bubbleClass}>
              {msg.message}
              <div className="message-time">{time}{isOwn && <span className={`check-icon ${msg.read ? 'read' : ''}`}>{msg.read ? '✓✓' : '✓'}</span>}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <input type="file" id="imageUpload" style={{ display: 'none' }} onChange={sendImage} accept="image/*" />

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
