import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* ======================================================
   1. LISTAR TODOS OS ITENS DE ENTREGA
====================================================== */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM tb_entrega_item ORDER BY id_entrega_item DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar itens de entrega:", error);
    res.status(500).json({ error: "Erro ao buscar itens de entrega" });
  }
});

/* ======================================================
   2. LISTAR ITENS DE UMA ENTREGA ESPECÍFICA
====================================================== */
router.get("/entrega/:id_entrega", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_entrega_item WHERE id_entrega = ?",
      [req.params.id_entrega]
    );

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar itens da entrega:", error);
    res.status(500).json({ error: "Erro ao buscar itens da entrega" });
  }
});

/* ======================================================
   3. LISTAR ITENS PELO MATERIAL
====================================================== */
router.get("/material/:id_material", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_entrega_item WHERE id_material = ?",
      [req.params.id_material]
    );

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar itens pelo material:", error);
    res.status(500).json({ error: "Erro ao buscar itens pelo material" });
  }
});

/* ======================================================
   4. BUSCAR UM ITEM PELO ID
====================================================== */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tb_entrega_item WHERE id_entrega_item = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Item de entrega não encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar item de entrega:", error);
    res.status(500).json({ error: "Erro ao buscar item de entrega" });
  }
});

/* ======================================================
   5. CRIAR ITEM DE ENTREGA
====================================================== */
router.post("/", async (req, res) => {
  try {
    const { id_entrega, id_material, quantidade, observacao } = req.body;

    const sql = `
      INSERT INTO tb_entrega_item 
      (id_entrega, id_material, quantidade, observacao)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      id_entrega,
      id_material,
      quantidade,
      observacao,
    ]);

    res.status(201).json({
      message: "Item de entrega criado com sucesso",
      id_entrega_item: result.insertId,
    });

  } catch (error) {
    console.error("Erro ao criar item de entrega:", error);
    res.status(500).json({ error: "Erro ao criar item de entrega" });
  }
});

/* ======================================================
   6. ATUALIZAR ITEM DE ENTREGA
====================================================== */
router.put("/:id", async (req, res) => {
  try {
    const { id_entrega, id_material, quantidade, observacao } = req.body;

    const sql = `
      UPDATE tb_entrega_item SET
        id_entrega = ?, id_material = ?, quantidade = ?, observacao = ?
      WHERE id_entrega_item = ?
    `;

    const [result] = await pool.query(sql, [
      id_entrega,
      id_material,
      quantidade,
      observacao,
      req.params.id,
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item de entrega não encontrado" });
    }

    res.json({ message: "Item de entrega atualizado com sucesso" });

  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    res.status(500).json({ error: "Erro ao atualizar item" });
  }
});

/* ======================================================
   7. APAGAR ITEM DE ENTREGA
====================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM tb_entrega_item WHERE id_entrega_item = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item de entrega não encontrado" });
    }

    res.json({ message: "Item de entrega removido com sucesso" });
  } catch (error) {
    console.error("Erro ao apagar item de entrega:", error);
    res.status(500).json({ error: "Erro ao apagar item de entrega" });
  }
});

export default router;
