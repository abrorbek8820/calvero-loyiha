// KvartiraFrame.jsx
import { useLocation } from "react-router-dom";

function KvartiraFrame() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") || "light";

  return (
    <iframe
      src={`https://kvartira.calvero.work/uy-kerak?mode=${mode}`}
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        backgroundColor: mode === "dark" ? "#000" : "#fff",
      }}
      title="Calvero Kvartira"
    />
  );
}

export default KvartiraFrame;
