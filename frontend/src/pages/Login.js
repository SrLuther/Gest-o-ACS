import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [professionalId, setProfessionalId] = useState("");
  const [microarea, setMicroarea] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId, microarea, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_login");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/perfil", { replace: true });
    } catch {
      setError("erro_conexao");
    }
  }

  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <form onSubmit={onSubmit} style={{ width: 360, display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center" }}>Login</div>
        <label style={{ display: "grid", gap: 6 }}>
          <span>ID Profissional</span>
          <input value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Microárea</span>
          <input value={microarea} onChange={(e) => setMicroarea(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Senha</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }} />
        </label>
        {error ? <div style={{ color: "#b91c1c" }}>{String(error)}</div> : null}
        <button type="submit" style={{ padding: 10, borderRadius: 8, border: "1px solid #2563eb", background: "#2563eb", color: "#fff", fontWeight: 700 }}>
          Entrar
        </button>
      </form>
    </div>
  );
}

export default Login;

