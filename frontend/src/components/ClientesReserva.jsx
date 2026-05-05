// src/components/ClienteReservas.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../javascript/dados";
import "./estilos/ClientesReserva.css";

/*
 * Indicador de estado da reserva.
 */
const EstadoBadge = ({ estado }) => {
  const estadoNormalizado = String(estado || "")
    .toLowerCase()
    .replace("í", "i");
  return (
    <span className={`estado-badge estado-${estadoNormalizado}`}>
      {estado}
    </span>
  );
};

/**
 * Formata data ISO -> DD/MM/AAAA.
 */
const fmtData = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-PT");
};

/**
 * Lista as reservas do cliente autenticado.
 *
 * Reage a `location.state.reservaCriada`: ao chegar com esse state,
 * refresca a lista, mostra um banner verde e destaca o card da nova reserva.
 */
export default function Reservas({ setAbaAtual }) {
  const location = useLocation();
  const reservaCriadaId = location.state?.reservaCriada || null;

  const [reservas, setReservas]           = useState([]);
  const [filtro, setFiltro]               = useState("Todas");
  const [carregando, setCarregando]       = useState(true);
  const [erro, setErro]                   = useState("");
  const [bannerSucesso, setBannerSucesso] = useState(reservaCriadaId);

  // ── Buscar reservas do backend ──────────────────────────────────────────
  const buscarReservas = useCallback(async () => {
  setErro("");
  setCarregando(true);

  const token = localStorage.getItem("token");
  if (!token) {
    setErro("Sessão não encontrada. Por favor faça login.");
    setCarregando(false);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/reservas/minhas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Falha ao buscar reservas");

    const data = await response.json();
    const lista = (Array.isArray(data) ? data : []).sort((a, b) => {
      const idA = a.id_reserva || a.id || 0;
      const idB = b.id_reserva || b.id || 0;
      return idB - idA;
    });
    setReservas(lista);
  } catch (error) {
    console.error("Erro ao buscar reservas:", error);
    setErro("Não foi possível carregar as suas reservas.");
  } finally {
    setCarregando(false);
  }
}, []);
  // ── Carrega ao montar ───────────────────────────────────────────────────
  useEffect(() => {
    buscarReservas();
  }, [buscarReservas]);

  // ── Refresca + banner quando vem do fluxo de criação ────────────────────
  useEffect(() => {
    if (reservaCriadaId) {
      buscarReservas();
      const t = setTimeout(() => setBannerSucesso(null), 8000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(t);
    }
  }, [reservaCriadaId, buscarReservas]);

  const reservasFiltradas =
    filtro === "Todas"
      ? reservas
      : reservas.filter((r) => r.estado === filtro);

  // Calcula total se o backend não enviar
  const calcularTotal = (reserva) => {
    if (reserva.valor_total != null) return Number(reserva.valor_total);
    const dias = (() => {
      const d1 = new Date(reserva.data_inicio);
      const d2 = new Date(reserva.data_fim);
      const n = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      return n > 0 ? n : 1;
    })();
    const subtotal = (reserva.itens || []).reduce(
      (acc, it) =>
        acc +
        (Number(it.preco_diaria) || 0) *
          (Number(it.quantidade) || 0) *
          dias,
      0
    );
    return subtotal + (Number(reserva.custo_transporte) || 0);
  };

  return (
    <section className="tab-content">
      <div className="reserva-header">
        <h2>Minhas Reservas</h2>
        <button
          type="button"
          className="btn-acao"
          onClick={buscarReservas}
          disabled={carregando}
          title="Recarregar lista"
        >
          <i className={`fas fa-sync ${carregando ? "fa-spin" : ""}`} />{" "}
          Atualizar
        </button>
      </div>

      {/* Banner verde após reserva criada */}
      {bannerSucesso && (
        <div
          style={{
            background: "#d1fae5",
            color: "#065f46",
            padding: "0.85rem 1rem",
            borderRadius: 8,
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid #6ee7b7",
          }}
        >
          <i className="fas fa-check-circle" />
          <span>
            ✅ Reserva <strong>#{bannerSucesso}</strong> criada com sucesso!
          </span>
        </div>
      )}

      <div className="filtros-reserva">
        {["Todas", "Pendente", "Confirmada", "Concluída"].map((f) => (
          <button
            key={f}
            type="button"
            className={`filtro-btn ${filtro === f ? "ativo" : ""}`}
            onClick={() => setFiltro(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="reserva-lista">
        {carregando ? (
          <p className="vazio">A carregar reservas…</p>
        ) : erro ? (
          <p className="vazio" style={{ color: "#b91c1c" }}>
            {erro}
          </p>
        ) : reservasFiltradas.length === 0 ? (
          <p className="vazio">Nenhuma reserva encontrada.</p>
        ) : (
          reservasFiltradas.map((reserva) => {
            const idChave = reserva.id_reserva || reserva.id;
            const ehNova =
              reservaCriadaId && Number(idChave) === Number(reservaCriadaId);
            const total = calcularTotal(reserva);

            return (
              <div
                className="reserva-item"
                key={idChave}
                style={
                  ehNova
                    ? {
                        border: "2px solid #10b981",
                        boxShadow: "0 0 0 4px rgba(16,185,129,0.15)",
                        background: "#ecfdf5",
                      }
                    : undefined
                }
              >
                <div className="reserva-detalhes">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 4,
                    }}
                  >
                    <strong>
                      Reserva #{reserva.codigo_reserva || idChave}
                    </strong>
                    {ehNova && (
                      <span
                        style={{
                          background: "#10b981",
                          color: "white",
                          fontSize: "0.75rem",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontWeight: 600,
                        }}
                      >
                        NOVA
                      </span>
                    )}
                  </div>

                  <p style={{ margin: "4px 0", color: "#475569" }}>
                    <i className="fas fa-calendar-alt" />{" "}
                    {fmtData(reserva.data_inicio)} a{" "}
                    {fmtData(reserva.data_fim)}
                  </p>

                  {reserva.tipo_transporte && (
                    <p style={{ margin: "4px 0", color: "#475569" }}>
                      <i className="fas fa-truck" />{" "}
                      {reserva.tipo_transporte === "empresa"
                        ? "Transporte da empresa"
                        : "Levantamento pessoal"}
                    </p>
                  )}

                  <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                    {reserva.itens?.map((item) => (
                      <li key={item.id_material}>
                        {item.nome_material || item.nome} (Qtd:{" "}
                        {item.quantidade})
                      </li>
                    ))}
                  </ul>

                  {total > 0 && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      Total: {total.toFixed(2)} MT
                    </p>
                  )}
                </div>

                <EstadoBadge estado={reserva.estado} />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}