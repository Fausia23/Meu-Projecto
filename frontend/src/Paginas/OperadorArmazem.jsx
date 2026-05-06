import React, { useState, useEffect } from "react";
import Tabs from "../components/Tabs";
import Entregas from "../components/Entregas";
import Devolucoes from "../components/Devolucoes";
import ConsultarReservas from "../components/ConsultarReservas";
import ConsultarInventario from "../components/ConsultarInventario";
import ConsultarCatalogo from "../components/ConsultarCatalogo";
import { BASE_URL } from "../javascript/dados";
import "../components/estilos/OperadorArmazem.css";

// Funções para buscar dados da API
async function fetchTodasAsReservas() {
  const res = await fetch(`${BASE_URL}/reservas`);
  return res.json();
}

async function fetchInventario() {
  const res = await fetch(`${BASE_URL}/materiais`);
  const materiais = await res.json();
  // Simula a estrutura de inventário que o componente espera
  return materiais.map(m => ({
    id: m.id_material,
    nome: m.nome,
    disponivel: m.quantidade_disponivel,
    alugada: m.quantidade_alugada,
    reservada: m.quantidade_reservada,
    total: m.quantidade_total,
  }));
}

async function fetchAlugueres() {
  // Esta função precisaria ser implementada no seu backend
  // Por enquanto, podemos retornar um array vazio ou dados simulados
  return [];
}

export default function OperadorArmazem() {
  const [abaAtiva, setAbaAtiva] = useState("entregas");
  const [inventario, setInventario] = useState([]);
  const [alugueres, setAlugueres] = useState([]);

  // Função para recarregar os dados quando uma entrega ou devolução ocorre
  const recarregarDados = async () => {
    console.log("A recarregar dados do inventário e alugueres...");
    const invData = await fetchInventario();
    const alugueresData = await fetchAlugueres();
    setInventario(invData);
    setAlugueres(alugueresData);
  };

  // Carrega os dados iniciais quando o componente é montado
  useEffect(() => {
    recarregarDados();
  }, []);

  const renderizarConteudo = () => {
    switch (abaAtiva) {
      case "entregas":
        return <Entregas onEntregaRegistrada={recarregarDados} />;
      case "devolucoes":
        return <Devolucoes alugueres={alugueres} onDevolucaoRegistrada={recarregarDados} />;
      case "consultar-reservas":
        return <ConsultarReservas fetchReservas={fetchTodasAsReservas} />;
      case "consultar-inventario":
        return <ConsultarInventario inventarioInicial={inventario} />;
      case "catalogo":
        return <ConsultarCatalogo />;
      default:
        return <p>Selecione uma aba.</p>;
    }
  };

  return (
    <main className="armazem-container">
      <header className="armazem-header">
        <h1>Portal do Operador de Armazém</h1>
        <p>Gestão de entregas, devoluções e inventário de materiais.</p>
      </header>
      <Tabs active={abaAtiva} onChange={setAbaAtiva} />
      <div className="conteudo-principal">
        {renderizarConteudo()}
      </div>
    </main>
  );
}