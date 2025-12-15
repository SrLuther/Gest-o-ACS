import React, { useEffect, useState } from "react";

function Agendamentos() {
  const [items, setItems] = useState([]);
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [susCard, setSusCard] = useState("");
  const [reqType, setReqType] = useState("visita_domiciliar");
  const [turn, setTurn] = useState("manha");
  const [remaining, setRemaining] = useState(null);
  const [fixedView, setFixedView] = useState([]);
  const [loadingFixed, setLoadingFixed] = useState(false);
  const [me, setMe] = useState(null);
  const [microareas, setMicroareas] = useState([]);
  const [cfg, setCfg] = useState({ microarea_id: "", day_of_week: 1, turn: "manha", tipo: "citopatologico", vagas_limitadas: false, vagas: 0, active: true, responsavel: "" });
  const [limitCfg, setLimitCfg] = useState({ microarea_id: "", tipo: "saude_escola", period: "mensal", limit: 1, active: true });
  const [extraWeek, setExtraWeek] = useState({ microarea_id: "", week_start: "", tipo: "hipertensao", extra: 1 });
  const [extraTurn, setExtraTurn] = useState({ microarea_id: "", week_start: "", day_of_week: 1, turn: "manha", tipo: "citopatologico", extra: 1 });
  const [notes, setNotes] = useState([]);

  function maskCPF(v) {
    return v
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  function maskSUS(v) {
    return v.replace(/\D/g, "").slice(0, 15);
  }

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

  async function loadFixed() {
    try {
      setLoadingFixed(true);
      const token = localStorage.getItem("token");
      const weekStart = (() => {
        const d = new Date();
        const day = d.getUTCDay();
        const diff = (day + 6) % 7;
        const start = new Date(d.getTime() - diff * 24 * 3600 * 1000);
        return start.toISOString().slice(0, 10);
      })();
      const res = await fetch(`http://localhost:3001/schedule/view?week=${weekStart}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFixedView(Array.isArray(data) ? data : []);
    } catch {
      // ignore fixed view errors
    } finally {
      setLoadingFixed(false);
    }
  }

  async function checkAvailability() {
    setRemaining(null);
    try {
      if (!date || !turn || !reqType) return;
      const token = localStorage.getItem("token");
      const url = new URL("http://localhost:3001/schedule/availability");
      url.searchParams.set("date", date);
      url.searchParams.set("turn", turn);
      url.searchParams.set("tipo", reqType);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRemaining(typeof data?.remaining === "number" ? data.remaining : null);
    } catch {
      setRemaining(null);
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
        body: JSON.stringify({ subject, date, time, full_name: fullName, cpf: cpf.replace(/\D/g, ""), sus_card: susCard.replace(/\D/g, ""), request_type: reqType, turn })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_criacao");
        return;
      }
      if (data?.error === "limit_reached") return;
      setSubject("");
      setDate("");
      setTime("");
      setFullName("");
      setCpf("");
      setSusCard("");
      setReqType("visita_domiciliar");
      setTurn("manha");
      setRemaining(null);
      load();
    } catch {
      setError("erro_conexao");
    }
  }

  useEffect(() => {
    load();
    loadFixed();
  }, []);

  useEffect(() => {
    checkAvailability();
  }, [date, turn, reqType]);

  function dayName(dow) {
    return ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][Number(dow) % 7];
  }
  function printSchedule() {
    window.print();
  }

  useEffect(() => {
    async function loadMe() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/profile/me", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setMe(data || null);
        if (data?.role === "admin") {
          const resAreas = await fetch("http://localhost:3001/microareas", { headers: { Authorization: `Bearer ${token}` } });
          const areas = await resAreas.json();
          setMicroareas(Array.isArray(areas) ? areas : []);
        }
      } catch {}
    }
    async function loadNotes() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/notifications", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : []);
      } catch {}
    }
    loadMe();
    loadNotes();
    const id = setInterval(loadNotes, 30000);
    return () => clearInterval(id);
  }, []);

  async function adminCreateFixed(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const body = { ...cfg, vagas: cfg.vagas_limitadas ? Number(cfg.vagas || 0) : null };
      const res = await fetch("http://localhost:3001/schedule/fixed", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_config_agenda");
        return;
      }
      setCfg({ microarea_id: "", day_of_week: 1, turn: "manha", tipo: "citopatologico", vagas_limitadas: false, vagas: 0, active: true, responsavel: "" });
      loadFixed();
    } catch {
      setError("erro_conexao");
    }
  }
  async function adminSetLimit(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/schedule/limits", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...limitCfg, limit: Number(limitCfg.limit || 0) }) });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_limite");
        return;
      }
      setLimitCfg({ microarea_id: "", tipo: "saude_escola", period: "mensal", limit: 1, active: true });
    } catch {
      setError("erro_conexao");
    }
  }
  async function adminExtraWeek(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/admin/extra-slots", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...extraWeek, extra: Number(extraWeek.extra || 0) }) });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_vagas_semana");
        return;
      }
    } catch {
      setError("erro_conexao");
    }
  }
  async function adminExtraTurn(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/admin/extra-turn-slots", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...extraTurn, extra: Number(extraTurn.extra || 0) }) });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_vagas_turno");
        return;
      }
      loadFixed();
    } catch {
      setError("erro_conexao");
    }
  }
  async function exportCSV(type) {
    try {
      const token = localStorage.getItem("token");
      let url = "";
      if (type === "appointments") {
        const weekStart = (() => {
          const d = new Date();
          const day = d.getUTCDay();
          const diff = (day + 6) % 7;
          const start = new Date(d.getTime() - diff * 24 * 3600 * 1000);
          return start.toISOString().slice(0, 10);
        })();
        const params = new URLSearchParams();
        if (me?.role === "admin" && cfg.microarea_id) params.set("microarea_id", String(cfg.microarea_id));
        params.set("week", weekStart);
        url = `http://localhost:3001/appointments/export.csv?${params.toString()}`;
      } else if (type === "schedule") {
        const params = new URLSearchParams();
        if (me?.role === "admin" && cfg.microarea_id) params.set("microarea_id", String(cfg.microarea_id));
        url = `http://localhost:3001/schedule/export.csv?${params.toString()}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const dl = document.createElement("a");
      dl.href = URL.createObjectURL(blob);
      dl.download = type === "appointments" ? "agendamentos.csv" : "agenda_fixa.csv";
      document.body.appendChild(dl);
      dl.click();
      dl.remove();
    } catch {}
  }

  return (
    <div>
      <h1>Agendamentos</h1>
      <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 12 }}>
        <input placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8, color: "var(--text-dark)", background: "var(--bg-white)" }} />
        <input placeholder="CPF" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8, color: "var(--text-dark)", background: "var(--bg-white)" }} />
        <input placeholder="Cartão SUS" value={susCard} onChange={(e) => setSusCard(maskSUS(e.target.value))} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8, color: "var(--text-dark)", background: "var(--bg-white)" }} />
        <select value={reqType} onChange={(e) => setReqType(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8, color: "var(--text-dark)", background: "var(--bg-white)" }}>
          <option value="hipertensao">Hipertensão</option>
          <option value="diabetes">Diabetes</option>
          <option value="citopatologico">Citopatológico</option>
          <option value="visita_domiciliar">Visita domiciliar</option>
          <option value="saude_mental">Saúde Mental</option>
          <option value="puericultura">Puericultura</option>
          <option value="reuniao_equipe">Reunião de equipe</option>
          <option value="demanda_espontanea">Demanda espontânea</option>
          <option value="prenatal_acompanhamento">Pré-natal (acomp.)</option>
          <option value="prenatal_cadastro">Pré-natal (cadastro)</option>
          <option value="saude_escola">Saúde na Escola</option>
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8, color: "var(--text-dark)", background: "var(--bg-white)" }} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8, color: "var(--text-dark)", background: "var(--bg-white)" }} />
        <select value={turn} onChange={(e) => setTurn(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8, color: "var(--text-dark)", background: "var(--bg-white)" }}>
          <option value="manha">Manhã</option>
          <option value="tarde">Tarde</option>
        </select>
        <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", fontWeight: 700 }}>
          Criar
        </button>
      </form>
      <div style={{ marginBottom: 12, color: "var(--text-dark)" }}>
        {remaining == null ? <span>Vagas: Ilimitadas ou não configuradas</span> : <span>Vagas restantes no turno: {remaining}</span>}
      </div>
      {error ? <div style={{ color: "#b91c1c", marginBottom: 8 }}>{String(error)}</div> : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Agenda fixa semanal</h2>
        <button onClick={printSchedule} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-white)", color: "var(--text-dark)", fontWeight: 600 }}>
          Imprimir
        </button>
      </div>
      {!!notes.filter(n => n.unread).length ? (
        <div style={{ padding: 10, borderRadius: 8, border: "1px solid #f59e0b", background: "#fff7ed", color: "#9a3412", marginBottom: 12 }}>
          {notes.filter(n => n.unread).slice(0,3).map(n => <div key={n.id}>Aviso: {n.message}</div>)}
        </div>
      ) : null}
      <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {loadingFixed ? <div>Carregando agenda...</div> : null}
        {!loadingFixed && fixedView.map((r) => (
          <div key={r.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }}>
            <div style={{ fontWeight: 700 }}>{dayName(r.day_of_week)} • {r.turn}</div>
            <div>{r.tipo} {r.responsavel ? "• Resp.: "+r.responsavel : ""}</div>
            <div>{r.vagas_limitadas ? `Vagas: ${r.vagas ?? 0}` : "Vagas: Ilimitadas"}</div>
            <div>{r.remaining == null ? "Restantes: -" : `Restantes: ${r.remaining}`}</div>
            <div style={{ height: 6, borderRadius: 4, background: "#e5e7eb", marginTop: 6 }}>
              {typeof r.remaining === "number" && r.vagas_limitadas ? (
                <div style={{ height: 6, borderRadius: 4, width: `${Math.max(0, Math.min(100, ((r.vagas || 0) - r.remaining) / (r.vagas || 1) * 100))}%`, background: r.remaining <= 1 ? "#ef4444" : r.remaining <= 3 ? "#f59e0b" : "#10b981" }} />
              ) : null}
            </div>
          </div>
        ))}
        {!loadingFixed && !fixedView.length ? <div>Nenhuma agenda fixa configurada</div> : null}
      </div>
      {me?.role === "admin" ? (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 8 }}>
          <h2 style={{ marginTop: 0 }}>Configuração (Admin)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <form onSubmit={adminCreateFixed} style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Agenda fixa por turno</div>
              <select value={cfg.microarea_id} onChange={(e) => setCfg(p => ({ ...p, microarea_id: Number(e.target.value) }))} required style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="">Selecione microárea</option>
                {microareas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={cfg.day_of_week} onChange={(e) => setCfg(p => ({ ...p, day_of_week: Number(e.target.value) }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                {[0,1,2,3,4,5,6].map(d => <option key={d} value={d}>{dayName(d)}</option>)}
              </select>
              <select value={cfg.turn} onChange={(e) => setCfg(p => ({ ...p, turn: e.target.value }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
              </select>
              <select value={cfg.tipo} onChange={(e) => setCfg(p => ({ ...p, tipo: e.target.value }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="saude_mental">Saúde Mental</option>
                <option value="puericultura">Puericultura</option>
                <option value="reuniao_equipe">Reunião de equipe</option>
                <option value="citopatologico">Citopatológico</option>
                <option value="demanda_espontanea">Demanda espontânea</option>
                <option value="hipertensao">Hipertensos</option>
                <option value="diabetes">Diabéticos</option>
                <option value="prenatal_acompanhamento">Pré-natal (acomp.)</option>
                <option value="prenatal_cadastro">Pré-natal (cadastro)</option>
                <option value="saude_escola">Saúde na Escola</option>
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={cfg.vagas_limitadas} onChange={(e) => setCfg(p => ({ ...p, vagas_limitadas: e.target.checked }))} />
                Vagas limitadas
              </label>
              {cfg.vagas_limitadas ? (
                <input type="number" min={0} value={cfg.vagas} onChange={(e) => setCfg(p => ({ ...p, vagas: e.target.value }))} placeholder="Número de vagas" style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
              ) : null}
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={cfg.active} onChange={(e) => setCfg(p => ({ ...p, active: e.target.checked }))} />
                Ativo
              </label>
              <input placeholder="Responsável (opcional)" value={cfg.responsavel} onChange={(e) => setCfg(p => ({ ...p, responsavel: e.target.value }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
              <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", fontWeight: 700 }}>Salvar turno</button>
            </form>
            <form onSubmit={adminSetLimit} style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Limites semanais/mensais</div>
              <select value={limitCfg.microarea_id} onChange={(e) => setLimitCfg(p => ({ ...p, microarea_id: Number(e.target.value) }))} required style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="">Selecione microárea</option>
                {microareas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={limitCfg.tipo} onChange={(e) => setLimitCfg(p => ({ ...p, tipo: e.target.value }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="reuniao_equipe">Reunião de equipe</option>
                <option value="saude_escola">Saúde na Escola</option>
              </select>
              <select value={limitCfg.period} onChange={(e) => setLimitCfg(p => ({ ...p, period: e.target.value }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
              <input type="number" min={0} value={limitCfg.limit} onChange={(e) => setLimitCfg(p => ({ ...p, limit: e.target.value }))} placeholder="Quantidade máxima" style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={limitCfg.active} onChange={(e) => setLimitCfg(p => ({ ...p, active: e.target.checked }))} />
                Ativo
              </label>
              <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", fontWeight: 700 }}>Salvar limite</button>
            </form>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <form onSubmit={adminExtraWeek} style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Liberar vagas semanais</div>
              <select value={extraWeek.microarea_id} onChange={(e) => setExtraWeek(p => ({ ...p, microarea_id: Number(e.target.value) }))} required style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="">Selecione microárea</option>
                {microareas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input type="date" value={extraWeek.week_start} onChange={(e) => setExtraWeek(p => ({ ...p, week_start: e.target.value }))} required style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
              <select value={extraWeek.tipo} onChange={(e) => setExtraWeek(p => ({ ...p, tipo: e.target.value }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="hipertensao">Hipertensão</option>
                <option value="diabetes">Diabetes</option>
              </select>
              <input type="number" min={0} value={extraWeek.extra} onChange={(e) => setExtraWeek(p => ({ ...p, extra: e.target.value }))} placeholder="Vagas extras" style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
              <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", fontWeight: 700 }}>Liberar</button>
            </form>
            <form onSubmit={adminExtraTurn} style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Liberar vagas por turno</div>
              <select value={extraTurn.microarea_id} onChange={(e) => setExtraTurn(p => ({ ...p, microarea_id: Number(e.target.value) }))} required style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="">Selecione microárea</option>
                {microareas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input type="date" value={extraTurn.week_start} onChange={(e) => setExtraTurn(p => ({ ...p, week_start: e.target.value }))} required style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
              <select value={extraTurn.day_of_week} onChange={(e) => setExtraTurn(p => ({ ...p, day_of_week: Number(e.target.value) }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                {[0,1,2,3,4,5,6].map(d => <option key={d} value={d}>{dayName(d)}</option>)}
              </select>
              <select value={extraTurn.turn} onChange={(e) => setExtraTurn(p => ({ ...p, turn: e.target.value }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
              </select>
              <select value={extraTurn.tipo} onChange={(e) => setExtraTurn(p => ({ ...p, tipo: e.target.value }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="saude_mental">Saúde Mental</option>
                <option value="puericultura">Puericultura</option>
                <option value="reuniao_equipe">Reunião de equipe</option>
                <option value="citopatologico">Citopatológico</option>
                <option value="demanda_espontanea">Demanda espontânea</option>
                <option value="hipertensao">Hipertensão</option>
                <option value="diabetes">Diabetes</option>
                <option value="prenatal_acompanhamento">Pré-natal (acomp.)</option>
                <option value="prenatal_cadastro">Pré-natal (cadastro)</option>
                <option value="saude_escola">Saúde na Escola</option>
              </select>
              <input type="number" min={0} value={extraTurn.extra} onChange={(e) => setExtraTurn(p => ({ ...p, extra: e.target.value }))} placeholder="Vagas extras" style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
              <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", fontWeight: 700 }}>Liberar</button>
            </form>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => exportCSV("schedule")} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-white)", color: "var(--text-dark)", fontWeight: 600 }}>Exportar agenda fixa (CSV)</button>
            <button onClick={() => exportCSV("appointments")} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-white)", color: "var(--text-dark)", fontWeight: 600 }}>Exportar agendamentos (CSV)</button>
          </div>
        </div>
      ) : null}
      <div style={{ display: "grid", gap: 8, color: "var(--text-dark)" }}>
        {items.map((it) => (
          <div key={it.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg_white)" }}>
            <div style={{ fontWeight: 700 }}>{it.subject}</div>
            <div>{it.date} {it.time}</div>
            <div>{it.full_name} {it.cpf ? " • CPF: "+it.cpf : ""} {it.sus_card ? " • SUS: "+it.sus_card : ""}</div>
            <div>Tipo: {it.request_type || "-"} • Turno: {it.turn || "-"}</div>
          </div>
        ))}
        {!items.length ? <div>Nenhum agendamento</div> : null}
      </div>
    </div>
  );
}

export default Agendamentos;
