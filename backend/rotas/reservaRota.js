// routes/reservaRota.js
import express from "express";
import pool from "../config/db.js";
import { qualquerAutenticado } from "../middlewares/authMiddleware.js";  // ← ADICIONAR


const router = express.Router();

/* =========================================================
   GET – Listar todas as reservas
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.*,
        c.nome_completo AS nome_cliente
      FROM tb_reserva r
      LEFT JOIN tb_cliente c ON r.id_cliente = c.id_cliente
      ORDER BY r.id_reserva DESC
    `);

    // Buscar itens de cada reserva
    const reservasComItens = await Promise.all(
      rows.map(async (reserva) => {
        const [itens] = await pool.query(
          `SELECT ri.*, m.nome, m.preco_diaria
           FROM tb_reserva_item ri
           JOIN tb_material m ON ri.id_material = m.id_material
           WHERE ri.id_reserva = ?`,
          [reserva.id_reserva]
        );
        return { ...reserva, itens };
      })
    );

    res.json(reservasComItens);
  } catch (error) {
    console.error("Erro ao listar reservas:", error);
    res.status(500).json({ erro: "Erro ao listar reservas" });
  }
});


router.get("/minhas", qualquerAutenticado, async (req, res) => {
  try {
    const idCliente = req.usuario.id;

    const [reservas] = await pool.query(
      `SELECT r.*, c.nome_completo AS nome_cliente
       FROM tb_reserva r
       LEFT JOIN tb_cliente c ON r.id_cliente = c.id_cliente
       WHERE r.id_cliente = ?
       ORDER BY r.id_reserva DESC`,
      [idCliente]
    );

    const reservasComItens = await Promise.all(
      reservas.map(async (reserva) => {
        const [itens] = await pool.query(
          `SELECT ri.*, m.nome AS nome_material, m.preco_diaria
           FROM tb_reserva_item ri
           JOIN tb_material m ON ri.id_material = m.id_material
           WHERE ri.id_reserva = ?`,
          [reserva.id_reserva]
        );
        return { ...reserva, itens };
      })
    );

    res.json(reservasComItens);
  } catch (err) {
    console.error("Erro ao buscar minhas reservas:", err);
    res.status(500).json({ erro: "Erro ao buscar reservas", detalhe: err.message });
  }
});

/* =========================================================
   GET – Obter reserva por ID (com itens)
========================================================= */
router.get("/:id", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [reservaRows] = await connection.query(
      `SELECT r.*, c.nome_completo AS nome_cliente
       FROM tb_reserva r
       LEFT JOIN tb_cliente c ON r.id_cliente = c.id_cliente
       WHERE r.id_reserva = ?`,
      [req.params.id]
    );

    if (reservaRows.length === 0) {
      return res.status(404).json({ erro: "Reserva não encontrada" });
    }

    const [itens] = await connection.query(
      `SELECT ri.*, m.nome, m.preco_diaria, m.imagem_url
       FROM tb_reserva_item ri
       JOIN tb_material m ON ri.id_material = m.id_material
       WHERE ri.id_reserva = ?`,
      [req.params.id]
    );

    res.json({ ...reservaRows[0], itens });
  } catch (error) {
    console.error("Erro ao obter reserva:", error);
    res.status(500).json({ erro: "Erro ao obter reserva" });
  } finally {
    connection.release();
  }
});


