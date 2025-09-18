import './Home.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Home() {
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleButtonClick = (action) => {
    setClicked(true);
    setTimeout(() =>{
      setClicked(false);
      action();
    }, 1000);
  };

  useEffect(() => {
    const mode = localStorage.getItem("mode") || "light";
    document.body.classList.remove("light", "dark");
    document.body.classList.add(mode);
  }, []);

  const toggleMode = (mode) => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(mode);
    localStorage.setItem("mode", mode);
    setShowThemeMenu(false);
  };

  const handleIshKerak = () => {
  const targetUrl = "https://calvero.work/ishkerak"; // tashqi ochilishi kerak bo'lgan sahifa

  // Chrome orqali ochishga urinish (intent://)
  const intentUrl =
    "intent://" +
    targetUrl.replace(/^https?:\/\//, "") +
    "#Intent;scheme=https;package=com.android.chrome;" +
    "S.browser_fallback_url=" +
    encodeURIComponent(targetUrl) +
    ";end";

  // Android Chrome bo'lsa — Chrome ochadi
  // Yo'q bo'lsa — fallback URL boshqa brauzerda ochiladi
  window.location.href = intentUrl;
};

  return (
    <div className="container">
      <div className="menu-wrapper">
        <button
          className="menu-button"
          onClick={() => setShowThemeMenu(!showThemeMenu)}
        >
          ☰
        </button>

        {showThemeMenu && (
          <div className="theme-menu active">
            <div onClick={() => toggleMode("light")}>🌞 Kungi rejim</div>
            <div onClick={() => toggleMode("dark")}>🌙 Tungi rejim</div>
          </div>
        )}
      </div>

      <div className="title-wrapper">
        <h1 className="title">CALVERO WORK<span className="trademark sparkle">™</span></h1>
      </div>

      <div className="buttons-wrapper">
        <button className={`button $ {clicked ? 'clicked' : ''}`} onClick={(() => navigate('/ishchi-kerak'))}>
          ISHCHI KERAK
        </button>

        <button className={`button $ {clicked ? 'clicked' : ''}`} onClick={handleIshKerak}>
          ISH KERAK
        </button>
      </div>


      <div className="footer">©Calvero-Work 2025</div>
    </div>
  );
}

export default Home;