import { useState, useEffect } from "react";
import { API_URL } from "../javascript/dados";

export default function Catalogo({ setAbaAtual, setMaterialParaReservar }) {
  const [pesquisa, setPesquisa] = useState("");
  const [categoria, setCategoria] = useState("");
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarMateriais = async () => {
      try {
        const res = await fetch(`${API_URL}/materiais`);
        const data = await res.json();
        // Construir o URL completo para cada imagem
        const materiaisComUrlCompleto = data.map(m => ({
          ...m,
          imagem_url: m.imagem_url && !m.imagem_url.startsWith('http')
            ? `${API_URL}${m.imagem_url}`
            : m.imagem_url
        }));
        setMateriais(materiaisComUrlCompleto);
      } catch (err) {
        console.error("Erro ao carregar materiais:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarMateriais();
  }, []);

  // Filtragem dinâmica
  const filtrados = materiais.filter((m) => {
    const nomeMatch = m.nome.toLowerCase().includes(pesquisa.toLowerCase());
    const catMatch = categoria ? m.categoria === categoria : true;
    return nomeMatch && catMatch;
  });

  const handleReservar = (material) => {
    setMaterialParaReservar(material);
    setAbaAtual("reserva");
  };

  return (
    <section className="tab-content">
      <h2>Catálogo de Materiais</h2>

      <div className="materiais-filtros">
        <input
          type="search"
          placeholder="Pesquisar material..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />

        <select onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas as Categorias</option>
          <option value="ferramentas_eletricas">Ferramentas Elétricas</option>
          <option value="maquinas_pesadas">Máquinas Pesadas</option>
        </select>
      </div>

      {/* LOADING */}
      {loading && <p>A carregar materiais...</p>}

      <div className="materiais-grelha">
        {!loading && filtrados.length === 0 ? (
          <p className="vazio">Nenhum material disponível.</p>
        ) : (
          filtrados.map((m) => (
            <div className="material-card" key={m.id_material}>
              <img src={m.imagem_url} alt={m.nome} />

              <div className="card-content">
                <span className="card-categoria">{m.categoria}</span>
                <h3>{m.nome}</h3>
                <p className="card-preco">{m.preco_dia} MT/dia</p>

                <div className="card-botoes">
                  <button className="btn-detalhes">Detalhes</button>
                  <button className="btn-reservar"
                    onClick={() => handleReservar(m)}>
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