/* =========================================================
   POST – Criar reserva + decrementar inventário
   Body esperado:
   {
     id_cliente: number,
     data_inicio: "YYYY-MM-DD",
     data_fim: "YYYY-MM-DD",
     tipo_transporte?: "pessoal" | "empresa",
     custo_transporte?: number,
     itens: [{ id_material: number, quantidade: number }]
   }
========================================================= */
router.post("/", async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
   const {
  id_cliente,
  data_inicio,   // continua a vir assim do frontend — OK
  data_fim,
  tipo_transporte  = "pessoal",
  custo_transporte = 0,
  itens = [],
} = req.body;


    // ── Validações básicas ────────────────────────────────
    if (!id_cliente || !data_inicio || !data_fim || itens.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        erro: "Campos obrigatórios: id_cliente, data_inicio, data_fim, itens (array não vazio)",
      });
    }

  if (new Date(data_fim) <= new Date(data_inicio)) {
      await connection.rollback();
      return res.status(400).json({ erro: "data_fim deve ser posterior a data_inicio" });
    }

    // ── Verificar stock disponível (com lock para evitar concorrência) ──
    for (const item of itens) {
      const { id_material, quantidade } = item;

      if (!id_material || !quantidade || Number(quantidade) < 1) {
        await connection.rollback();
        return res.status(400).json({
          erro: `Item inválido: id_material=${id_material}, quantidade=${quantidade}`,
        });
      }

      const [matRows] = await connection.query(
        "SELECT nome, quantidade_disponivel FROM tb_material WHERE id_material = ? FOR UPDATE",
        [id_material]
      );

      if (matRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ erro: `Material #${id_material} não encontrado` });
      }

      const disponivel = Number(matRows[0].quantidade_disponivel);
      if (disponivel < Number(quantidade)) {
        await connection.rollback();
        return res.status(409).json({
          erro: `Stock insuficiente para "${matRows[0].nome}". Disponível: ${disponivel}, solicitado: ${quantidade}`,
        });
      }
    }

    // ── Calcular valor total estimado ─────────────────────
    const dias = Math.ceil(
      (new Date(data_fim) - new Date(data_inicio)) / (1000 * 60 * 60 * 24)
    );

    let valor_total = Number(custo_transporte) || 0;
    for (const item of itens) {
      const [mat] = await connection.query(
        "SELECT preco_diaria FROM tb_material WHERE id_material = ?",
        [item.id_material]
      );
      valor_total += Number(mat[0].preco_diaria) * Number(item.quantidade) * dias;
    }

    // ── Criar a reserva ───────────────────────────────────
   const [reservaResult] = await connection.query(
  `INSERT INTO tb_reserva
     (id_cliente, data_levantamento_prevista, data_devolucao_prevista,
      status_reserva, tipo_transporte, custo_transporte)
   VALUES (?, ?, ?, 'Pendente', ?, ?)`,
  [id_cliente, data_inicio, data_fim, tipo_transporte, custo_transporte]
);
    const id_reserva = reservaResult.insertId;

    // ── Inserir itens + decrementar inventário ────────────
    for (const item of itens) {
      const { id_material, quantidade } = item;
      const qtd = Number(quantidade);

      // Obtém preço actual
      const [mat] = await connection.query(
        "SELECT preco_diaria FROM tb_material WHERE id_material = ?",
        [id_material]
      );
      const preco_unitario_momento = Number(mat[0].preco_diaria);

      // Regista o item na reserva
      await connection.query(
        `INSERT INTO tb_reserva_item
           (id_reserva, id_material, quantidade, preco_unitario_momento)
         VALUES (?, ?, ?, ?)`,
        [id_reserva, id_material, qtd, preco_unitario_momento]
      );

      // ✅ DECREMENTA quantidade_disponivel no inventário
      await connection.query(
        `UPDATE tb_material
         SET quantidade_disponivel = quantidade_disponivel - ?
         WHERE id_material = ?`,
        [qtd, id_material]
      );
    }

    await connection.commit();

    res.status(201).json({
      mensagem: "Reserva criada com sucesso",
      id_reserva,
      valor_total: Number(valor_total.toFixed(2)),
    });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao criar reserva:", error);
    res.status(500).json({ erro: "Erro interno ao criar reserva", detalhe: error.message });
  } finally {
    connection.release();
  }
});

/* =========================================================
   PUT – Alterar status da reserva
   Body: { status_reserva: "pendente" | "Confirmada" | "cancelada" }
   Cancelar → devolve stock ao inventário
========================================================= */
router.put("/:id/status", async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { status_reserva } = req.body;
    const id_reserva = req.params.id;

   const statusValidos = ["Pendente", "Confirmada", "Em Curso", "Concluida", "Cancelada"];

    if (!statusValidos.includes(status_reserva)) {
      await connection.rollback();
      return res.status(400).json({ erro: `Status inválido. Use: ${statusValidos.join(", ")}` });
    }

    // Verificar se reserva existe e o status actual
    const [[reservaActual]] = await connection.query(
      "SELECT status_reserva FROM tb_reserva WHERE id_reserva = ?",
      [id_reserva]
    );

    if (!reservaActual) {
      await connection.rollback();
      return res.status(404).json({ erro: "Reserva não encontrada" });
    }

    // ✅ Se cancelar uma reserva pendente → devolver stock
if (status_reserva === "Cancelada" && reservaActual.status_reserva === "Pendente") {
      const [itens] = await connection.query(
        "SELECT id_material, quantidade FROM tb_reserva_item WHERE id_reserva = ?",
        [id_reserva]
      );

      for (const item of itens) {
        await connection.query(
          `UPDATE tb_material
           SET quantidade_disponivel = quantidade_disponivel + ?
           WHERE id_material = ?`,
          [item.quantidade, item.id_material]
        );
      }
    }

    await connection.query(
      "UPDATE tb_reserva SET status_reserva = ? WHERE id_reserva = ?",
      [status_reserva, id_reserva]
    );

    await connection.commit();
    res.json({ mensagem: `Reserva actualizada para "${status_reserva}"` });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao actualizar status da reserva:", error);
    res.status(500).json({ erro: "Erro ao actualizar status" });
  } finally {
    connection.release();
  }
});

/* =========================================================
   DELETE – Cancelar reserva (equivale a PUT status=cancelada)
========================================================= */
router.delete("/:id", async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [[reserva]] = await connection.query(
      "SELECT status_reserva FROM tb_reserva WHERE id_reserva = ?",
      [req.params.id]
    );

    if (!reserva) {
      await connection.rollback();
      return res.status(404).json({ erro: "Reserva não encontrada" });
    }

    // Devolver stock se ainda estava pendente
    if (reserva.status_reserva === "Pendente") {
      const [itens] = await connection.query(
        "SELECT id_material, quantidade FROM tb_reserva_item WHERE id_reserva = ?",
        [req.params.id]
      );
      for (const item of itens) {
        await connection.query(
          "UPDATE tb_material SET quantidade_disponivel = quantidade_disponivel + ? WHERE id_material = ?",
          [item.quantidade, item.id_material]
        );
      }
    }

    
      await connection.query(
  "UPDATE tb_reserva SET status_reserva = 'Cancelada' WHERE id_reserva = ?",
  [req.params.id]
);

    await connection.commit();
    res.json({ mensagem: "Reserva cancelada e stock reposto" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao cancelar reserva:", error);
    res.status(500).json({ erro: "Erro ao cancelar reserva" });
  } finally {
    connection.release();
  }
});

export default router;