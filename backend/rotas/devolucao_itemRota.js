import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================================================
   GET – Listar todos os itens devolvidos
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tb_devolucao_item");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar itens da devolução:", error);
    res.status(500).json({ error: "Erro ao obter itens de devolução" });
  }
});

/* =========================================================
   GET – Obter item por ID
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM  tb_devolucao_item WHERE id_devolucao_item = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Item de devolução não encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao obter item da devolução:", error);
    res.status(500).json({ error: "Erro ao obter item da devolução" });
  }
});

/* =========================================================
   POST – Criar item de devolução
========================================================= */
router.post("/", async (req, res) => {
  try {
    const {
      id_devolucao,
      id_material,
      quantidade,
      estado_retorno,
      custo_multa_dano,
      detalhes_dano,
    } = req.body;

    // Validação de campos obrigatórios
    if (!id_devolucao || !id_material || !quantidade || !estado_retorno) {
      return res.status(400).json({
        error:
          "Campos obrigatórios: id_devolucao, id_material, quantidade, estado_retorno",
      });
    }

    const sql = `
      INSERT INTO  tb_devolucao_item 
        (id_devolucao, id_material, quantidade, estado_retorno, custo_multa_dano, detalhes_dano)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      id_devolucao,
      id_material,
      quantidade,
      estado_retorno,
      custo_multa_dano ?? 0.0,
      detalhes_dano ?? null,
    ]);

    res.status(201).json({
      message: "Item de devolução registado com sucesso",
      id_devolucao_item: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao registar item de devolução:", error);
    res.status(500).json({ error: "Erro ao registar item de devolução" });
  }
});

/* =========================================================
   PUT – Atualizar item da devolução
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const {
      id_devolucao,
      id_material,
      quantidade,
      estado_retorno,
      custo_multa_dano,
      detalhes_dano,
    } = req.body;

    const sql = `
      UPDATE  tb_devolucao_item SET
        id_devolucao = ?,
        id_material = ?,
        quantidade = ?,
        estado_retorno = ?,
        custo_multa_dano = ?,
        detalhes_dano = ?
      WHERE id_devolucao_item = ?
    `;

    const [result] = await pool.query(sql, [
      id_devolucao,
      id_material,
      quantidade,
      estado_retorno,
      custo_multa_dano ?? 0.0,
      detalhes_dano ?? null,
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Item de devolução não encontrado",
      });
    }

    res.json({ message: "Item de devolução atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar item de devolução:", error);
    res.status(500).json({ error: "Erro ao atualizar item de devolução" });
  }
});

/* =========================================================
   DELETE – Remover item da devolução
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM  tb_devolucao_item WHERE id_devolucao_item = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Item de devolução não encontrado",
      });
    }

    res.json({ message: "Item de devolução removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover item de devolução:", error);
    res.status(500).json({ error: "Erro ao remover item de devolução" });
  }
});

export default router;
