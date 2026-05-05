import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Componente de Rota Protegida para controlar o acesso baseado em roles.
 * @param {object} props
 * @param {string[]} props.allowedRoles - Array de roles permitidas para aceder a esta rota.
 * @param {JSX.Element} props.children - O componente a ser renderizado se o acesso for permitido.
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  // Obter o token e o cargo (role) do utilizador do localStorage
  // É crucial que o seu componente de Login guarde esta informação após a autenticação.
  const userToken = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole'); 

  if (!userToken) {
    // Se não houver token, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Se o utilizador não tiver a role permitida, redireciona para uma página de acesso negado ou para a página principal
    return <Navigate to="/" replace />; // Ou para uma página de erro 403
  }

  // Se o acesso for permitido, renderiza os componentes filhos
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
