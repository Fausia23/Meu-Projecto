// src/hooks/useReservaFlow.js


import { useState, useCallback } from 'react';
import { API_URL, authFetch } from '../javascript/dados';

// ── etapas do fluxo ──────────────────────────────────────────
const ETAPA = {
  NENHUMA:       'NENHUMA',
  AUTH:          'AUTH',
  DADOS_CLIENTE: 'DADOS_CLIENTE',
  CRIANDO:       'CRIANDO',
  SUCESSO:       'SUCESSO',
  ERRO:          'ERRO',
};

export function useReservaFlow() {
  /* ── estado do carrinho ── */
  const [itens,       setItens]       = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [datasReserva, setDatasReserva] = useState({ dataInicio: '', dataFim: '' });

  /* ── estado do fluxo ── */
  const [etapa,          setEtapa]          = useState(ETAPA.NENHUMA);
  const [reservaCriada,  setReservaCriada]  = useState(null);  // dados da reserva após sucesso
  const [erroFluxo,      setErroFluxo]      = useState('');

  /* ══════════════════════════════════════════
     CARRINHO — helpers
  ══════════════════════════════════════════ */
  const adicionarItem = useCallback((material, quantidade = 1) => {
    setItens(prev => {
      const idx = prev.findIndex(i => i.id_material === material.id_material);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = {
          ...copia[idx],
          quantidade: Math.min(
            copia[idx].quantidade + quantidade,
            material.quantidade_disponivel || 999
          ),
        };
        return copia;
      }
      return [...prev, { ...material, quantidade }];
    });
  }, []);

  const atualizarQuantidade = useCallback((id_material, quantidade) => {
    if (quantidade < 1) return;
    setItens(prev =>
      prev.map(i => i.id_material === id_material ? { ...i, quantidade } : i)
    );
  }, []);

  const removerItem = useCallback((id_material) => {
    setItens(prev => prev.filter(i => i.id_material !== id_material));
  }, []);

  const limparCarrinho = useCallback(() => {
    setItens([]);
    setDatasReserva({ dataInicio: '', dataFim: '' });
  }, []);

  const alterarDatas = useCallback((campo, valor) => {
    setDatasReserva(prev => ({ ...prev, [campo]: valor }));
  }, []);

  /* ══════════════════════════════════════════
     FLUXO — etapa 1: cliente clica "Confirmar Reserva"
  ══════════════════════════════════════════ */
  const iniciarReserva = useCallback(() => {
    setErroFluxo('');
    const token = localStorage.getItem('token');
    if (!token) {
      // Não autenticado → mostrar modal de login
      setEtapa(ETAPA.AUTH);
    } else {
      // Já autenticado → verificar perfil directamente
      setEtapa(ETAPA.CRIANDO);
      verificarPerfilEContinuar();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ══════════════════════════════════════════
     FLUXO — etapa 2: callback do ModalAuth
  ══════════════════════════════════════════ */
  const onAuthSuccess = useCallback(({ precisaCompletarDados }) => {
    setEtapa(ETAPA.NENHUMA); // fecha o modal auth
    if (precisaCompletarDados) {
      setEtapa(ETAPA.DADOS_CLIENTE);
    } else {
      criarReserva();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ══════════════════════════════════════════
     FLUXO — etapa 3: callback do ModalDadosCliente
  ══════════════════════════════════════════ */
  const onDadosConcluidos = useCallback(() => {
    setEtapa(ETAPA.NENHUMA);
    criarReserva();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ══════════════════════════════════════════
     FLUXO — verificar perfil (já autenticado)
  ══════════════════════════════════════════ */
  const verificarPerfilEContinuar = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/clientes/meu-perfil`);
      if (!res.ok) { setEtapa(ETAPA.DADOS_CLIENTE); return; }
      const data = await res.json();

      const precisaCompletarDados =
        !data.telefone || data.telefone.trim() === '' ||
        !data.endereco || data.endereco.trim() === '';

      if (precisaCompletarDados) {
        setEtapa(ETAPA.DADOS_CLIENTE);
      } else {
        criarReserva();
      }
    } catch {
      setEtapa(ETAPA.DADOS_CLIENTE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ══════════════════════════════════════════
     FLUXO — criar a reserva na API
  ══════════════════════════════════════════ */
  const criarReserva = useCallback(async () => {
    setEtapa(ETAPA.CRIANDO);
    setErroFluxo('');

    try {
      const payload = {
        data_inicio: datasReserva.dataInicio,
        data_fim:    datasReserva.dataFim,
        itens: itens.map(i => ({
          id_material: i.id_material,
          quantidade:  i.quantidade,
        })),
      };

      const res = await authFetch(`${API_URL}/reservas`, {
        method: 'POST',
        body:   JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.error || 'Erro ao criar reserva.');

      setReservaCriada(data);
      setEtapa(ETAPA.SUCESSO);
      limparCarrinho();
      setCarrinhoAberto(false);

    } catch (err) {
      setErroFluxo(err.message);
      setEtapa(ETAPA.ERRO);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasReserva, itens]);

  /* ══════════════════════════════════════════
     RESET
  ══════════════════════════════════════════ */
  const resetFluxo = useCallback(() => {
    setEtapa(ETAPA.NENHUMA);
    setErroFluxo('');
    setReservaCriada(null);
  }, []);

  /* ══════════════════════════════════════════
     RETURN
  ══════════════════════════════════════════ */
  return {
    // Carrinho
    itens,
    carrinhoAberto,
    setCarrinhoAberto,
    datasReserva,
    adicionarItem,
    atualizarQuantidade,
    removerItem,
    limparCarrinho,
    alterarDatas,

    // Fluxo
    etapa,
    ETAPA,
    iniciarReserva,
    onAuthSuccess,
    onDadosConcluidos,
    resetFluxo,
    reservaCriada,
    erroFluxo,
  };
}