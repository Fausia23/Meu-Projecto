// src/components/Modal.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

export default function Modal({ mostrar, fechar, children }) {
  // Bloqueia o scroll do body quando o modal está aberto
  useEffect(() => {
    if (mostrar) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mostrar]);

  // Fecha ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mostrar) fechar();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mostrar, fechar]);

  if (!mostrar) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      onClick={fechar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-caixa"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-fechar"
          onClick={fechar}
          aria-label="Fechar modal"
        >
          &times;
        </button>

        <div className="modal-conteudo">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
