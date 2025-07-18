import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./Balance.css";

const Balance = () => {
  const [balance, setBalance] = useState(null);
  const [customId, setCustomId] = useState("");
  const [lastTopUp, setLastTopUp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const userPhone = localStorage.getItem("userPhone"); // ✅ aynan mana shunday yozasan

  const fetchData = async () => {
    try {
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .select("balance, custom_id")
        .eq("phone", userPhone)  // ✅ id emas, phone bilan olamiz
        .single();

      if (!workerError && worker) {
        setBalance(worker.balance);
        setCustomId(worker.custom_id);
      } else {
        console.error("Worker Error:", workerError);
      }

      const { data: logs, error: logError } = await supabase
        .from("balance_logs")
        .select("amount, created_at")
        .eq("user_id", worker.id) // ✅ aynan worker.id orqali qidiramiz
        .gt("amount", 0)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!logError && logs.length > 0) {
        setLastTopUp(logs[0]);
      } else {
        console.error("Logs Error:", logError);
      }
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  if(userPhone){
    fetchData();
  } else {
    console.error("userPhone topilmadi!");
  }

}, []);

const formatCustomId = (id) => {
  if (!id || id.length !== 8) return id;
  return id.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
};

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customId);
    alert("Hisob raqamingiz nusxalandi!");
  };

  if (loading) return <div>⏳ Yuklanmoqda...</div>;

  return (
    <div className="balance-page">
      <img src="/logo-calvero.png" alt="Calvero" className="calvero-logo" />

      <h2>💰 Balansingiz: {balance?.toLocaleString()} so‘m</h2>

      <div className="account-id">
        <span className="formatted-id">Hisob raqam: {formatCustomId(customId)}</span>
        <button onClick={copyToClipboard}>📋 Nusxalash</button>
      </div>

      {lastTopUp && (
        <div className="last-topup">
          🕓 Oxirgi to‘ldirish: {lastTopUp.amount.toLocaleString()} so‘m –{" "}
          {new Date(lastTopUp.created_at).toLocaleDateString()}
        </div>
      )}

      <div className="instruction-card">
        <h4>📘 Balans to‘ldirish yo‘riqnoma:</h4>
        <p>
          To‘ldirish uchun <b>PayMe</b> yoki <b>Paynet</b> ilovasidan foydalaning. <br />
          Izohga <b>{customId}</b> hisob raqamingizni yozishni unutmang. <br />
          To‘lov 1–5 daqiqa ichida balansga tushadi.
        </p>
      </div>

      <div className="partners">
        <img src="/payme.png" alt="PayMe" className="partner-logo" />
        <img src="/paynet.png" alt="Paynet" className="partner-logo" />
      </div>
    </div>
  );
};

export default Balance;