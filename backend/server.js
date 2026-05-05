import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

// Rotas
import uploadsRouter       from "./rotas/uploads.js";
import materialRota        from "./rotas/materialRota.js";
import clienteRota         from "./rotas/clienteRota.js";
import entregaRota         from "./rotas/entregaRota.js";
import reservaRota         from "./rotas/reservaRota.js";
import reserva_itemRota    from "./rotas/reserva_itemRota.js";
import devolucaoRota       from "./rotas/devolucaoRota.js";
import devolucao_itemRota  from "./rotas/devolucao_itemRota.js";
import entrega_itemRota    from "./rotas/entrega_itemRota.js";
import pagamentoRota       from "./rotas/pagamentoRota.js";
import configuracaoRota    from "./rotas/configuracaoRota.js";
import manutencaoRota      from "./rotas/manutencaoRota.js";
import usuarioRota         from "./rotas/usuarioRota.js";
import faturaRota          from "./rotas/facturaRota.js";
import categoriaRota       from "./rotas/categoriaRota.js";
import relatorioRota       from "./rotas/relatorioRota.js";
import LoginRota           from "./rotas/LoginRota.js";
import adminUsuarioRota    from "./rotas/adminUsuarioRota.js";

// Middlewares
import errorHandler        from "./middlewares/errorHandler.js";
import notFound            from "./middlewares/notFound.js";
import { verificarAcesso } from "./middlewares/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3001;

const buildPath   = path.resolve(__dirname, "..", "build");
const uploadsPath = path.join(__dirname, "uploads");

// 🔍 DEBUG inicial
console.log("[server] uploadsPath:", uploadsPath);
console.log("[server] uploadsPath existe?", fs.existsSync(uploadsPath));

// CORS
app.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));

app.use(express.json());

// WEBSOCKET
const wss = new WebSocketServer({ server, path: "/api/ws" });
let clients = [];
wss.on("connection", (ws) => {
  clients.push(ws);
  ws.on("close", () => { clients = clients.filter((c) => c !== ws); });
});
export function enviarNotificacao(msg) {
  clients.forEach((c) => { if (c.readyState === 1) c.send(msg); });
}

// ─── FICHEIROS ESTÁTICOS (antes das rotas) ───
app.use("/uploads", express.static(uploadsPath, { fallthrough: false }));
app.use(express.static(buildPath));

// ─── ROTAS PÚBLICAS ───
app.use("/api/login",     LoginRota);
app.use("/api/uploads",   uploadsRouter);
app.use("/api/materiais", materialRota);

// ─── ROTAS PROTEGIDAS ───
app.use("/api/admin/usuarios",  verificarAcesso(["admin"]),                                  adminUsuarioRota);
app.use("/api/clientes",        verificarAcesso(["admin","gestor","cliente","funcionario"]), clienteRota);
app.use("/api/reservas",        verificarAcesso(["admin","gestor","cliente","funcionario"]), reservaRota);
app.use("/api/reserva_itens",   verificarAcesso(["admin","gestor","cliente"]),               reserva_itemRota);
app.use("/api/entregas",        verificarAcesso(["admin","gestor","funcionario"]),           entregaRota);
app.use("/api/entrega_itens",   verificarAcesso(["admin","gestor","funcionario"]),           entrega_itemRota);
app.use("/api/devolucoes",      verificarAcesso(["admin","gestor","funcionario"]),           devolucaoRota);
app.use("/api/devolucao_itens", verificarAcesso(["admin","gestor","funcionario"]),           devolucao_itemRota);
app.use("/api/pagamentos",      verificarAcesso(["admin","gestor"]),                         pagamentoRota);
app.use("/api/categorias",      verificarAcesso(["admin","gestor"]),                         categoriaRota);
app.use("/api/configuracoes",   verificarAcesso(["admin"]),                                  configuracaoRota);
app.use("/api/manutencoes",     verificarAcesso(["admin","gestor","funcionario"]),           manutencaoRota);
app.use("/api/usuarios",        verificarAcesso(["admin","gestor"]),                         usuarioRota);
app.use("/api/faturas",         verificarAcesso(["admin","gestor"]),                         faturaRota);
app.use("/api/relatorios",      verificarAcesso(["admin","gestor"]),                         relatorioRota);

// ─── CATCH-ALL React Router (exclui /api E /uploads) ───
app.get(/^(?!\/(api|uploads)).*/, (req, res) => {
  const indexPath = path.join(buildPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend não compilado. Corre 'npm run build'.");
  }
});

// ERROR HANDLERS
app.use(notFound);
app.use(errorHandler);

server.listen(PORT, () => console.log(`Servidor iniciado na porta ${PORT}`));