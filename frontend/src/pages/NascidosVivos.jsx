import React, { useEffect, useState } from "react";

function NascidosVivos() {
  const [items, setItems] = useState([]);
  const [motherName, setMotherName] = useState("");
  const [address, setAddress] = useState("");
  const [resMunicipality, setResMunicipality] = useState("");
  const [sex, setSex] = useState("M");
  const [weight, setWeight] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deliveryType, setDeliveryType] = useState("hospitalar");
  const [occMunicipality, setOccMunicipality] = useState("");
  const [registered, setRegistered] = useState("nao");
  const [childSUS, setChildSUS] = useState("");
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3001/births", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }

  async function save(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const w = weight ? Number(weight) : null;
    await fetch("http://localhost:3001/births", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        mother_name: motherName,
        address,
        residence_municipality: resMunicipality,
        sex,
        weight_kg: w,
        birth_date: birthDate,
        delivery_type: deliveryType,
        occurrence_municipality: occMunicipality,
        registered,
        child_sus_card: childSUS,
        microarea_id: user?.microarea_id
      })
    });
    setMotherName(""); setAddress(""); setResMunicipality(""); setSex("M"); setWeight(""); setBirthDate(""); setDeliveryType("hospitalar"); setOccMunicipality(""); setRegistered("nao"); setChildSUS("");
    load();
  }

  function exportCSV() {
    window.open("http://localhost:3001/births/export.csv", "_blank");
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1>Nascidos Vivos</h1>
      <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 12 }}>
        <input placeholder="Nome da mãe" value={motherName} onChange={(e) => setMotherName(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <input placeholder="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <input placeholder="Município residência" value={resMunicipality} onChange={(e) => setResMunicipality(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <select value={sex} onChange={(e) => setSex(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }}>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
        </select>
        <input type="number" step="0.01" placeholder="Peso (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }}>
          <option value="hospitalar">Hospitalar</option>
          <option value="residencial">Residencial</option>
        </select>
        <input placeholder="Município ocorrência" value={occMunicipality} onChange={(e) => setOccMunicipality(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <select value={registered} onChange={(e) => setRegistered(e.target.value)} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }}>
          <option value="sim">Cadastrada: Sim</option>
          <option value="nao">Cadastrada: Não</option>
        </select>
        <input placeholder="Cartão SUS criança" value={childSUS} onChange={(e) => setChildSUS(e.target.value.replace(/\D/g, "").slice(0, 15))} style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 8 }} />
        <button type="submit" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff" }}>Salvar</button>
        <button type="button" onClick={exportCSV} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-white)", color: "var(--text-dark)" }}>Exportar CSV</button>
      </form>
      <div>
        {items.slice(0, 10).map((it) => (
          <div key={it.id} style={{ padding: 8, borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: 700 }}>{it.mother_name}</span> • {it.birth_date} • {it.delivery_type} • {it.sex} • {it.weight_kg ?? "-"} kg
          </div>
        ))}
      </div>
    </div>
  );
}

export default NascidosVivos;
