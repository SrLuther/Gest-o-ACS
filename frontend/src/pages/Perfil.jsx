import React, { useEffect, useState } from "react";

function Perfil() {
  const [me, setMe] = useState({});
  const [dash, setDash] = useState({ appointments: 0, doses: 0, deaths: 0, births: 0 });
  const [name, setName] = useState("");
  const [cnes, setCnes] = useState("");
  const [ine, setIne] = useState("");
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  async function load() {
    const token = localStorage.getItem("token");
    const r1 = await fetch("http://localhost:3001/profile/me", { headers: { Authorization: `Bearer ${token}` } });
    const m = await r1.json();
    setMe(m || {});
    setName(m?.name || "");
    setCnes(m?.cnes || "");
    setIne(m?.ine || "");
    const r2 = await fetch("http://localhost:3001/dashboard", { headers: { Authorization: `Bearer ${token}` } });
    const d = await r2.json();
    setDash(d || {});
  }

  async function save() {
    const token = localStorage.getItem("token");
    await fetch("http://localhost:3001/profile/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, microarea_id: user?.microarea_id, cnes, ine })
    });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1>Perfil</h1>
      <div style={{ marginBottom: 12, color: "var(--text-dark)" }}>
        <div>Nome: {me?.name || "-"}</div>
        <div>ID Profissional: {user?.professional_id || "-"}</div>
        <div>Role: {user?.role || "-"}</div>
        <div>Microárea ID: {user?.microarea_id ?? "-"}</div>
        <div>Último acesso: {me?.last_access_at || "-"}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }}>
          <div style={{ fontWeight: 700 }}>Agendamentos (semana)</div>
          <div>{dash.appointments}</div>
        </div>
        <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }}>
          <div style={{ fontWeight: 700 }}>Doses Vitamina</div>
          <div>{dash.doses}</div>
        </div>
        <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }}>
          <div style={{ fontWeight: 700 }}>Óbitos</div>
          <div>{dash.deaths}</div>
        </div>
        <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }}>
          <div style={{ fontWeight: 700 }}>Nascidos Vivos</div>
          <div>{dash.births}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8 }}>
        <input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8, color: "var(--text-dark)", background: "var(--bg-white)" }} />
        <input placeholder="CNES" value={cnes} onChange={(e) => setCnes(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8, color: "var(--text-dark)", background: "var(--bg-white)" }} />
        <input placeholder="INE" value={ine} onChange={(e) => setIne(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8, color: "var(--text-dark)", background: "var(--bg-white)" }} />
        <button onClick={save} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", fontWeight: 700 }}>
          Salvar
        </button>
      </div>
    </div>
  );
}

export default Perfil;
