import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Hisob.css";

export default function Hisob() {
  const [cid, setCid] = useState("");
  const [worker, setWorker] = useState(null);
  const [txs, setTxs] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    const ex = Number(localStorage.getItem("support_auth_expires") || 0);
    if (ex && Date.now() > ex) {
      localStorage.removeItem("support_auth");
      localStorage.removeItem("support_auth_expires");
      nav("/login");
    }
  }, [nav]);

  function toSoms(amountTiyin) {
    const tiy = Number(amountTiyin || 0);
    const soms = Math.trunc(tiy / 100); // tiyindan so‘mga
    return new Intl.NumberFormat("uz-UZ").format(soms);
  }

  function formatAmount(t) {
    const base = toSoms(t.amount);
    // state: 2 => tushgan, -2 => qaytgan
    if (t.state === 2) return `+${base} so'm`;
    if (t.state === -2) return `-${base} so'm`;
    return `${base} so'm;`
  }

  function formatState(state) {
    switch (state) {
      case 1: return "Created (kutilmoqda)";
      case 2: return "Performed (tushgan)";
      case -1: return "Canceled (bekor qilingan)";
      case -2: return "Refunded (qaytarilgan)";
      default: return state;
    }
  }

  async function search() {
    if (!cid) return alert("Custom ID kiriting");
    try {
      const { data: w, error: we } = await supabase
        .from("workers")
        .select("custom_id, phone, balance, is_listed")
        .eq("custom_id", cid)
        .single();
      if (we || !w) return alert("Worker topilmadi");
      setWorker(w);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("worker_custom_id", cid)
        .order("create_time", { ascending: false })
        .limit(10);
      setTxs(transactions || []);
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi");
    }
  }

  function logout() {
    localStorage.removeItem("support_auth");
    localStorage.removeItem("support_auth_expires");
    nav("/login");
  }

  return (
    <div className="hisob-container">
      <div style={{ maxWidth: 900, margin: "24px auto", fontFamily: "system-ui" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Hisob (Support)</h1>
          <button onClick={logout}>Chiqish</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            placeholder="8 raqamli Custom ID"
            style={{ padding: 8, flex: 1 }}
          />
          <button onClick={search} style={{ padding: "8px 12px" }}>
            Qidirish
          </button>
        </div>

        {worker && (
          <div style={{ marginTop: 16, border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
            <div><b>Custom ID:</b> {worker.custom_id}</div>
            <div><b>Telefon:</b> {worker.phone}</div>
            <div><b>Balans:</b> {toSoms(worker.balance)} so'm</div>
            <div><b>Status:</b> {worker.is_listed ? "Online" : "Offline"}</div>
          </div>
        )}

        {txs.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Payme ID</th>
                <th style={{ padding: 8 }}>Summa</th>
                <th style={{ padding: 8 }}>Holat</th>
                <th style={{ padding: 8 }}>Vaqt</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.paycom_tx_id}>
                    <td style={{ padding: 8, borderTop: "1px solid #fafafa" }}>{t.paycom_tx_id}</td>
                  <td style={{ padding: 8 }}>{formatAmount(t)}</td>
                  <td style={{ padding: 8 }}>{formatState(t.state)}</td>
                  <td style={{ padding: 8 }}>
                    {t.create_time ? new Date(Number(t.create_time)).toLocaleString() : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}