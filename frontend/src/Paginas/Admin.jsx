// src/Paginas/Admin.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import AdminHeader from "../components/AdminTabs/AdminHeader";
import AdminMenu   from "../components/AdminTabs/AdminMenu";
import TabUtilizadores from "../components/AdminTabs/TabUtilizadores";
import TabRelatorios   from "../components/GestorTabs/TabRelatorios";
import TabCatalogo     from "../components/GestorTabs/CatalogoTabs";
import TabClientes     from "../components/GestorTabs/TabClientes";
import TabReservas     from "../components/ConsultarReservas";
import Entregas        from "../components/Entregas";
import Devolucoes      from "../components/Devolucoes";

import { API_URL } from "../javascript/dados";
import "../components/estilos/Admin.css";

export default function Admin() {
  const [tab,       setTab]       = useState("utilizadores");
  const [alugueres, setAlugueres] = useState([]);
  const [inventario,setInventario]= useState([]);
  const [loading,   setLoading]   = useState(true);

  const navigate = useNavigate();

  // ── helper autenticado ─────────────────────────────────
  const fetchAuth = useCallback(async (url) => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login", { replace: true }); return null; }

    const res = await fetch(url, {
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      localStorage.clear();
      navigate("/login", { replace: true });
      return null;
    }
    return res;
  }, [navigate]);

  // ── carrega dados ──────────────────────────────────────
  const carregarDados = useCallback(async () => {
    try {
      const [resInv, resRes] = await Promise.all([
        fetchAuth(`${API_URL}/materiais/inventario`),
        fetchAuth(`${API_URL}/reservas`),
      ]);

      if (resInv) {
        const d = await resInv.json();
        setInventario(Array.isArray(d) ? d : []);
      }
      if (resRes) {
        const d = await resRes.json();
        setAlugueres(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
    }
  }, [fetchAuth]);

  // ── guard + carga inicial ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("userRole");

    if (!token || role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      setLoading(true);
      await carregarDados();
      setLoading(false);
    })();
  }, [navigate, carregarDados]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  if (loading) return <div className="admin-loading">A carregar painel...</div>;

  return (
    <div className="admin-container">
      <AdminHeader onLogout={handleLogout} />

      <div className="admin-body">
        <AdminMenu tab={tab} setTab={setTab} />

        <main className="admin-conteudo">

          <div hidden={tab !== "utilizadores"}>
            <TabUtilizadores />
          </div>

          <div hidden={tab !== "clientes"}>
            <TabClientes />
          </div>

          <div hidden={tab !== "catalogo"}>
            <TabCatalogo />
          </div>

          <div hidden={tab !== "entregas"}>
            <Entregas
              inventario={inventario}
              onEntregaRegistrada={carregarDados}
            />
          </div>

          <div hidden={tab !== "devolucoes"}>
            <Devolucoes
              alugueres={alugueres}
              onDevolucaoRegistrada={carregarDados}
            />
          </div>

          <div hidden={tab !== "reservas"}>
            <TabReservas />
          </div>

          <div hidden={tab !== "relatorios"}>
            <TabRelatorios />
          </div>

        </main>
      </div>
    </div>
  );
}