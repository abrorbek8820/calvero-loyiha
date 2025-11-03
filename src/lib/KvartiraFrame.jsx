import { useLocation } from "react-router-dom";

function KvartiraFrame() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const mode = params.get("mode") || "light";
  const rawUrl = decodeURIComponent(params.get("url") || "");

  // 🌗 mode parametrini subURL ichiga majburan qo‘shamiz
  let iframeSrc = "";
  if (rawUrl) {
    // Agar rawUrl ichida allaqachon mode bo‘lsa, qayta qo‘shmaymiz
    const hasMode = rawUrl.includes("mode=");
    if (hasMode) {
      iframeSrc = rawUrl;
    } else {
      const hasQuery = rawUrl.includes("?");
      const connector = hasQuery ? "&" : "?";
      iframeSrc = `${rawUrl}${connector}mode=${mode}`;
    }
  } else {
    iframeSrc = `https://kvartira.calvero.work/?mode=${mode}`;
  }

  console.log("iframeSrc:", iframeSrc); // 👈 tekshirish uchun

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
