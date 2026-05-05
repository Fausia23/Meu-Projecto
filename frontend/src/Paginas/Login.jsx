import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from '../javascript/dados';
import "../components/estilos/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState(""); 
  const [verSenha, setVerSenha] = useState(false); // Estado para controlar a visibilidade da senha
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
 const response = await fetch(`${API_URL}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, senha }),
});

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Email ou palavra-passe incorretos.");
      }

      
      // 1. Guardar o Token JWT (O seu crachá de segurança)
      localStorage.setItem("token", data.token);
      
      // 2. Guardar dados do utilizador para usar no site
      localStorage.setItem("userRole", data.user.perfil); // Alterado para userRole
      localStorage.setItem("userName", data.user.nome);
      localStorage.setItem("userId", data.user.id);

      // 3. Redirecionamento baseado no Perfil (Role)
    const ROTAS_POR_PERFIL = {
  admin:       '/admin',
  gestor:      '/gestor',
  funcionario: '/operadorArmazem',
  cliente:     '/cliente',
};

const rota = ROTAS_POR_PERFIL[data.user.perfil] ?? '/cliente';
navigate(rota);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-body">
      <div className="login-box">
        <h2>Bem-vindo de Volta!</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label htmlFor="email">Endereço de Email</label>
            <input
              type="email"
              id="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
  <label htmlFor="senha">Palavra-passe</label>

  <div className="password-input-container">

    {/* Ícone de Login dentro da caixa */}
    <span className="login-icon">
      <i className="fas fa-lock"></i>
    </span>

    <input
      type={verSenha ? "text" : "password"}
      id="senha"
      placeholder="••••••••"
      value={senha}
      onChange={(e) => setSenha(e.target.value)}
      required
    />

    {/* Ícone de mostrar senha */}
    <span
      className="password-toggle-icon"
      onClick={() => setVerSenha(!verSenha)}
    >
      <i className={verSenha ? "fas fa-eye-slash" : "fas fa-eye"}></i>
    </span>
  </div>
</div>


          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="register-link">
          Não tem uma conta? <Link to="/Registar">Registe-se aqui</Link>
        </p>
      </div>

      <footer className="footer-login">
        <p>&copy; 2025 Alex Constructions. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Login;