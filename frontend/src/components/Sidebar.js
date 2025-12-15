import React from "react";
import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 8,
  color: isActive ? "#fff" : "#222",
  background: isActive ? "#2563eb" : "transparent",
  textDecoration: "none",
  fontWeight: 600
});

function Sidebar() {
  return (
    <aside style={{ width: 240, borderRight: "1px solid #e5e7eb", padding: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>ACS Gestão Geral</div>
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
      </nav>
    </aside>
  );
}

export default Sidebar;

