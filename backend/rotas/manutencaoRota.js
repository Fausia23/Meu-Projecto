import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================================================
   GET – Listar todas as manutenções
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM  tb_manutencao");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar manutenções:", error);
    res.status(500).json({ error: "Erro ao obter manutenções" });
  }
});

/* =========================================================
   GET – Obter manutenção por ID
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM  tb_manutencao WHERE id_manutencao = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Manutenção não encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao obter manutenção:", error);
    res.status(500).json({ error: "Erro ao obter manutenção" });
  }
});

/* =========================================================
   POST – Criar manutenção
========================================================= */
router.post("/", async (req, res) => {
  try {
    const { id_material, data_inicio, data_fim, descricao_problema, custo_reparo } =
      req.body;

    if (!id_material || !descricao_problema) {
      return res.status(400).json({
        error: "Campos obrigatórios: id_material, descricao_problema",
      });
    }

    const sql = `
      INSERT INTO  tb_manutencao
        (id_material, data_inicio, data_fim, descricao_problema, custo_reparo)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      id_material,
      data_inicio ?? new Date(),
      data_fim ?? null,
      descricao_problema,
      custo_reparo ?? 0.0,
    ]);

    res.status(201).json({
      message: "Manutenção registada com sucesso",
      id_manutencao: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar manutenção:", error);
    res.status(500).json({ error: "Erro ao criar manutenção" });
  }
});

/* =========================================================
   PUT – Atualizar manutenção
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { id_material, data_inicio, data_fim, descricao_problema, custo_reparo } =
      req.body;

    const sql = `
      UPDATE  tb_manutencao SET
        id_material = ?,
        data_inicio = ?,
        data_fim = ?,
        descricao_problema = ?,
        custo_reparo = ?
      WHERE id_manutencao = ?
    `;

    const [result] = await pool.query(sql, [
      id_material,
      data_inicio ?? new Date(),
      data_fim ?? null,
      descricao_problema,
      custo_reparo ?? 0.0,
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Manutenção não encontrada" });
    }

    res.json({ message: "Manutenção atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar manutenção:", error);
    res.status(500).json({ error: "Erro ao atualizar manutenção" });
  }
});

/* =========================================================
   DELETE – Remover manutenção
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM tb_manutencao WHERE id_manutencao = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Manutenção não encontrada" });
    }

    res.json({ message: "Manutenção removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover manutenção:", error);
    res.status(500).json({ error: "Erro ao remover manutenção" });
  }
});

export default router;
