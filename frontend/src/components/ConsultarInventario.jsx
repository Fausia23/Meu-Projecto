import React, { useState, useEffect } from "react";
import { carregarInventarioAPI, obterInventario } from "../javascript/dados";

export default function ConsultarInventario() {
  const [nome, setNome] = useState("");
  const [estado, setEstado] = useState("todos");
  const [inventario, setInventario] = useState([]);
  const [original, setOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carrega o inventário da API ao montar o componente
  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      setError(null);

      try {
        await carregarInventarioAPI(); // Atualiza a variável global 'inventario'
        const dados = obterInventario();

        // Calcula a quantidade disponível real
        const inventarioCalculado = dados.map(item => ({
          ...item,
          disponivel: item.total - (item.alugada + item.reservada),
        }));

        setInventario(inventarioCalculado);
        setOriginal(inventarioCalculado);
      } catch (err) {
        console.error("Falha ao carregar inventário:", err);
        setError("Não foi possível carregar o inventário. Verifique a ligação ao servidor.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  // Função para aplicar os filtros
  function aplicarFiltros() {
    const filtroNome = nome.trim().toLowerCase();

    const filtrado = original.filter((item) => {
      const porNome = !filtroNome || item.nome.toLowerCase().includes(filtroNome);

      let estadoItem = "disponivel";
      if (item.alugada > 0) estadoItem = "alugado";
      else if (item.reservada > 0) estadoItem = "reservado";

      const porEstado = estado === "todos" || estadoItem === estado;

      return porNome && porEstado;
    });

    setInventario(filtrado);
  }

  // Aplicar filtro automaticamente ao digitar ou mudar o estado (melhor UX)
  useEffect(() => {
    aplicarFiltros();
  }, [nome, estado, original]);

  // Função auxiliar para determinar o estado visual de cada item
  function getEstadoItem(item) {
    if (item.alugada > 0) return "alugado";
    if (item.reservada > 0) return "reservado";
    return "disponivel";
  }

  return (
    <section className="inventario-container">
      <h2 className="inventario-titulo">Consultar Inventário</h2>
      <p className="inventario-desc">
        Pesquise materiais e visualize quantidades, estado e disponibilidade.
      </p>

      <div className="inventario-filtros">
        <div className="filtro-grupo">
          <label>Nome do Material</label>
          <input
            type="text"
            placeholder="Ex: Betoneira"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="filtro-grupo">
          <label>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} disabled={loading}>
            <option value="todos">Todos</option>
            <option value="disponivel">Disponível</option>
            <option value="reservado">Reservado</option>
            <option value="alugado">Alugado</option>
            {/* Se quiseres adicionar "em-manutencao" no futuro, basta incluir aqui e no backend */}
          </select>
        </div>

        <button className="btn-acao" onClick={aplicarFiltros} disabled={loading}>
          Aplicar Filtros
        </button>
      </div>

      <div className="inventario-lista">
        {loading ? (
          <p style={{ textAlign: "center", padding: "40px" }}>
            A carregar inventário...
          </p>
        ) : error ? (
          <p style={{ textAlign: "center", color: "var(--cor-erro)", padding: "40px" }}>
            {error}
          </p>
        ) : inventario.length === 0 ? (
          <p className="inventario-vazio">
            {original.length === 0
              ? "O inventário está vazio."
              : "Nenhum material corresponde aos filtros aplicados."}
          </p>
        ) : (
          <table className="inv-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th style={{ textAlign: "center" }}>Disponível</th>
                <th style={{ textAlign: "center" }}>Alugada</th>
                <th style={{ textAlign: "center" }}>Reservada</th>
                <th style={{ textAlign: "center" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {inventario.map((item) => {
                const estadoItem = getEstadoItem(item);
                return (
                  <tr key={item.id} className={`estado-${estadoItem}`}>
                    <td className="nome-col">{item.nome}</td>
                    <td
                      className="qtd-col"
                      style={{
                        fontWeight: "bold",
                        color: "var(--cor-sucesso)",
                      }}
                    >
                      {item.disponivel}
                    </td>
                    <td className="qtd-col" style={{ color: "var(--cor-erro)" }}>
                      {item.alugada}
                    </td>
                    <td className="qtd-col" style={{ color: "var(--cor-aviso)" }}>
                      {item.reservada}
                    </td>
                    <td className="qtd-col">{item.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}