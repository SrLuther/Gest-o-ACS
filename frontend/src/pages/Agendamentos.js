import React, { useEffect, useState } from "react";

function Agendamentos() {
  const [items, setItems] = useState([]);
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/appointments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro");
        return;
      }
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("erro_conexao");
    }
  }

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, date, time })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_criacao");
        return;
      }
      setSubject("");
      setDate("");
      setTime("");
      load();
    } catch {
      setError("erro_conexao");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1>Agendamentos</h1>
      <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 12 }}>
        <input placeholder="Assunto" value={subject} onChange={(e) => setSubject(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid #2563eb", background: "#2563eb", color: "#fff", fontWeight: 700 }}>
          Criar
        </button>
      </form>
      {error ? <div style={{ color: "#b91c1c", marginBottom: 8 }}>{String(error)}</div> : null}
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <div style={{ fontWeight: 700 }}>{it.subject}</div>
            <div>{it.date} {it.time}</div>
          </div>
        ))}
        {!items.length ? <div>Nenhum agendamento</div> : null}
      </div>
    </div>
  );
}

export default Agendamentos;

