import './Home.css';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleIshKerak = () => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/ishkerak');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="container">
      <h1 className="title">CALVERO WORK</h1>

      <div style={{ marginTop: "50px" }}>
        <button className="button" onClick={() => navigate('/ishchi-kerak')}>
          ISHCHI KERAK
        </button>
      </div>

      <div style={{ marginBottom: "auto" }}>
        <button className="button" onClick={handleIshKerak}>
          ISH KERAK
        </button>
      </div>

      <div className="footer">©Calvero-Work 2025</div>
    </div>
  );
}

export default Home;