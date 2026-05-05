// src/Paginas/Materiais.jsx
import React, { useState } from "react";
import ListaMateriais from "../components/ListaMateriais";
import Carrinho from "../components/Carrinho";
import FiltrosMateriais from "../components/FiltrosMateriais";
import { useNavigate } from "react-router-dom";
import "../components/estilos/Materiais.css";

export default function Materiais() {
  const [itens,          setItens]          = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [termo,          setTermo]          = useState("");
  const [categoria,      setCategoria]      = useState("");
  const [ordem,          setOrdem]          = useState("");

  const navigate = useNavigate();

  // ── Carrinho ─────────────────────────────────────────────────────────────
  // Qualquer utilizador pode adicionar ao carrinho — o login só é pedido
  // quando tenta finalizar a reserva.
  const adicionarAoCarrinho = (material, quantidade = 1) => {
    setItens((prev) => {
      const existente = prev.find((i) => i.id_material === material.id_material);
      if (existente) {
        return prev.map((i) =>
          i.id_material === material.id_material
            ? { ...i, quantidade: Math.min(i.quantidade + quantidade, i.quantidade_disponivel) }
            : i
        );
      }
      return [...prev, { ...material, quantidade }];
    });
  };

  const atualizarQuantidade = (idMaterial, novaQuantidade) => {
    if (novaQuantidade < 1) return;
    setItens((prev) =>
      prev.map((item) =>
        item.id_material === idMaterial
          ? { ...item, quantidade: Math.min(novaQuantidade, item.quantidade_disponivel) }
          : item
      )
    );
  };

  const removerItem    = (id) => setItens((prev) => prev.filter((i) => i.id_material !== id));
  const limparCarrinho = ()   => setItens([]);

  // ── Finaliza a reserva ──────────────────────────────────────────────────
  // A verificação de autenticação é feita no próprio Carrinho.jsx
  // (token + idCliente no localStorage + validação no backend via
  // /clientes/meu-perfil). Aqui apenas navegamos para /reservas com o
  // carrinho — o Carrinho só chama esta função após a sessão estar OK.
  const handleFinalizarReserva = () => {
    if (itens.length === 0) return;
    navigate("/reservas", { state: { carrinho: itens } });
    setCarrinhoAberto(false);
  };

  return (
    <main className="materiais-container">
      <div className="container">

        {/* ── HEADER + FILTROS na mesma linha ── */}
        <section className="materiais-header">
          <div className="materiais-header-texto">
            <h1>
              Alugue connosco, <span>não vai se arrepender</span>
            </h1>
            <p>Encontre a ferramenta ou equipamento perfeito para a sua obra.</p>
          </div>

          <FiltrosMateriais
            termo={termo}          setTermo={setTermo}
            categoria={categoria}  setCategoria={setCategoria}
            ordem={ordem}          setOrdem={setOrdem}
            itensCarrinho={itens}
            onAbrirCarrinho={() => setCarrinhoAberto(true)}
          />
        </section>

        <ListaMateriais
          onAdicionarAoCarrinho={adicionarAoCarrinho}
          termo={termo}
          categoria={categoria}
          ordem={ordem}
        />
      </div>

      {/* ── CARRINHO (sempre montado, visível quando aberto) ── */}
      <Carrinho
        itens={itens}
        aberto={carrinhoAberto}
        onFechar={() => setCarrinhoAberto(false)}
        onUpdateQuantidade={atualizarQuantidade}
        onRemoverItem={removerItem}
        onLimparCarrinho={limparCarrinho}
        onFinalizarReserva={handleFinalizarReserva}
      />
    </main>
  );
}