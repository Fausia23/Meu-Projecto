// src/components/AdminTabs/AdminHeader.jsx
import React from "react";

export default function AdminHeader({ onLogout }) {
  const nome = localStorage.getItem("userName") || "Administrador";

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <div className="admin-logo">
          <span className="admin-logo-icon">⚙</span>
          <div>
            <h1>Painel de Administração</h1>
            <p>Alex Constructions — Acesso Total ao Sistema</p>
          </div>
        </div>
      </div>

      <div className="admin-header-right">
        <div className="admin-user-info">
          <div className="admin-avatar">
            {nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="admin-user-name">{nome}</span>
            <span className="admin-user-role">Administrador</span>
          </div>
        </div>
        <button className="admin-btn-logout" onClick={onLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}
