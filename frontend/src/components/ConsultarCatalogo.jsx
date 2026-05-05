import React from "react";
import ListaMateriais from "./ListaMateriais";

export default function ConsultarCatalogo() {
  return (
    <section id="consultar-catalogo" className="tab-content">
      <h2>Catálogo de Materiais</h2>
      {/* O componente ListaMateriais já inclui os filtros e a grelha */}
      <ListaMateriais />
    </section>
  );
}
