import React from "react";
import "./estilos/Materiais.css";
import ListaMateriais from "./ListaMateriais";

export default function CarrosselMateriais() {
  return (
    <section className="container">
      <ListaMateriais
        termo=""
        categoria=""
        ordem=""
      />
    </section>
  );
}
