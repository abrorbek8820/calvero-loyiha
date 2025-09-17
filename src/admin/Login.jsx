import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Simple client-side login:
 * - correct password stored in env during build or small constant (better: VITE var)
 * - on success -> set localStorage support_auth=1 and navigate /hisob
 * - on fail -> navigate to decoy path (random or fixed)
 */

const CORRECT_PASSWORD = import.meta.env.VITE_SUPPORT_PASSWORD || "Calvero2025!"; // set in .env

// Some decoy paths (you can expand)
const DECOYS = [
  "/hdjj--%23+jdbucf",
  "/skcdobcskkf",
  "/not-found-xyz-8392"
];

function randomDecoy() {
  // either return a random fixed decoy
  return DECOYS[Math.floor(Math.random() * DECOYS.length)];
  // or generate ephemeral random path:
  // return '/' + Math.random().toString(36).slice(2,14);
}

export default function Login() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (password === CORRECT_PASSWORD) {
      // unlock: set localStorage flag
      localStorage.setItem("support_auth", "1");
      // optional: store expiry
      const expires = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem("support_auth_expires", String(expires));
      nav("/hisob");
    } else {
      // wrong: navigate to decoy (makes it harder for scanning bots)
      const decoy = randomDecoy();
      nav(decoy);
    }
  }

  return (
    <div style={{maxWidth:520, margin:"40px auto", fontFamily:"system-ui,Arial"}}>
      <h2>Admin — Hisob</h2>
      <form onSubmit={handleSubmit} style={{display:"flex", gap:8}}>
        <input
          type="password"
          placeholder="Parol"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          style={{flex:1, padding:8, fontSize:16}}
        />
        <button type="submit" style={{padding:"8px 12px"}}>Kirish</button>
      </form>
      {err && <div style={{color:"red", marginTop:8}}>{err}</div>}
      <p style={{color:"#666", marginTop:12, fontSize:13}}>
        Sahifa oddiy parol bilan himoyalangan. Keyinchalik yanada mustahkamlaymiz.
      </p>
    </div>
  );
}