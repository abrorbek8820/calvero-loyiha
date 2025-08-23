import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Delete() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSession(data.session || null);
    })();
    return () => { mounted = false; };
  }, []);

  const handleDelete = async () => {
    if (deleting) return;

    const warn =
      "Diqqat! Akkauntni BUTUNLAY o‘chirmoqchisiz. Bu amal qaytarilmaydi. Davom etamizmi?";
    if (!window.confirm(warn)) return;

    try {
      setDeleting(true);

      // (ixtiyoriy) phone ni yuborish – storage fayl nomi va yozuvlarni moslashda foydali
      const phone = localStorage.getItem("userPhone");
      const { error } = await supabase.functions.invoke("delete-account", {
        body: { phone: phone || null },
      });
      if (error) {
        console.error(error);
        alert("O‘chirishda xatolik yuz berdi. Keyinroq urinib ko‘ring.");
        setDeleting(false);
        return;
      }

      // Local saqlanganlarni tozalash
      try {
        localStorage.removeItem("userPhone");
        localStorage.removeItem("clientPhone");
        localStorage.removeItem("session_token");
        localStorage.removeItem("userType");
      } catch {}

      // Sessiyani yopish
      await supabase.auth.signOut();

      alert("Akkauntingiz muvaffaqiyatli o‘chirildi.");
      navigate("/");
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Akkauntni o‘chirish</h1>

        <div style={styles.notice}>
          <strong>Diqqat!</strong> Akkauntni o‘chirish tugmasini bosish orqali siz bu
          platformadan ma’lumotlaringizni <u>butunlay</u> o‘chirib yuborasiz. Agar
          hisobingizda mablag‘ bo‘lsa, <b>o‘chirishdan oldin operatorga murojaat qiling!</b>{" "}
          O‘chirib yuborilgan akkaunt uchun pul mablag‘i qaytarilmaydi.
        </div>

        {session ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              ...styles.deleteBtn,
              opacity: deleting ? 0.8 : 1,
              cursor: deleting ? "not-allowed" : "pointer",
            }}
            title="Akkauntni butunlay o‘chirish"
          >
            {deleting ? "O‘chirilmoqda..." : "🗑️ Akkauntni o‘chirish"}
          </button>
        ) : (
          <div style={styles.loginBox}>
            <p style={{ marginBottom: 10 }}>
              Akkauntni o‘chirish uchun avval tizimga kiring.
            </p>
            <Link to="/otp" style={styles.loginBtn}>
              Kirish sahifasiga o‘tish
            </Link>
          </div>
        )}

        <div style={styles.footerLinks}>
          <Link to="/" style={styles.link}>Bosh sahifa</Link>
          <span style={{ opacity: 0.4 }}>•</span>
          <Link to="/privacy" style={styles.link}>Maxfiylik siyosati</Link>
          <span style={{ opacity: 0.4 }}>•</span>
          <Link to="/offer" style={styles.link}>Oferta</Link>
        </div>
      </div>
    </div>
  );
}

// Minimal inline “CSS”
const styles = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b0b0b", // xohlasang light/dark rejim bilan almashtirib tur
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#121212",
    color: "#fff",
    borderRadius: 16,
    padding: 20,boxShadow: "0 8px 26px rgba(0,0,0,.35)",
    border: "1px solid rgba(255,255,255,.08)",
  },
  title: {
    margin: "6px 0 14px",
    fontSize: 24,
    fontWeight: 700,
  },
  notice: {
    background: "rgba(255,77,79,.1)",
    border: "1px solid rgba(255,77,79,.35)",
    color: "#ffcccc",
    padding: "12px 14px",
    borderRadius: 12,
    lineHeight: 1.5,
    marginBottom: 16,
  },
  deleteBtn: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #ff4d4f",
    background: "#ff4d4f",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
  },
  loginBox: {
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.15)",
    padding: 14,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  loginBtn: {
    display: "inline-block",
    background: "#2d7ef7",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 700,
    textDecoration: "none",
  },
  footerLinks: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    opacity: 0.9,
  },
  link: {
    color: "#9ec0ff",
    textDecoration: "none",
  },
};