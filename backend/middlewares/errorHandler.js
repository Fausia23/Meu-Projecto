export default function errorHandler(err, req, res, next) {
  console.error(" ERRO:", err);

  res.status(500).json({
    erro: "Erro interno do servidor",
    detalhes: err.message,
  });
}
