// src/components/AdminTabs/AdminMenu.jsx
import React from "react";

const MENUS = [
  { key: "utilizadores", label: "Utilizadores",  icon: "👥" },
  { key: "clientes",     label: "Clientes",       icon: "🤝" },
  { key: "catalogo",     label: "Catálogo",        icon: "📦" },
  { key: "entregas",     label: "Entregas",        icon: "🚚" },
  { key: "devolucoes",   label: "Devoluções",      icon: "↩️"  },
  { key: "reservas",     label: "Reservas",        icon: "📋" },
  { key: "relatorios",   label: "Relatórios",      icon: "📊" },
];

export default function AdminMenu({ tab, setTab }) {
  return (
    <aside className="admin-sidebar">
      <nav className="admin-nav">
        <p className="admin-nav-label">Menu</p>
        {MENUS.map((item) => (
          <button
            key={item.key}
            className={`admin-nav-item ${tab === item.key ? "active" : ""}`}
            onClick={() => setTab(item.key)}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
