import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./Balance.css";
import { Helmet } from "react-helmet-async";

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
        .select("id, balance, custom_id")
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
        .eq("phone", userPhone) // ✅ aynan worker.id orqali qidiramiz
        .gt("amount", 0)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!logError && logs.length > 0) {
        setLastTopUp(logs[0]);
      } else {
        console.log("Logs mavjud emas yoki bosh.");
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
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>

    <img src="/logo-calvero.png" alt="Calvero" className="calvero-logo" />

    <h2 className="balance-text">
      💰 Balansingiz: <span className="amount">{(balance / 100)?.toLocaleString()} so‘m</span>
    </h2>

    <div className="account-id-box">
      <span className="account-id">Hisob raqam: <strong>{formatCustomId(customId)}</strong></span>
      <button className="copy-button" onClick={copyToClipboard}>📋 Nusxalash</button>
    </div>

    {lastTopUp && (
      <div className="last-topup">
        🕓 Oxirgi to‘ldirish: {lastTopUp.amount.toLocaleString()} so‘m –{" "}
        {new Date(lastTopUp.created_at).toLocaleDateString()}
      </div>
    )}

    <div className="instruction-box">
      <h4>📘 Balans to‘ldirish yo‘riqnoma:</h4>
      <p>
        To‘ldirish uchun <b>PayMe</b> ilovasidan foydalaning. <br />
        <b>{customId}</b> hisob raqamingizni yozishni unutmang. <br />
        To‘lov 1–5 daqiqa ichida balansga tushadi.
      </p>
    </div>

    <div className="partner-logo-box">
  <img src="/payme.png" className="partner-logo" alt="Payme" />
    </div>
  </div>
);}

export default Balance;