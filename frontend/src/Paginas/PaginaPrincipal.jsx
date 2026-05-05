import React from "react";

import CarrosselDestaques from "./CarrosselDestaques"; // Corrigindo o caminho da importação

import '../components/estilos/PaginaPrincipal.css';

import Header from "../components/Header";        
import Footer from "../components/Footer";

export default function PaginaPrincipal() {
  return (
    <div className="pagina-container">
      <Header />

      <main className="conteudo-principal">
        <CarrosselDestaques />
      </main>
     <div className="footer-wrapper">
        <Footer />
     </div>
    </div>
  );
}
