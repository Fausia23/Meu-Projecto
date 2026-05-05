// src/Paginas/Cliente.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header   from "../components/ClienteHeader";
import Tabs     from "../components/ClienteTabs";
import Perfil   from "../components/ClientePerfil";
import Reservas from "../components/ClientesReserva";
import Footer   from "../components/ClienteFooter";
import "../components/estilos/Cliente.css";
import "../components/estilos/PaginaPrincipal.css";

export default function Cliente() {
  const [nomeUtilizador, setNomeUtilizador] = useState("");
  const [abaAtual,       setAbaAtual]       = useState("reservas");

  const navigate = useNavigate();
  const location = useLocation();

  // ── Verificação de sessão ────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("userRole");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // Bloqueia acesso se não for cliente
    if (role !== "cliente" && role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    // Usa apenas o primeiro nome
    const nome = localStorage.getItem("userName") || "Cliente";
    setNomeUtilizador(nome.split(" ")[0]);
  }, [navigate]);

  // ── Se chegou com uma reserva acabada de criar → vai para o tab "reservas"
  useEffect(() => {
    if (location.state?.reservaCriada) {
      setAbaAtual("reservas");
    }
  }, [location.state]);

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div>
      <Header onLogout={handleLogout} />

      <main className="page-content">
        <div className="container">
          <section className="cliente-header">
            <h1>Bem-vindo, {nomeUtilizador}!</h1>
            <p>
              Gira o seu perfil e acompanhe as suas reservas de forma simples e
              rápida.
            </p>
          </section>

          <Tabs abaAtual={abaAtual} setAbaAtual={setAbaAtual} />

          {abaAtual === "perfil"   && <Perfil />}
          {abaAtual === "reservas" && <Reservas setAbaAtual={setAbaAtual} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}