import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================================================
   GET – Listar todas as categorias
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tb_categoria");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    res.status(500).json({ error: "Erro ao obter categorias" });
  }
});

/* =========================================================
   GET – Obter categoria por ID
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_categoria WHERE id_categoria = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao obter categoria:", error);
    res.status(500).json({ error: "Erro ao obter categoria" });
  }
});

/* =========================================================
   POST – Criar categoria
========================================================= */
router.post("/", async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "Campo obrigatório: nome" });
    }

    const sql = `
      INSERT INTO tb_categoria
        (nome, descricao)
      VALUES (?, ?)
    `;

    const [result] = await pool.query(sql, [nome, descricao ?? null]);

    res.status(201).json({
      message: "Categoria criada com sucesso",
      id_categoria: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ error: "Erro ao criar categoria" });
  }
});

/* =========================================================
   PUT – Atualizar categoria
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    const sql = `
      UPDATE tb_categoria SET
        nome = ?,
        descricao = ?
      WHERE id_categoria = ?
    `;

    const [result] = await pool.query(sql, [nome, descricao ?? null, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    res.json({ message: "Categoria atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
});

/* =========================================================
   DELETE – Remover categoria
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM tb_categoria WHERE id_categoria = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    res.json({ message: "Categoria removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover categoria:", error);
    res.status(500).json({ error: "Erro ao remover categoria" });
  }
});

export default router;
