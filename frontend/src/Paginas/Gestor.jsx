import React, { useState, useEffect } from "react";

import GestorHeader from "../components/GestorHeader";
import GestorMenu from "../components/GestorMenu";
import TabCatalogo from "../components/GestorTabs/CatalogoTabs";
import TabClientes from "../components/GestorTabs/TabClientes";
import TabFaturas from "../components/GestorTabs/TabFacturas";
import TabPagamentos from "../components/GestorTabs/TabPagamento";
import TabRelatorios from "../components/GestorTabs/TabRelatorios";

import Entregas from "../components/Entregas";
import Devolucoes from "../components/Devolucoes";

import {
  obterAlugueres,
  carregarInventarioAPI,
  obterInventario,
} from "../javascript/dados";

import "../components/estilos/Gestor.css";

export default function Gestor() {
  const [tab, setTab] = useState("catalogo");

  const [alugueres, setAlugueres] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [loadingInventario, setLoadingInventario] = useState(true);

  // Carrega dados iniciais: alugueres (local) + inventário (do backend)
  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        // 1. Alugueres ativos (do localStorage – usado para devoluções)
        const alugueresRaw = obterAlugueres();
        const alugueresData = Array.isArray(alugueresRaw) ? alugueresRaw : [];
        setAlugueres(alugueresData);

        // 2. Inventário real do backend
        setLoadingInventario(true);
        await carregarInventarioAPI(); // chama /api/materiais/inventario
        const inventarioData = obterInventario();
        setInventario(Array.isArray(inventarioData) ? inventarioData : []);
        setLoadingInventario(false);

      } catch (error) {
        console.error("Erro ao carregar dados do gestor:", error);
        setAlugueres([]);
        setInventario([]);
        setLoadingInventario(false);
      }
    }

    carregarDadosIniciais();
  }, []);

  // Função para recarregar apenas os alugueres (após entrega ou devolução)
  const atualizarAlugueres = () => {
    const novosAlugueres = obterAlugueres();
    setAlugueres(Array.isArray(novosAlugueres) ? novosAlugueres : []);
  };

  // Função para recarregar o inventário (útil após entrega/devolução)
  const atualizarInventario = async () => {
    setLoadingInventario(true);
    await carregarInventarioAPI();
    const dados = obterInventario();
    setInventario(Array.isArray(dados) ? dados : []);
    setLoadingInventario(false);
  };

  return (
    <div className="gestor-container">
      <GestorHeader />
      <div className="gestor-body">
        <GestorMenu tab={tab} setTab={setTab} />

        <main className="gestor-conteudo">
          <div className={`tab-pane ${tab === 'catalogo' ? 'active' : ''}`} hidden={tab !== 'catalogo'}>
            <TabCatalogo />
          </div>

          <div className={`tab-pane ${tab === 'clientes' ? 'active' : ''}`} hidden={tab !== 'clientes'}>
            <TabClientes />
          </div>

          <div className={`tab-pane ${tab === 'entregas' ? 'active' : ''}`} hidden={tab !== 'entregas'}>
            <Entregas
              onEntregaRegistrada={() => {
                atualizarAlugueres();
                atualizarInventario(); // atualiza disponível/alugada
              }}
            />
          </div>

          <div className={`tab-pane ${tab === 'devolucoes' ? 'active' : ''}`} hidden={tab !== 'devolucoes'}>
            <Devolucoes
              alugueres={alugueres}
              onDevolucaoRegistrada={() => {
                atualizarAlugueres();
                atualizarInventario(); // atualiza disponível
              }}
            />
          </div>

          <div className={`tab-pane ${tab === 'faturas' ? 'active' : ''}`} hidden={tab !== 'faturas'}>
            <TabFaturas />
          </div>

          <div className={`tab-pane ${tab === 'pagamentos' ? 'active' : ''}`} hidden={tab !== 'pagamentos'}>
            <TabPagamentos />
          </div>

          <div className={`tab-pane ${tab === 'relatorios' ? 'active' : ''}`} hidden={tab !== 'relatorios'}>
            <TabRelatorios />
          </div>
        </main>
      </div>
    </div>
  );
}