import React, { useState, useEffect } from "react";
import { API_URL, authFetch } from "../javascript/dados";
import Recibo from "./Recibo";

export default function Entregas({ onEntregaRegistrada, abaInicial = 'reservas' }) {
  const [reservas,             setReservas]             = useState([]);
  const [clientes,             setClientes]             = useState([]);
  const [materiais,            setMateriais]            = useState([]);
  const [selected,             setSelected]             = useState(null);
  const [dataEntrega]                                   = useState(new Date().toISOString().split("T")[0]);
  const [responsavelEntrega,   setResponsavelEntrega]   = useState("");
  const [previsaoDevolucao,    setPrevisaoDevolucao]    = useState("");
  const [metodoEnvio,          setMetodoEnvio]          = useState("transporte_empresa");
  const [erros,                setErros]                = useState({});
  const [loading,              setLoading]              = useState(false);
  const [modoDireto,           setModoDireto]           = useState(abaInicial !== 'reservas');
  const [clienteDireto,        setClienteDireto]        = useState("");
  const [itensDiretos,         setItensDiretos]         = useState([]);
  const [materialSelecionado,  setMaterialSelecionado]  = useState("");
  const [quantidadeMaterial,   setQuantidadeMaterial]   = useState(1);
  const [quantidadesEntregues, setQuantidadesEntregues] = useState({});
  const [entregaFinalizada,    setEntregaFinalizada]    = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // materiais é público; clientes e reservas precisam de token
        const [resMat, resCli, resRes] = await Promise.all([
          fetch(`${API_URL}/materiais`),
          authFetch(`${API_URL}/clientes`),
          authFetch(`${API_URL}/reservas`),   // GET / — lista todas
        ]);

        if (!resMat.ok || !resCli.ok || !resRes.ok) {
          console.warn("Alguma rota respondeu com erro:",
            resMat.status, resCli.status, resRes.status);
        }

        const matJson = resMat.ok ? await resMat.json() : [];
        const cliJson = resCli.ok ? await resCli.json() : [];
        const resJson = resRes.ok ? await resRes.json() : [];

        setMateriais(matJson);
        setClientes(cliJson);
        // Filtra localmente as reservas pendentes
        setReservas(resJson.filter(r =>
          r.status_reserva?.toLowerCase() === "pendente"
        ));
      } catch (e) {
        console.error("Erro ao carregar dados iniciais:", e);
      }
    };

    carregarDados();
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("userName");
    if (user) setResponsavelEntrega(user);
  }, []);

  useEffect(() => {
    if (selected) {
      const init = {};
      (selected.itens || []).forEach(i => (init[i.id_material] = i.quantidade));
      setQuantidadesEntregues(init);
      setPrevisaoDevolucao(
        selected.data_devolucao_prevista
          ? new Date(selected.data_devolucao_prevista).toISOString().split("T")[0]
          : ""
      );
    } else {
      setQuantidadesEntregues({});
      setPrevisaoDevolucao("");
    }
  }, [selected]);

  const handleAdicionarItem = () => {
    setErros({});
    if (!materialSelecionado || quantidadeMaterial < 1)
      return setErros({ item: "Selecione um material e uma quantidade válida." });

    const mat = materiais.find(m => Number(m.id_material) === Number(materialSelecionado));
    if (!mat) return setErros({ item: "Material não encontrado." });

    const jaAdicionado = itensDiretos.reduce((acc, it) =>
      acc + (Number(it.id_material) === Number(mat.id_material) ? Number(it.quantidade) : 0), 0);

    const disponivel = Number(mat.quantidade_disponivel) || 0;
    if (Number(quantidadeMaterial) + jaAdicionado > disponivel)
      return setErros({ item: `Stock insuficiente. Disponível: ${disponivel - jaAdicionado}` });

    setItensDiretos(prev => {
      const idx = prev.findIndex(p => Number(p.id_material) === Number(mat.id_material));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantidade: Number(copy[idx].quantidade) + Number(quantidadeMaterial) };
        return copy;
      }
      return [...prev, { id_material: mat.id_material, nome: mat.nome, quantidade: Number(quantidadeMaterial) }];
    });

    setMaterialSelecionado("");
    setQuantidadeMaterial(1);
  };

  const atualizarStockLocal = (itensEntregues) => {
    setMateriais(prev => {
      const copia = [...prev];
      itensEntregues.forEach(ie => {
        const idx = copia.findIndex(m => Number(m.id_material) === Number(ie.id_material));
        if (idx > -1) copia[idx] = {
          ...copia[idx],
          quantidade_disponivel: copia[idx].quantidade_disponivel - Number(ie.quantidade)
        };
      });
      return copia;
    });
  };

  const confirmarEntrega = async () => {
    setErros({});
    if (!selected) return;
    if (!previsaoDevolucao) return setErros({ previsao: "Data de devolução obrigatória." });

    setLoading(true);
    try {
      const entregaRes = await authFetch(`${API_URL}/entregas`, {
        method: "POST",
        body: JSON.stringify({
          id_reserva:                      selected.id_reserva,
          nome_funcionario_entrega:        responsavelEntrega,
          responsavel_recebimento_cliente: selected.cliente,
          metodo_envio:                    metodoEnvio,
          data_prevista_devolucao:         previsaoDevolucao,
        }),
      });

      if (!entregaRes.ok) {
        const err = await entregaRes.json().catch(() => ({}));
        throw new Error(err.erro || "Falha ao registar entrega");
      }
      const { id_entrega } = await entregaRes.json();

      await Promise.all(
        Object.entries(quantidadesEntregues)
          .filter(([, qtd]) => Number(qtd) > 0)
          .map(([id_mat, qtd]) =>
            authFetch(`${API_URL}/entrega_itens`, {
              method: "POST",
              body: JSON.stringify({
                id_entrega,
                id_material: Number(id_mat),
                quantidade:  Number(qtd),
                observacao:  "Entrega via reserva",
              }),
            })
          )
      );

      await authFetch(`${API_URL}/reservas/${selected.id_reserva}/status`, {
        method: "PUT",
        body: JSON.stringify({ status_reserva: "Confirmada" }),
      });

      atualizarStockLocal(
        Object.entries(quantidadesEntregues).map(([id_material, quantidade]) => ({ id_material, quantidade }))
      );

      alert(`Entrega da reserva #${selected.id_reserva} registada com sucesso!`);
      setReservas(prev => prev.filter(r => r.id_reserva !== selected.id_reserva));
      setSelected(null);
      if (onEntregaRegistrada) onEntregaRegistrada();

    } catch (err) {
      console.error(err);
      setErros({ geral: err.message || "Erro ao processar entrega" });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEntregaDireta = async () => {
    setErros({});
    const novosErros = {};
    const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!regex.test(clienteDireto) || clienteDireto.trim().length < 2)
      novosErros.cliente = "Nome do cliente inválido.";
    if (itensDiretos.length === 0) novosErros.materiais = "Adicione pelo menos um material.";
    if (!previsaoDevolucao) novosErros.previsao = "Data de devolução obrigatória.";
    if (previsaoDevolucao && new Date(previsaoDevolucao) < new Date(dataEntrega))
      novosErros.previsao = "Devolução não pode ser antes da entrega.";
    if (Object.keys(novosErros).length > 0) return setErros(novosErros);

    const payload = {
      id_reserva:                      null,
      nome_funcionario_entrega:        responsavelEntrega,
      responsavel_recebimento_cliente: clienteDireto.trim(),
      metodo_envio:                    metodoEnvio,
      data_prevista_devolucao:         previsaoDevolucao,
      itens: itensDiretos.map(i => ({ id_material: Number(i.id_material), quantidade: Number(i.quantidade) })),
    };

    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/entregas`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errObj = await res.json().catch(() => ({}));
        throw new Error(errObj.erro || "Erro ao criar entrega");
      }

      const { id_entrega } = await res.json();

      const fullRes = await authFetch(`${API_URL}/entregas/${id_entrega}`);
      if (!fullRes.ok) throw new Error("Falha ao buscar entrega completa");
      const entregaCompleta = await fullRes.json();

      setEntregaFinalizada(entregaCompleta);
      alert(`Entrega ${entregaCompleta.codigo_entrega} registada com sucesso!`);
      setClienteDireto("");
      setItensDiretos([]);
      setPrevisaoDevolucao("");
      atualizarStockLocal(payload.itens);
      if (onEntregaRegistrada) onEntregaRegistrada();

    } catch (err) {
      setErros({ geral: err.message });
    } finally {
      setLoading(false);
    }
  };

  const gerarPDF = async (id_entrega) => {
    try {
      const res = await authFetch(`${API_URL}/entregas/${id_entrega}/recibo-pdf`);
      if (!res.ok) throw new Error("Erro ao gerar PDF");
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Recibo_${entregaFinalizada.codigo_entrega}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF");
    }
  };

  return (
    <section style={{ display: "flex", gap: "20px", padding: "20px" }}>
      {/* COLUNA ESQUERDA */}
      <div style={{ flex: 1, minWidth: "300px" }}>
        <h2>Registar Entrega</h2>

        <div style={{ margin: "15px 0", display: "flex", gap: "10px" }}>
          <button onClick={() => { setModoDireto(false); setEntregaFinalizada(null); setSelected(null); }}
            style={{ padding: "12px 20px", background: !modoDireto ? "#0066cc" : "#ddd", color: !modoDireto ? "white" : "#333", border: "none", borderRadius: "8px" }}>
            Reservas Pendentes ({reservas.length})
          </button>
          <button onClick={() => { setModoDireto(true); setEntregaFinalizada(null); }}
            style={{ padding: "12px 20px", background: modoDireto ? "#0066cc" : "#ddd", color: modoDireto ? "white" : "#333", border: "none", borderRadius: "8px" }}>
            Entrega Direta
          </button>
        </div>

        {!modoDireto && reservas.length === 0 && (
          <p style={{ color: "#64748b" }}>Nenhuma reserva pendente.</p>
        )}

        {!modoDireto && reservas.map(r => {
          const cli = clientes.find(c => c.id_cliente === r.id_cliente);
          return (
            <div key={r.id_reserva}
              onClick={() => setSelected({ ...r, cliente: cli?.nome_completo || "Desconhecido" })}
              style={{
                padding: "12px", margin: "8px 0", borderRadius: "8px", cursor: "pointer",
                background: selected?.id_reserva === r.id_reserva ? "#0066cc" : "#f8f9fa",
                color:      selected?.id_reserva === r.id_reserva ? "white"   : "black",
              }}>
              <strong>#{r.id_reserva}</strong> — {cli?.nome_completo || "..."}
            </div>
          );
        })}
      </div>

      {/* COLUNA DIREITA */}
      <div style={{ flex: 2 }}>

        {selected && !modoDireto && (
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <h3>Entrega da Reserva #{selected.id_reserva}</h3>
            <p><strong>Cliente:</strong> {selected.cliente}</p>

            <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
              <thead style={{ background: "#0066cc", color: "white" }}>
                <tr>
                  <th style={{ padding: "10px" }}>Material</th>
                  <th style={{ padding: "10px" }}>Qtd Reservada</th>
                  <th style={{ padding: "10px" }}>Qtd Entregue</th>
                </tr>
              </thead>
              <tbody>
                {(selected.itens || []).map((it, i) => {
                  const mat = materiais.find(m => m.id_material === it.id_material);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#f8fbff" : "white" }}>
                      <td style={{ padding: "10px" }}>{mat?.nome || "Desconhecido"}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>{it.quantidade}</td>
                      <td style={{ padding: "10px" }}>
                        <input type="number" min="0"
                          value={quantidadesEntregues[it.id_material] ?? ""}
                          onChange={e => setQuantidadesEntregues(prev => ({ ...prev, [it.id_material]: Number(e.target.value) }))}
                          style={{ width: "70px", padding: "8px" }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <FormularioEntregaCampos
              dataEntrega={dataEntrega} responsavelEntrega={responsavelEntrega}
              previsaoDevolucao={previsaoDevolucao} setPrevisaoDevolucao={setPrevisaoDevolucao}
              metodoEnvio={metodoEnvio} setMetodoEnvio={setMetodoEnvio} erros={erros} />

            {erros.geral && <p style={{ color: "red" }}>{erros.geral}</p>}

            <div style={{ marginTop: "20px" }}>
              <button onClick={confirmarEntrega} disabled={loading}
                style={{ padding: "12px 30px", background: "#28a745", color: "white", border: "none", borderRadius: "8px" }}>
                {loading ? "A processar..." : "Confirmar Entrega"}
              </button>
              <button onClick={() => setSelected(null)}
                style={{ marginLeft: "10px", padding: "12px 20px", background: "#dc3545", color: "white", border: "none", borderRadius: "8px" }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {modoDireto && !entregaFinalizada && (
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <h3>Entrega Direta</h3>

            <input type="text" placeholder="Nome do cliente"
              value={clienteDireto} onChange={e => setClienteDireto(e.target.value)}
              style={{ width: "100%", padding: "12px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ccc" }} />
            {erros.cliente && <p style={{ color: "red" }}>{erros.cliente}</p>}

            <FormularioEntregaCampos
              dataEntrega={dataEntrega} responsavelEntrega={responsavelEntrega}
              previsaoDevolucao={previsaoDevolucao} setPrevisaoDevolucao={setPrevisaoDevolucao}
              metodoEnvio={metodoEnvio} setMetodoEnvio={setMetodoEnvio} erros={erros} />

            <h4>Adicionar Material</h4>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <select value={materialSelecionado} onChange={e => setMaterialSelecionado(e.target.value)}
                style={{ flex: 3, padding: "10px", borderRadius: "8px" }}>
                <option value="">-- Escolher material --</option>
                {materiais.map(m => (
                  <option key={m.id_material} value={m.id_material}>{m.nome}</option>
                ))}
              </select>
              <input type="number" value={quantidadeMaterial} min="1"
                onChange={e => setQuantidadeMaterial(Math.max(1, Number(e.target.value || 1)))}
                style={{ width: "80px", padding: "10px" }} />
              <button onClick={handleAdicionarItem}
                style={{ padding: "10px 20px", background: "#0066cc", color: "white", border: "none", borderRadius: "8px" }}>
                Adicionar
              </button>
            </div>

            {erros.item && <p style={{ color: "red" }}>{erros.item}</p>}
            {itensDiretos.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {itensDiretos.map((item, i) => (
                  <li key={i} style={{ padding: "10px", background: "#f0f8ff", margin: "8px 0", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                    <span>{item.nome} × {item.quantidade}</span>
                    <button onClick={() => setItensDiretos(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ background: "red", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px" }}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {erros.materiais && <p style={{ color: "red" }}>{erros.materiais}</p>}
            {erros.geral    && <p style={{ color: "red", marginTop: "12px" }}>{erros.geral}</p>}

            <div style={{ marginTop: "30px" }}>
              <button onClick={confirmarEntregaDireta} disabled={loading}
                style={{ padding: "15px 40px", background: "#28a745", color: "white", fontSize: "18px", border: "none", borderRadius: "8px" }}>
                {loading ? "A processar..." : "Confirmar Entrega Direta"}
              </button>
            </div>
          </div>
        )}

        {entregaFinalizada && (
          <Recibo
            entrega={entregaFinalizada}
            onClose={() => setEntregaFinalizada(null)}
            onGerarPDF={gerarPDF}
            onImprimir={() => window.print()}
            onNovaEntrega={() => { setEntregaFinalizada(null); setModoDireto(true); }} />
        )}
      </div>
    </section>
  );
}

function FormularioEntregaCampos({ dataEntrega, responsavelEntrega, previsaoDevolucao, setPrevisaoDevolucao, metodoEnvio, setMetodoEnvio, erros }) {
  return (
    <div style={{ margin: "20px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
        <div>
          <label>Data Entrega</label>
          <input type="date" value={dataEntrega} readOnly style={{ width: "100%", padding: "10px" }} />
        </div>
        <div>
          <label>Responsável</label>
          <input type="text" value={responsavelEntrega} readOnly style={{ width: "100%", padding: "10px" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" }}>
        <div>
          <label>Previsão Devolução</label>
          <input type="date" value={previsaoDevolucao} min={dataEntrega}
            onChange={e => setPrevisaoDevolucao(e.target.value)}
            style={{ width: "100%", padding: "10px" }} />
          {erros.previsao && <p style={{ color: "red", margin: "5px 0" }}>{erros.previsao}</p>}
        </div>
        <div>
          <label>Método de Envio</label>
          <select value={metodoEnvio} onChange={e => setMetodoEnvio(e.target.value)}
            style={{ width: "100%", padding: "10px" }}>
            <option value="transporte_empresa">Transporte Empresa</option>
            <option value="pessoal">Levantamento Pessoal</option>
            <option value="externo">Transporte Externo</option>
          </select>
        </div>
      </div>
    </div>
  );
}
