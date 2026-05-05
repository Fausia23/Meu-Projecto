import React, { useState, useEffect } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "../components/estilos/Carrossel.css";
import "../components/estilos/PaginaPrincipal.css";
import { Carousel } from "react-responsive-carousel";
import { API_URL } from "../javascript/dados";

const FALLBACK = "https://placehold.co/600x400?text=Imagem+Indisponivel";

// Os uploads estão fora do prefixo /api → usar a raiz do servidor
const STATIC_URL = API_URL.replace(/\/api\/?$/, "");

// --- Setas personalizadas ---
const SetaAnterior = (onClickHandler, hasPrev, label) =>
  hasPrev && (
    <button type="button" onClick={onClickHandler} title={label} className="arrow prev">
      <i className="fas fa-chevron-left"></i>
    </button>
  );

const SetaProximo = (onClickHandler, hasNext, label) =>
  hasNext && (
    <button type="button" onClick={onClickHandler} title={label} className="arrow next">
      <i className="fas fa-chevron-right"></i>
    </button>
  );

/* ---------- Helpers ---------- */

function normalizar(s) {
  const semAcentos = (s || "")
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
  return semAcentos.toLowerCase();
}

/**
 * Constrói URL absoluta limpa para uma imagem de material:
 *   1. Aceita campos com nomes diferentes
 *   2. Converte backslashes (\) → forward slashes (/)
 *   3. Colapsa duplicações tipo "uploads/materiais/imagens/uploads/materiais/imagens/"
 *   4. Usa STATIC_URL (sem /api) para construir o URL final
 */
function construirUrlImagem(material) {
  if (!material) return null;

  let raw =
    material.imagem_url ||
    material.imagem ||
    material.foto ||
    material.url_imagem ||
    material.image ||
    null;

  if (!raw) return null;

  // (1) Backslashes → forward slashes
  raw = raw.replace(/\\/g, "/");

  // (2) Colapsa duplicação
  const reDup = new RegExp("(uploads/materiais/imagens/){2,}", "g");
  raw = raw.replace(reDup, "uploads/materiais/imagens/");

  // (3) Remove "//" duplos no caminho (preservando o "://" do protocolo)
  raw = raw.replace(/([^:])\/\/+/g, "$1/");

  // (4) Já é URL absoluto?
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const base = STATIC_URL.replace(/\/+$/, "");
  const path = raw.startsWith("/") ? raw : "/" + raw;
  return base + path;
}

export default function CarrosselDestaques() {
  const [materiais, setMateriais] = useState([]);

  useEffect(() => {
    const carregarMateriais = async () => {
      try {
        const response = await fetch(`${API_URL}/materiais`);
        if (!response.ok) throw new Error("HTTP " + response.status);

        const data = await response.json();
        const normalizados = data.map((m) => ({
          ...m,
          imagem_url: construirUrlImagem(m),
        }));

        // 🔍 DEBUG
        console.log("[Carrossel] API_URL:", API_URL);
        console.log("[Carrossel] STATIC_URL:", STATIC_URL);
        console.log("[Carrossel] URLs:", normalizados.map((m) => m.imagem_url));

        setMateriais(normalizados);
      } catch (err) {
        console.error("[Carrossel] Falha ao carregar materiais:", err);
      }
    };
    carregarMateriais();
  }, []);

  const acharMaterial = (termos) => {
    const lista = Array.isArray(termos) ? termos : [termos];
    for (const termo of lista) {
      const t = normalizar(termo);
      if (!t) continue;
      const found = materiais.find((m) => normalizar(m.nome).includes(t));
      if (found) return found;
    }
    return null;
  };

  const obterPreco = (termos) => {
    const m = acharMaterial(termos);
    return m ? `${m.preco_diaria} MZN/dia` : "Preço sob consulta";
  };

  const obterImagemUrl = (termos) => {
    const m = acharMaterial(termos);
    if (!m) return FALLBACK;
    return m.imagem_url || FALLBACK;
  };

  const slides = [
    {
      busca: ["betoneira"],
      classe: "slide-azul",
      titulo: "Alugue a Sua Betoneira a Preço de Igreja",
      texto:
        "Não perca tempo a mexer cimento com pá e para seu laje nem precisa contratar muitas pessoas. Com as nossas betoneiras, o trabalho rende mais e o seu bolso agradece. É só ligar e a obra não para!",
      alt: "Betoneira disponível para aluguer",
    },
    {
      busca: ["andaime"],
      classe: "slide-cinza",
      titulo: "Trabalhe nas Alturas Sem Medo",
      texto:
        "Chega de arriscar em escadas de madeira! Com os nossos andaimes, a sua equipa trabalha segura e com confiança. É o fim das gambiarras perigosas.",
      alt: "Andaime tubular para construção civil",
    },
    {
      busca: ["compactador"],
      classe: "slide-amarelo",
      titulo: "Deixe o Chão no Ponto",
      texto:
        "Para que gastar dinheiro com pessoas para pisar a terra e deixe de usar pilão para a adensar a terra, areia. A nossa máquina faz o trabalho pesado, deixa o terreno firme e poupa o seu tempo e o seu bolso.",
      alt: "Compactador de solo para aluguer",
    },
    {
      busca: ["escorra", "escora"],
      classe: "slide-azul-escuro",
      titulo: "Laje Firme, Sem Dor de Cabeça",
      texto:
        "Esqueça o gasto e o risco de usar madeira para segurar a laje. As nossas escorras de ferro são mais seguras, fáceis de usar e garantem que nada vai dar errado.",
      alt: "Escorras metálicas para suporte de estruturas",
    },
    {
      busca: ["confragem", "cofragem"],
      classe: "slide-verde",
      titulo: "Paredes Direitas, Obra Perfeita",
      texto:
        "Chega de usar tábuas tortas e chapas velhas que depois te custam dinheiro e tempo para alisar o teto. Com as nossas formas, as suas paredes e colunas ficam direitinhas, com um acabamento liso e profissional. É mais rápido e o resultado é outro nível.",
      alt: "Chapas de cofragem para paredes e colunas",
    },
  ];

  return (
    <Carousel
      autoPlay
      infiniteLoop
      interval={5000}
      transitionTime={600}
      showThumbs={false}
      showStatus={false}
      className="carrossel-principal"
      showIndicators
      stopOnHover
      animationHandler="fade"
      swipeable={false}
      renderArrowPrev={SetaAnterior}
      renderArrowNext={SetaProximo}
    >
      {slides.map((s, idx) => (
        <div className={`slide-layout ${s.classe}`} key={idx}>
          <div className="slide-imagem">
            <img
              src={obterImagemUrl(s.busca)}
              alt={s.alt}
              onError={(e) => {
                if (e.target.src !== FALLBACK) {
                  console.warn("[Carrossel] Falhou:", e.target.src);
                  e.target.src = FALLBACK;
                }
              }}
            />
          </div>
          <div className="slide-texto">
            <h2>{s.titulo}</h2>
            <div className="texto-destaque-barra"></div>
            <p>{s.texto}</p>
            <div className="slide-preco">{obterPreco(s.busca)}</div>
          </div>
        </div>
      ))}
    </Carousel>
  );
}