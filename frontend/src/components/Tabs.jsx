import React from 'react';


const tabs = [
{ id: 'entregas', label: 'Entregas' },
{ id: 'devolucoes', label: 'Devoluções' },
{ id: 'consultar-reservas', label: 'Consultar Reservas' },
{ id: 'consultar-inventario', label: 'Consultar Inventário' },
{ id: 'catalogo', label: 'Catálogo de Materiais' }
];


export default function Tabs({ active, onChange }) {
return (
<nav className="armazem-tabs">
<div className="armazem-botoes">
{tabs.map((t) => (
<button
key={t.id}
className={t.id === active ? 'active' : ''}
onClick={() => onChange(t.id)}
aria-pressed={t.id === active}
>
{t.label}
</button>
))}
</div>
</nav>
);
}