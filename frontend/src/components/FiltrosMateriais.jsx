import React, { useMemo } from "react";
import cartIcon from '../assets/imagens/Carrinho-De-Compras.webp';
import "./estilos/Materiais.css";

export default function FiltrosMateriais({
  termo,
  setTermo,
  categoria,
  setCategoria,
  ordem,
  setOrdem,
  itensCarrinho,
  onAbrirCarrinho,
}) {
  const totalItens = useMemo(
    () => (itensCarrinho || []).reduce((acc, item) => acc + item.quantidade, 0),
    [itensCarrinho]
  );

  return (
    <section className="materiais-filtros">
      <input
        type="search"
        placeholder="Pesquisar material..."
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
      />

      <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
        <option value="">Todas as Categorias</option>
        <option value="1">Ferramentas Elétricas</option>
        <option value="2">Máquinas Pesadas</option>
        <option value="5">Diversos</option>
      </select>

      <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
        <option value="">Ordenar por</option>
        <option value="preco_asc">Preço: Menor → Maior</option>
        <option value="preco_desc">Preço: Maior → Menor</option>
        <option value="nome_asc">Nome A-Z</option>
      </select>

      <button
        className="carrinho-botao-filtro"
        onClick={onAbrirCarrinho}
        title="Ver carrinho"
      >
        <img src={cartIcon} alt="Carrinho de compras" />
        {totalItens > 0 && <span className="carrinho-badge">{totalItens}</span>}
      </button>
    </section>
  );
}