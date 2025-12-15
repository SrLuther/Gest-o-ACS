import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function Gestao() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [uForm, setUForm] = useState({ name: "", microarea_id: "", role: "acs", password: "" });
  const [mForm, setMForm] = useState({ name: "" });
  const [error, setError] = useState("");

  async function loadAll() {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const meRes = await fetch("http://localhost:3001/profile/me", { headers: { Authorization: `Bearer ${token}` } });
      const meData = await meRes.json();
      setMe(meData || null);
      if (meData?.role === "admin") {
        const [usersRes, areasRes] = await Promise.all([
          fetch("http://localhost:3001/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:3001/microareas", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const [usersData, areasData] = await Promise.all([usersRes.json(), areasRes.json()]);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setAreas(Array.isArray(areasData) ? areasData : []);
      }
    } catch {
      setError("erro_conexao");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...uForm, microarea_id: Number(uForm.microarea_id || 0) })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_criar_usuario");
        return;
      }
      setUForm({ name: "", microarea_id: "", role: "acs", password: "" });
      loadAll();
    } catch {
      setError("erro_conexao");
    }
  }

  async function updateUser(id, changes) {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_editar_usuario");
        return;
      }
      loadAll();
    } catch {
      setError("erro_conexao");
    }
  }

  async function deleteUser(id) {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_excluir_usuario");
        return;
      }
      loadAll();
    } catch {
      setError("erro_conexao");
    }
  }

  async function createMicroarea(e) {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/admin/microareas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(mForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_criar_microarea");
        return;
      }
      setMForm({ name: "" });
      loadAll();
    } catch {
      setError("erro_conexao");
    }
  }

  async function updateMicroarea(id, changes) {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/admin/microareas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_editar_microarea");
        return;
      }
      loadAll();
    } catch {
      setError("erro_conexao");
    }
  }

  async function deleteMicroarea(id) {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/admin/microareas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_excluir_microarea");
        return;
      }
      loadAll();
    } catch {
      setError("erro_conexao");
    }
  }

  if (me && me.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div style={{ color: "var(--text-dark)" }}>
      <h1>Gestão</h1>
      {error ? <div style={{ color: "#b91c1c", marginBottom: 8 }}>{String(error)}</div> : null}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <h2>Usuários</h2>
          <form onSubmit={createUser} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 12 }}>
            <input placeholder="Nome (login)" value={uForm.name} onChange={(e) => setUForm(p => ({ ...p, name: e.target.value }))} required style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }} />
            <select value={uForm.microarea_id} onChange={(e) => setUForm(p => ({ ...p, microarea_id: e.target.value }))} required style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }}>
              <option value="">Microárea</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={uForm.role} onChange={(e) => setUForm(p => ({ ...p, role: e.target.value }))} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }}>
              <option value="admin">Admin</option>
              <option value="acs">ACS</option>
            </select>
            <input type="password" placeholder="Senha" value={uForm.password} onChange={(e) => setUForm(p => ({ ...p, password: e.target.value }))} required style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }} />
            <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", fontWeight: 700 }}>
              Cadastrar
            </button>
          </form>
          <div style={{ display: "grid", gap: 8 }}>
            {users.map(u => (
              <div key={u.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }}>
                <div style={{ fontWeight: 700 }}>{u.name} <span style={{ fontWeight: 400 }}>({u.professional_id})</span></div>
                <div>{u.role.toUpperCase()} • Microárea: {u.microarea_name}</div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                  <input defaultValue={u.name} onBlur={(e) => updateUser(u.id, { name: e.target.value })} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
                  <select defaultValue={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                    <option value="admin">Admin</option>
                    <option value="acs">ACS</option>
                  </select>
                  <select defaultValue={u.microarea_id} onChange={(e) => updateUser(u.id, { microarea_id: Number(e.target.value) })} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <input type="password" placeholder="Nova senha" onBlur={(e) => e.target.value && updateUser(u.id, { password: e.target.value })} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
                  <button onClick={() => deleteUser(u.id)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", fontWeight: 700 }}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {!users.length ? <div>Nenhum usuário</div> : null}
          </div>
        </div>
        <div>
          <h2>Microáreas</h2>
          <form onSubmit={createMicroarea} style={{ display: "grid", gridTemplateColumns: "2fr auto", gap: 8, marginBottom: 12 }}>
            <input placeholder="Nome da microárea" value={mForm.name} onChange={(e) => setMForm({ name: e.target.value })} required style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }} />
            <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", fontWeight: 700 }}>
              Cadastrar
            </button>
          </form>
          <div style={{ display: "grid", gap: 8 }}>
            {areas.map(a => (
              <div key={a.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)" }}>
                <div style={{ fontWeight: 700 }}>{a.name}</div>
                <div>Identificador: {a.identifier || "-"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                  <input defaultValue={a.name} onBlur={(e) => updateMicroarea(a.id, { name: e.target.value })} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
                  <input defaultValue={a.cnes || ""} placeholder="CNES" onBlur={(e) => updateMicroarea(a.id, { cnes: e.target.value })} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
                  <input defaultValue={a.ine || ""} placeholder="INE" onBlur={(e) => updateMicroarea(a.id, { ine: e.target.value })} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 8 }} />
                  <button onClick={() => deleteMicroarea(a.id)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", fontWeight: 700 }}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {!areas.length ? <div>Nenhuma microárea</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gestao;
