// src/javascript/dados.js
// src/javascript/dados.js

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:3001";
export const BASE_URL = BACKEND;
export const API_URL = `${BACKEND}/api`;
  

/**
 * Busca todos os materiais da API.
 */
// Função auxiliar — sempre envia o token JWT
export function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export async function obterMateriaisAPI(  ) {
  try {
    const response = await authFetch(`${API_URL}/materiais`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    const materiais = await response.json();
    return materiais.map(m => ({ ...m, preco_diaria: parseFloat(m.preco_diaria || 0) }));

  }
  catch (error) {
    console.error("Erro ao buscar materiais da API:", error);
    throw error;
  }
}

/**
 * Adiciona um novo material através da API.
 */
/*
export async function adicionarMaterialAPI(material) {
  try {
    const response = await fetch(`${API_URL}/materiais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material),
    });
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Erro ao adicionar material via API:", error);
    throw error;
  }
}
*/

export async function adicionarMaterialAPI(material) {
  const response = await authFetch(`${API_URL}/materiais`, {
    method: 'POST',
    body: JSON.stringify(material),
  });
  if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
  return await response.json();
}



/**
 * Descarrega o recibo de uma entrega em formato PDF.
 */
/*
export async function baixarReciboEntregaAPI(id_entrega, codigo_entrega) {
  try {
    const response = await fetch(`${API_URL}/entregas/${id_entrega}/recibo-pdf`);
    if (!response.ok) {
      const erro = await response.json().catch(() => null);
      throw new Error(erro?.erro || 'Falha ao descarregar o recibo em PDF.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo_${codigo_entrega}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erro ao descarregar o recibo:", error);
    alert(error.message);
  }
}*/


export async function baixarReciboEntregaAPI(id_entrega, codigo_entrega) {
  const response = await authFetch(`${API_URL}/entregas/${id_entrega}/recibo-pdf`);
  if (!response.ok) {
    const erro = await response.json().catch(() => null);
    throw new Error(erro?.erro || 'Falha ao descarregar o recibo em PDF.');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recibo_${codigo_entrega}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/*  INVENTÁRIO (fonte de verdade do backend)*/

// Variável global que vai guardar o inventário mais recente
export let inventario = [];

/**
 * Carrega o inventário completo diretamente do backend.
 * Inclui: total, disponível, alugada e reservada (calculado em tempo real no servidor).
 */
/*
export async function carregarInventarioAPI() {
  try {
    const response = await fetch(`${API_URL}/materiais/inventario`);
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar inventário: ${response.status}`);
    }

    const data = await response.json();

    // Atualiza a variável global
    inventario = data.map(item => ({
      id: item.id,
      nome: item.nome,
      total: Number(item.total),
      disponivel: Number(item.disponivel),
      alugada: Number(item.alugada),
      reservada: Number(item.reservada),
    }));

    console.log("Inventário carregado com sucesso:", inventario);
    return inventario;

  } catch (error) {
    console.error("Erro ao carregar inventário da API:", error);
    alert("Não foi possível carregar o inventário. Verifique a ligação ao servidor.");
    return [];
  }
}*/


export async function carregarInventarioAPI() {
  const response = await authFetch(`${API_URL}/materiais/inventario`);
  if (!response.ok) throw new Error(`Erro ao carregar inventário: ${response.status}`);
  const data = await response.json();
  inventario = data.map(item => ({
    id: item.id,
    nome: item.nome,
    total: Number(item.total),
    disponivel: Number(item.disponivel),
    alugada: Number(item.alugada),
    reservada: Number(item.reservada),
  }));
  return inventario;
}

/**
 * Retorna o inventário atual (já carregado).
 * Use esta função nos componentes React depois de chamar carregarInventarioAPI().
 */
export function obterInventario() {
  return inventario;
}

/* 
   RESERVAS PENDENTES & ALUGUERES ATIVOS
 */
export let reservasPendentes = [];
export let alugueresAtivos = [];

/* 
   CATÁLOGO SIMPLES (para cliente)
*/
export let catalogo = [];

/**
 * Carrega o catálogo simples (para página do cliente)
 */
export async function carregarCatalogoAPI() {
  try {
    const materiais = await obterMateriaisAPI();
    catalogo = materiais.filter(m => m.quantidade_disponivel > 0);
    return catalogo;
  } catch (error) {
    console.error("Erro ao carregar catálogo:", error);
    return [];
  }
}

export function obterCatalogo() {
  return catalogo;
}

/* =============================================
   ALUGUERES (localStorage – apenas para simulação offline ou carrinho temporário)
============================================= */
export function adicionarAluguer(aluguer) {
  const lista = JSON.parse(localStorage.getItem("alugueres") || "[]");
  lista.push(aluguer);
  localStorage.setItem("alugueres", JSON.stringify(lista));
}

export function fetchAluguer(id) {
  return alugueresAtivos.find(a => a.id.toString() === id.toString());
}

export function removerAluguer(id) {
  let lista = JSON.parse(localStorage.getItem("alugueres") || "[]");
  lista = lista.filter(a => a.id.toString() !== id.toString());
  localStorage.setItem("alugueres", JSON.stringify(lista));
}

export function obterAlugueres() {
  return JSON.parse(localStorage.getItem("alugueres") || "[]");
}

/* =============================================
   RESERVAS
============================================= */
export function obterReservasPendentes() {
  return reservasPendentes.filter(r => r.status === "pendente");
}

export function encontrarReservaPendente(id) {
  return reservasPendentes.find(r => r.id === id && r.status === "pendente");
}

export function atualizarReservaStatus(id, novoStatus) {
  const r = reservasPendentes.find(r => r.id === id);
  if (r) r.status = novoStatus;
}

export function obterTodasAsReservas(filtro = null) {
  if (!filtro) return reservasPendentes;
  return reservasPendentes.filter(r => r.status === filtro);
}

export function adicionarReserva(reserva) {
  reservasPendentes.push(reserva);
}

export function atualizarReserva(id, dadosAtualizados) {
  const reserva = reservasPendentes.find(r => r.id === id);
  if (reserva) Object.assign(reserva, dadosAtualizados);
}

export function removerReserva(id) {
  reservasPendentes = reservasPendentes.filter(r => r.id !== id);
}

/* =============================================
   CLIENTES (simulação local)
============================================= */
let clientes 

export function obterClientes() {
  return clientes;
}

export function adicionarCliente(cli) {
  cli.id = Date.now();
  clientes.push(cli);
}

export function atualizarCliente(cliAtualizado) {
  clientes = clientes.map(c => (c.id === cliAtualizado.id ? cliAtualizado : c));
}

export function removerCliente(id) {
  clientes = clientes.filter(c => c.id !== id);
}