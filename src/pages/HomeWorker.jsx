import './HomeSinov.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function Home() {
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [mode, setMode] = useState(localStorage.getItem("mode") || "light");

  // ✅ Boshlang‘ich rejimni qo‘llash
  useEffect(() => {
    applyTheme(mode);
  }, []);

  // ✅ Tema qo‘llash funksiyasi
  const applyTheme = (selectedMode) => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(selectedMode);
    localStorage.setItem("mode", selectedMode);
    setMode(selectedMode);
  };

  // ✅ Tema tanlash (kun/tun)
  const toggleMode = (newMode) => {
    applyTheme(newMode);
    setShowThemeMenu(false);
  };

  // 🔘 Tugmalar ro‘yxati
  const buttons = [
    { text: "ISHCHI KERAK", link: "/ishchi-kerak" },
    { text: "ISH KERAK", link: "/ishkerak" },
    { text: "IJARA UY KERAK", link: "https://kvartira.calvero.work/uy-kerak" },
    { text: "MENING UYLARIM", link: "https://kvartira.calvero.work/my-houses" },
  ];

  // 🚀 Tugma bosilganda navigatsiya
  const handleClick = (index, link) => {
    setClickedIndex(index);
    setTimeout(() => {
      // 🌐 Agar subdomen bo‘lsa — URL’ga mode ni qo‘shamiz
      if (link.includes("kvartira.calvero.work")) {
        const connector = link.includes("?") ? "&" : "?";
        window.location.href = `${link}${connector}mode=${mode}`;
      } else {
        navigate(link);
      }
    }, 700);
  };

  return (
    <div className="container">
      {/* 🌗 Menyu */}
      <div className="menu-wrapper">
        <button
          className="menu-button"
          onClick={() => setShowThemeMenu(!showThemeMenu)}
        >
          ☰
        </button>

        {showThemeMenu && (
          <div className="theme-menu active">
            <div
              onClick={() => toggleMode("light")}
              className={mode === "light" ? "active" : ""}
            >
              🌞 KUNGI REJIM
            </div>
            <div
              onClick={() => toggleMode("dark")}
              className={mode === "dark" ? "active" : ""}
            >
              🌙 TUNGI REJIM
            </div>
          </div>
        )}
      </div>

      {/* 🏷️ Sarlavha */}
      <div className="title-wrapper">
        <h1 className="title">
          CALVERO <span className="sub">PLATFORM</span>
        </h1>
        <p className="subtitle">Halol mehnat uchun yagona tizim</p>
      </div>

      {/* 🔘 Tugmalar */}
      <div className="buttons-wrapper">
        {buttons.map((btn, index) => (
          <motion.button
            key={index}
            className="button"
            initial={{ x: -200, opacity: 0 }}
            animate={
              clickedIndex === null
                ? { x: 0, opacity: 1 }
                : clickedIndex === index
                ? { x: 0, opacity: 1, scale: 1.05 }
                : { x: -200, opacity: 0 }
            }
            transition={{
              delay: clickedIndex === null ? index * 0.2 : 0,
              duration: 0.5,
              ease: "easeOut",
            }}
            onClick={() => handleClick(index, btn.link)}
          >
            {btn.text}
          </motion.button>
        ))}
      </div>

      <div className="footer">© Calvero 2025</div>
    </div>
  );
}

export default Home;
