import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================================================
   GET – Listar todos os itens de reserva
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tb_reserva_item");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar itens da reserva:", error);
    res
      .status(500)
      .json({ error: "Erro ao obter itens da reserva" });
  }
});

/* =========================================================
   GET – Obter item por ID
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_reserva_item WHERE id_reserva_item = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Item da reserva não encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao obter item da reserva:", error);
    res.status(500).json({ error: "Erro ao obter item da reserva" });
  }
});

/* =========================================================
   GET – Listar itens por id_reserva
========================================================= */
router.get("/reserva/:id_reserva", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_reserva_item WHERE id_reserva = ?",
      [req.params.id_reserva]
    );

    res.json(rows);
  } catch (error) {
    console.error("Erro ao obter itens por reserva:", error);
    res.status(500).json({
      error: "Erro ao obter itens desta reserva",
    });
  }
});

/* =========================================================
   POST – Criar item de reserva
========================================================= */
router.post("/", async (req, res) => {
  try {
    const { id_reserva, id_material, quantidade, preco_unitario_momento } =
      req.body;

    if (!id_reserva || !id_material || !quantidade || !preco_unitario_momento) {
      return res.status(400).json({
        error:
          "Campos obrigatórios: id_reserva, id_material, quantidade, preco_unitario_momento",
      });
    }

    const sql = `
      INSERT INTO tb_reserva_item
        (id_reserva, id_material, quantidade, preco_unitario_momento)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      id_reserva,
      id_material,
      quantidade,
      preco_unitario_momento,
    ]);

    res.status(201).json({
      message: "Item de reserva registado com sucesso",
      id_reserva_item: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar item de reserva:", error);
    res.status(500).json({ error: "Erro ao criar item de reserva" });
  }
});

/* =========================================================
   PUT – Atualizar item de reserva
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { id_reserva, id_material, quantidade, preco_unitario_momento } =
      req.body;

    const sql = `
      UPDATE tb_reserva_item SET
        id_reserva = ?,
        id_material = ?,
        quantidade = ?,
        preco_unitario_momento = ?
      WHERE id_reserva_item = ?
    `;

    const [result] = await pool.query(sql, [
      id_reserva,
      id_material,
      quantidade,
      preco_unitario_momento,
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Item de reserva não encontrado" });
    }

    res.json({ message: "Item de reserva atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar item de reserva:", error);
    res.status(500).json({ error: "Erro ao atualizar item de reserva" });
  }
});

/* =========================================================
   DELETE – Remover item de reserva
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM tb_reserva_item WHERE id_reserva_item = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Item de reserva não encontrado" });
    }

    res.json({ message: "Item de reserva removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover item de reserva:", error);
    res.status(500).json({ error: "Erro ao remover item de reserva" });
  }
});

export default router;
