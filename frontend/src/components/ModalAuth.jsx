// src/components/ModalAuth.jsx
import React, { useState } from 'react';
import Modal from './Modal';
import { API_URL } from '../javascript/dados';
import './estilos/ModalAuth.css';

/**
 * Modal de Autenticação
 *
 * Props:
 *  - mostrar       : boolean
 *  - onFechar      : () => void
 *  - onAuthSuccess : ({ precisaCompletarDados }) => void
 *      Após login/registo com sucesso. Indica se ainda
 *      é preciso completar os dados de contacto.
 */
export default function ModalAuth({ mostrar, onAuthSuccess, onFechar }) {
  const [modo, setModo]           = useState('login');
  const [nome, setNome]           = useState('');
  const [email, setEmail]         = useState('');
  const [senha, setSenha]         = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [nuit, setNuit]           = useState('');
  const [verSenha, setVerSenha]   = useState(false);
  const [erro, setErro]           = useState('');
  const [loading, setLoading]     = useState(false);

  const limparForm = () => {
    setNome(''); setEmail(''); setSenha('');
    setConfirmar(''); setNuit(''); setErro('');
  };

  const trocarModo = (novoModo) => { setModo(novoModo); limparForm(); };

  /* ── Guarda sessão com TODAS as chaves (compat) ── */
  const guardarSessao = (data) => {
    const u = data.user || {};
    const idCliente = u.id_cliente ?? u.id;

    localStorage.setItem('token',     data.token);
    localStorage.setItem('userRole',  u.perfil || 'cliente');
    localStorage.setItem('userName',  u.nome || '');
    localStorage.setItem('userId',    String(u.id ?? ''));
    // Chaves usadas em diferentes partes do app
    localStorage.setItem('clienteId', String(idCliente ?? ''));
    localStorage.setItem('idCliente', String(idCliente ?? ''));
  };

  /* ── Verifica se o perfil já tem telefone + endereço ── */
  const verificarPerfil = async () => {
    try {
      const res = await fetch(`${API_URL}/clientes/meu-perfil`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) return { precisaCompletarDados: true };
      const data = await res.json();

      const morada = data.endereco || data.morada || '';
      const telefone = data.telefone || '';
      const precisaCompletarDados =
        telefone.trim() === '' || morada.trim() === '';

      return { precisaCompletarDados };
    } catch {
      return { precisaCompletarDados: true };
    }
  };

  /* ── LOGIN ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciais inválidas.');

      guardarSessao(data);
      limparForm();

      const perfilInfo = await verificarPerfil();
      onAuthSuccess(perfilInfo);

    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── REGISTO ── */
  const handleRegisto = async (e) => {
    e.preventDefault();
    setErro('');
    if (nuit.length !== 9)                   return setErro('O NUIT deve ter 9 dígitos.');
    if ([...nuit].every(c => c === nuit[0])) return setErro('NUIT inválido.');
    if (senha.length < 6)                    return setErro('Senha com mínimo 6 caracteres.');
    if (senha !== confirmar)                 return setErro('As senhas não coincidem.');

    setLoading(true);
    try {
      const resReg = await fetch(`${API_URL}/login/usuarios`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nome, email, senha, nuit }),
      });
      const dataReg = await resReg.json();
      if (!resReg.ok) throw new Error(dataReg.error || 'Erro ao criar conta.');

      // Auto-login após registo
      const resLogin = await fetch(`${API_URL}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, senha }),
      });
      const dataLogin = await resLogin.json();
      if (!resLogin.ok) throw new Error('Conta criada! Faça login manualmente.');

      guardarSessao(dataLogin);
      limparForm();

      // Novo registo → SEMPRE precisa completar dados (telefone/endereço)
      onAuthSuccess({ precisaCompletarDados: true });

    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal mostrar={mostrar} fechar={onFechar}>

      <div className="modal-auth-header">
        <div className="modal-auth-icone">🔐</div>
        <h2>{modo === 'login' ? 'Inicie Sessão para Reservar' : 'Crie a sua Conta'}</h2>
        <p>
          {modo === 'login'
            ? 'É necessário fazer login para finalizar a sua reserva.'
            : 'Registe-se gratuitamente e finalize a sua reserva.'}
        </p>
      </div>

      <div className="modal-auth-abas">
        <button
          type="button"
          className={`modal-auth-aba ${modo === 'login'   ? 'activa' : ''}`}
          onClick={() => trocarModo('login')}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`modal-auth-aba ${modo === 'registo' ? 'activa' : ''}`}
          onClick={() => trocarModo('registo')}
        >
          Registar
        </button>
      </div>

      {/* ── FORMULÁRIO LOGIN ── */}
      {modo === 'login' && (
        <form onSubmit={handleLogin} className="modal-auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div className="form-group">
            <label>Palavra-passe</label>
            <div className="password-input-container">
              <span className="login-icon"><i className="fas fa-lock" /></span>
              <input
                type={verSenha ? 'text' : 'password'} placeholder="••••••••"
                value={senha} onChange={e => setSenha(e.target.value)} required
              />
              <span className="password-toggle-icon" onClick={() => setVerSenha(!verSenha)}>
                <i className={verSenha ? 'fas fa-eye-slash' : 'fas fa-eye'} />
              </span>
            </div>
          </div>
          {erro && <p className="error-message">{erro}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'A entrar…' : 'Entrar e Reservar'}
          </button>
        </form>
      )}

      {/* ── FORMULÁRIO REGISTO ── */}
      {modo === 'registo' && (
        <form onSubmit={handleRegisto} className="modal-auth-form">
          <div className="form-group">
            <label>Nome Completo</label>
            <input
              type="text" placeholder="Ex: Fáusia Hleco"
              value={nome} onChange={e => setNome(e.target.value)} required
            />
          </div>
          <div className="form-group">
            <label>NUIT (9 dígitos)</label>
            <input
              type="text" placeholder="Ex: 400123456" maxLength={9}
              value={nuit}
              onChange={e => setNuit(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div className="form-group">
            <label>Palavra-passe</label>
            <div className="password-input-container">
              <span className="login-icon"><i className="fas fa-lock" /></span>
              <input
                type={verSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                value={senha} onChange={e => setSenha(e.target.value)} required
              />
              <span className="password-toggle-icon" onClick={() => setVerSenha(!verSenha)}>
                <i className={verSenha ? 'fas fa-eye-slash' : 'fas fa-eye'} />
              </span>
            </div>
          </div>
          <div className="form-group">
            <label>Confirmar Palavra-passe</label>
            <div className="password-input-container">
              <span className="login-icon"><i className="fas fa-lock" /></span>
              <input
                type={verSenha ? 'text' : 'password'} placeholder="Repita a palavra-passe"
                value={confirmar} onChange={e => setConfirmar(e.target.value)} required
              />
            </div>
          </div>
          {erro && <p className="error-message">{erro}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'A registar…' : 'Criar Conta e Reservar'}
          </button>
        </form>
      )}

      <p className="modal-auth-rodape">
        {modo === 'login'
          ? <> Não tem conta? <button type="button" className="btn-link" onClick={() => trocarModo('registo')}>Registe-se aqui</button></>
          : <> Já tem conta? <button type="button" className="btn-link" onClick={() => trocarModo('login')}>Faça Login</button></>
        }
      </p>

    </Modal>
  );
}