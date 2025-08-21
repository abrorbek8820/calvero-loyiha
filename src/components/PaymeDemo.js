import { useState } from "react";
import { fmt } from "./lib/fmt";
import { callPayme } from "./api/payme";

export default function PaymeDemo({ auth }) {
  const [rows, setRows] = useState([]);

  async function onCreate() {
    try {
      const res = await callPayme("CreateTransaction", {
        id: "TX" + Date.now(),
        amount: 1000000, // 10 000 so'm = 1 000 000 tiyín
        account: { order_id: "44445555" }
      }, auth);

      alert(`Create OK: tx=${res.transaction}, state=${res.state}`);
    } catch (e) {
      alert(`Xato: ${e.message}`);
    }
  }

  async function loadStatement() {
    const { transactions = [] } = await callPayme("GetStatement", {
      from: 0, to: 4102444800000
    }, auth);

    setRows(transactions.map(tx => ({
      id: tx.id,
      time: new Date(tx.time).toLocaleString(),
      amountSom: Math.floor(tx.amount / 100),
      accountStr: fmt(tx.account),
      txid: tx.transaction,
      state: tx.state,
      reason: tx.reason ?? ""
    })));
  }

  return (
    <div>
      <button onClick={onCreate}>Create TX</button>
      <button onClick={loadStatement}>Load Statement</button>

      <table>
        <thead>
          <tr>
            <th>ID</th><th>Time</th><th>Amount</th><th>Account</th><th>TxID</th><th>State</th><th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
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
  );
}