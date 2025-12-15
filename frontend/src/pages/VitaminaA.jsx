import React, { useEffect, useState } from "react";

function VitaminaA() {
  const [children, setChildren] = useState([]);
  const [doses, setDoses] = useState([]);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [susCard, setSusCard] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [doseChildId, setDoseChildId] = useState("");
  const [vitType, setVitType] = useState("100000");
  const [doseNum, setDoseNum] = useState(1);
  const [doseDate, setDoseDate] = useState("");
  const [mensal, setMensal] = useState({ month: "", vitamin_type: "100000", saldo_anterior: 0, administradas: 0, perdas: 0, solicitacao_proximo_mes: 0 });
  const [mensalList, setMensalList] = useState([]);
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  function maskCPF(v) {
    return v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  function maskSUS(v) {
    return v.replace(/\D/g, "").slice(0, 15);
  }

  async function load() {
    const token = localStorage.getItem("token");
    const r1 = await fetch("http://localhost:3001/vitamina/children", { headers: { Authorization: `Bearer ${token}` } });
    const c = await r1.json();
    setChildren(Array.isArray(c) ? c : []);
    const r2 = await fetch("http://localhost:3001/vitamina/doses", { headers: { Authorization: `Bearer ${token}` } });
    const d = await r2.json();
    setDoses(Array.isArray(d) ? d : []);
    const r3 = await fetch("http://localhost:3001/vitamina/mensal", { headers: { Authorization: `Bearer ${token}` } });
    const m = await r3.json();
    setMensalList(Array.isArray(m) ? m : []);
  }

  async function addChild(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch("http://localhost:3001/vitamina/children", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ full_name: fullName, cpf: cpf.replace(/\D/g, ""), sus_card: susCard.replace(/\D/g, ""), birth_date: birthDate, microarea_id: user?.microarea_id })
    });
    setFullName(""); setCpf(""); setSusCard(""); setBirthDate("");
    load();
  }

  async function addDose(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch("http://localhost:3001/vitamina/doses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ child_id: Number(doseChildId), vitamin_type: vitType, dose_number: Number(doseNum), administered_at: doseDate })
    });
    setDoseChildId(""); setVitType("100000"); setDoseNum(1); setDoseDate("");
    load();
  }

  async function saveMensal(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch("http://localhost:3001/vitamina/mensal", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ microarea_id: user?.microarea_id, ...mensal })
    });
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1>Vitamina A</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--bg-white)" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Vitaminas Administradas</div>
          <form onSubmit={addChild} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 12 }}>
            <input placeholder="Nome da criança" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <input placeholder="Cartão SUS" value={susCard} onChange={(e) => setSusCard(maskSUS(e.target.value))} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <input placeholder="CPF" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff" }}>Salvar criança</button>
          </form>
          <form onSubmit={addDose} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8 }}>
            <select value={doseChildId} onChange={(e) => setDoseChildId(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }}>
              <option value="">Selecione a criança</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            <select value={vitType} onChange={(e) => setVitType(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }}>
              <option value="100000">100.000 UI</option>
              <option value="200000">200.000 UI</option>
            </select>
            <input type="number" min="1" max="10" value={doseNum} onChange={(e) => setDoseNum(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <input type="date" value={doseDate} onChange={(e) => setDoseDate(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff" }}>Registrar dose</button>
          </form>
          <div style={{ marginTop: 12 }}>
            {doses.slice(0, 10).map((d) => (
              <div key={d.id} style={{ padding: 8, borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontWeight: 700 }}>{d.full_name}</span> • {d.vitamin_type} • dose {d.dose_number} • {d.administered_at}
              </div>
            ))}
          </div>
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--bg-white)" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Controle Mensal</div>
          <form onSubmit={saveMensal} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto", gap: 8 }}>
            <input placeholder="Mês (YYYY-MM)" value={mensal.month} onChange={(e) => setMensal({ ...mensal, month: e.target.value })} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <select value={mensal.vitamin_type} onChange={(e) => setMensal({ ...mensal, vitamin_type: e.target.value })} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }}>
              <option value="100000">100.000 UI</option>
              <option value="200000">200.000 UI</option>
            </select>
            <input type="number" placeholder="Saldo anterior" value={mensal.saldo_anterior} onChange={(e) => setMensal({ ...mensal, saldo_anterior: Number(e.target.value) })} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <input type="number" placeholder="Administradas" value={mensal.administradas} onChange={(e) => setMensal({ ...mensal, administradas: Number(e.target.value) })} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <input type="number" placeholder="Perdas" value={mensal.perdas} onChange={(e) => setMensal({ ...mensal, perdas: Number(e.target.value) })} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <input type="number" placeholder="Solicitação próximo mês" value={mensal.solicitacao_proximo_mes} onChange={(e) => setMensal({ ...mensal, solicitacao_proximo_mes: Number(e.target.value) })} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
            <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff" }}>Salvar</button>
          </form>
          <div style={{ marginTop: 12 }}>
            {mensalList.slice(0, 10).map((m) => (
              <div key={m.id} style={{ padding: 8, borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontWeight: 700 }}>{m.month}</span> • {m.vitamin_type} • estoque {m.estoque_atual}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VitaminaA;
