import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================================================
   GET – Obter configuração atual
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tb_configuracao LIMIT 1");
    if (rows.length === 0) {
      return res.status(404).json({ error: "Configuração não encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao obter configuração:", error);
    res.status(500).json({ error: "Erro ao obter configuração" });
  }
});

/* =========================================================
   PUT – Atualizar configuração
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { nome_empresa, nuit_empresa, endereco_empresa, telefone_contato, taxa_iva } = req.body;

    const sql = `
      UPDATE tb_configuracao SET
        nome_empresa = ?,
        nuit_empresa = ?,
        endereco_empresa = ?,
        telefone_contato = ?,
        taxa_iva = ?
      WHERE id_config = ?
    `;

    const [result] = await pool.query(sql, [
      nome_empresa ?? null,
      nuit_empresa ?? null,
      endereco_empresa ?? null,
      telefone_contato ?? null,
      taxa_iva ?? 16.0,
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Configuração não encontrada" });
    }

    res.json({ message: "Configuração atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error);
    res.status(500).json({ error: "Erro ao atualizar configuração" });
  }
});

export default router;
