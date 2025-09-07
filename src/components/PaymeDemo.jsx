// src/components/PaymeDemo.jsx
import { useState } from "react";
import { callPayme } from "./api/payme";   // mos ravishda yo'lini tekshir
import { fmt } from "../lib/fmt";

export default function PaymeDemo() {
  const [orderId, setOrderId] = useState("44445555"); // account.order_id
  const [amountSom, setAmountSom] = useState(10000);  // foydalanuvchi kiritadi (so'mda)
  const [paycomId, setPaycomId] = useState("");       // Payme transaction id (Create uchun o'zimiz beramiz)
  const [rows, setRows] = useState([]);               // GetStatement ro'yxati
  const [log, setLog] = useState("");                 // natijalarni ko'rsatish

  const amountTiyin = Math.round(Number(amountSom || 0) * 100);

  const appendLog = (title, data) =>
    setLog((prev) => `${title}\n${fmt(data)}\n\n${prev}`);

  const genPaycomId = () => `TX${Date.now()}`;

  // --- Ping (tez sinov)
  async function onPing() {
    try {
      const res = await callPayme("Ping", {});
      appendLog("Ping OK", res);
      alert("Ping OK");
    } catch (e) {
      appendLog("Ping ERROR", e.message);
      alert("Xato: " + e.message);
    }
  }

  // --- CheckPerformTransaction
  async function onCheck() {
    try {
      const res = await callPayme("CheckPerformTransaction", {
        amount: amountTiyin,
        account: { order_id: orderId },
      });
      appendLog("CheckPerformTransaction", res);
      alert(`allow = ${res.allow ? "true" : "false"}`);
    } catch (e) {
      appendLog("CheckPerform ERROR", e.message);
      alert("Xato: " + e.message);
    }
  }

  // --- CreateTransaction
  async function onCreate() {
    try {
      const id = genPaycomId();
      setPaycomId(id);
      const res = await callPayme("CreateTransaction", {
        id,
        amount: amountTiyin,
        account: { order_id: orderId },
      });
      appendLog("CreateTransaction", res);
      alert(`Create OK: tx=${res.transaction}, state=${res.state}`);
    } catch (e) {
      appendLog("Create ERROR", e.message);
      alert("Xato: " + e.message);
    }
  }

  // --- PerformTransaction
  async function onPerform() {
    if (!paycomId) {
      alert("Avval Create qiling (paycomId yo'q)");
      return;
    }
    try {
      const res = await callPayme("PerformTransaction", { id: paycomId });
      appendLog("PerformTransaction", res);
      alert(`Perform state=${res.state}`);
    } catch (e) {
      appendLog("Perform ERROR", e.message);
      alert("Xato: " + e.message);
    }
  }

  // --- CancelTransaction (refund)
  async function onCancel() {
    if (!paycomId) {
      alert("Avval Create qiling (paycomId yo'q)");
      return;
    }
    try {
      const res = await callPayme("CancelTransaction", {
        id: paycomId,
        reason: 5, // sandbox uchun
      });
      appendLog("CancelTransaction", res);
      alert(`Cancel state=${res.state}`);
    } catch (e) {
      appendLog("Cancel ERROR", e.message);
      alert("Xato: " + e.message);
    }
  }

  // --- CheckTransaction
  async function onCheckTx() {
    if (!paycomId) {
      alert("Avval Create qiling (paycomId yo'q)");
      return;
    }
    try {
      const res = await callPayme("CheckTransaction", { id: paycomId });
      appendLog("CheckTransaction", res);
      alert(`Check state=${res.state}`);
    } catch (e) {
      appendLog("CheckTx ERROR", e.message);
      alert("Xato: " + e.message);
    }
  }

  // --- GetStatement
  async function onLoadStatement() {
    try {
      const { transactions = [] } = await callPayme("GetStatement", {
        from: 0,
        to: 4102444800000, // 2100-01-01
      });
      setRows(
        transactions.map((tx) => ({
          id: tx.id,
          time: new Date(tx.time).toLocaleString(),
          amountSom: Math.floor(Number(tx.amount || 0) / 100),
          accountStr: fmt(tx.account),txid: tx.transaction,
          state: tx.state,
          reason: tx.reason ?? "",
        }))
      );
      appendLog("GetStatement", transactions.slice(0, 3)); // sample
    } catch (e) {
      appendLog("Statement ERROR", e.message);
      alert("Xato: " + e.message);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Payme Demo</h2>

      <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <label>
          Order ID:
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Amount (so‘m):
          <input
            type="number"
            value={amountSom}
            onChange={(e) => setAmountSom(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Paycom Tx ID (Create dan so‘ng avtomatik to‘ladi):
          <input value={paycomId} onChange={(e) => setPaycomId(e.target.value)} style={{ width: "100%" }} />
        </label>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onPing}>Ping</button>
          <button onClick={onCheck}>CheckPerform</button>
          <button onClick={onCreate}>Create TX</button>
          <button onClick={onPerform}>Perform</button>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onCheckTx}>Check TX</button>
          <button onClick={onLoadStatement}>Load Statement</button>
        </div>
      </div>

      <h3 style={{ marginTop: 20 }}>Transactions</h3>
      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>ID</th>
              <th>Time</th>
              <th>Amount</th>
              <th>Account</th>
              <th>TxID</th>
              <th>State</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.time}</td>
                <td>{r.amountSom}</td>
                <td><code>{r.accountStr}</code></td>
                <td>{r.txid}</td>
                <td>{r.state}</td>
                <td>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 20 }}>Log</h3>
      <textarea
        value={log}
        readOnly
        rows={12}
        style={{ width: "100%", fontFamily: "monospace" }}
      />
    </div>
  );
}