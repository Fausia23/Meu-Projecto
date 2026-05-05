import React, { useState, useMemo, useEffect } from "react";
import { API_URL, authFetch } from "../javascript/dados";

export default function Devolucoes() {
  const [filtroCliente, setFiltroCliente] = useState("");
  const [entregas, setEntregas] = useState([]);

  useEffect(() => {
    const buscarEntregas = async () => {
      try {
        const res = await authFetch(`${API_URL}/entregas`);
        if (!res.ok) throw new Error("Falha ao buscar entregas");
        const data = await res.json();
        setEntregas(data.filter(e => e.status_entrega === 'entregue'));
      } catch (error) {
        console.error("Erro ao buscar entregas:", error);
        alert("Não foi possível carregar as devoluções pendentes.");
      }
    };
    buscarEntregas();
  }, []);

  const entregasFiltradas = useMemo(() => {
    if (!filtroCliente.trim()) return entregas;
    const filtroLower = filtroCliente.toLowerCase();
    return entregas.filter(e =>
      (e.responsavel_recebimento_cliente || "").toLowerCase().includes(filtroLower)
    );
  }, [entregas, filtroCliente]);

  const confirmarDevolucao = async (id_entrega) => {
    if (!window.confirm(`Tem a certeza que deseja registar a devolução da entrega #${id_entrega}?`)) return;

    try {
      const res = await authFetch(`${API_URL}/entregas/${id_entrega}/devolver`, {
        method: "PUT",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.erro || "Falha ao registar devolução no servidor.");
      }

      setEntregas(prev => prev.filter(e => e.id_entrega !== id_entrega));
      alert(`Devolução da entrega #${id_entrega} confirmada com sucesso!`);
    } catch (error) {
      console.error("Erro ao confirmar devolução:", error);
      alert(`Erro: ${error.message}`);
    }
  };

  return (
    <section id="devolucoes" className="tab-content" aria-labelledby="devolucoes-title">
      <h2 id="devolucoes-title">Registrar Devolução de Materiais</h2>
      <p>Visualize todos os materiais atualmente alugados e registre a devolução.</p>

      <div className="filtros-reservas" style={{ justifyContent: "flex-start", alignItems: "flex-end" }}>
        <div style={{ flex: 1, maxWidth: "450px" }}>
          <label>Filtrar por Cliente:</label>
          <input
            type="text"
            placeholder="Digite o nome do cliente para filtrar..."
            value={filtroCliente}
            onChange={e => setFiltroCliente(e.target.value)}
          />
        </div>
      </div>

      <table className="inv-table" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID Entrega</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Data da Entrega</th>
            <th>Previsão Devolução</th>
            <th>Funcionário (Entrega)</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {entregasFiltradas.length === 0 ? (
            <tr><td colSpan="7" style={{ textAlign: "center" }}>Nenhuma devolução pendente.</td></tr>
          ) : (
            entregasFiltradas.map(entrega => (
              <tr key={entrega.id_entrega}>
                <td>#{entrega.id_entrega}</td>
                <td>{entrega.responsavel_recebimento_cliente}</td>
                <td>{entrega.tipo_entrega}</td>
                <td>{new Date(entrega.data_efetiva_entrega).toLocaleDateString()}</td>
                <td>{entrega.data_prevista_devolucao ? new Date(entrega.data_prevista_devolucao).toLocaleDateString() : "N/A"}</td>
                <td>{entrega.nome_funcionario_entrega || "—"}</td>
                <td>
                  <button className="btn-acao" style={{ padding: "5px 10px" }} onClick={() => confirmarDevolucao(entrega.id_entrega)}>
                    Devolver
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
