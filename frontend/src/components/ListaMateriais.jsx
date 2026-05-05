import React, { useState, useMemo, useEffect, Suspense } from "react";
import MaterialCard from "./MaterialCard";
// import FiltrosMateriais from "./FiltrosMateriais";
import { API_URL, BASE_URL } from "../javascript/dados";

// const Modal = React.lazy(() => import("./Modal"));
import Modal from "./Modal";   

export default function ListaMateriais({ onAdicionarAoCarrinho = () => {}, termo, categoria, ordem }) {
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [loadingDetalhe] = useState(false);
  const [quantidade, setQuantidade] = useState(1); // Estado para a quantidade no modal

  // Busca inicial de materiais
  useEffect(() => {
    const buscarMateriais = async () => {
      try {
        setLoading(true);
        setErro(null);

        const response = await fetch(`${API_URL}/materiais`);

        // 1. Verificar o tipo de conteúdo antes de tentar o parse
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
          const textResponse = await response.text(); // Ler a resposta como texto
          console.error("Resposta inesperada do servidor:", textResponse);
          throw new Error(
            `Falha na comunicação com o servidor. Status: ${response.status}.`
          );
        }

        const data = await response.json();

        // 2. A verificação de !response.ok já foi feita acima
        if (!Array.isArray(data)) {
          console.error("Resposta da API não é um array:", data);
          setMateriais([]);
          return;
        }

        const materiaisProcessados = data.map(m => {
          let imagemFinal = null;

          if (m.imagem_url) {
            const nomeArquivo = m.imagem_url
              .replace(/\\/g, "/")
              .split("/")
              .pop();

            if (nomeArquivo && nomeArquivo.trim() !== "") {
       imagemFinal = `${BASE_URL}/uploads/materiais/imagens/${nomeArquivo}`;
            }
          }

          return { ...m, imagem_url: imagemFinal };
        });

        setMateriais(materiaisProcessados);
      } catch (error) {
        console.error("Erro ao buscar materiais:", error);
        setErro("Não foi possível carregar os materiais. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    buscarMateriais();
  }, []);

  // Filtragem e ordenação com useMemo
  const materiaisFiltrados = useMemo(() => {
    let lista = materiais.slice();

    // Filtro por nome
    if (termo.trim()) {
      const termoLower = termo.toLowerCase();
      lista = lista.filter(m => m.nome?.toLowerCase().includes(termoLower));
    }

    // Filtro por categoria
    if (categoria) {
      lista = lista.filter(m => m.id_categoria?.toString() === categoria);
    }

    // Ordenação
    if (ordem === "preco_asc") {
      lista.sort((a, b) => (a.preco_diaria || 0) - (b.preco_diaria || 0));
    } else if (ordem === "preco_desc") {
      lista.sort((a, b) => (b.preco_diaria || 0) - (a.preco_diaria || 0));
    } else if (ordem === "nome_asc") {
      lista.sort((a, b) => a.nome?.localeCompare(b.nome || "") || 0);
    }

    return lista;
  }, [materiais, termo, categoria, ordem]);

  // Renderização condicional
  if (loading) {
    return <p className="carregando">A carregar materiais...</p>;
  }

  if (erro) {
    return <p className="erro-msg">{erro}</p>;
  }

  return (
    <>
      
<section id="materiaisGrelha" className="materiais-grelha" aria-live="polite">
  {materiaisFiltrados.length === 0 ? (
    <p className="nenhum-resultado" role="status">
      Nenhum material encontrado com os filtros aplicados.
    </p>
  ) : (
    materiaisFiltrados.map(material => (
      <MaterialCard
        key={material.id_material}
        material={material}
        onAdicionarAoCarrinho={onAdicionarAoCarrinho}
      />
    ))
  )}
</section>

      <Suspense fallback={<div className="modal-suspense">A carregar modal...</div>}>
        <Modal mostrar={!!detalhe} fechar={() => setDetalhe(null)}>
          {loadingDetalhe ? (
            <p className="text-center py-8">A carregar detalhes...</p>
          ) : detalhe ? (
            <div className="modal-detalhes">
              {detalhe.imagem_url && (
                <img
                  src={detalhe.imagem_url}
                  alt={detalhe.nome}
                  className="w-full max-w-md mx-auto rounded-lg mb-6"
                  loading="lazy"
                />
              )}
              <h2 className="text-2xl font-bold mb-4">{detalhe.nome}</h2>
              <p><strong>Categoria:</strong> {detalhe.nome_categoria || 'N/A'}</p>
              <p><strong>Preço diário:</strong> {detalhe.preco_diaria} MZN</p>
              <p className="mt-4"><strong>Descrição:</strong></p>
              <p className="text-gray-700">
                {detalhe.descricao || "Sem descrição disponível."}
              </p> 
              <div className="modal-acoes-carrinho">
                <input 
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value, 10))}
                  className="modal-input-qtd"
                />
                <button 
                  onClick={() => onAdicionarAoCarrinho(detalhe, quantidade)}
                  className="modal-btn-adicionar"
                >
                  <i className="fas fa-cart-plus"></i> Adicionar
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      </Suspense>
    </>
  );
}