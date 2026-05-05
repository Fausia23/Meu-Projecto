// src/Paginas/OperadorArmazem.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import CatalogoMateriais   from "../components/ConsultarCatalogo";
import ConsultarInventario from "../components/ConsultarInventario";
import ConsultarReservas   from "../components/ConsultarReservas";
import Devolucoes          from "../components/Devolucoes";
import Entregas            from "../components/Entregas";
import Tabs                from "../components/Tabs";

import { API_URL } from "../javascript/dados";

export default function OperadorArmazem() {
  const [activeTab,  setActiveTab]  = useState("entregas");
  const [alugueres,  setAlugueres]  = useState([]);
  const [inventario, setInventario] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [erro,       setErro]       = useState("");

  const navigate = useNavigate();

  // ✅ Helper — fetch autenticado
  const fetchAutenticado = useCallback(async (url) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return null;
    }

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

  // ✅ Carrega inventário real da API — sem manipulações
  const carregarInventario = useCallback(async () => {
    try {
      const res = await fetchAutenticado(`${API_URL}/materiais/inventario`);
      if (!res) return;

      const data = await res.json();
      setInventario(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar inventário:", err);
      setErro("Erro ao carregar inventário.");
    }
  }, [fetchAutenticado]);

  // ✅ Carrega alugueres da API — não do localStorage
  const carregarAlugueres = useCallback(async () => {
    try {
      const res = await fetchAutenticado(`${API_URL}/reservas`);
      if (!res) return;

      const data = await res.json();
      setAlugueres(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar alugueres:", err);
      setErro("Erro ao carregar reservas.");
    }
  }, [fetchAutenticado]);

  // ✅ Verifica perfil e carrega dados ao entrar
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("userRole");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!["admin", "gestor", "funcionario"].includes(role)) {
      navigate("/login", { replace: true });
      return;
    }

    const carregar = async () => {
      setLoading(true);
      await Promise.all([carregarInventario(), carregarAlugueres()]);
      setLoading(false);
    };

    carregar();
  }, [navigate, carregarInventario, carregarAlugueres]);

  // ✅ Actualiza tudo após entrega ou devolução
  const actualizarTudo = useCallback(() => {
    carregarInventario();
    carregarAlugueres();
  }, [carregarInventario, carregarAlugueres]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  if (loading) return <p style={{ padding: "2rem" }}>A carregar dados...</p>;

  return (
    <div className="container react-container">
      <header className="armazem-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>Gestão de Armazém</h1>
            <p>Painel de controlo para operadores: gerencie entregas, devoluções e consulte informações.</p>
          </div>
          {/* ✅ Botão de logout */}
          <button onClick={handleLogout} className="btn-logout">
            Sair
          </button>
        </div>
      </header>

      {erro && <p style={{ color: "red", padding: "1rem" }}>{erro}</p>}

      <Tabs active={activeTab} onChange={setActiveTab} />

      <main className="tab-area">

        <div hidden={activeTab !== "entregas"}>
          <Entregas
            inventario={inventario}
            onEntregaRegistrada={actualizarTudo}
          />
        </div>

        <div hidden={activeTab !== "devolucoes"}>
          <Devolucoes
            alugueres={alugueres}
            onDevolucaoRegistrada={actualizarTudo}
          />
        </div>

        <div hidden={activeTab !== "consultar-inventario"}>
          <ConsultarInventario inventarioInicial={inventario} />
        </div>

        {/* <div hidden={activeTab !== "catalogo"}>
          <CatalogoMateriais />
        </div> */}

        <div hidden={activeTab !== "consultar-reservas"}>
          <ConsultarReservas />
        </div>

      </main>
    </div>
  );
}
