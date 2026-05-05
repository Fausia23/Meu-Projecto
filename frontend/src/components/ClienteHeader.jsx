import { Link } from "react-router-dom";
import "./estilos/Cliente.css";
import "./estilos/PaginaPrincipal.css";

export default function Header({ onLogout }) {
  return (
    <header className="cabecalho">
      <div className="container">
        <Link to="/" className="logo" aria-label="Voltar à página principal">
          Alex Constructions
        </Link>

        <button onClick={onLogout} className="btn-secundaria pequeno" aria-label="Terminar sessão">
          Sair
        </button>
      </div>
    </header>
  );
}
