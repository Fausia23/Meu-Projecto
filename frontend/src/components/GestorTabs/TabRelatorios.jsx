import React, { useState } from "react";
import "../estilos/TabRelatorios.css";

export default function TabRelatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [relatorio, setRelatorio] = useState(null);
  const [mensagem, setMensagem] = useState("");

  function gerarRelatorio() {
    setMensagem("");
    setRelatorio(null);

    // 🔹 Simulação de dados
    const dadosSimulados = {
      inventario: [
        { item: "Betoneira", total: 10, disponivel: 4 },
        { item: "Andaime", total: 20, disponivel: 5 },
      ],
      financeiro: [
        { periodo: "Jan/2025", total: 120000 },
        { periodo: "Fev/2025", total: 95000 },
      ],
      clientes: [
        { cliente: "João Silva", alugueres: 5, total: 35000 },
        { cliente: "Maria José", alugueres: 3, total: 21000 },
      ],
    };

    const resultado = dadosSimulados[tipoRelatorio];

    if (!resultado || resultado.length === 0) {
      setMensagem("Não há dados para o período ou filtros seleccionados.");
      return;
    }

    setRelatorio(resultado);
  }

  function exportarPDF() {
    alert("Exportação para PDF (caso de uso separado)");
  }

  return (
    <section className="tab-relatorios">
      <h2>Gerar Relatórios</h2>

      {/* 🔹 Parâmetros */}
      <div className="filtros">
        <select value={tipoRelatorio} onChange={e => setTipoRelatorio(e.target.value)}>
          <option value="">-- Tipo de Relatório --</option>
          <option value="inventario">Inventário</option>
          <option value="financeiro">Financeiro</option>
          <option value="clientes">Desempenho de Clientes</option>
        </select>

        <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />

        <button onClick={gerarRelatorio}>Gerar Relatório</button>
      </div>

      {/* 🔹 Fluxo alternativo A1 */}
      {mensagem && <p className="mensagem">{mensagem}</p>}

      {/* 🔹 Exibição do relatório */}
      {relatorio && (
        <div className="resultado">
          <table>
            <thead>
              <tr>
                {Object.keys(relatorio[0]).map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relatorio.map((linha, i) => (
                <tr key={i}>
                  {Object.values(linha).map((val, j) => (
                    <td key={j}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button className="exportar" onClick={exportarPDF}>
            Exportar para PDF
          </button>
        </div>
      )}
    </section>
  );
}
