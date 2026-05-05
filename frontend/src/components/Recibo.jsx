import React from "react";

export default function Recibo({ entrega, onClose, onNovaEntrega, onGerarPDF, onImprimir }) {
  if (!entrega) return null;

  // Função auxiliar para zerar as horas e comparar apenas as datas
  function tratarData(dataString) {
      const data = new Date(dataString);
      data.setHours(0, 0, 0, 0); // Zera horas, minutos, segundos
      return data;
  }

  // Calcular dias do aluguel
  let diasCalculados = 1; // Padrão
  if (entrega.data_prevista_devolucao && entrega.data_entrega) {
    const dataInicio = tratarData(entrega.data_entrega);
    const dataFim = tratarData(entrega.data_prevista_devolucao);
    const diferencaMs = dataFim - dataInicio;
    // Usar Math.round para evitar problemas de arredondamento com horas/fusos.
    // Adicionar +1 para contar o dia de início. Se for o mesmo dia, diff é 0, então 0 + 1 = 1 dia.
    const diferencaDias = Math.round(diferencaMs / (1000 * 60 * 60 * 24));
    // Garante que o mínimo é sempre 1 dia.
    diasCalculados = Math.max(1, diferencaDias + 1);
  }

  const dias = diasCalculados;
  
  const totalGeral = entrega.itens.reduce((t, i) => t + Number(i.subtotal), 0);

  return (
    <div style={styles.overlay}>
      <div style={styles.recibo}>
        
        <h2 style={styles.title}>RECIBO DE ENTREGA</h2>
        <p style={styles.codigo}>{entrega.codigo_entrega}</p>

        <hr />

        <p><strong>Cliente:</strong> {entrega.responsavel_recebimento_cliente}</p>
        <p><strong>Funcionário Responsável:</strong> {entrega.nome_funcionario_entrega}</p>
        <p><strong>Método de Envio:</strong> {entrega.metodo_envio}</p>

        <p><strong>Data Entrega:</strong> {entrega.data_formatada}</p>
        <p><strong>Devolução Prevista:</strong> {entrega.devolucao_formatada}</p>
        <p><strong>Duração do Aluguer:</strong> {dias} dia(s)</p>

        <hr />

        <table style={styles.tabela}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Qtd</th>
              <th>Preço/Dia</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {entrega.itens.map((item, i) => (
              <tr key={i}>
                <td>{item.nome_material}</td>
                <td style={{ textAlign: "center" }}>{item.quantidade}</td>
                <td style={{ textAlign: "right" }}>{Number(item.preco_diaria).toFixed(2)} MZN</td>
                <td style={{ textAlign: "right" }}>{Number(item.subtotal).toFixed(2)} MZN</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />
        <p style={styles.total}><strong>Total Geral: {totalGeral.toFixed(2)} MZN</strong></p>

        <div style={styles.buttons}>
          <button onClick={onImprimir}>🖨 Imprimir</button>
          <button onClick={() => onGerarPDF(entrega.id_entrega)}>📄 PDF</button>
          <button onClick={onNovaEntrega}>➕ Nova Entrega</button>
          <button onClick={onClose} style={{ background: "#d9534f" }}>✖ Fechar</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay:{
    position:"fixed", top:0, left:0, width:"100%", height:"100%",
    background:"rgba(0,0,0,0.4)", display:"flex", justifyContent:"center",
    alignItems:"center", padding:"10px", zIndex:9999
  },
  recibo:{
    background:"#fff", width:"350px", padding:"20px", borderRadius:"10px",
    fontFamily:"Arial", fontSize:"14px", boxShadow:"0 0 10px rgba(0,0,0,0.3)"
  },
  title:{ textAlign:"center", margin:0 },
  codigo:{ textAlign:"center", fontWeight:"bold", marginBottom:"10px" },
  tabela:{
    width:"100%", marginTop:"10px", borderCollapse:"collapse"
  },
  total:{ fontSize:"16px", textAlign:"right", marginTop:"10px" },
  buttons:{
    display:"flex", flexWrap:"wrap", gap:"8px", marginTop:"15px", justifyContent:"center"
  }
};
