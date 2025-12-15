import React, { useEffect, useState } from "react";

function Obitos() {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [address, setAddress] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [sex, setSex] = useState("M");
  const [age, setAge] = useState("");
  const [place, setPlace] = useState("hospital");
  const [doNumber, setDoNumber] = useState("");
  const [items, setItems] = useState([]);
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3001/deaths", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }

  async function save(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch("http://localhost:3001/deaths", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ date, name, mother_name: motherName, address, municipality, sex, age: age ? Number(age) : null, place, do_number: doNumber, microarea_id: user?.microarea_id })
    });
    setDate(""); setName(""); setMotherName(""); setAddress(""); setMunicipality(""); setSex("M"); setAge(""); setPlace("hospital"); setDoNumber("");
    load();
  }

  function exportCSV() {
    window.open("http://localhost:3001/deaths/export.csv", "_blank");
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1>Óbitos</h1>
      <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 12 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <input placeholder="Nome da mãe" value={motherName} onChange={(e) => setMotherName(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <input placeholder="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <input placeholder="Município" value={municipality} onChange={(e) => setMunicipality(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <select value={sex} onChange={(e) => setSex(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }}>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
        </select>
        <input type="number" placeholder="Idade" value={age} onChange={(e) => setAge(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <select value={place} onChange={(e) => setPlace(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }}>
          <option value="hospital">Hospital</option>
          <option value="residencia">Residência</option>
        </select>
        <input placeholder="Nº D.O." value={doNumber} onChange={(e) => setDoNumber(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff" }}>Salvar</button>
        <button type="button" onClick={exportCSV} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-white)", color: "var(--text-dark)" }}>Exportar CSV</button>
      </form>
      <div>
        {items.slice(0, 10).map((it) => (
          <div key={it.id} style={{ padding: 8, borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: 700 }}>{it.name}</span> • {it.date} • {it.municipality || "-"} • {it.place}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Obitos;
