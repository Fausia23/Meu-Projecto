
export const ROLES = {
  ADMIN: 'admin',
  GESTOR: 'gestor',
  FUNCIONARIO: 'funcionario',
  CLIENTE: 'cliente',
};

// Hierarquia de permissões por recurso
export const PERMISSOES = {
  usuarios:       [ROLES.ADMIN],
  relatorios:     [ROLES.ADMIN, ROLES.GESTOR],
  stock:          [ROLES.ADMIN, ROLES.GESTOR, ROLES.FUNCIONARIO],
  pedidos:        [ROLES.ADMIN, ROLES.GESTOR, ROLES.FUNCIONARIO, ROLES.CLIENTE],
};