import { Router } from "express";
import pool from "../config/db.js";
import { qualquerAutenticado } from '../middlewares/authMiddleware.js';

const router = Router();

/* ======================================================
   1. LISTAR TODOS OS CLIENTES (só admin/gestor)
====================================================== */
router.get("/", qualquerAutenticado, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tb_cliente ORDER BY id_cliente DESC");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar clientes:", err);
    res.status(500).json({ erro: "Erro ao buscar clientes" });
  }
});

/* ======================================================
   2. BUSCAR CLIENTE PELO id_usuario (do JWT)
   Rota: GET /api/clientes/meu-perfil
   Usada pelo Perfil.jsx com o userId do localStorage
====================================================== */
router.get("/meu-perfil", qualquerAutenticado, async (req, res) => {
  try {
    // req.usuario.id é o id_usuario do JWT
    const [rows] = await pool.query(
      "SELECT * FROM tb_cliente WHERE id_cliente = ?",
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar perfil:", err);
    res.status(500).json({ erro: "Erro ao buscar perfil" });
  }
});

/* ======================================================
   3. ENTREGAS DO CLIENTE AUTENTICADO
   Rota: GET /api/clientes/minhas-entregas
====================================================== */
router.get("/minhas-entregas", qualquerAutenticado, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, 
        GROUP_CONCAT(
          JSON_OBJECT(
            'id_material', m.id_material,
            'nome_material', m.nome,
            'quantidade', ri.quantidade
          )
        ) AS itens
       FROM tb_entrega e
       LEFT JOIN tb_reserva r ON e.id_reserva = r.id_reserva
       LEFT JOIN tb_reserva_item ri ON r.id_reserva = ri.id_reserva
       LEFT JOIN tb_material m ON ri.id_material = m.id_material
       WHERE r.id_cliente = (SELECT id_cliente FROM tb_cliente WHERE id_cliente= ?)
       GROUP BY e.id_entrega
       ORDER BY e.data_efetiva_entrega DESC`,
      [req.usuario.id]
    );

    const formatadas = rows.map(e => ({
      ...e,
      itens: e.itens ? JSON.parse(`[${e.itens}]`) : []
    }));

    res.json(formatadas);
  } catch (err) {
    console.error("Erro ao buscar entregas:", err);
    res.status(500).json({ erro: "Erro ao buscar entregas" });
  }
});

/* ======================================================
   4. ATUALIZAR PERFIL DO CLIENTE AUTENTICADO
   Rota: PUT /api/clientes/meu-perfil
====================================================== */
router.put("/meu-perfil", qualquerAutenticado, async (req, res) => {
  const {
    nome_completo,
    email,
    telefone,
    endereco,
    tipo_cliente,
    nome_empresa,
    observacoes,
  } = req.body;
 
  try {
    // Actualiza tb_cliente — só os campos que vieram no body
    await pool.query(
      `UPDATE tb_cliente
       SET
         nome_completo = COALESCE(?, nome_completo),
         email         = COALESCE(?, email),
         telefone      = COALESCE(?, telefone),
         endereco      = COALESCE(?, endereco),
         tipo_cliente  = COALESCE(?, tipo_cliente),
         nome_empresa  = COALESCE(?, nome_empresa),
         observacoes   = COALESCE(?, observacoes)
       WHERE id_cliente= ?`,
      [
        nome_completo || null,
        email         || null,
        telefone      || null,
        endereco      || null,
        tipo_cliente  || null,
        nome_empresa  || null,
        observacoes   || null,
        req.usuario.id,
      ]
    );
 
    // Só actualiza tb_usuario se nome ou email vieram no body
    if (nome_completo || email) {
      await pool.query(
        `UPDATE tb_usuario
         SET
           nome  = COALESCE(?, nome),
           email = COALESCE(?, email)
         WHERE id_usuario = ?`,
        [nome_completo || null, email || null, req.usuario.id]
      );
    }
 
    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    res.status(500).json({ erro: "Erro ao atualizar perfil" });
  }
});

/* ======================================================
   5. BUSCAR CLIENTE POR id_cliente (admin)
====================================================== */
router.get("/:id", qualquerAutenticado, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_cliente WHERE id_cliente = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar cliente:", err);
    res.status(500).json({ erro: "Erro ao buscar cliente" });
  }
});

/* ======================================================
   6. CRIAR CLIENTE
====================================================== */
router.post("/", async (req, res) => {
  try {
    const { nome_completo, nuit, tipo_cliente, endereco, telefone, email } = req.body;

    const sql = `
      INSERT INTO tb_cliente (nome_completo, nuit, tipo_cliente, endereco, telefone, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [nome_completo, nuit, tipo_cliente, endereco, telefone, email]);
    res.json({ sucesso: true, id_cliente: result.insertId });

  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ erro: "NUIT já registado!" });
    }
    res.status(500).json({ erro: "Erro ao criar cliente" });
  }
});

/* ======================================================
   7. ATUALIZAR CLIENTE (admin)
====================================================== */
router.put("/:id", qualquerAutenticado, async (req, res) => {
  try {
    const { nome_completo, nuit, tipo_cliente, endereco, telefone, email } = req.body;

    const sql = `
      UPDATE tb_cliente SET
        nome_completo = ?, nuit = ?, tipo_cliente = ?, endereco = ?,
        telefone = ?, email = ?
      WHERE id_cliente = ?
    `;

    await pool.query(sql, [nome_completo, nuit, tipo_cliente, endereco, telefone, email, req.params.id]);
    res.json({ sucesso: true });

  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ erro: "NUIT já registado!" });
    }
    res.status(500).json({ erro: "Erro ao atualizar cliente" });
  }
});

/* ======================================================
   8. APAGAR CLIENTE (admin)
====================================================== */
router.delete("/:id", qualquerAutenticado, async (req, res) => {
  try {
    await pool.query("DELETE FROM tb_cliente WHERE id_cliente = ?", [req.params.id]);
    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao apagar cliente:", err);
    res.status(500).json({ erro: "Erro ao apagar cliente" });
  }
});

export default router;
