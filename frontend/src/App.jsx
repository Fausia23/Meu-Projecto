// src/App.js  —  ACTUALIZADO com rota /admin
import React from "react";
import { Routes, Route } from "react-router-dom";

import PaginaPrincipal from "./Paginas/PaginaPrincipal.jsx";
import Materiais       from "./Paginas/Materiais.jsx";
import OperadorArmazem from "./Paginas/OperadorArmazem.jsx";
import Login           from "./Paginas/Login.jsx";
import Admin           from "./Paginas/Admin.jsx";          // ← NOVO
import Gestor          from "./Paginas/Gestor.jsx";
import Cliente         from "./Paginas/Cliente.jsx";
import Reservas        from "./Paginas/Reservas.jsx";
import Registar        from "./Paginas/Registar.jsx";
import ProtectedRoute  from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/"          element={<PaginaPrincipal />} />
      <Route path="/materiais" element={<Materiais />} />
      <Route path="/login"     element={<Login />} />
      <Route path="/registar"  element={<Registar />} />
      <Route path="/reservas" element={<Reservas />} />

      {/* ── Rota Admin (acesso exclusivo ao admin) ── */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Admin />
        </ProtectedRoute>
      }/>

      {/* Rotas protegidas existentes */}
      <Route path="/operadorArmazem" element={
        <ProtectedRoute allowedRoles={['admin', 'funcionario']}>
          <OperadorArmazem />
        </ProtectedRoute>
      }/>
      <Route path="/gestor" element={
        <ProtectedRoute allowedRoles={['admin', 'gestor']}>
          <Gestor />
        </ProtectedRoute>
      }/>
      <Route path="/cliente" element={
        <ProtectedRoute allowedRoles={['admin', 'cliente']}>
          <Cliente />
        </ProtectedRoute>
      }/>
      {
      /* ── Rota Reservas (acesso exclusivo ao admin e cliente) ── */}
      
    </Routes>
  );
}

export default App;
