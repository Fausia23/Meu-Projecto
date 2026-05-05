import React, { useState, useEffect, useCallback } from "react";
import { API_URL, authFetch } from "../../javascript/dados";

export default function TabCatalogo() {
  const [secao, setSecao] = useState("catalogo");
  const [materiais, setMateriais] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [erroRegisto, setErroRegisto] = useState("");
  const [sucessoRegisto, setSucessoRegisto] = useState("");
  const [erroGerenciar, setErroGerenciar] = useState("");
  const [sucessoGerenciar, setSucessoGerenciar] = useState("");
  const [loadingInventario, setLoadingInventario] = useState(true);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [materialParaEditar, setMaterialParaEditar] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null, nome: "" });

  const [novoMaterial, setNovoMaterial] = useState({
    nome: "", id_categoria: "", preco_diaria: "",
    quantidade_total: "", descricao: "", imagem_url: "",
  });

  // ✅ Tudo usa authFetch e vai directamente à API (sem cache local)
  const carregarDados = useCallback(async () => {
    setLoadingInventario(true);
    try {
      const [respMateriais, respInventario] = await Promise.all([
        authFetch(`${API_URL}/materiais`),
        authFetch(`${API_URL}/materiais/inventario`),
      ]);

      if (respMateriais.ok) {
        const dados = await respMateriais.json();
        setMateriais(dados.map(m => ({ ...m, preco_diaria: parseFloat(m.preco_diaria || 0) })));
      }

      if (respInventario.ok) {
  const dadosInv = await respInventario.json();
  setInventario(dadosInv.map(item => ({
    id:            item.id,          // ✅ a API devolve "id", não "id_material"
    nome:          item.nome,
    disponivel:    Number(item.disponivel    ?? 0),
    alugada:       Number(item.alugada       ?? 0),
    reservada:     Number(item.reservada     ?? 0),
    em_manutencao: Number(item.em_manutencao ?? 0),
    estragado:     Number(item.estragado     ?? 0),
  })));
}
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoadingInventario(false);
    }
  }, []);

  // Carrega ao montar
  useEffect(() => { carregarDados(); }, [carregarDados]);

  // ✅ Auto-refresh a cada 30 segundos quando está no inventário
  useEffect(() => {
    if (secao !== "catalogo") return;
    const intervalo = setInterval(carregarDados, 30_000);
    return () => clearInterval(intervalo);
  }, [secao, carregarDados]);

  // === REGISTO ===
  async function salvarMaterial(e) {
    e.preventDefault();
    setErroRegisto(""); setSucessoRegisto("");
    try {
      const resp = await authFetch(`${API_URL}/materiais`, {
        method: "POST",
        body: JSON.stringify({
          ...novoMaterial,
          preco_diaria:    parseFloat(novoMaterial.preco_diaria) || 0,
          quantidade_total: Number(novoMaterial.quantidade_total) || 0,
        }),
      });
      if (resp.ok) {
        setSucessoRegisto("Material registado com sucesso!");
        setNovoMaterial({ nome: "", id_categoria: "", preco_diaria: "", quantidade_total: "", descricao: "", imagem_url: "" });
        carregarDados();
      } else {
        const erro = await resp.json().catch(() => ({}));
        setErroRegisto(erro.erro || "Erro ao registar.");
      }
    } catch { setErroRegisto("Erro de rede."); }
  }

  // === EDIÇÃO ===
  const abrirModalEdicao = (mat) => { setMaterialParaEditar(mat); setModalEdicaoAberto(true); };

  async function salvarEdicao(e) {
    e.preventDefault();
    const dados = { ...materialParaEditar };
    delete dados.id_material;
    delete dados.nome_categoria;
    dados.preco_diaria    = parseFloat(dados.preco_diaria) || 0;
    dados.quantidade_total = Number(dados.quantidade_total) || 0;

    try {
      const resp = await authFetch(`${API_URL}/materiais/${materialParaEditar.id_material}`, {
        method: "PUT",
        body: JSON.stringify(dados),
      });
      if (resp.ok) {
        setSucessoGerenciar("Actualizado com sucesso!");
        setModalEdicaoAberto(false);
        carregarDados(); // ✅ Recarrega inventário imediatamente após edição
      } else {
        const err = await resp.json().catch(() => ({}));
        setErroGerenciar(err.erro || "Erro ao actualizar.");
      }
    } catch { setErroGerenciar("Erro de rede."); }
    finally { setTimeout(() => setSucessoGerenciar(""), 5000); }
  }

  // === REMOÇÃO ===
  const abrirConfirmacaoRemocao = (id, nome) => setModalConfirmacao({ aberto: true, id, nome });
  const cancelarRemocao = () => setModalConfirmacao({ aberto: false, id: null, nome: "" });

  const confirmarRemocao = async () => {
    if (!modalConfirmacao.id) return;
    try {
      const resp = await authFetch(`${API_URL}/materiais/${modalConfirmacao.id}`, { method: "DELETE" });
      if (resp.ok) {
        setSucessoGerenciar(`"${modalConfirmacao.nome}" removido com sucesso!`);
        carregarDados(); // ✅ Recarrega inventário após remoção
      } else {
        const erroData = await resp.json().catch(() => ({}));
        setErroGerenciar(erroData.erro || "Erro ao remover.");
      }
    } catch { setErroGerenciar("Falha de comunicação com o servidor."); }
    finally { cancelarRemocao(); }
  };

  const nomeCategoria = (id) => ({ "1": "Ferramentas", "2": "Equipamentos", "3": "Máquinas Pesadas" }[id] || "—");
  const materiaisFiltrados = materiais.filter(m => m.nome.toLowerCase().includes(pesquisa.toLowerCase()));

  return (
    <section className="tab-content active">
      <div className="gestor-conteudo-header">
        <h2>Gestão de Catálogo de Materiais</h2>
        <div className="botoes-acao">
          <button className={`btn-acao ${secao === "catalogo" ? "active" : ""}`} onClick={() => { setSecao("catalogo"); carregarDados(); }}>
            Inventário
          </button>
          <button className={`btn-secundario ${secao === "registro" ? "active" : ""}`} onClick={() => setSecao("registro")}>
            Registar
          </button>
          <button className={`btn-secundario ${secao === "gerenciar" ? "active" : ""}`} onClick={() => { setSecao("gerenciar"); carregarDados(); }}>
            Gerenciar
          </button>
        </div>

        {secao === "gerenciar" && (
          <div className="sub-header-sticky">
            <h3>Materiais em Catálogo</h3>
            <input
              type="text" placeholder="Pesquisar por nome..."
              value={pesquisa} onChange={(e) => setPesquisa(e.target.value)}
              className="input-pesquisa"
            />
          </div>
        )}
      </div>

      {/* ── INVENTÁRIO ── */}
      {secao === "catalogo" && (
        <div className="config fade-in">
          {/* ✅ Botão de refresh manual */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button className="btn-secundario" onClick={carregarDados} disabled={loadingInventario}>
              {loadingInventario ? "A actualizar..." : "🔄 Actualizar"}
            </button>
          </div>

          <table className="tabela-materiais tabela-inventario">
            <thead>
              <tr>
                <th style={{ width: "40%", textAlign: "left" }}>Nome do Material</th>
                <th className="col-disponivel">Disponível</th>
                <th className="col-alugada">Alugada</th>
                <th className="col-reservada">Reservada</th>
                <th className="col-manutencao">Em Manut.</th>
                <th className="col-estragado">Estragado</th>
              </tr>
            </thead>
            <tbody>
              {loadingInventario ? (
                <tr><td colSpan="6" style={{ textAlign: "center", padding: "50px", color: "#888" }}>A carregar inventário...</td></tr>
              ) : inventario.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: "center", padding: "50px", color: "#888" }}>Nenhum material registado.</td></tr>
              ) : (
                inventario.map((item) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: "left" }}><strong>{item.nome}</strong></td>
                    <td className="col-disponivel">
                      <span className={`badge ${item.disponivel > 0 ? "disponivel" : "zero"}`}>{item.disponivel}</span>
                    </td>
                    <td className="col-alugada"><span className="badge alugada">{item.alugada}</span></td>
                    <td className="col-reservada"><span className="badge reservada">{item.reservada}</span></td>
                    <td className="col-manutencao"><span className="badge manutencao">{item.em_manutencao}</span></td>
                    <td className="col-estragado"><span className="badge estragado">{item.estragado}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: "30px", fontSize: "0.95rem", color: "#555", textAlign: "center" }}>
            <strong>Legenda:</strong><br /><br />
            <span className="badge disponivel" style={{ margin: "0 12px" }}>Disponível</span>
            <span className="badge alugada"    style={{ margin: "0 12px" }}>Alugada</span>
            <span className="badge reservada"  style={{ margin: "0 12px" }}>Reservada</span>
            <span className="badge manutencao" style={{ margin: "0 12px" }}>Em Manutenção</span>
            <span className="badge estragado"  style={{ margin: "0 12px" }}>Estragado</span>
          </div>
        </div>
      )}

      {/* ── REGISTO ── */}
      {secao === "registro" && (
        <div className="config fade-in">
          <h3>Novo Material</h3>
          <form className="form-material" onSubmit={salvarMaterial}>
            <label>Nome *</label>
            <input type="text" required value={novoMaterial.nome} onChange={(e) => setNovoMaterial({ ...novoMaterial, nome: e.target.value })} />
            <label>Categoria *</label>
            <select required value={novoMaterial.id_categoria} onChange={(e) => setNovoMaterial({ ...novoMaterial, id_categoria: e.target.value })}>
              <option value="">Selecione</option>
              <option value="1">Ferramentas</option>
              <option value="2">Equipamentos</option>
              <option value="3">Máquinas Pesadas</option>
            </select>
            <label>Quantidade Inicial *</label>
            <input type="number" min="1" required value={novoMaterial.quantidade_total} onChange={(e) => setNovoMaterial({ ...novoMaterial, quantidade_total: e.target.value })} />
            <label>Preço Diária (MZN) *</label>
            <input type="number" step="0.01" min="0" required value={novoMaterial.preco_diaria} onChange={(e) => setNovoMaterial({ ...novoMaterial, preco_diaria: e.target.value })} />
            <label>Descrição</label>
            <textarea rows="3" value={novoMaterial.descricao} onChange={(e) => setNovoMaterial({ ...novoMaterial, descricao: e.target.value })} />
            <label>URL da Imagem (opcional)</label>
            <input type="text" value={novoMaterial.imagem_url} onChange={(e) => setNovoMaterial({ ...novoMaterial, imagem_url: e.target.value })} />
            {erroRegisto    && <p className="mensagem-erro">{erroRegisto}</p>}
            {sucessoRegisto && <p className="mensagem-sucesso">{sucessoRegisto}</p>}
            <button type="submit" className="btn-acao salvar">Salvar Material</button>
          </form>
        </div>
      )}

      {/* ── GERENCIAR ── */}
      {secao === "gerenciar" && (
        <div className="config fade-in">
          {erroGerenciar    && <p className="mensagem-erro">{erroGerenciar}</p>}
          {sucessoGerenciar && <p className="mensagem-sucesso">{sucessoGerenciar}</p>}
          <table className="tabela-materiais">
            <thead>
              <tr>
                <th>Nome</th><th>Categoria</th><th>Qtd. Total</th>
                <th>Preço/dia</th><th style={{ width: "120px", textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {materiaisFiltrados.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Nenhum material encontrado.</td></tr>
              ) : (
                materiaisFiltrados.map((m) => (
                  <tr key={m.id_material}>
                    <td>{m.nome}</td>
                    <td>{nomeCategoria(m.id_categoria)}</td>
                    <td>{m.quantidade_total}</td>
                    <td>{(parseFloat(m.preco_diaria) || 0).toFixed(2)} MZN</td>
                    <td className="acoes-tabela">
                      <button className="btn-small editar" onClick={() => abrirModalEdicao(m)}>Editar</button>
                      <button className="btn-small remover" onClick={() => abrirConfirmacaoRemocao(m.id_material, m.nome)}>Remover</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL EDIÇÃO ── */}
      {modalEdicaoAberto && materialParaEditar && (
        <div className="modal-backdrop" onClick={() => setModalEdicaoAberto(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Editar: {materialParaEditar.nome}</h3>
            {materialParaEditar.imagem_url && (
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <img
                  src={materialParaEditar.imagem_url.startsWith("http") ? materialParaEditar.imagem_url : `/uploads/materiais/imagens/${materialParaEditar.imagem_url.replace(/^\/+/, "")}`}
                  alt={materialParaEditar.nome}
                  style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            )}
            <form onSubmit={salvarEdicao}>
              <label>Nome</label>
              <input type="text" required value={materialParaEditar.nome} onChange={(e) => setMaterialParaEditar({ ...materialParaEditar, nome: e.target.value })} />
              <label>Categoria</label>
              <select value={materialParaEditar.id_categoria} onChange={(e) => setMaterialParaEditar({ ...materialParaEditar, id_categoria: e.target.value })}>
                <option value="1">Ferramentas</option>
                <option value="2">Equipamentos</option>
                <option value="3">Máquinas Pesadas</option>
              </select>
              <label>Quantidade Total</label>
              <input type="number" min="0" value={materialParaEditar.quantidade_total} onChange={(e) => setMaterialParaEditar({ ...materialParaEditar, quantidade_total: e.target.value })} />
              <label>Preço Diária (MZN)</label>
              <input type="number" step="0.01" min="0" value={materialParaEditar.preco_diaria} onChange={(e) => setMaterialParaEditar({ ...materialParaEditar, preco_diaria: e.target.value })} />
              <label>URL da Imagem</label>
              <input type="text" value={materialParaEditar.imagem_url || ""} onChange={(e) => setMaterialParaEditar({ ...materialParaEditar, imagem_url: e.target.value })} />
              <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="submit" className="btn-acao">Salvar</button>
                <button type="button" className="btn-secundario" onClick={() => setModalEdicaoAberto(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAÇÃO REMOÇÃO ── */}
      {modalConfirmacao.aberto && (
        <div className="modal-backdrop" onClick={cancelarRemocao}>
          <div className="modal-box" style={{ width: "420px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "var(--vermelho)" }}>Confirmar remoção</h3>
            <p>Tem a certeza que deseja remover permanentemente:</p>
            <p style={{ fontWeight: "600" }}>"{modalConfirmacao.nome}"</p>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Esta acção não pode ser desfeita.</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="btn-secundario" onClick={cancelarRemocao}>Cancelar</button>
              <button className="btn-acao" style={{ background: "var(--vermelho)" }} onClick={confirmarRemocao}>Sim, remover</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}