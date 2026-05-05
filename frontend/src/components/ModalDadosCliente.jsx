// src/components/ModalDadosCliente.jsx
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { API_URL, authFetch } from '../javascript/dados';
import './estilos/Modal.css';

export default function ModalDadosCliente({ mostrar, onConcluido, onFechar }) {
  const [telefone,    setTelefone]    = useState('');
  const [morada,      setMorada]      = useState('');
  const [tipoCliente, setTipoCliente] = useState('Particular');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro,        setErro]        = useState('');
  const [loading,     setLoading]     = useState(false);
  const [carregando,  setCarregando]  = useState(true);

  useEffect(() => {
    if (!mostrar) return;
    const buscarDados = async () => {
      setCarregando(true);
      setErro('');
      try {
        const res = await authFetch(`${API_URL}/clientes/meu-perfil`);
        if (res.ok) {
          const data = await res.json();
          setTelefone(data.telefone        || '');
          setMorada(data.morada            || data.endereco || '');
          setTipoCliente(data.tipo_cliente || 'Particular');
          setNomeEmpresa(data.nome_empresa || '');
        }
      } catch {
        // silencioso
      } finally {
        setCarregando(false);
      }
    };
    buscarDados();
  }, [mostrar]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    setErro('');
    const telLimpo = telefone.replace(/\D/g, '');
    if (telLimpo.length < 9) return setErro('Indique um número de telefone válido (mínimo 9 dígitos).');
    if (!morada.trim())       return setErro('Indique a sua morada ou localização.');
    if (tipoCliente === 'Empresa' && !nomeEmpresa.trim()) return setErro('Indique o nome da empresa.');

    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/clientes/meu-perfil`, {
        method: 'PUT',
        body: JSON.stringify({
          telefone:     telLimpo,
          endereco:     morada,
          tipo_cliente: tipoCliente,
          nome_empresa: tipoCliente === 'Empresa' ? nomeEmpresa.trim() : null,
          observacoes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.erro || 'Erro ao guardar dados.');
      onConcluido();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal mostrar={mostrar} fechar={onFechar}>
      <div className="modal-auth-header">
        <div className="modal-auth-icone">📋</div>
        <h2>Complete os seus dados</h2>
        <p>Precisamos de mais alguns dados para confirmar a entrega.</p>
      </div>

      {carregando ? (
        <p style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>A carregar dados…</p>
      ) : (
        <form onSubmit={handleGuardar} className="modal-auth-form">

          <div className="form-group">
  <label>
    Telefone <span style={{ color: '#e74c3c' }}>*</span>
  </label>
  <input
    type="tel"
    placeholder="Ex: 84 123 4567"
    value={telefone}
    maxLength={11}                       /* 9 dígitos + 2 espaços */
    inputMode="numeric"
    onChange={(e) => {
      // 1) só dígitos
      const apenasNumeros = e.target.value.replace(/\D/g, '').slice(0, 9);
      // 2) formatação automática: "84 123 4567"
      let formatado = apenasNumeros;
      if (apenasNumeros.length > 5) {
        formatado = `${apenasNumeros.slice(0, 2)} ${apenasNumeros.slice(2, 5)} ${apenasNumeros.slice(5)}`;
      } else if (apenasNumeros.length > 2) {
        formatado = `${apenasNumeros.slice(0, 2)} ${apenasNumeros.slice(2)}`;
      }
      setTelefone(formatado);
    }}
    required
  />

  {/* ── Mensagem de erro ── */}
  {telefone && (() => {
    const digitos = telefone.replace(/\D/g, '');
    const prefixosValidos = ['82', '83', '84', '85', '86', '87'];

    if (digitos.length > 0 && !prefixosValidos.includes(digitos.slice(0, 2))) {
      return (
        <small style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>
          O número deve começar com 82, 83, 84, 85, 86 ou 87.
        </small>
      );
    }
    if (digitos.length > 0 && digitos.length < 9) {
      return (
        <small style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>
          Faltam {9 - digitos.length} dígito(s) — o número deve ter 9 dígitos.
        </small>
      );
    }
    if (digitos.length === 9 && prefixosValidos.includes(digitos.slice(0, 2))) {
      return (
        <small style={{ color: '#16a34a', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>
         
        </small>
      );
    }
    return null;
  })()}
</div>

          <div className="form-group">
            <label>Morada / Localização <span style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="text" placeholder="Bairro 1, Macia"
              value={morada}
              onChange={e => setMorada(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de Cliente</label>
            <div className="transporte-opcoes">
              {['Particular', 'Empresa'].map(tipo => (
                <label key={tipo} className={`transporte-card ${tipoCliente === tipo ? 'selecionado' : ''}`}>
                  <input type="radio" name="tipoCliente" value={tipo}
                    checked={tipoCliente === tipo} onChange={() => setTipoCliente(tipo)} />
                  <div className="transporte-info">
                    <span>{tipo === 'Particular' ? '👤 Particular' : '🏢 Empresa'}</span>
                    <small>{tipo === 'Particular' ? 'Uso pessoal' : 'Uso empresarial'}</small>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {tipoCliente === 'Empresa' && (
            <div className="form-group">
              <label>Nome da Empresa <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="text" placeholder="Ex: Construções XYZ Lda."
                value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label>Observações (opcional)</label>
            <textarea
              placeholder="Ex: Entregar de manhã, portão azul…"
              value={observacoes} onChange={e => setObservacoes(e.target.value)}
              rows={3} style={{ resize: 'vertical', width: '100%', padding: '.7rem',
                borderRadius: 8, border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          {erro && <p className="error-message">{erro}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'A guardar…' : 'Confirmar e Concluir Reserva'}
          </button>

          <button type="button" className="btn-link"
            style={{ textAlign: 'center', marginTop: '.5rem' }} onClick={onConcluido}>
            Preencher mais tarde
          </button>
        </form>
      )}
    </Modal>
  );
}