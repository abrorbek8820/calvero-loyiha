// src/components/Chat/Chat.jsx
import React, { useEffect, useRef, useState } from "react";
import "./Chat.css";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import OnlineDot from "../OnlineDot";

export default function Chat() {
  const navigate = useNavigate();
  const { phone: otherPhone } = useParams();

  const sender_phone =
    localStorage.getItem("userPhone") || localStorage.getItem("clientPhone");
  const receiver_phone = otherPhone;

  // ---- STATE ----
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherLastSeen, setOtherLastSeen] = useState(null);

  // faqat oxirgi N ta xabar
  const pageSize = 15;
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // scroll boshqaruvi
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const inputRef = useRef(null);

  // kebab menyu
  const [openMenuId, setOpenMenuId] = useState(null);

  
const [menuUp, setMenuUp] = useState(false); 

  const [previewUrl, setPreviewUrl] = useState(null);
const openPreview = (url) => setPreviewUrl(url);
const closePreview = () => setPreviewUrl(null);

const toggleMenu = (id, btnEl) => {
  setOpenMenuId(cur => (cur === id ? null : id));

  if (btnEl) {
    const rect = btnEl.getBoundingClientRect();

    // Footer balandligi + biz qo'ygan offsetni hisobga olamiz
    const footer = document.querySelector('.chat-footer');
    const footerH = footer ? footer.getBoundingClientRect().height : 0;

    // Agar offsetdan foydalansangiz (oldin tavsiya qilganimdek)
    const rootStyles = getComputedStyle(document.documentElement);
    const bottomOffset = parseInt(rootStyles.getPropertyValue('--bottom-offset')) || 0;

    // Kebab tugmadan pastda qolgan real joy:
    const spaceBelow = window.innerHeight - rect.bottom - footerH - bottomOffset;

    // Menyu taxminiy balandligi: 110–140 px (2 tugmali bo'lsa ~110, 3 tugmali ~140)
    const menuHeight = 140;

    setMenuUp(spaceBelow < menuHeight);

    // Menyu ekranga sig‘ishi uchun xabarni markazga keltiramiz
    btnEl.closest('.message-bubble')
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
};
const closeMenu = () => { setOpenMenuId(null); setMenuUp(false); };

// ESC bosilganda yopish
useEffect(() => {
  const onEsc = (e) => e.key === 'Escape' && closePreview();
  document.addEventListener('keydown', onEsc);
  return () => document.removeEventListener('keydown', onEsc);
}, []);

  // tashqariga bosilganda yoki ESC bosilganda menyuni yopamiz
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest(".msg-actions") && !e.target.closest(".msg-menu")) {
        closeMenu();
      }
    };
    const onEsc = (e) => e.key === "Escape" && closeMenu();
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // --------- SCROLL HELPERS ----------
  const handleScroll = () => {
    const el = chatRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    setAutoScroll(atBottom);
    closeMenu(); // scroll bo‘lsa menyuni yopamiz
  };

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (autoScroll) scrollToBottom("smooth");
  }, [messages, autoScroll]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [receiver_phone]);

  // --------- DATA FETCH ----------
  const fetchLastSeen = async () => {
    let { data } = await supabase
      .from("workers")
      .select("last_seen")
      .eq("phone", receiver_phone)
      .maybeSingle();

    if (!data) {
      const c = await supabase
        .from("clients")
        .select("last_seen")
        .eq("client_phone", receiver_phone)
        .maybeSingle();
      if (c?.data) data = c.data;
    }
    if (data) setOtherLastSeen(data.last_seen);
  };

  const fetchMessages = async () => {
    if (!sender_phone || !receiver_phone) return;

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .or(
        `and(sender_phone.eq.${sender_phone},receiver_phone.eq.${receiver_phone}),and(sender_phone.eq.${receiver_phone},receiver_phone.eq.${sender_phone})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Xabarlarni olishda xatolik:", error);
      return;
    }

    const list = data || [];
    setMessages(list);
    setVisibleCount((v) =>
      Math.min(Math.max(v, pageSize), list.length || pageSize)
    );

    fetchLastSeen();
  };

  // o'qildi flag
  useEffect(() => {
    const markAsRead = async () => {
      if (!sender_phone || !receiver_phone) return;

      const { error } = await supabase
        .from("chats")
        .update({ read: true })
        .match({
          receiver_phone: sender_phone,
          sender_phone: receiver_phone,
          read: false,
        });

      if (error) {
        console.error("O'qilgan deb belgilashda xatolik:", error);
      }
    };

    markAsRead();
  }, [sender_phone, receiver_phone, messages]);

  // Polling
  useEffect(() => {
    if (!sender_phone) navigate("/client-register");
  }, [sender_phone, navigate]);

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 4000);
    return () => clearInterval(t);
  }, [sender_phone, receiver_phone]);

  // --------- SENDERS ----------
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("chats").insert([
      { sender_phone, receiver_phone, message: newMessage.trim() },
    ]);

    if (!error) {
      fetchMessages();
      setNewMessage("");
      if (inputRef.current) inputRef.current.style.height = "";
    } else {
      console.error("Xabar yuborishda xatolik:", error);
    }
  };

  const sendLocation = () => {
    if (!navigator.geolocation) {
      alert("Brauzer GPS ni qo‘llab-quvvatlamaydi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const { error } = await supabase
        .from("chats")
        .insert([{ sender_phone, receiver_phone, location }]);
      if (error) {
        console.error("GPS yuborishda xatolik:", error);
        return;
      }
      setAutoScroll(true);
      fetchMessages();
    });
  };

  const sendImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Faqat rasm faylini yuklang.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Rasm hajmi 5 MB dan oshmasin.");
      return;
    }

    const safeBase = file.name.replace(/[^\w.\-]/g, "_");
    const fileName = `${Date.now()}_${safeBase}`;
    const { error: upErr } = await supabase.storage
      .from("chat-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (upErr) {
      console.error("Fayl yuklanmadi:", upErr);
      return;
    }
    const imageUrl = supabase
      .storage
      .from("chat-images")
      .getPublicUrl(fileName).data.publicUrl;

    const { error } = await supabase
      .from("chats")
      .insert([{ sender_phone, receiver_phone, image_url: imageUrl }]);

    if (error) {
      console.error("Chatga yozishda xatolik:", error);
      return;
    }
    setAutoScroll(true);
    fetchMessages();
  };

  // --------- EDIT / DELETE HANDLERS ----------
  const startEdit = (msg) => {
    const next = window.prompt("Yangi matn:", msg.message || "");
    if (next == null) return;
    editMessage(msg.id, next);
  };

  const editMessage = async (id, newText) => {
    const text = newText.trim();
    if (!text) return;

    const { error } = await supabase
      .from("chats")
      .update({
        message: text,
        edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Tahrirda xatolik:", error);
      return;
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, message: text, edited: true, edited_at: new Date().toISOString() }
          : m
      )
    );
  };

  const deleteForEveryone = async (id) => {
    const ok = window.confirm("Xabarni hamma uchun o‘chirasizmi?");
    if (!ok) return;

    const { error } = await supabase
      .from("chats")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        message: null,
      })
      .eq("id", id);

    if (error) {
      console.error("O‘chirishda xatolik:", error);
      return;
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, is_deleted: true, deleted_at: new Date().toISOString(), message: null }
          : m
      )
    );
  };

  // --------- LOAD MORE (eski xabarlar) ----------
  const loadMoreMessages = () => {
    const el = chatRef.current;
    if (!el) {
      setVisibleCount((c) => Math.min(c + pageSize, messages.length));
      return;
    }
    const prev = el.scrollHeight;
    setVisibleCount((c) => Math.min(c + pageSize, messages.length));
    requestAnimationFrame(() => {
      const now = el.scrollHeight;
      el.scrollTop += now - prev;
    });
  };

  // Ishchi profiliga yo'naltirish (agar mavjud bo'lsa)
  const goToWorkerProfileIfExists = async () => {
    try {
      const { data, error } = await supabase
        .from("workers")
        .select("phone")
        .eq("phone", receiver_phone)
        .maybeSingle();

      if (error) throw error;

      if (data?.phone) {
        navigate(`/profile/${encodeURIComponent(receiver_phone)}`);
      } else {
        // klient — hech narsa qilmaymiz
      }
    } catch (e) {
      console.error(e);
    }
  };

  

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button
          type="button"
          className="phone-link"
          onClick={goToWorkerProfileIfExists}
          title="Profilni ko‘rish"
        >
          💬 Chat (+{receiver_phone})
        </button>
        <OnlineDot lastSeen={otherLastSeen} showTime={true} />
      </div>

      <div className="chat-messages" ref={chatRef}>
        {messages.length > visibleCount && (
          <div style={{ textAlign: "center", margin: "8px 0" }}>
            <button onClick={loadMoreMessages} className="load-more-btn">
              🔁 Yana yuklash
            </button>
          </div>
        )}

        {messages.slice(-visibleCount).map((msg) => {
          const isOwn = msg.sender_phone === sender_phone;

          // 🇺🇿 Tashkentga qo‘lda +5 soat
          const time = new Date(
            new Date(msg.created_at).getTime() + 5 * 60 * 60 * 1000
          ).toLocaleTimeString("uz-UZ", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          const bubbleClass = `message-bubble ${isOwn ? "right" : "left"} ${
            msg.image_url || msg.location ? "media-bubble" : ""
          }`;

          // O'chirilgan xabar placeholder
          if (msg.is_deleted) {
            return (
              <div key={msg.id} className={bubbleClass}>
                <em className="deleted-placeholder">Xabar o‘chirildi</em>
                <div className="message-time">{time}</div>
              </div>
            );
          }

          // Rasm
          if (msg.image_url) {
            return (
              <div key={msg.id} className={bubbleClass}>
                <img
  src={msg.image_url}
  alt="rasm"
  className="chat-image"
  onClick={() => openPreview(msg.image_url)}  // 🔥 qo‘shildi
/>
                <div className="message-time">
                  {time}
                  {isOwn && (
                    <span className={`check-icon ${msg.read ? "read" : ""}`}>
                      {msg.read ? "\u2713\u2713" : "\u2713"}
                    </span>
                  )}
                </div>

                {isOwn && (
                  <div className="msg-actions right">
                    <button
  className="kebab-btn"
  aria-label="Amallar"
  aria-expanded={openMenuId === msg.id}
  onClick={(e) => {
    e.stopPropagation();
    toggleMenu(msg.id, e.currentTarget); // 👈 elementni berayapmiz
  }}
>
  ⋮
</button>

                    {openMenuId === msg.id && (
                      <div className={`msg-menu ${menuUp ? 'up' : 'down'}`} role="menu">  
                        <button
                          role="menuitem"
                          onClick={() => {
                            closeMenu();
                            deleteForEveryone(msg.id);
                          }}
                        >
                          🗑️ O‘chirish
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          // Lokatsiya
          if (msg.location) {
            const mapsUrl = `https://maps.google.com/?q=${msg.location.lat},${msg.location.lng}`;
            return (
              <div key={msg.id} className={`message-bubble ${isOwn ? "right" : "left"} media-bubble`}>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(mapsUrl, "_blank", "noopener,noreferrer") ||
                      (window.location.href = mapsUrl);
                  }}
                >
                  <img
                    src="/assets/map-icon.png"
                    alt="joylashuv"
                    className="chat-image"
                    style={{ width: 80, height: 80, borderRadius: 8, border: "2px solid #4fc3f7" }}
                  />
                </a>
                <div className="message-time">
                  {time}
                  {isOwn && (
                    <span className={`check-icon ${msg.read ? "read" : ""}`}>
                      {msg.read ? "\u2713\u2713" : "\u2713"}
                    </span>
                  )}
                </div>

                {isOwn && (
                  <div className="msg-actions right">
                    <button
  className="kebab-btn"
  aria-label="Amallar"
  aria-expanded={openMenuId === msg.id}
  onClick={(e) => {
    e.stopPropagation();
    toggleMenu(msg.id, e.currentTarget); // 👈 elementni berayapmiz
  }}
>
  ⋮
</button>

                    {openMenuId === msg.id && (
                      <div className={`msg-menu ${menuUp ? 'up' : 'down'}`} role="menu">  
                        <button
                          role="menuitem"
                          onClick={() => {
                            closeMenu();
                            deleteForEveryone(msg.id);
                          }}
                        >
                          🗑️ O‘chirish
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          // Matn
          return (
            <div key={msg.id} className={bubbleClass}>
              {msg.message}
              <div className="message-time">
                {time}
                {msg.edited && <span className="edited-tag">(tahrirlangan)</span>}
                {isOwn && (
                  <span className={`check-icon ${msg.read ? "read" : ""}`}>
                    {msg.read ? "\u2713\u2713" : "\u2713"}
                  </span>
                )}
              </div>

              {isOwn && (
                <div className="msg-actions right">
                  <button
  className="kebab-btn"
  aria-label="Amallar"
  aria-expanded={openMenuId === msg.id}
  onClick={(e) => {
    e.stopPropagation();
    toggleMenu(msg.id, e.currentTarget); // 👈 elementni berayapmiz
  }}
>
  ⋮
</button>

                  {openMenuId === msg.id && (
                    <div className={`msg-menu ${menuUp ? 'up' : 'down'}`} role="menu"> 
                      <button
                        role="menuitem"
                        onClick={() => {
                          closeMenu();
                          startEdit(msg);
                        }}
                      >
                        ✏️Tahrirlash
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          closeMenu();
                          deleteForEveryone(msg.id);
                        }}
                      >
                        🗑️ O‘chirish
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <input
          type="file"
          id="imageUpload"
          style={{ display: "none" }}
          onChange={sendImage}
          accept="image/*"
        />
        <button
          className="chat-btn"
          onClick={() => document.getElementById("imageUpload").click()}
        >
          📎
        </button>

        <button className="chat-location-btn" onClick={sendLocation}>
          <img src="/assets/send-location.png" alt="lokatsiya" />
        </button>

        <textarea
          ref={inputRef}
          className="chat-input"
          rows={1}
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          placeholder="Xabar yozing..."
        />

        <button className="chat-send-btn" onClick={sendMessage}>
          ➤
        </button>
      </div>

      <div className="chat-pasti">
        <button
          type="button"
          className="phone-link"
          
        >
          
        </button>
        
      </div>
    

    {previewUrl && (
  <div className="img-modal" onClick={closePreview}>
    <div
      className="img-modal-body"
      onClick={(e) => e.stopPropagation()}  // rasm ustiga bosilganda yopilmasin
    >
      <button className="img-modal-close" onClick={closePreview} aria-label="Yopish">✕</button>
      <img src={previewUrl} alt="preview" className="img-modal-img" />
      <a
        className="img-modal-download"
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Yuklab olish ↗
      </a>
    </div>
  </div>
)}
</div>
  );
}