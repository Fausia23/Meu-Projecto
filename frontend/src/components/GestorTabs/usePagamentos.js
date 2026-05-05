import { useState } from "react";

export function usePagamentos() {
  const [numeroFactura, setNumeroFactura] = useState("");
  const [factura, setFactura] = useState(null);
  const [valorPago, setValorPago] = useState(0);
  const [metodoPagamento, setMetodoPagamento] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function buscarFactura() {
    if (!numeroFactura.trim()) {
      setMensagem("Por favor, insira o número da fatura.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/faturas/numero/${numeroFactura}`);
      if (!response.ok) {
        if (response.status === 404) {
          setMensagem("Fatura não encontrada.");
        } else {
          setMensagem("Erro ao buscar a fatura.");
        }
        setFactura(null);
        return;
      }
      const data = await response.json();
      const pagamentosResponse = await fetch(`http://localhost:3001/api/pagamentos/fatura/${data.id_fatura}`);
      const pagamentosAnteriores = await pagamentosResponse.json();
      const totalPago = pagamentosAnteriores.reduce((acc, p) => acc + parseFloat(p.valor_pago), 0);
      const saldo = data.valor_total - totalPago;
      const faturaComSaldo = { ...data, saldo };
      setMensagem("");
      setFactura(faturaComSaldo);
      setValorPago(saldo);
    } catch (error) {
      setMensagem("Erro de conexão com o servidor.");
      setFactura(null);
    }
  }

  async function registrarPagamento() {
    if (!factura) return;
    const pago = Number(valorPago);
    if (pago <= 0 || pago > factura.saldo) {
      setMensagem(`Valor de pagamento inválido. Deve ser entre 0.01 e ${factura.saldo}.`);
      return;
    }
    try {
      await fetch("http://localhost:3001/api/pagamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_fatura: factura.id_fatura,
          valor_pago: pago,
          metodo_pagamento: metodoPagamento,
        }),
      });
      const novoSaldo = factura.saldo - pago;
      if (novoSaldo <= 0) {
        await fetch(`http://localhost:3001/api/faturas/${factura.id_fatura}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status_fatura: "Paga" }),
        });
      }
      setMensagem(novoSaldo <= 0 ? "Pagamento total registrado com sucesso!" : `Pagamento parcial de ${pago} MT registrado. Saldo restante: ${novoSaldo.toFixed(2)} MT`);
      buscarFactura();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      setMensagem("Erro de servidor ao registrar o pagamento.");
    }
  }

  return {
    numeroFactura, setNumeroFactura,
    factura,
    valorPago, setValorPago,
    metodoPagamento, setMetodoPagamento,
    dataPagamento, setDataPagamento,
    mensagem, 
    buscarFactura,
    registrarPagamento,
  };
}