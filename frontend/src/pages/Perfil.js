import React from "react";

function Perfil() {
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  return (
    <div>
      <h1>Perfil</h1>
      <div>ID Profissional: {user?.professional_id || "-"}</div>
      <div>Role: {user?.role || "-"}</div>
      <div>Microárea ID: {user?.microarea_id ?? "-"}</div>
    </div>
  );
}

export default Perfil;

