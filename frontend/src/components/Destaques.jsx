import React from "react";
import "./estilos/PaginaPrincipal.css";
import'./estilos/Materiais.css';

export default function Destaques() {
  return (
    <section className="destaques">
      <h2>Porquê Escolher a Alex Constructions?</h2>
      <div className="cards">
        <div className="card">
          <h3>Variedade</h3>
          <p>Ampla gama de equipamentos modernos e bem mantidos para todas as suas necessidades.</p>
        </div>
        <div className="card">
          <h3>Flexibilidade</h3>
          <p>Opções de aluguer flexíveis para curtos ou longos períodos, adaptadas ao seu projeto.</p>
        </div>
        <div className="card">
          <h3>Preços Competitivos</h3>
          <p>As melhores tarifas do mercado sem comprometer a qualidade e o serviço.</p>
        </div>
      </div>
    </section>
  );
}
