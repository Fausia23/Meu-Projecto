// src/components/Carrinho.jsx
import React, { useMemo, useState } from 'react';
import ModalAuth from './ModalAuth';
import { API_URL } from '../javascript/dados';
import './estilos/Carrinho.css';

export default function Carrinho({
  itens,
  aberto,
  onFechar,
  onUpdateQuantidade,
  onRemoverItem,
  onLimparCarrinho,
  onFinalizarReserva,
}) {
  const [mostrarModalAuth, setMostrarModalAuth] = useState(false);
  const [verificando, setVerificando]           = useState(false);

  const subtotal = useMemo(
    () => itens.reduce((acc, item) => acc + item.preco_diaria * item.quantidade, 0),
    [itens]
  );

  // ── Limpa toda a sessão ──────────────────────────────────────────────────
  const limparSessao = () => {
    ['token', 'userId', 'clienteId', 'idCliente', 'userRole', 'userName']
      .forEach((k) => localStorage.removeItem(k));
  };

  // ── Valida token chamando /clientes/meu-perfil ───────────────────────────
  const tokenValido = async (token) => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000); // timeout 6s
      const res = await fetch(`${API_URL}/clientes/meu-perfil`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  };

  // ── Clique em "Confirmar Reserva" ────────────────────────────────────────
  const handleConfirmarReserva = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const token = localStorage.getItem('token');
    const idCliente =
      localStorage.getItem('clienteId') ||
      localStorage.getItem('idCliente') ||
      localStorage.getItem('userId');

    // Sem sessão → abre modal de login/registo
    if (!token || !idCliente) {
      limparSessao();
      setMostrarModalAuth(true);
      return;
    }

    // Com sessão → valida com o backend
    setVerificando(true);
    const ok = await tokenValido(token);
    setVerificando(false);

    if (!ok) {
      limparSessao();
      setMostrarModalAuth(true);
      return;
    }

    // Sessão válida → segue para a página de reservas
    onFinalizarReserva();
  };

  // ── Após login/registo ───────────────────────────────────────────────────
  const handleAuthSuccess = () => {
    setMostrarModalAuth(false);
    onFinalizarReserva();
  };

  // ── Quando o modal de auth fecha sem login ───────────────────────────────
  const handleAuthFechar = () => {
    setMostrarModalAuth(false);
  };

  if (!aberto) return null;

  const temSessao = !!localStorage.getItem('token');

  return (
    <>
      {/* O carrinho só é exibido quando o modal de autenticação NÃO está aberto.
          Mantemos o componente montado para preservar o state.                  */}
      {!mostrarModalAuth && (
        <div className="carrinho-overlay" onClick={onFechar}>
          <div
            className="carrinho-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="carrinho-header">
              <h3>
                <i className="fas fa-shopping-cart" style={{ marginRight: 8 }} />
                Carrinho
                {itens.length > 0 && (
                  <span className="carrinho-badge">{itens.length}</span>
                )}
              </h3>
              <button
                type="button"
                className="carrinho-fechar-btn"
                onClick={onFechar}
                aria-label="Fechar carrinho"
              >
                &times;
              </button>
            </div>

            {/* ── Body ── */}
            <div className="carrinho-body">
              {itens.length === 0 ? (
                <div className="carrinho-vazio">
                  <i
                    className="fas fa-box-open"
                    style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 12 }}
                  />
                  <p>O seu carrinho está vazio.</p>
                </div>
              ) : (
                itens.map((item) => (
                  <div key={item.id_material} className="carrinho-item">
                    <img
                      src={item.imagem_url || 'https://placehold.co/60x60?text=📦'}
                      alt={item.nome}
                      className="carrinho-item-img"
                    />
                    <div className="carrinho-item-detalhes">
                      <p className="carrinho-item-nome">{item.nome}</p>
                      <p className="carrinho-item-preco">
                        {item.preco_diaria.toFixed(2)} MT/dia
                      </p>
                      <div className="carrinho-item-acoes">
                        <button
                          type="button"
                          className="carrinho-qtd-btn"
                          onClick={() =>
                            onUpdateQuantidade(item.id_material, item.quantidade - 1)
                          }
                          disabled={item.quantidade <= 1}
                        >
                          −
                        </button>
                        <span className="carrinho-qtd-valor">
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          className="carrinho-qtd-btn"
                          onClick={() =>
                            onUpdateQuantidade(item.id_material, item.quantidade + 1)
                          }
                          disabled={
                            item.quantidade >= (item.quantidade_disponivel || 100)
                          }
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoverItem(item.id_material)}
                          className="carrinho-remover-item-btn"
                          title="Remover item"
                        >
                          <i className="fas fa-trash-alt" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Footer ── */}
            {itens.length > 0 && (
              <div className="carrinho-footer">
                <div className="carrinho-resumo">
                  <div className="carrinho-subtotal">
                    <span>Subtotal/dia</span>
                    <strong>{subtotal.toFixed(2)} MT</strong>
                  </div>
                  <p className="carrinho-hint">
                    <i
                      className="fas fa-info-circle"
                      style={{ marginRight: 4 }}
                    />
                    {temSessao
                      ? 'As datas serão definidas na próxima etapa'
                      : 'Será pedido login antes de definir as datas'}
                  </p>
                </div>

                <button
                  type="button"
                  className="carrinho-finalizar-btn"
                  onClick={handleConfirmarReserva}
                  disabled={verificando}
                >
                  {verificando ? (
                    <>
                      <i
                        className="fas fa-spinner fa-spin"
                        style={{ marginRight: 8 }}
                      />
                      A verificar sessão...
                    </>
                  ) : temSessao ? (
                    <>
                      <i
                        className="fas fa-arrow-right"
                        style={{ marginRight: 8 }}
                      />
                       Reservar
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock" style={{ marginRight: 8 }} />
                      Iniciar Sessão e Reservar
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onLimparCarrinho}
                  className="btn-limpar-carrinho"
                >
                  <i className="fas fa-trash" style={{ marginRight: 6 }} />
                  Limpar Carrinho
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal de Autenticação (apenas quando necessário) ─────────────── */}
      {mostrarModalAuth && (
        <ModalAuth
          mostrar={true}
          onAuthSuccess={handleAuthSuccess}
          onFechar={handleAuthFechar}
        />
      )}
    </>
  );
}