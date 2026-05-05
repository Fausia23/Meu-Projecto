// middleware/auth.js
import jwt from "jsonwebtoken";

export const verificarAcesso = (rolesPermitidas = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token)
      return res.status(401).json({ erro: "Token não fornecido." });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = decoded;

      // ✅ Corrigido: 'perfil' em vez de 'cargo'
      if (rolesPermitidas.length > 0 && !rolesPermitidas.includes(decoded.perfil)) {
        return res.status(403).json({ erro: "Acesso negado: permissão insuficiente." });
      }

      next();
    } catch (err) {
      const mensagem = err.name === "TokenExpiredError"
        ? "Token expirado."
        : "Token inválido.";
      return res.status(401).json({ erro: mensagem });
    }
  };
};

// ✅ Atalhos prontos a usar nas rotas
export const soAdmin         = verificarAcesso(['admin']);
export const soGestor        = verificarAcesso(['admin', 'gestor']);
export const soFuncionario   = verificarAcesso(['admin', 'gestor', 'funcionario']);
export const qualquerAutenticado = verificarAcesso([]);