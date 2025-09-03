import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './ChatList.css';
import { Trash2 } from 'lucide-react';
import OnlineDot from '../components/OnlineDot';

export default function ChatList() {
  const [chats, setChats] = useState([]); // [{ phone, name, last_seen, last_msg_at, last_msg_text, unread_count }]
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const navigate = useNavigate();
  const userPhone = localStorage.getItem('userPhone') || localStorage.getItem('clientPhone');

  // Re-fetch overlap’ni bloklash uchun
  const fetchingRef = useRef(false);

  // ... yuqorisi o'zgarmaydi

const fetchChats = async (showLoading = false) => {
  if (fetchingRef.current) return;
  fetchingRef.current = true;
  try {
    if (showLoading) setIsLoading(true);

    // 1) So'nggi xabarlar (faqat kerakli maydonlar)
    const { data: raw, error: errChats } = await supabase
      .from('chats')
      .select('id,sender_phone,receiver_phone,message,read,created_at')
      .or(`sender_phone.eq.${userPhone},receiver_phone.eq.${userPhone}`)
      .order('created_at', { ascending: false })
      .limit(500);

    if (errChats) throw errChats;

    // 2) Har juftlik bo'yicha eng so'nggi xabar
    const latestByPeer = new Map();
    for (const row of raw) {
      const other =
        row.sender_phone === userPhone ? row.receiver_phone : row.sender_phone;
      if (!latestByPeer.has(other)) {
        latestByPeer.set(other, {
          last_msg_at: row.created_at,
          last_msg_text: row.message,
        });
      }
    }

    const others = Array.from(latestByPeer.keys());
    if (others.length === 0) {
      setChats([]);
      setIsLoading(false);
      setInitialLoadDone(true);
      return;
    }

    // 3) Workers va Clients jadvalidan ism(lar)ni va last_seen (worker'larda) ni OLISH — ikkita bulk IN so'rovi
    const [workersRes, clientsRes, unreadRes] = await Promise.all([
      supabase.from('workers').select('phone,last_seen,name').in('phone', others),
      // Eslatma: senga mos: clients jadvalida ustun nomi client_phone
      supabase.from('clients').select('client_phone,name').in('client_phone', others),
      supabase
        .from('chats')
        .select('sender_phone')
        .eq('receiver_phone', userPhone)
        .eq('read', false)
        .limit(1000),
    ]);

    if (workersRes.error) throw workersRes.error;
    if (clientsRes.error) throw clientsRes.error;
    if (unreadRes.error) throw unreadRes.error;

    console.log('[CHATLIST] peers:', others.length);

console.log('[CHATLIST] workers err/data:', workersRes.error, workersRes.data?.length);
console.log('[CHATLIST] clients err/data:', clientsRes.error, clientsRes.data?.length);

    const workers = workersRes.data || [];
    const clients = clientsRes.data || [];
    const unreadRows = unreadRes.data || [];

    // 4) Xaritalar
    const lastSeenMap = new Map(workers.map(w => [w.phone, w.last_seen]));
    const workerNameMap = new Map(workers.map(w => [w.phone, (w.name || '').trim()]));
    const clientNameMap = new Map(
      clients.map(c => [c.client_phone, (c.name || '').trim()])
    );

    const unreadCountByPeer = new Map();
    for (const r of unreadRows) {
      unreadCountByPeer.set(
        r.sender_phone,
        (unreadCountByPeer.get(r.sender_phone) || 0) + 1
      );
    }

    // 5) Yakuniy model: ism tanlashda prioritet:
    //    1) workers.name bo'lsa o'sha
    //    2) bo'lmasa clients.name
    //    3) bo'lmasa null (fallback UI telefonni ko'rsatadi)
    const merged = others
      .map(phone => {
        const last = latestByPeer.get(phone);
        const workerName = workerNameMap.get(phone);
        const clientName = clientNameMap.get(phone);
        const finalName = (workerName && workerName.length ? workerName : (clientName && clientName.length ? clientName : null));

        return {
          phone,
          name: finalName,
          last_seen: lastSeenMap.get(phone) || null, // clients uchun bo'sh bo'lishi mumkin
          last_msg_at: last?.last_msg_at || null,
          last_msg_text: last?.last_msg_text || '',
          unread_count: unreadCountByPeer.get(phone) || 0,
        };
      })
      .sort((a, b) => (a.last_msg_at < b.last_msg_at ? 1 : -1));

    setChats(merged);
  } catch (e) {
    console.error(e);
  } finally {
    setIsLoading(false);
    setInitialLoadDone(true);
    fetchingRef.current = false;
  }
};

// ... pastdagi render qismi o'zgarmaydi (u allaqachon name + phone ko'rsatadi)

  const handleDeleteChat = async (otherPhone) => {
    const isConfirmed = window.confirm('Ushbu raqam bilan bogʻliq barcha chatlarni oʻchirishni xohlaysizmi?');
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('chats')
      .delete()
      .or(
        `and(sender_phone.eq.${userPhone},receiver_phone.eq.${otherPhone}),and(sender_phone.eq.${otherPhone},receiver_phone.eq.${userPhone})`
      );

    if (error) {
      alert(`Xatolik yuz berdi: ${error.message}`);
    } else {
      alert('Barcha yozishmalar muvaffaqiyatli oʻchirildi.');
      fetchChats(false);
    }
  };

  useEffect(() => {
    fetchChats(true); // birinchi yuklanishda spinner
    const interval = setInterval(() => fetchChats(false), 10000);
    return () => clearInterval(interval);
  }, [userPhone]);

  return (
    <div className="chat-list-container">
      <h2>📥 Chatlar</h2>

      {isLoading && !initialLoadDone ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p style={{ marginTop: 10 }}>Yuklanmoqda...</p>
        </div>
      ) : (
        <div className="chat-items-wrapper">
          {chats.length > 0 ? (
            chats.map((chat) => (
              <div
                key={chat.phone}
                className={`chat-item ${chat.unread_count > 0 ? 'unread' : ''}`}
              >
                <div
                  onClick={() => navigate(`/chat/${chat.phone}`)}
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {/* Chap: online nuqta */}
                  <OnlineDot lastSeen={chat.last_seen} />

                  {/* O‘rta: Ism (qalin) + telefon (mayda kulrang) */}
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span style={{ fontWeight: 600, color: '#2c2c2cff' }}>
                      {chat.name || `+${chat.phone}`}
                    </span>
                    {chat.name && (
                      <span style={{ fontSize: 12, color: '#666' }}>
                        +{chat.phone}
                      </span>
                    )}
                  </div>

                  {/* O‘qilmagan badge (soni) */}
                  {chat.unread_count > 0 && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        display: 'inline-flex',
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        background: 'red',
                        color: 'white',
                        padding: '0 5px',
                      }}
                      aria-label="O‘qilmagan"
                      title="O‘qilmagan"
                    >
                      {chat.unread_count}
                    </span>
                  )}
                </div>

                {/* O‘chirish tugmasi */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.phone);
                  }}
                  className="delete-btn"
                  aria-label="Chatni o‘chirish"
                  title="Chatni o‘chirish"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          ) : (
            <p>Chatlar mavjud emas.</p>
          )}
        </div>
      )}
    </div>
  );
}