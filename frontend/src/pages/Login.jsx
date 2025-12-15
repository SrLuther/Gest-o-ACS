import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [professionalId, setProfessionalId] = useState("");
  const [microarea, setMicroarea] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!consent) {
      setError("consent_required");
      return;
    }
    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId, microarea, password, consent: true })
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

  async function requestReset() {
    setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_reset");
        return;
      }
      setResetToken(data.token);
    } catch {
      setError("erro_conexao");
    }
  }

  async function doReset() {
    setError("");
    try {
      const np = prompt("Nova senha:");
      if (!np) return;
      const res = await fetch("http://localhost:3001/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, new_password: np })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "erro_reset");
        return;
      }
      alert("Senha alterada");
    } catch {
      setError("erro_conexao");
    }
  }

  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      <form onSubmit={onSubmit} style={{ width: 360, display: "grid", gap: 12, border: "1px solid var(--border)", borderRadius: 12, padding: 16, background: "var(--bg-white)", color: "var(--text-dark)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", color: "var(--text-dark)" }}>Login</div>
        <label style={{ display: "grid", gap: 6, color: "var(--text-dark)" }}>
          <span>ID Profissional</span>
          <input value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", color: "var(--text-dark)", background: "var(--bg-white)" }} />
        </label>
        <label style={{ display: "grid", gap: 6, color: "var(--text-dark)" }}>
          <span>Microárea</span>
          <input value={microarea} onChange={(e) => setMicroarea(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", color: "var(--text-dark)", background: "var(--bg-white)" }} />
        </label>
        <label style={{ display: "grid", gap: 6, color: "var(--text-dark)" }}>
          <span>Senha</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", color: "var(--text-dark)", background: "var(--bg-white)" }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-dark)" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Concordo com a Política de Privacidade</span>
        </label>
        {error ? <div style={{ color: "#b91c1c" }}>{String(error)}</div> : null}
        <button type="submit" style={{ padding: 10, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff", fontWeight: 700 }}>
          Entrar
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={requestReset} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-white)", color: "var(--text-dark)" }}>
            Esqueci a senha
          </button>
          {resetToken ? (
            <button type="button" onClick={doReset} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff" }}>
              Usar token
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export default Login;
