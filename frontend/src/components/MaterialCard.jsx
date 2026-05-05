import React from "react";

export default function MaterialCard({ material, onAdicionarAoCarrinho }) {
  // Agora, o URL da imagem já vem completo do componente pai (ListaMateriais)
  // Apenas usamos um placeholder se a URL não existir.
  const imageUrl = material.imagem_url || "https://placehold.co/200";

  return (
    <div className="materiais-card">
      <div className="img-wrapper">
        <img
          src={imageUrl}
          alt={material.nome}
          loading="lazy"
        />
      </div>
      <div className="materiais-info">
        <span className="card-categoria">{material.nome_categoria || 'Sem categoria'}</span>
        <h3>{material.nome}</h3>
        <p className="materiais-preco">{parseFloat(material.preco_diaria || 0).toFixed(2)} Mts/dia</p>
        <button className="btn-adicionar" onClick={() => onAdicionarAoCarrinho(material)}>
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
}
