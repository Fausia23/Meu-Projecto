import { useState, useEffect } from "react";
import { API_URL, authFetch } from "../javascript/dados";
import "./estilos/ClientePerfil.css";

export default function Perfil() {
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState({
    nome: "", id_cliente: null, email: "", telefone: "", nuit: "",
  });
  const [historico, setHistorico] = useState([]);
  const [erros,     setErros]     = useState({});
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        // Usa a nova rota /meu-perfil que identifica pelo JWT, não pelo ID
        const resCliente = await authFetch(`${API_URL}/clientes/meu-perfil`);

        if (resCliente.ok) {
          const d = await resCliente.json();
          setUserData({
            id_cliente: d.id_cliente,
            nome:       d.nome_completo || "",
            email:      d.email         || "",
            telefone:   d.telefone      || "",
            nuit:       d.nuit          || "",
          });
        } else if (resCliente.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
          return;
        }

        // Histórico de entregas
        const resEntregas = await authFetch(`${API_URL}/clientes/minhas-entregas`);
        if (resEntregas.ok) {
          setHistorico(await resEntregas.json());
        }

      } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setErros({});
    const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!regex.test(userData.nome) || userData.nome.trim().length < 2) {
      setErros({ nome: "O nome deve conter apenas letras e ter pelo menos 2 caracteres." });
      return;
    }

    try {
      const response = await authFetch(`${API_URL}/clientes/meu-perfil`, {
        method: "PUT",
        body: JSON.stringify({
          nome_completo: userData.nome,
          email:         userData.email,
          telefone:      userData.telefone,
        }),
      });

      if (!response.ok) throw new Error("Falha ao atualizar o perfil.");

      localStorage.setItem("userName", userData.nome);
      setEditMode(false);
      alert("Perfil atualizado com sucesso.");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleDeleteAccount = () => {
    if (!window.confirm("Tem a certeza que deseja eliminar a conta?")) return;
    localStorage.clear();
    alert("Conta removida.");
    window.location.href = "/login";
  };

  const handleCancelarAluguer = async (aluguerId) => {
    if (!window.confirm(`Cancelar o aluguer #${aluguerId}?`)) return;
    try {
      const response = await authFetch(`${API_URL}/entregas/${aluguerId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Não foi possível cancelar o aluguer.");
      setHistorico(prev => prev.filter(a => a.id_entrega !== aluguerId));
      alert("Aluguer cancelado com sucesso.");
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>A carregar perfil...</div>;

  return (
    <div className="perfil-container">
      {/* Coluna de Dados Pessoais */}
      <section className="secao-perfil">
        <div className="perfil-header">
          <h2><i className="fas fa-user-circle"></i> Os Meus Dados</h2>
          {!editMode && (
            <button className="btn-editar" onClick={() => setEditMode(true)}>
              <i className="fas fa-edit"></i> Editar
            </button>
          )}
        </div>

        {!editMode ? (
          <div className="perfil-info">
            <div className="info-item">
              <span><i className="fas fa-id-card"></i> Nome</span>
              <p>{userData.nome}</p>
            </div>
            <div className="info-item">
              <span><i className="fas fa-envelope"></i> Email</span>
              <p>{userData.email}</p>
            </div>
            <div className="info-item">
              <span><i className="fas fa-phone"></i> Telefone</span>
              <p>{userData.telefone || "—"}</p>
            </div>
            <div className="info-item">
              <span><i className="fas fa-file-alt"></i> NUIT</span>
              <p>{userData.nuit}</p>
            </div>
          </div>
        ) : (
          <div className="perfil-edit">
            <div className="form-grupo">
              <label>Nome:</label>
              <input name="nome" value={userData.nome} onChange={handleChange} />
              {erros.nome && <p className="mensagem-erro">{erros.nome}</p>}
            </div>
            <div className="form-grupo">
              <label>Email:</label>
              <input type="email" name="email" value={userData.email} onChange={handleChange} />
            </div>
            <div className="form-grupo">
              <label>Telefone:</label>
              <input type="tel" name="telefone" value={userData.telefone} onChange={handleChange} />
            </div>
            <div className="botoes-acao">
              <button className="btn-acao" onClick={handleSave}>
                <i className="fas fa-save"></i> Guardar
              </button>
              <button className="btn-secundario" onClick={() => setEditMode(false)}>Cancelar</button>
            </div>
          </div>
        )}

        <div className="conta-opcoes">
          <button className="btn-secundario" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Terminar Sessão
          </button>
          <button className="btn-perigo" onClick={handleDeleteAccount}>
            <i className="fas fa-user-slash"></i> Eliminar Conta
          </button>
        </div>
      </section>

      {/* Coluna de Histórico */}
      <section className="secao-historico">
        <h2><i className="fas fa-history"></i> Histórico de Alugueres</h2>

        <div className="historico-lista">
          {historico.length > 0 ? (
            historico.map(a => (
              <div key={a.id_entrega} className="historico-card">
                <div className="card-header">
                  <h3>#{a.id_entrega}</h3>
                  <span className="data-aluguer">
                    <i className="far fa-calendar-alt"></i>{" "}
                    {new Date(a.data_efetiva_entrega).toLocaleDateString()}
                  </span>
                </div>
                <div className="card-body">
                  <strong>Itens:</strong>
                  <ul>
                    {(a.itens || []).map(i => (
                      <li key={i.id_material}>
                        {i.nome_material} <span>(Qtd: {i.quantidade})</span>
                      </li>
                    ))}
                  </ul>
                  <div className="card-footer">
                    <button className="btn-cancelar-card" onClick={() => handleCancelarAluguer(a.id_entrega)}>
                      <i className="fas fa-times"></i> Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="sem-historico">Sem registos.</p>
          )}
        </div>
      </section>
    </div>
  );
}
