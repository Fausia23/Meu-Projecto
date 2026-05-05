// pages/Registar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../javascript/dados';
import '../components/estilos/Registo.css';

export default function Registar() {
  const [nome,          setNome]          = useState('');
  const [email,         setEmail]         = useState('');
  const [senha,         setSenha]         = useState('');
  const [confirmarSenha,setConfirmarSenha]= useState('');
  const [nuit,          setNuit]          = useState('');
  const [verSenha,      setVerSenha]      = useState(false);

  const [erro,      setErro]      = useState('');
  const [sucesso,   setSucesso]   = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // ── Validações frontend ──────────────────────────────────
  const validarFormulario = () => {
    // ✅ Validação de comprimento ANTES de verificar dígitos iguais
    if (nuit.length !== 9)
      return 'O NUIT deve ter exactamente 9 dígitos.';

    if ([...nuit].every(c => c === nuit[0]))
      return 'O NUIT não pode ter todos os dígitos iguais.';

    if (senha.length < 6)
      return 'A palavra-passe deve ter no mínimo 6 caracteres.';

    if (senha !== confirmarSenha)
      return 'As palavras-passe não coincidem.';

    return null; // sem erros
  };

  // ── Submit ───────────────────────────────────────────────
  const handleRegisto = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const erroValidacao = validarFormulario();
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login/usuarios`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nome, email, senha, nuit }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`);

      setSucesso('Conta criada com sucesso! A redirecionar...');
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      setErro(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-body">
      <div className="login-box">
        <h2>Criar Nova Conta</h2>
        <p>Registe-se para começar a alugar na Alex Constructions.</p>

        <form onSubmit={handleRegisto}>

          {/* Nome */}
          <div className="form-group">
            <label htmlFor="nome">Nome Completo</label>
            <input
              type="text"
              id="nome"
              placeholder="Ex: Fáusia Hleco"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          {/* NUIT */}
          <div className="form-group">
            <label htmlFor="nuit">NUIT (9 Dígitos)</label>
            <input
              type="text"
              id="nuit"
              value={nuit}
              pattern="[0-9]{9}"
              maxLength="9"
              placeholder="Ex: 400123456"
              onChange={(e) => setNuit(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Senha */}
          <div className="form-group">
            <label htmlFor="senha">Palavra-passe</label>
            <div className="password-input-container">
              <span className="login-icon">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type={verSenha ? 'text' : 'password'}
                id="senha"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <span
                className="password-toggle-icon"
                onClick={() => setVerSenha(!verSenha)}
              >
                <i className={verSenha ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
              </span>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar Palavra-passe</label>
            <div className="password-input-container">
              <span className="login-icon">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type={verSenha ? 'text' : 'password'}
                id="confirmarSenha"
                placeholder="Repita a palavra-passe"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Feedback */}
          {erro    && <p className="error-message">{erro}</p>}
          {sucesso && <p className="success-message" style={{ color: '#28a745', fontWeight: 'bold' }}>{sucesso}</p>}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'A Registar...' : 'Criar Conta'}
          </button>
        </form>

        <p className="register-link">
          Já tem uma conta? <Link to="/login">Faça Login</Link>
        </p>
      </div>

      <footer className="footer-login">
        <p>&copy; 2025 Alex Constructions. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}