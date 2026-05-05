import React from "react";
import "./estilos/PaginaPrincipal.css";


export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Aluguer de Materiais de Construção Simplificado</h1>
        <p>Encontre as ferramentas e equipamentos perfeitos para o seu próximo projeto, com flexibilidade e os melhores preços.</p>
        <a href="/materiais" className="botao-principal">Ver Materiais Disponíveis</a>
      </div>
    </section>
  );
}
