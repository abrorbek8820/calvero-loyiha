import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './ChatList.css';
import { Trash2 } from 'lucide-react';
import OnlineDot from '../components/OnlineDot';

export default function ChatList() {
  const [chats, setChats] = useState([]);          // [{ phone, last_seen, last_msg_at, last_msg_text, unread_count }]
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const userPhone =
    localStorage.getItem('userPhone') || localStorage.getItem('clientPhone');
  const navigate = useNavigate();

  // overlapni oldini olish uchun
  const fetchingRef = useRef(false);

  const fetchChats = async (showLoading = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setIsLoading(showLoading);

      // 1) Faqat kerakli maydonlar: (oxirgilarini tez olish uchun limit qo'yamiz)
      // Eslatma: tarix juda katta bo'lsa, limitni 500/1000 qilib, keyinroq server tomonda VIEW/RPC ga o'tamiz
      const { data: raw, error: errChats } = await supabase
        .from('chats')
        .select('id,sender_phone,receiver_phone,message,read,created_at')
        .or(`sender_phone.eq.${userPhone},receiver_phone.eq.${userPhone}`)
        .order('created_at', { ascending: false })
        .limit(500);

      if (errChats) throw errChats;

      // 2) “Juftlik” bo’yicha eng so‘nggi xabarni tanlab olish (frontda)
      // otherPhone -> { last_msg_at, last_msg_text, last_msg_id }
      const latestByPeer = new Map();
      for (const row of raw) {
        const other =
          row.sender_phone === userPhone ? row.receiver_phone : row.sender_phone;
        if (!latestByPeer.has(other)) {
          latestByPeer.set(other, {
            last_msg_at: row.created_at,
            last_msg_text: row.message,
            last_msg_id: row.id,
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

      // 3) last_seen ni bitta IN(...) bilan olish (N+1 o’rniga 1 so’rov)
      const { data: workers, error: errWorkers } = await supabase
        .from('workers')
        .select('phone,last_seen')
        .in('phone', others);

      if (errWorkers) throw errWorkers;

      const lastSeenMap = new Map(
        (workers || []).map((w) => [w.phone, w.last_seen]),
      );

      // 4) Unread’larni bitta so‘rovda olish (faqat kerakli maydonlar)
      const { data: unreadRows, error: errUnread } = await supabase
        .from('chats')
        .select('id,sender_phone')
        .eq('receiver_phone', userPhone)
        .eq('read', false)
        .limit(1000); // xavfsizlik uchun yuqori chegara

      if (errUnread) throw errUnread;

      const unreadCountByPeer = new Map();
      for (const r of unreadRows || []) {
        unreadCountByPeer.set(
          r.sender_phone,
          (unreadCountByPeer.get(r.sender_phone) || 0) + 1,
        );
      }

      // 5) Yakuniy model: har peer uchun bitta element
      const merged = others
        .map((phone) => {
          const last = latestByPeer.get(phone);
          return {
            phone,
            last_seen: lastSeenMap.get(phone) || null,
            last_msg_at: last?.last_msg_at || null,
            last_msg_text: last?.last_msg_text || '',
            unread_count: unreadCountByPeer.get(phone) || 0,
          };
        })
        .sort((a, b) => (a.last_msg_at < b.last_msg_at ? 1 : -1)); // so‘nggi xabarga ko‘ra

      setChats(merged);
      setIsLoading(false);
      setInitialLoadDone(true);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      setInitialLoadDone(true);
    } finally {
      fetchingRef.current = false;
    }
  };

  const handleDeleteChat = async (otherPhone) => {
    const isConfirmed = window.confirm(
      'Ushbu raqam bilan bogʻliq barcha chatlarni oʻchirishni xohlaysizmi?',
    );
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('chats')
      .delete()
      .or(
        `and(sender_phone.eq.${userPhone},receiver_phone.eq.${otherPhone}),and(sender_phone.eq.${otherPhone},receiver_phone.eq.${userPhone})`,
      );

    if (error) {
      alert(`Xatolik yuz berdi: ${error.message}`);
    } else {
      alert('Barcha yozishmalar muvaffaqiyatli oʻchirildi.');
      fetchChats(false);
    }
  };

  useEffect(() => {
    // birinchi yuklanishda spinner ko‘rsatamiz
    fetchChats(true);

    const interval = setInterval(() => {
      // keyingi yangilanishlar spinner ko‘rsatmaydi
      fetchChats(false);
    }, 10000);

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
                key={chat.phone} // 🔑 har peer uchun barqaror kalit
                className={`chat-item ${chat.unread_count > 0 ? 'unread' : ''}`}
              >
                <div
                  onClick={() => navigate(`/chat/${chat.phone}`)}
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>✉️ +{chat.phone}</span>
                  <OnlineDot lastSeen={chat.last_seen} />

                  {chat.unread_count > 0 && (
                    <span
                      style={{
                        marginLeft: 6,
                        display: 'inline-flex',
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        background: 'red',
                        color: 'white',
                        padding: '0 4px',
                      }}
                      aria-label="O‘qilmagan"
                      title="O‘qilmagan"
                    >
                      {chat.unread_count}
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.phone);
                  }}
                  className="delete-btn"
                  aria-label="Chovni o‘chirish"
                  title="Chovni o‘chirish"
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