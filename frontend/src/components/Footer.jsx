import React, { useEffect, useRef } from "react";
import "./estilos/PaginaPrincipal.css"; // Corrigido para usar o ficheiro CSS principal


export default function Footer() {
  const footerRef = useRef(null);

  useEffect(() => {
    const footerElement = footerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          footerElement.classList.add("is-visible");
          observer.unobserve(footerElement); // Para a observação após ser visível
        }
      },
      {
        root: null, // Viewport
        threshold: 0.1, // Ativa quando 10% do elemento estiver visível
      }
    );

    if (footerElement) observer.observe(footerElement);

    return () => observer.disconnect(); // Limpa o observador ao desmontar
  }, []);
  return (
    <footer className="footer" ref={footerRef}>
      <div className="container conteudo-footer">
        <div className="footer-about">
          <h3>Sobre Nós</h3>
          <p>A Alex Constructions é a sua parceira ideal para aluguer e compra de materiais de construção, oferecendo qualidade, segurança e os melhores preços do mercado.</p>
        </div>
        <div className="footer-links">
          <h3>Links Úteis</h3>
          <ul>
            <li><a href="#!">Política de Privacidade</a></li>
            <li><a href="#!">Termos e Condições</a></li>
            <li><a href="#!">FAQ</a></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h3>Contacto</h3>
          <p>Bairro 4 <br /> Vila da Macia, Gaza</p>
          <p>Email: <a href="mailto:alexconta2010@gmail.com">alexconta2010@gmail.com</a></p>
          <p>Telefone: <a href="tel:+258868482362">+258 86 848 2362</a></p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Alex Constructions. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
