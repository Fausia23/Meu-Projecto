export default function GestorMenu({ tab, setTab }) {
  const botoes = [
    { id: "catalogo", icon: "fa-boxes", label: "Catálogo" },
    { id: "clientes", icon: "fa-users", label: "Clientes" },
    { id: "reservas", icon: "fa-calendar-alt", label: "Reservas" },
    { id: "entregas", icon: "fa-truck", label: "Entregas" },
    { id: "devolucoes", icon: "fa-undo", label: "Devoluções" },
    { id: "faturas", icon: "fa-file-invoice-dollar", label: "Faturas" },
    { id: "pagamentos", icon: "fa-money-check-alt", label: "Pagamentos" },
    { id: "relatorios", icon: "fa-chart-line", label: "Relatórios" }
  ];

  return (
    <nav className="gestor-menu">
      <div className="tab-button">
        {botoes.map(btn => (
          <button
            key={btn.id}
            className={tab === btn.id ? "active" : ""}
            onClick={() => setTab(btn.id)}
          >
            <i className={`fas ${btn.icon}`}></i> {btn.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
