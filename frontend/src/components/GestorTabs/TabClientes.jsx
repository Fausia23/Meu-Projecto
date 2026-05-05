// src/components/tabs/TabClientes.jsx
import React, { useState, useEffect } from "react";
import { API_URL, authFetch } from "../../javascript/dados";

export default function TabClientes() {
  const [clientes,   setClientes]   = useState([]);
  const [filtro,     setFiltro]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [erro,       setErro]       = useState("");
  const [modalOpen,  setModalOpen]  = useState(false);
  const [formData,   setFormData]   = useState({
    id_cliente: null, nome_completo: "", telefone: "", email: "", nuit: ""
  });

  // ── Carrega clientes da API ───────────────────────────────────────────────
  useEffect(() => { carregarClientes(); }, []);

  async function carregarClientes() {
    setLoading(true); setErro("");
    try {
      const res  = await authFetch(`${API_URL}/clientes`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro("Não foi possível carregar os clientes.");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Filtro local ──────────────────────────────────────────────────────────
  const listaFiltrada = clientes.filter((c) => {
    const termo = filtro.toLowerCase();
    return (
      (c.nome_completo || "").toLowerCase().includes(termo) ||
      (c.telefone      || "").includes(filtro) ||
      (c.email         || "").toLowerCase().includes(termo)
    );
  });

  // ── Modal ─────────────────────────────────────────────────────────────────
  function abrirModal(cliente = null) {
    setFormData(
      cliente
        ? { ...cliente }
        : { id_cliente: null, nome_completo: "", telefone: "", email: "", nuit: "" }
    );
    setModalOpen(true);
  }

  async function salvarCliente() {
    if (!formData.nome_completo.trim()) return alert("Nome é obrigatório.");
    try {
      if (formData.id_cliente) {
        // Editar
        const res = await authFetch(`${API_URL}/clientes/${formData.id_cliente}`, {
          method: "PUT",
          body: JSON.stringify({
            nome_completo: formData.nome_completo,
            telefone:      formData.telefone,
            email:         formData.email,
          }),
        });
        if (!res.ok) throw new Error("Erro ao actualizar cliente.");
      } else {
        // Criar — normalmente feito pelo registo, mas permite criação manual
        const res = await authFetch(`${API_URL}/clientes`, {
          method: "POST",
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Erro ao criar cliente.");
      }
      setModalOpen(false);
      carregarClientes();
    } catch (err) {
      alert(err.message);
    }
  }

  async function apagar(id_cliente) {
    if (!window.confirm("Tem certeza que deseja remover este cliente?")) return;
    try {
      const res = await authFetch(`${API_URL}/clientes/${id_cliente}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover cliente.");
      carregarClientes();
    } catch (err) {
      alert(err.message);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <section id="clientes">
      <h2>Gerenciar Clientes</h2>

      <div className="filtros-reservas" style={{ marginTop: 10 }}>
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou email..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <button className="btn-acao" onClick={() => abrirModal()}>
          + Adicionar Cliente
        </button>
      </div>

      {erro    && <p style={{ color: "red",   padding: "10px 0" }}>{erro}</p>}
      {loading && <p style={{ color: "#666",  padding: "10px 0" }}>A carregar clientes...</p>}

      <div className="table-responsive">
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>NUIT</th>
              <th style={{ width: 140 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && listaFiltrada.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              listaFiltrada.map((c) => (
                <tr key={c.id_cliente}>
                  <td>{c.id_cliente}</td>
                  <td>{c.nome_completo}</td>
                  <td>{c.telefone  || "—"}</td>
                  <td>{c.email     || "—"}</td>
                  <td>{c.nuit      || "—"}</td>
                  <td>
                    <button
                      className="btn-secundario"
                      style={{ padding: "4px 8px", marginRight: 6 }}
                      onClick={() => abrirModal(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-perigo"
                      style={{ padding: "4px 8px" }}
                      onClick={() => apagar(c.id_cliente)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>{formData.id_cliente ? "Editar Cliente" : "Novo Cliente"}</h3>

            <label>Nome Completo</label>
            <input
              type="text"
              value={formData.nome_completo}
              onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
            />

            <label>Telefone</label>
            <input
              type="text"
              value={formData.telefone || ""}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />

            <label>Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            {!formData.id_cliente && (
              <>
                <label>NUIT</label>
                <input
                  type="text"
                  maxLength={9}
                  value={formData.nuit || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nuit: e.target.value.replace(/\D/g, "") })
                  }
                />
              </>
            )}

            <div className="acoes-form">
              <button className="btn-acao" onClick={salvarCliente}>
                Salvar
              </button>
              <button className="btn-secundario" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}