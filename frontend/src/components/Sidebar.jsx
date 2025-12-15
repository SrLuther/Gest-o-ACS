import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 8,
  color: isActive ? "#fff" : "var(--text-dark)",
  background: isActive ? "#2563eb" : "transparent",
  textDecoration: "none",
  fontWeight: 600
});

function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    async function load() {
      try {
        const cachedUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
        if (cachedUser?.role === "admin") setIsAdmin(true);
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3001/profile/me", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setIsAdmin(data?.role === "admin");
      } catch {}
    }
    load();
  }, []);
  return (
    <aside style={{ width: 240, borderRight: "1px solid var(--border)", padding: 12, background: "var(--bg-white)", color: "var(--text-dark)" }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "var(--text-dark)" }}>ACS Gestão Geral</div>
      <nav style={{ display: "grid", gap: 6 }}>
        <NavLink to="/perfil" style={linkStyle}>
          <span>👤</span>
          <span>Perfil</span>
        </NavLink>
        <NavLink to="/vitamina-a" style={linkStyle}>
          <span>🅰️</span>
          <span>Vitamina A</span>
        </NavLink>
        <NavLink to="/obitos" style={linkStyle}>
          <span>⚰️</span>
          <span>Óbitos</span>
        </NavLink>
        <NavLink to="/nascidos-vivos" style={linkStyle}>
          <span>👶</span>
          <span>Nascidos Vivos</span>
        </NavLink>
        <NavLink to="/agendamentos" style={linkStyle}>
          <span>📅</span>
          <span>Agendamentos</span>
        </NavLink>
        {isAdmin ? (
          <NavLink to="/gestao" style={linkStyle}>
            <span>🛠️</span>
            <span>Gestão</span>
          </NavLink>
        ) : null}
      </nav>
      <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <button
          onClick={() => {
            try {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            } catch {}
            navigate("/login", { replace: true });
          }}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", fontWeight: 700 }}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
