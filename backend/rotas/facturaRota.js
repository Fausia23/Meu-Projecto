import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================================================
   GET – Listar todas as faturas
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tb_fatura");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar faturas:", error);
    res.status(500).json({ error: "Erro ao obter faturas" });
  }
});

/* =========================================================
   GET – Obter fatura por ID
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_fatura WHERE id_fatura = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Fatura não encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao obter fatura:", error);
    res.status(500).json({ error: "Erro ao obter fatura" });
  }
});

/* =========================================================
   POST – Criar fatura
========================================================= */
router.post("/", async (req, res) => {
  try {
    const {
      id_reserva,
      numero_fatura,
      valor_liquido,
      valor_iva,
      valor_total,
      status_fatura,
    } = req.body;

    // Campos obrigatórios
    if (!id_reserva || !valor_liquido || !valor_iva || !valor_total) {
      return res.status(400).json({
        error:
          "Campos obrigatórios: id_reserva, valor_liquido, valor_iva, valor_total",
      });
    }

    const sql = `
      INSERT INTO tb_fatura
        (id_reserva, numero_fatura, valor_liquido, valor_iva, valor_total, status_fatura)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      id_reserva,
      numero_fatura ?? null,
      valor_liquido,
      valor_iva,
      valor_total,
      status_fatura ?? "Pendente",
    ]);

    res.status(201).json({
      message: "Fatura criada com sucesso",
      id_fatura: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar fatura:", error);
    res.status(500).json({ error: "Erro ao criar fatura" });
  }
});

/* =========================================================
   PUT – Atualizar fatura
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const {
      id_reserva,
      numero_fatura,
      valor_liquido,
      valor_iva,
      valor_total,
      status_fatura,
    } = req.body;

    const sql = `
      UPDATE tb_fatura SET
        id_reserva = ?,
        numero_fatura = ?,
        valor_liquido = ?,
        valor_iva = ?,
        valor_total = ?,
        status_fatura = ?
      WHERE id_fatura = ?
    `;

    const [result] = await pool.query(sql, [
      id_reserva,
      numero_fatura ?? null,
      valor_liquido,
      valor_iva,
      valor_total,
      status_fatura ?? "Pendente",
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Fatura não encontrada" });
    }

    res.json({ message: "Fatura atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar fatura:", error);
    res.status(500).json({ error: "Erro ao atualizar fatura" });
  }
});

/* =========================================================
   DELETE – Remover fatura
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM tb_fatura WHERE id_fatura = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Fatura não encontrada" });
    }

    res.json({ message: "Fatura removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover fatura:", error);
    res.status(500).json({ error: "Erro ao remover fatura" });
  }
});

export default router;
