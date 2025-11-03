import { useLocation } from "react-router-dom";

function KvartiraFrame() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const mode = params.get("mode") || "light";
  const url = decodeURIComponent(params.get("url") || "");

  // Agar URL bo‘lmasa, fallback qilib kvartira bosh sahifasini ko‘rsatamiz
  const iframeSrc = url || `https://kvartira.calvero.work/?mode=${mode}`;

  return (
    <iframe
      src={iframeSrc}
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
