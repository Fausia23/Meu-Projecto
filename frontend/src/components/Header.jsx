import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./estilos/PaginaPrincipal.css";
import "./estilos/Materiais.css";   // <-- CORRIGIDO

export default function Header() {
  const [menuAtivo, setMenuAtivo] = useState(false);

  return (
    <header className="cabecalho">
      <div className="container">

        <Link to="/" className="logo">Alex Constructions</Link>

        <nav className={`menu-navegacao ${menuAtivo ? "is-active" : ""}`}>
          <ul>
            <li><Link to="/" className="active">Início</Link></li>
            <li><Link to="/materiais">Materiais</Link></li>
            <li><a href="#servicos">Serviços</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
        </nav>

        <div className="login-area">
          <Link to="/login" className="botao-login">Login</Link>
        </div>

        <button
          className={`hamburger-icon ${menuAtivo ? "is-active" : ""}`}
          aria-label="Abrir Menu"
          onClick={() => setMenuAtivo(!menuAtivo)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  );
}
