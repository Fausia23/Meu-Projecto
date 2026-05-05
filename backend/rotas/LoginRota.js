// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from "../config/db.js";

const router = express.Router();

// ✅ Perfis que qualquer pessoa pode registar
const PERFIS_PUBLICOS = ['cliente'];

const validarNUIT = (nuit) => /^[0-9]{9}$/.test(nuit);

// ─── REGISTAR ─────────────────────────────────────────────
router.post("/usuarios", async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const { nome, email, senha, nuit } = req.body;

    if (!nome || !email || !senha) {
      await connection.rollback();
      return res.status(400).json({ error: "nome, email e senha são obrigatórios." });
    }

    // valida NUIT se foi enviado
    if (nuit && !validarNUIT(nuit)) {
      await connection.rollback();
      return res.status(400).json({ error: "NUIT inválido. Deve conter 9 dígitos." });
    }

    // verifica email duplicado
    const [[existente]] = await connection.query(
      "SELECT id_usuario FROM tb_usuario WHERE email = ?", [email]
    );
    if (existente) {
      await connection.rollback();
      return res.status(409).json({ error: "Este email já está registado." });
    }

    const hashSenha = await bcrypt.hash(senha, 10);

    // 1. cria o usuário (SEM nuit — não existe nessa tabela)
    const [result] = await connection.query(
      `INSERT INTO tb_usuario (nome, email, senha_hash, perfil)
       VALUES (?, ?, ?, 'cliente')`,
      [nome, email, hashSenha]
    );
    const id_usuario = result.insertId;

    // 2. cria o cliente (com nuit) e liga ao usuário pelos dois campos id e id_usuario
    await connection.query(
      `INSERT INTO tb_cliente (nome_completo, email, nuit, id, id_usuario)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, email, nuit || null, id_usuario, id_usuario]
    );

    await connection.commit();
    res.status(201).json({ mensagem: "Conta criada com sucesso" });
  } catch (err) {
    await connection.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email ou NUIT já registado." });
    }

    console.error("Erro ao registar:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});
// ─── LOGIN ────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    const [[usuario]] = await pool.query(
      "SELECT * FROM tb_usuario WHERE email = ?", [email]
    );
    if (!usuario) return res.status(401).json({ error: "Credenciais inválidas." });

    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) return res.status(401).json({ error: "Credenciais inválidas." });

    let idFinal     = usuario.id_usuario;
    let id_cliente  = null; // ← declarar aqui

    // ✅ Só busca tb_cliente se for perfil cliente
    if (usuario.perfil === 'cliente') {
      const [[cliente]] = await pool.query(
        "SELECT id_cliente FROM tb_cliente WHERE id = ?", [usuario.id_usuario]
      );

      if (!cliente) {
        return res.status(403).json({
          error: "Perfil de cliente não encontrado. Contacte o suporte."
        });
      }

      id_cliente = cliente.id_cliente; // ← guardar o valor
      idFinal    = cliente.id_cliente;
    }

    const token = jwt.sign(
      { id: idFinal, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id:        idFinal,
        nome:      usuario.nome,
        perfil:    usuario.perfil,
        id_cliente 
      }
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro interno." });
  }
});


export default router;