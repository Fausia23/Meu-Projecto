import React from "react";
import { usePagamentos } from "./usePagamentos"; // 🔹 Importa o hook
import "../estilos/TabPagamento.css";

export default function TabPagamentos() {
  // 🔹 Usa o hook para obter estados e funções
  const {
    numeroFactura, setNumeroFactura,
    factura,
    valorPago, setValorPago,
    metodoPagamento, setMetodoPagamento,
    dataPagamento, setDataPagamento,
    mensagem,
    pagamentos = [], // ✅ Garantir array vazio por padrão
    buscarFactura,
    registrarPagamento,
  } = usePagamentos();

  return (
    <section className="tab-pagamentos">
      <h2>Registrar Pagamentos</h2>

      <div className="bloco">
        <label>Número da Factura</label>
        <input
          type="text"
          value={numeroFactura || ""}
          onChange={e => setNumeroFactura(e.target.value)}
          placeholder="Ex: INV-2025-1001"
        />
        <button onClick={buscarFactura}>Buscar Factura</button>
      </div>

      {mensagem && <p className="mensagem">{mensagem}</p>}

      {factura && (
        <div className="bloco detalhes-factura">
          <p><strong>Cliente:</strong> {factura.cliente || "-"}</p>
          <p><strong>Total:</strong> {factura.total ?? "-"} MT</p>
          <p><strong>Saldo:</strong> {factura.saldo ?? "-"} MT</p>
          <p><strong>Estado:</strong> {factura.estado || "-"}</p>

          <label>Valor Pago</label>
          <input
            type="number"
            value={valorPago || ""}
            onChange={e => setValorPago(e.target.value)}
          />

          <label>Método de Pagamento</label>
          <select
            value={metodoPagamento || ""}
            onChange={e => setMetodoPagamento(e.target.value)}
          >
            <option value="">-- selecione --</option>
            <option value="M-Pesa">M-Pesa</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>

          <label>Data do Pagamento</label>
          <input
            type="date"
            value={dataPagamento || ""}
            onChange={e => setDataPagamento(e.target.value)}
          />

          <button className="btn" onClick={registrarPagamento}>
            Registrar Pagamento
          </button>
        </div>
      )}

      {pagamentos?.length > 0 && (
        <div className="bloco pagamentos-registrados">
          <h3>Pagamentos Registrados</h3>
          <table>
            <thead>
              <tr>
                <th>Factura</th>
                <th>Cliente</th>
                <th>Valor Pago</th>
                <th>Método</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((p, i) => (
                <tr key={i}>
                  <td>{p.numeroFactura || "-"}</td>
                  <td>{p.cliente || "-"}</td>
                  <td>{p.valorPago ?? "-"} MT</td>
                  <td>{p.metodoPagamento || "-"}</td>
                  <td>{p.dataPagamento || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
