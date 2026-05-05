import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================================================
   GET – Listar todos os logs
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tb_relatorio ORDER BY data_geracao DESC");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar logs:", error);
    res.status(500).json({ error: "Erro ao obter logs" });
  }
});

/* =========================================================
   GET – Obter log por ID
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_relatorio WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Log não encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao obter log:", error);
    res.status(500).json({ error: "Erro ao obter log" });
  }
});

/* =========================================================
   POST – Criar log
========================================================= */
router.post("/", async (req, res) => {
  try {
    const { titulo, tipo, conteudo_json, id_usuario } = req.body;

    if (!titulo || !tipo) {
      return res.status(400).json({ error: "Campos obrigatórios: titulo, tipo" });
    }

    const sql = `
      INSERT INTO tb_relatorio
        (titulo, tipo, conteudo_json, id_usuario)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      titulo,
      tipo,
      conteudo_json ? JSON.stringify(conteudo_json) : null,
      id_usuario ?? null,
    ]);

    res.status(201).json({
      message: "Log registado com sucesso",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar log:", error);
    res.status(500).json({ error: "Erro ao criar log" });
  }
});

/* =========================================================
   PUT – Atualizar log
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { titulo, tipo, conteudo_json, id_usuario } = req.body;

    const sql = `
      UPDATE tb_relatorio SET
        titulo = ?,
        tipo = ?,
        conteudo_json = ?,
        id_usuario = ?
      WHERE id = ?
    `;

    const [result] = await pool.query(sql, [
      titulo,
      tipo,
      conteudo_json ? JSON.stringify(conteudo_json) : null,
      id_usuario ?? null,
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Log não encontrado" });
    }

    res.json({ message: "Log atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar log:", error);
    res.status(500).json({ error: "Erro ao atualizar log" });
  }
});

/* =========================================================
   DELETE – Remover log
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM tb_relatorio WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Log não encontrado" });
    }

    res.json({ message: "Log removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover log:", error);
    res.status(500).json({ error: "Erro ao remover log" });
  }
});

export default router;
