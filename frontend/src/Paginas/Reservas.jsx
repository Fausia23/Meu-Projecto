// src/Paginas/Reservas.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../javascript/dados";
import "../components/estilos/Reservas.css";
import ModalAuth from "../components/ModalAuth";
import ModalDadosCliente from "../components/ModalDadosCliente";

// ─── Utilitário de dias ───────────────────────────────────────────────────────
const calcularDias = (inicio, fim) => {
  if (!inicio || !fim) return 0;
  const d1 = new Date(inicio);
  const d2 = new Date(fim);
  const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

// ─── Card de item da reserva ──────────────────────────────────────────────────
function ItemReserva({ item, dataInicio, dataFim, onUpdate, onRemove }) {
  const dias = calcularDias(dataInicio, dataFim);
  const subtotal = item.quantidade * item.preco_diaria * (dias || 1);

  return (
    <div className="reserva-item-card">
      <img
        src={item.imagem_url || "https://placehold.co/72x72?text=📦"}
        alt={item.nome}
        className="reserva-item-img"
      />
      <div className="reserva-item-info">
        <h4 className="reserva-item-nome">{item.nome}</h4>
        <p className="reserva-item-preco">{item.preco_diaria.toFixed(2)} MT/dia</p>
        <p className="reserva-item-sub">
          Subtotal: <strong>{subtotal.toFixed(2)} MT</strong>
          {dias > 0 && (
            <span className="reserva-item-dias">
              {" "}
              · {dias} dia{dias !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>
      <div className="reserva-item-qtd">
        <button
          className="reserva-qtd-btn"
          onClick={() => onUpdate(item.id_material, item.quantidade - 1)}
          disabled={item.quantidade <= 1}
        >
          −
        </button>
        <span>{item.quantidade}</span>
        <button
          className="reserva-qtd-btn"
          onClick={() => onUpdate(item.id_material, item.quantidade + 1)}
          disabled={item.quantidade >= (item.quantidade_disponivel || 100)}
        >
          +
        </button>
      </div>
      <button
        className="reserva-item-remover"
        onClick={() => onRemove(item.id_material)}
        title="Remover"
      >
        <i className="fas fa-times" />
      </button>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function Reservas() {
  const location = useLocation();
  const navigate = useNavigate();

  const [itens, setItens] = useState([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [transporte, setTransporte] = useState("pessoal");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  // Modais
  const [mostrarModalAuth, setMostrarModalAuth] = useState(false);
  const [mostrarModalDados, setMostrarModalDados] = useState(false);

  const CUSTO_TRANSPORTE = 500;
  const hoje = new Date().toISOString().split("T")[0];

  // ── Inicializa carrinho ─────────────────────────────────────────────────────
  useEffect(() => {
    const carrinho = location.state?.carrinho;
    if (!carrinho || carrinho.length === 0) {
      setErro("Nenhum item no carrinho. A redirecionar...");
      setTimeout(() => navigate("/materiais"), 2500);
      return;
    }
    setItens(carrinho);
  }, [location.state, navigate]);

  const atualizarItem = (id_material, novaQtd) => {
    if (novaQtd < 1) return;
    setItens((prev) =>
      prev.map((i) =>
        i.id_material === id_material
          ? { ...i, quantidade: Math.min(novaQtd, i.quantidade_disponivel || 100) }
          : i
      )
    );
  };

  const removerItem = (id_material) =>
    setItens((prev) => prev.filter((i) => i.id_material !== id_material));

  const dias = calcularDias(dataInicio, dataFim);

  const total = useMemo(() => {
    const subtotal = itens.reduce(
      (acc, item) => acc + item.quantidade * item.preco_diaria * (dias || 1),
      0
    );
    return transporte === "empresa" ? subtotal + CUSTO_TRANSPORTE : subtotal;
  }, [itens, dias, transporte]);

  // ── Verifica perfil completo (telefone + endereço) ─────────────────────────
  const verificarPerfilCompleto = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;
      const res = await fetch(`${API_URL}/clientes/meu-perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      const data = await res.json();
      const morada = data.endereco || data.morada || "";
      const telefone = data.telefone || "";
      return telefone.trim() !== "" && morada.trim() !== "";
    } catch {
      return false;
    }
  };

  // ── Validar inputs e iniciar fluxo ─────────────────────────────────────────
  const handleConfirmar = async () => {
    setErro("");
    if (!dataInicio) return setErro("Selecione a data de levantamento.");
    if (!dataFim) return setErro("Selecione a data de devolução.");
    if (new Date(dataFim) <= new Date(dataInicio))
      return setErro("A data de devolução deve ser posterior à de levantamento.");
    if (itens.length === 0)
      return setErro("Adicione pelo menos um item ao carrinho.");

    const token = localStorage.getItem("token");

    // 1. Não autenticado → abre modal de login/registo
    if (!token) {
      setMostrarModalAuth(true);
      return;
    }

    // 2. Autenticado → verifica se perfil tem telefone + endereço
    const perfilCompleto = await verificarPerfilCompleto();
    if (!perfilCompleto) {
      setMostrarModalDados(true);
      return;
    }

    // 3. Tudo OK → grava reserva
    criarReserva();
  };

  // ── Após login/registo ─────────────────────────────────────────────────────
  const handleAuthSuccess = async ({ precisaCompletarDados } = {}) => {
    setMostrarModalAuth(false);

    // Se o ModalAuth já confirmou que faltam dados, abre logo o modal
    if (precisaCompletarDados) {
      setMostrarModalDados(true);
      return;
    }

    // Caso contrário, faz uma verificação adicional (defensiva)
    const completo = await verificarPerfilCompleto();
    if (!completo) {
      setMostrarModalDados(true);
    } else {
      criarReserva();
    }
  };

  // ── Após preencher dados de contacto ───────────────────────────────────────
  const handleDadosConcluidos = () => {
    setMostrarModalDados(false);
    criarReserva();
  };

  // ── Envia reserva para a API ───────────────────────────────────────────────
  const criarReserva = async () => {
    setErro("");
    setLoading(true);
    const token = localStorage.getItem("token");
    // aceita ambas as chaves, por compatibilidade
    const id_cliente =
      localStorage.getItem("clienteId") ||
      localStorage.getItem("idCliente") ||
      localStorage.getItem("userId");

    if (!token || !id_cliente) {
      setErro("Sessão inválida. Por favor faça login novamente.");
      setLoading(false);
      setMostrarModalAuth(true);
      return;
    }

    const payload = {
      id_cliente: Number(id_cliente),
      data_inicio: dataInicio,
      data_fim: dataFim,
      tipo_transporte: transporte,
      custo_transporte: transporte === "empresa" ? CUSTO_TRANSPORTE : 0,
      itens: itens.map((i) => ({
        id_material: Number(i.id_material),
        quantidade: Number(i.quantidade),
      })),
    };

    try {
      const res = await fetch(`${API_URL}/reservas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 401) {
        localStorage.clear();
        setMostrarModalAuth(true);
        return;
      }
      if (!res.ok)
        throw new Error(data.error || data.erro || "Falha ao criar reserva.");

      setSucesso(`✅ Reserva #${data.id_reserva} confirmada com sucesso!`);
      setItens([]);
      setTimeout(
        () =>
          navigate("/cliente", { state: { reservaCriada: data.id_reserva } }),
        2500
      );
    } catch (err) {
      setErro(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="reserva-pagina">
      {/* Cabeçalho */}
      <div className="reserva-header">
        <button
          className="reserva-voltar"
          onClick={() => navigate("/materiais")}
        >
          <i className="fas fa-arrow-left" /> Voltar aos Materiais
        </button>
        <h1 className="reserva-titulo">Finalizar Reserva</h1>
        <p className="reserva-subtitulo">
          Reveja os itens e defina o período de aluguer
        </p>
      </div>

      <div className="reserva-layout">
        {/* Coluna esquerda: itens */}
        <div className="reserva-col-itens">
          <div className="reserva-secao">
            <h2 className="reserva-secao-titulo">
              <i className="fas fa-boxes" /> Itens Selecionados
            </h2>

            {sucesso && <div className="reserva-sucesso">{sucesso}</div>}
            {erro && <div className="reserva-erro">{erro}</div>}

            {itens.length === 0 && !erro && !sucesso && (
              <p className="reserva-vazio">Nenhum item na reserva.</p>
            )}

            <div className="reserva-itens-lista">
              {itens.map((item) => (
                <ItemReserva
                  key={item.id_material}
                  item={item}
                  dataInicio={dataInicio}
                  dataFim={dataFim}
                  onUpdate={atualizarItem}
                  onRemove={removerItem}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Coluna direita: datas + resumo */}
        <div className="reserva-col-resumo">
          {/* Datas */}
          <div className="reserva-secao">
            <h2 className="reserva-secao-titulo">
              <i className="fas fa-calendar-alt" /> Período de Aluguer
            </h2>
            <div className="reserva-datas-grid">
              <div className="reserva-campo">
                <label>📦 Data de Levantamento</label>
                <input
                  type="date"
                  min={hoje}
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value);
                    if (
                      dataFim &&
                      new Date(dataFim) <= new Date(e.target.value)
                    )
                      setDataFim("");
                  }}
                />
              </div>
              <div className="reserva-campo">
                <label>🔄 Data de Devolução</label>
                <input
                  type="date"
                  min={dataInicio || hoje}
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  disabled={!dataInicio}
                />
              </div>
            </div>
            {dias > 0 && (
              <p className="reserva-dias-badge">
                <i className="fas fa-clock" /> {dias} dia{dias !== 1 ? "s" : ""} de
                aluguer
              </p>
            )}
          </div>

          {/* Transporte */}
          <div className="reserva-secao">
            <h2 className="reserva-secao-titulo">
              <i className="fas fa-truck" /> Transporte
            </h2>
            <div className="reserva-transporte-grid">
              {[
                {
                  value: "pessoal",
                  icon: "🚶",
                  label: "Levantamento Pessoal",
                  sub: "Sem custo adicional",
                },
                {
                  value: "empresa",
                  icon: "🚛",
                  label: "Transporte da Empresa",
                  sub: `+${CUSTO_TRANSPORTE.toFixed(2)} MT`,
                },
              ].map((op) => (
                <label
                  key={op.value}
                  className={`reserva-transporte-card ${
                    transporte === op.value ? "selecionado" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="transporte"
                    value={op.value}
                    checked={transporte === op.value}
                    onChange={() => setTransporte(op.value)}
                  />
                  <span className="reserva-transporte-icon">{op.icon}</span>
                  <div>
                    <strong>{op.label}</strong>
                    <small>{op.sub}</small>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Resumo financeiro */}
          <div className="reserva-secao reserva-resumo-financeiro">
            <h2 className="reserva-secao-titulo">
              <i className="fas fa-receipt" /> Resumo
            </h2>
            <div className="reserva-resumo-linhas">
              {itens.map((item) => (
                <div key={item.id_material} className="reserva-resumo-linha">
                  <span>
                    {item.nome} × {item.quantidade}
                  </span>
                  <span>
                    {(item.preco_diaria * item.quantidade * (dias || 1)).toFixed(
                      2
                    )}{" "}
                    MT
                  </span>
                </div>
              ))}
              {transporte === "empresa" && (
                <div className="reserva-resumo-linha">
                  <span>Transporte</span>
                  <span>+{CUSTO_TRANSPORTE.toFixed(2)} MT</span>
                </div>
              )}
            </div>
            <div className="reserva-resumo-total">
              <span>
                Total Estimado{" "}
                {dias > 0 ? `(${dias} dia${dias !== 1 ? "s" : ""})` : ""}
              </span>
              <strong>{total.toFixed(2)} MT</strong>
            </div>

            <button
              className="reserva-btn-confirmar"
              onClick={handleConfirmar}
              disabled={loading || itens.length === 0 || !!sucesso}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> A processar...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle" /> Confirmar Reserva
                </>
              )}
            </button>

            {!localStorage.getItem("token") && (
              <p className="reserva-auth-hint">
                <i className="fas fa-lock" /> Será pedido o login ao confirmar
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal de Autenticação ── */}
      <ModalAuth
        mostrar={mostrarModalAuth}
        onAuthSuccess={handleAuthSuccess}
        onFechar={() => setMostrarModalAuth(false)}
      />

      {/* ── Modal de Dados do Cliente ── */}
      <ModalDadosCliente
        mostrar={mostrarModalDados}
        onFechar={() => setMostrarModalDados(false)}
        onConcluido={handleDadosConcluidos}
      />
    </div>
  );
}