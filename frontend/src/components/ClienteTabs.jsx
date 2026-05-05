import React from "react";

export default function Tabs({ abaAtual, setAbaAtual }) {
  const mudarAba = (tab) => {
    setAbaAtual(tab);
  };

  return (
    <nav className="cliente-tabs" aria-label="Navegação da área do cliente">
      <button
        className={`tab-button ${abaAtual === "reservas" ? "active" : ""}`}
        onClick={() => mudarAba("reservas")}
        aria-pressed={abaAtual === "reservas"}
      >
        Reservas
      </button>

      <button
        className={`tab-button ${abaAtual === "perfil" ? "active" : ""}`}
        onClick={() => mudarAba("perfil")}
        aria-pressed={abaAtual === "perfil"}
      >
        Perfil
      </button>
    </nav>
  );
}
