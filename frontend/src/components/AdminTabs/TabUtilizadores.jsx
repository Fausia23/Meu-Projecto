// src/components/AdminTabs/TabUtilizadores.jsx
import React, { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../javascript/dados";

const PERFIS = ["admin", "gestor", "funcionario"];

const VAZIO = { nome: "", email: "", senha: "", perfil: "funcionario" };

export default function TabUtilizadores() {
  const [utilizadores, setUtilizadores] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [erro,         setErro]         = useState("");
  const [sucesso,      setSucesso]      = useState("");

  // Modal de criação/edição
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState(null); // null = criar, obj = editar
  const [form,      setForm]      = useState(VAZIO);
  const [formErro,  setFormErro]  = useState("");
  const [saving,    setSaving]    = useState(false);

  // Confirmação de apagar
  const [confirmarApagar, setConfirmarApagar] = useState(null);

  // ── token ────────────────────────────────────────────────
  const token = () => localStorage.getItem("token");

  const headers = () => ({
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token()}`,
  });

  // ── feedback temporário ──────────────────────────────────
  const feedback = (msg, tipo = "sucesso") => {
    if (tipo === "sucesso") { setSucesso(msg); setTimeout(() => setSucesso(""), 3500); }
    else                    { setErro(msg);    setTimeout(() => setErro(""),    3500); }
  };

  // ── listar utilizadores ──────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/usuarios`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar.");
      setUtilizadores(Array.isArray(data) ? data : []);
    } catch (err) {
      feedback(err.message, "erro");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { carregar(); }, [carregar]);

  // ── abrir modal ──────────────────────────────────────────
  const abrirCriar = () => {
    setEditando(null);
    setForm(VAZIO);
    setFormErro("");
    setModal(true);
  };

  const abrirEditar = (u) => {
    setEditando(u);
    setForm({ nome: u.nome, email: u.email, senha: "", perfil: u.perfil });
    setFormErro("");
    setModal(true);
  };

  // ── guardar (criar ou editar) ────────────────────────────
  const guardar = async () => {
    if (!form.nome || !form.email || !form.perfil)
      return setFormErro("Nome, email e perfil são obrigatórios.");
    if (!editando && !form.senha)
      return setFormErro("A senha é obrigatória para novo utilizador.");

    setSaving(true);
    setFormErro("");
    try {
      let res;
      if (editando) {
        // PUT /:id
        res = await fetch(`${API_URL}/usuarios/${editando.id_usuario}`, {
          method:  "PUT",
          headers: headers(),
          body:    JSON.stringify(form),
        });
      } else {
        // POST /admin
        res = await fetch(`${API_URL}/usuarios/admin`, {
          method:  "POST",
          headers: headers(),
          body:    JSON.stringify(form),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao guardar.");

      feedback(editando ? "Utilizador actualizado." : "Utilizador criado.");
      setModal(false);
      carregar();
    } catch (err) {
      setFormErro(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── activar / desactivar ─────────────────────────────────
  const toggleAtivo = async (u) => {
    try {
      const res = await fetch(`${API_URL}/usuarios/${u.id_usuario}/ativo`, {
        method:  "PATCH",
        headers: headers(),
        body:    JSON.stringify({ ativo: !u.ativo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro.");
      feedback(data.message);
      carregar();
    } catch (err) {
      feedback(err.message, "erro");
    }
  };

  // ── apagar ───────────────────────────────────────────────
  const apagar = async (id) => {
    try {
      const res = await fetch(`${API_URL}/usuarios/${id}`, {
        method:  "DELETE",
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao apagar.");
      feedback("Utilizador removido.");
      setConfirmarApagar(null);
      carregar();
    } catch (err) {
      feedback(err.message, "erro");
      setConfirmarApagar(null);
    }
  };

  // ── render ───────────────────────────────────────────────
  const badgePerfil = (p) => {
    const cores = { admin: "badge-admin", gestor: "badge-gestor", funcionario: "badge-func", cliente: "badge-cliente" };
    return <span className={`badge ${cores[p] || "badge-default"}`}>{p}</span>;
  };

  return (
    <section className="tab-utilizadores">
      <div className="tab-header">
        <div>
          <h2>Gestão de Utilizadores</h2>
          <p>Crie, edite e gira todos os utilizadores do sistema.</p>
        </div>
        <button className="admin-btn-primary" onClick={abrirCriar}>
          + Novo Utilizador
        </button>
      </div>

      {sucesso && <div className="alert alert-sucesso">{sucesso}</div>}
      {erro    && <div className="alert alert-erro">{erro}</div>}

      {loading ? (
        <p className="admin-loading-text">A carregar utilizadores...</p>
      ) : (
        <div className="tabela-wrapper">
          <table className="admin-tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Estado</th>
                <th>Criado em</th>
                <th>Acções</th>
              </tr>
            </thead>
            <tbody>
              {utilizadores.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#888" }}>Nenhum utilizador encontrado.</td></tr>
              ) : utilizadores.map((u) => (
                <tr key={u.id_usuario}>
                  <td><strong>{u.nome}</strong></td>
                  <td>{u.email}</td>
                  <td>{badgePerfil(u.perfil)}</td>
                  <td>
                    <span className={`estado ${u.ativo ? "estado-ativo" : "estado-inativo"}`}>
                      {u.ativo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{new Date(u.data_criacao).toLocaleDateString("pt-PT")}</td>
                  <td className="acoes">
                    <button className="btn-sm btn-editar"  onClick={() => abrirEditar(u)}>Editar</button>
                    <button className="btn-sm btn-toggle"  onClick={() => toggleAtivo(u)}>
                      {u.ativo ? "Desactivar" : "Activar"}
                    </button>
                    <button className="btn-sm btn-apagar"  onClick={() => setConfirmarApagar(u)}>Apagar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Criar/Editar ──────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? "Editar Utilizador" : "Novo Utilizador"}</h3>

            <label>Nome</label>
            <input value={form.nome}  onChange={(e) => setForm({ ...form, nome: e.target.value })}  placeholder="Nome completo" />

            <label>Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" type="email" />

            <label>Senha {editando && <small>(deixe em branco para não alterar)</small>}</label>
            <input value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="••••••••" type="password" />

            <label>Perfil</label>
            <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })}>
              {PERFIS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            {formErro && <p className="modal-erro">{formErro}</p>}

            <div className="modal-acoes">
              <button className="btn-cancelar" onClick={() => setModal(false)}>Cancelar</button>
              <button className="admin-btn-primary" onClick={guardar} disabled={saving}>
                {saving ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Apagar ──────────────────────── */}
      {confirmarApagar && (
        <div className="modal-overlay" onClick={() => setConfirmarApagar(null)}>
          <div className="modal-box modal-pequeno" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar remoção</h3>
            <p>Tem a certeza que deseja apagar <strong>{confirmarApagar.nome}</strong>? Esta acção é irreversível.</p>
            <div className="modal-acoes">
              <button className="btn-cancelar" onClick={() => setConfirmarApagar(null)}>Cancelar</button>
              <button className="btn-apagar"   onClick={() => apagar(confirmarApagar.id_usuario)}>Apagar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
