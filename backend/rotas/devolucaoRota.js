import express from "express";
import pool from "../config/db.js"; // usa mysql2 pool com ES modules

const router = express.Router();

/* =========================================================
   GET – Listar todas as devoluções
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tb_devolucao");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar devoluções:", error);
    res.status(500).json({ error: "Erro ao obter devoluções" });
  }
});

/* =========================================================
   GET – Obter devolução por ID
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_devolucao WHERE id_devolucao = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Devolução não encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao obter devolução:", error);
    res.status(500).json({ error: "Erro ao obter devolução" });
  }
});

/* =========================================================
   POST – Criar nova devolução
========================================================= */
router.post("/", async (req, res) => {
  try {
    const { id_reserva, id_operador, observacoes } = req.body;

    if (!id_reserva || !id_operador) {
      return res.status(400).json({
        error: "Os campos id_reserva e id_operador são obrigatórios"
      });
    }

    const sql = `
      INSERT INTO tb_devolucao  
        (id_reserva, id_operador, observacoes)
      VALUES (?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      id_reserva,
      id_operador,
      observacoes || null
    ]);

    res.status(201).json({
      message: "Devolução registada com sucesso",
      id_devolucao: result.insertId
    });
  } catch (error) {
    console.error("Erro ao criar devolução:", error);
    res.status(500).json({ error: "Erro ao criar devolução" });
  }
});

/* =========================================================
   PUT – Atualizar devolução
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { id_reserva, id_operador, observacoes } = req.body;

    const sql = `
      UPDATE tb_devolucao  SET
        id_reserva = ?,
        id_operador = ?,
        observacoes = ?
      WHERE id_devolucao = ?
    `;

    const [result] = await pool.query(sql, [
      id_reserva,
      id_operador,
      observacoes ?? null,
      req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Devolução não encontrada" });
    }

    res.json({ message: "Devolução atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar devolução:", error);
    res.status(500).json({ error: "Erro ao atualizar devolução" });
  }
});

/* =========================================================
   DELETE – Desativar/Remover devolução
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM tb_devolucao  WHERE id_devolucao = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Devolução não encontrada" });
    }

    res.json({ message: "Devolução removida com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar devolução:", error);
    res.status(500).json({ error: "Erro ao eliminar devolução" });
  }
});

export default router;
