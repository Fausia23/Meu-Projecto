import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================================================
   GET – Listar todos os pagamentos
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tb_pagamento");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar pagamentos:", error);
    res.status(500).json({ error: "Erro ao obter pagamentos" });
  }
});

/* =========================================================
   GET – Obter pagamento por ID
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_pagamento WHERE id_pagamento = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao obter pagamento:", error);
    res.status(500).json({ error: "Erro ao obter pagamento" });
  }
});

/* =========================================================
   GET – Listar pagamentos por fatura
========================================================= */
router.get("/fatura/:id_fatura", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_pagamento WHERE id_fatura = ?",
      [req.params.id_fatura]
    );

    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar pagamentos por fatura:", error);
    res.status(500).json({ error: "Erro ao obter pagamentos desta fatura" });
  }
});

/* =========================================================
   POST – Criar pagamento
========================================================= */
router.post("/", async (req, res) => {
  try {
    const { id_fatura, id_usuario_registro, valor_pago, metodo_pagamento, referencia_transacao } =
      req.body;

    if (!id_fatura || !valor_pago || !metodo_pagamento) {
      return res.status(400).json({
        error:
          "Campos obrigatórios: id_fatura, valor_pago, metodo_pagamento",
      });
    }

    const sql = `
      INSERT INTO tb_pagamento
        (id_fatura, id_usuario_registro, valor_pago, metodo_pagamento, referencia_transacao)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      id_fatura,
      id_usuario_registro ?? null,
      valor_pago,
      metodo_pagamento,
      referencia_transacao ?? null,
    ]);

    res.status(201).json({
      message: "Pagamento registado com sucesso",
      id_pagamento: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

/* =========================================================
   PUT – Atualizar pagamento
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { id_fatura, id_usuario_registro, valor_pago, metodo_pagamento, referencia_transacao } =
      req.body;

    const sql = `
      UPDATE tb_pagamento SET
        id_fatura = ?,
        id_usuario_registro = ?,
        valor_pago = ?,
        metodo_pagamento = ?,
        referencia_transacao = ?
      WHERE id_pagamento = ?
    `;

    const [result] = await pool.query(sql, [
      id_fatura,
      id_usuario_registro ?? null,
      valor_pago,
      metodo_pagamento,
      referencia_transacao ?? null,
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    res.json({ message: "Pagamento atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error);
    res.status(500).json({ error: "Erro ao atualizar pagamento" });
  }
});

/* =========================================================
   DELETE – Remover pagamento
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM tb_pagamento WHERE id_pagamento = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    res.json({ message: "Pagamento removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover pagamento:", error);
    res.status(500).json({ error: "Erro ao remover pagamento" });
  }
});

export default router;
