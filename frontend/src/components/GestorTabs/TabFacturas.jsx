import React, { useMemo, useState } from "react";
import "../estilos/TabFacturas.css";

/**
 * TabFacturas
 * Caso de uso: Gerar Facturas
 * - Seleção de aluguer
 * - Cálculo automático por DIAS
 * - Ajuste manual antes da emissão
 * - Estado inicial: Pendente
 */
export default function TabFacturas() {
  // 🔹 Alugueres simulados (vêm do backend no futuro)
  const alugueresDisponiveis = [
    {
      id: "AL-001",
      cliente: "João Silva",
      duracaoDias: 5,
      valorDia: 1500,
    },
    {
      id: "AL-002",
      cliente: "Maria José",
      duracaoDias: 3,
      valorDia: 1800,
    },
  ];

  const [aluguerSelecionado, setAluguerSelecionado] = useState(null);
  const [ajusteManual, setAjusteManual] = useState(0);
  const [facturas, setFacturas] = useState([]);
  const [modoRevisao, setModoRevisao] = useState(false);

  // 🔹 Cálculo automático (SEM imposto)
  const totalCalculado = useMemo(() => {
    if (!aluguerSelecionado) return 0;
    const base =
      aluguerSelecionado.duracaoDias * aluguerSelecionado.valorDia;
    return base + Number(ajusteManual || 0);
  }, [aluguerSelecionado, ajusteManual]);

  function gerarFactura() {
    if (!aluguerSelecionado) return;

    const novaFactura = {
      numero: gerarNumeroFactura(),
      aluguerId: aluguerSelecionado.id,
      cliente: aluguerSelecionado.cliente,
      duracaoDias: aluguerSelecionado.duracaoDias,
      valorDia: aluguerSelecionado.valorDia,
      ajusteManual,
      total: totalCalculado,
      estado: "Pendente",
      data: new Date().toLocaleDateString(),
    };

    setFacturas((prev) => [novaFactura, ...prev]);
    setModoRevisao(false);
    setAluguerSelecionado(null);
    setAjusteManual(0);
  }

  return (
    <section className="tab-facturas">
      <h2>Gerar Facturas</h2>

      {/* Passo 1: Seleção do aluguer */}
      <div className="bloco">
        <label>Selecionar Aluguer / Cliente</label>
        <select
          value={aluguerSelecionado?.id || ""}
          onChange={(e) => {
            const al = alugueresDisponiveis.find(
              (a) => a.id === e.target.value
            );
            setAluguerSelecionado(al);
            setModoRevisao(true);
          }}
        >
          <option value="">-- selecione --</option>
          {alugueresDisponiveis.map((a) => (
            <option key={a.id} value={a.id}>
              {a.id} – {a.cliente}
            </option>
          ))}
        </select>
      </div>

      {/* Revisão da factura */}
      {modoRevisao && aluguerSelecionado && (
        <div className="bloco revisao">
          <h3>Revisão da Factura</h3>

          <p><strong>Cliente:</strong> {aluguerSelecionado.cliente}</p>
          <p><strong>Duração:</strong> {aluguerSelecionado.duracaoDias} dias</p>
          <p><strong>Valor por dia:</strong> {aluguerSelecionado.valorDia} MT</p>

          <label>Ajuste Manual (opcional)</label>
          <input
            type="number"
            value={ajusteManual}
            onChange={(e) => setAjusteManual(e.target.value)}
          />

          <p className="total">
            Total da Factura: <strong>{totalCalculado} MT</strong>
          </p>

          <button className="btn" onClick={gerarFactura}>
            Confirmar Geração
          </button>
        </div>
      )}

      {/* Lista de facturas */}
      <h3>Facturas Geradas</h3>
      <table className="facturas-table">
        <thead>
          <tr>
            <th>Nº Factura</th>
            <th>Cliente</th>
            <th>Aluguer</th>
            <th>Duração (dias)</th>
            <th>Total (MT)</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {facturas.length === 0 && (
            <tr>
              <td colSpan="6" className="empty">
                Nenhuma factura gerada
              </td>
            </tr>
          )}

          {facturas.map((f) => (
            <tr key={f.numero}>
              <td>{f.numero}</td>
              <td>{f.cliente}</td>
              <td>{f.aluguerId}</td>
              <td>{f.duracaoDias}</td>
              <td>{f.total} MT</td>
              <td>
                <span className="estado pendente">{f.estado}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function gerarNumeroFactura() {
  const ano = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${ano}-${seq}`;
}
