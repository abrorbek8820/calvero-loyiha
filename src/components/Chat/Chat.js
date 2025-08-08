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

  // KoЎ®rsatish uchun: faqat oxirgi N ta xabar
  const pageSize = 15;
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Scroll boshqaruvi
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const inputRef = useRef(null);

  // --------- SCROLL HELPERS ----------
  const handleScroll = () => {
    const el = chatRef.current;
    if (!el) return;
    // Pastga juda yaqin boЎ®lsa auto-scroll true boЎ®ladi
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    setAutoScroll(atBottom);
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

  // messages oЎ®zgarsa, faqat pastda turgan boЎ®lsak, pastga tushamiz
  useEffect(() => {
    if (autoScroll) scrollToBottom("smooth");
  }, [messages, autoScroll]);

  // Raqam almashsa ЁC koЎ®rinadigan sonni reset qilamiz
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [receiver_phone]);

  // --------- DATA FETCH ----------
  const fetchLastSeen = async () => {
    // workers -> clients ketma-ket qidiramiz
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

    // Asosiy holatni yangilaymiz
    const list = data || [];
    setMessages(list);

    // KoЎ®rinadigan sonni haddan kichraytirib yubormaslik
    setVisibleCount((v) => Math.min(Math.max(v, pageSize), list.length || pageSize));

    // headerЎЇdagi dot ham yangilansin
    fetchLastSeen();
  };

  useEffect(() => {
  const markAsRead = async () => {
    if (!sender_phone || !receiver_phone) return;

    const { error } = await supabase
      .from('chats')
      .update({ read: true })
      .match({
        receiver_phone: sender_phone, // hozir chat ochgan foydalanuvchi
        sender_phone: receiver_phone, // boshqa taraf
        read: false
      });

    if (error) {
      console.error("O'qilgan deb belgilashda xatolik:", error);
    }
  };

  markAsRead();
}, [sender_phone, receiver_phone, messages]);

  // Polling
  useEffect(() => {
    if (!sender_phone) navigate("/register");
  }, [sender_phone, navigate]);

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 4000);
    return () => clearInterval(t);
  }, [sender_phone, receiver_phone]);

  // --------- SENDERS ----------
  const sendMessage = async () => {
  if (!newMessage.trim()) return;

  const { error } = await supabase.from('chats').insert([
    { sender_phone, receiver_phone, message: newMessage }
  ]);

  if (!error) {
    fetchMessages();
    setNewMessage('');

    // 👉 textarea balandligini boshlang‘ich holatiga qaytaramiz
    if (inputRef.current) {
      // inline height ni o‘chirib, CSS/rows=1 bo‘yicha kichraytiradi
      inputRef.current.style.height = '';
      // xohlasangiz qat’iy min o‘lcham berish ham mumkin:
      // inputRef.current.style.height = '40px';
    }
  } else {
    console.error('Xabar yuborishda xatolik:', error);
  }
};

  const sendLocation = () => {
    if (!navigator.geolocation) {
      alert("Brauzer GPS ni qoЎ®llab-quvvatlamaydi.");
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

    const fileName = `${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase
      .storage
      .from("chat-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (upErr) {
      console.error("Fayl yuklanmadi:", upErr);
      return;
    }
    const imageUrl = supabase.storage.from("chat-images").getPublicUrl(fileName).data.publicUrl;

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

  // --------- LOAD MORE (eski xabarlar) ----------
  const loadMoreMessages = () => {
    const el = chatRef.current;
    if (!el) {
      setVisibleCount((c) => Math.min(c + pageSize, messages.length));
      return;
    }
    const prev = el.scrollHeight;
    setVisibleCount((c) => Math.min(c + pageSize, messages.length));
    // view harakatsiz qolsin (yuqoriga prepend boЎ®lganda)
    requestAnimationFrame(() => {
      const now = el.scrollHeight;
      el.scrollTop += now - prev;
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span>💬 Chat ({receiver_phone})</span>
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

          // rasm
          if (msg.image_url) {
            return (
              <div key={msg.id} className={bubbleClass}>
                <img src={msg.image_url} alt="rasm" className="chat-image" />
                <div className="message-time">
                  {time}
                  {isOwn && (
                    <span className={`check-icon ${msg.read ? "read" : ""}`}>
                      {msg.read ? '\u2713\u2713' : '\u2713'}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          // lokatsiya
          if (msg.location) {
            const mapsUrl = `https://maps.google.com/?q=${msg.location.lat},${msg.location.lng}`;
            return (
              <div key={msg.id} className={`message-bubble ${isOwn ? "right" : "left"} media-bubble`}>
                <a
                  href={mapsUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(mapsUrl, "_blank") || (window.location.href = mapsUrl);
                  }}
                >
                  <img
                    src="/assets/map-icon.png"
                    alt="joylashuv"
                    className="chat-image"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      border: "2px solid #4fc3f7",
                    }}
                  />
                </a>
                <div className="message-time">
                  {time}
                  {isOwn && (
                    <span className={`check-icon ${msg.read ? "read" : ""}`}>
                      {msg.read ? '\u2713\u2713' : '\u2713'}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          // matn
          return (
            <div key={msg.id} className={bubbleClass}>
              {msg.message}
              <div className="message-time">
                {time}
                {isOwn && (
                  <span className={`check-icon ${msg.read ? "read" : ""}`}>
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

        <textarea ref={inputRef}
          className="chat-input"
          rows={1}
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            // auto-grow
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          placeholder="Xabar yozing..."
        />

        <button className="chat-send-btn" onClick={sendMessage}>
          ➤
        </button>
      </div>
    </div>
  );
}