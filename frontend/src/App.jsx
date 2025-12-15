import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Perfil from "./pages/Perfil.jsx";
import VitaminaA from "./pages/VitaminaA.jsx";
import Obitos from "./pages/Obitos.jsx";
import NascidosVivos from "./pages/NascidosVivos.jsx";
import Agendamentos from "./pages/Agendamentos.jsx";
import Login from "./pages/Login.jsx";
import Gestao from "./pages/Gestao.jsx";

function Protected({ children }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-light)", color: "var(--text-dark)" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 16 }}>{children}</div>
    </div>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) return null;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protected>
              <Layout>
                <Perfil />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/perfil"
          element={
            <Protected>
              <Layout>
                <Perfil />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/vitamina-a"
          element={
            <Protected>
              <Layout>
                <VitaminaA />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/obitos"
          element={
            <Protected>
              <Layout>
                <Obitos />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/nascidos-vivos"
          element={
            <Protected>
              <Layout>
                <NascidosVivos />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/agendamentos"
          element={
            <Protected>
              <Layout>
                <Agendamentos />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/gestao"
          element={
            <Protected>
              <Layout>
                <Gestao />
              </Layout>
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
