import React, { useState, useEffect } from "react";

export default function ConsultarReservas({ fetchReservas }) {
  const [status, setStatus] = useState("todos");
  const [cliente, setCliente] = useState("");
  const [reservas, setReservas] = useState([]);
  const [reservasOriginais, setReservasOriginais] = useState([]);

  useEffect(() => {
    async function load() {
      if (fetchReservas) {
        const data = await fetchReservas();
        setReservas(data || []);
        setReservasOriginais(data || []);
      }
    }
    load();
  }, [fetchReservas]);

  function aplicarFiltro() {
    const filtroCliente = cliente.trim().toLowerCase();

    const filtrado = reservasOriginais.filter((r) => {
      const byStatus = status === "todos" || r.status === status;
      const byCliente =
        !filtroCliente || (r.cliente || "").toLowerCase().includes(filtroCliente);
      return byStatus && byCliente;
    });

    setReservas(filtrado);
  }

  return (
    <section id="consultar-reservas" className="tab-content">
      <h2>Consultar Reservas</h2>
      <p>Visualize e filtre todas as reservas de materiais.</p>

      <div className="filtros-reservas">
        <div style={{ minWidth: 160 }}>
          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="devolvido">Devolvido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label>Cliente:</label>
          <input
            type="text"
            placeholder="Nome do cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
        </div>

        <button className="btn-acao" onClick={aplicarFiltro}>
          Filtrar
        </button>
      </div>

      <div className="tabela-wrapper" style={{ marginTop: 12 }}>
        <table className="tabela-reservas">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Data</th>
              <th>Materiais</th>
            </tr>
          </thead>

          <tbody>
            {reservas.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  - sem reservas -
                </td>
              </tr>
            ) : (
              reservas.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.cliente}</td>
                  <td className={`estado-${r.status}`}>{r.status}</td>
                  <td>{new Date(r.data).toLocaleDateString()}</td>
                  <td>{(r.itens || []).length}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
