// routes/entregaRota.js
import express from "express";
import pool from "../config/db.js";
import { fileURLToPath } from "url";
import path from "path";
import PDFDocument from "pdfkit";
import fs from "fs";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ======================================================
   1. LISTAR TODAS AS ENTREGAS
====================================================== */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id_entrega,
        id_reserva,
        tipo_entrega,
        nome_funcionario_entrega,
        DATE_FORMAT(data_efetiva_entrega, '%Y-%m-%d %H:%i') AS data_efetiva_entrega,
        data_prevista_devolucao,
        responsavel_recebimento_cliente,
        metodo_envio,
        valor_total,
        status_entrega,
        comprovativo_url
      FROM tb_entrega
      ORDER BY id_entrega DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar entregas:", err);
    res.status(500).json({ erro: "Erro ao buscar entregas" });
  }
});

/* ======================================================
   2. BUSCAR ENTREGA POR ID (com itens)
====================================================== */
router.get("/:id", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [entrega] = await connection.query(
      `SELECT *,
        DATE_FORMAT(data_efetiva_entrega, '%Y-%m-%d %H:%i') AS data_formatada,
        DATE_FORMAT(data_prevista_devolucao, '%Y-%m-%d') AS devolucao_formatada
       FROM tb_entrega WHERE id_entrega = ?`,
      [req.params.id]
    );

    if (entrega.length === 0) {
      return res.status(404).json({ erro: "Entrega não encontrada" });
    }

    const [itens] = await connection.query(
      `SELECT ei.*, m.nome AS nome_material
       FROM tb_entrega_item ei
       JOIN tb_material m ON ei.id_material = m.id_material
       WHERE ei.id_entrega = ?`,
      [req.params.id]
    );

    res.json({ ...entrega[0], itens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar entrega" });
  } finally {
    connection.release();
  }
});

/* ======================================================
   3. CRIAR ENTREGA (DIRETA ou VIA RESERVA)
   
   Regras de inventário:
   - Entrega VIA RESERVA: o stock JÁ foi decrementado na criação
     da reserva, por isso NÃO voltamos a decrementar aqui.
   - Entrega DIRETA: decrementamos o stock agora.
====================================================== */
router.post("/", async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const {
      id_reserva = null,
      nome_funcionario_entrega,
      responsavel_recebimento_cliente,
      metodo_envio = null,
      data_prevista_devolucao = null,
      itens = [],
    } = req.body;

    const isDireta = !id_reserva;

    // Validações
    if (!nome_funcionario_entrega?.trim() || !responsavel_recebimento_cliente?.trim()) {
      await connection.rollback();
      return res.status(400).json({ erro: "Funcionário e cliente são obrigatórios" });
    }

    if (isDireta && (!data_prevista_devolucao || itens.length === 0)) {
      await connection.rollback();
      return res.status(400).json({ erro: "Entrega direta precisa de data de devolução e itens" });
    }

    // ── Para entrega DIRETA: verificar stock antes de continuar ──
    if (isDireta) {
      for (const item of itens) {
        const [matRows] = await connection.query(
          "SELECT nome, quantidade_disponivel FROM tb_material WHERE id_material = ? FOR UPDATE",
          [item.id_material]
        );
        if (matRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({ erro: `Material #${item.id_material} não encontrado` });
        }
        const disponivel = Number(matRows[0].quantidade_disponivel);
        if (disponivel < Number(item.quantidade)) {
          await connection.rollback();
          return res.status(409).json({
            erro: `Stock insuficiente para "${matRows[0].nome}". Disponível: ${disponivel}`,
          });
        }
      }
    }

    // Gera código ALX-XXXXXX
    const [autoInc] = await connection.query(
      "SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_entrega'"
    );
    const proximoId = autoInc[0].AUTO_INCREMENT;
    const codigo_entrega = `ALX-${String(proximoId).padStart(6, "0")}`;

    // Cria a entrega
    const [result] = await connection.query(
      `INSERT INTO tb_entrega
         (id_reserva, tipo_entrega, codigo_entrega, nome_funcionario_entrega,
          responsavel_recebimento_cliente, metodo_envio, data_prevista_devolucao,
          status_entrega, valor_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'entregue', 0)`,
      [
        id_reserva,
        isDireta ? "direta" : "reserva",
        codigo_entrega,
        nome_funcionario_entrega.trim(),
        responsavel_recebimento_cliente.trim(),
        metodo_envio,
        data_prevista_devolucao,
      ]
    );
    const id_entrega = result.insertId;
    let valor_total = 0;

    if (isDireta && itens.length > 0) {
      // Calcula dias de aluguer
      const dataEntrega = new Date();
      dataEntrega.setHours(0, 0, 0, 0);
      const dataDevol = new Date(data_prevista_devolucao);
      dataDevol.setUTCHours(0, 0, 0, 0);
      const dias_aluguel = Math.max(
        1,
        Math.ceil((dataDevol - dataEntrega) / (1000 * 60 * 60 * 24)) + 1
      );

      for (const item of itens) {
        const { id_material, quantidade } = item;
        const qtd = Number(quantidade);

        const [mat] = await connection.query(
          "SELECT preco_diaria FROM tb_material WHERE id_material = ?",
          [id_material]
        );
        const preco_diaria = Number(mat[0].preco_diaria) || 0;
        const subtotal = qtd * preco_diaria * dias_aluguel;
        valor_total += subtotal;

        // Insere item na entrega
        await connection.query(
          `INSERT INTO tb_entrega_item
             (id_entrega, id_material, quantidade, preco_diaria, dias_aluguel, observacao)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id_entrega, id_material, qtd, preco_diaria, dias_aluguel, "Entrega direta no balcão"]
        );

        // ✅ DECREMENTA inventário apenas para entrega direta
        await connection.query(
          "UPDATE tb_material SET quantidade_disponivel = quantidade_disponivel - ? WHERE id_material = ?",
          [qtd, id_material]
        );
      }

      await connection.query(
        "UPDATE tb_entrega SET valor_total = ? WHERE id_entrega = ?",
        [valor_total, id_entrega]
      );
    }

    // Para entrega via reserva: insere os itens da entrega (sem alterar stock)
    if (!isDireta) {
      const [itensReserva] = await connection.query(
        `SELECT ri.id_material, ri.quantidade, m.preco_diaria
         FROM tb_reserva_item ri
         JOIN tb_material m ON m.id_material = ri.id_material
         WHERE ri.id_reserva = ?`,
        [id_reserva]
      );

      // Calcula dias a partir das datas da reserva
      const [[reserva]] = await connection.query(
  `SELECT data_levantamento_prevista AS data_inicio,
          data_devolucao_prevista    AS data_fim
   FROM tb_reserva WHERE id_reserva = ?`,
  [id_reserva]
);
      

      const dias_aluguel = reserva
        ? Math.max(
            1,
            Math.ceil(
              (new Date(reserva.data_fim) - new Date(reserva.data_inicio)) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 1;

      for (const item of itensReserva) {
        const subtotal = Number(item.quantidade) * Number(item.preco_diaria) * dias_aluguel;
        valor_total += subtotal;

        await connection.query(
          `INSERT INTO tb_entrega_item
             (id_entrega, id_material, quantidade, preco_diaria, dias_aluguel, observacao)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id_entrega,
            item.id_material,
            item.quantidade,
            item.preco_diaria,
            dias_aluguel,
            "Entrega via reserva",
          ]
        );
        // ⚠️ NÃO altera quantidade_disponivel — já foi decrementada na criação da reserva
      }

      await connection.query(
        "UPDATE tb_entrega SET valor_total = ? WHERE id_entrega = ?",
        [valor_total, id_entrega]
      );
    }

    await connection.commit();

    res.json({
      sucesso: true,
      id_entrega,
      codigo_entrega,
      tipo_entrega: isDireta ? "direta" : "reserva",
      valor_total: Number(valor_total.toFixed(2)),
      mensagem: `Entrega ${codigo_entrega} criada com sucesso!`,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erro ao criar entrega:", err);
    res.status(500).json({ erro: err.message });
  } finally {
    connection.release();
  }
});

/* ======================================================
   4. MARCAR COMO DEVOLVIDO
   ✅ Restaura quantidade_disponivel para cada item devolvido
====================================================== */
router.put("/:id/devolver", async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [entregaRows] = await connection.query(
      "SELECT status_entrega FROM tb_entrega WHERE id_entrega = ?",
      [req.params.id]
    );

    if (entregaRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: "Entrega não encontrada" });
    }
    if (entregaRows[0].status_entrega === "devolvido") {
      await connection.rollback();
      return res.status(400).json({ erro: "Esta entrega já foi devolvida" });
    }

    // Buscar itens da entrega
    const [itens] = await connection.query(
      "SELECT id_material, quantidade FROM tb_entrega_item WHERE id_entrega = ?",
      [req.params.id]
    );

    // ✅ RESTAURA quantidade_disponivel para cada item devolvido
    for (const item of itens) {
      await connection.query(
        "UPDATE tb_material SET quantidade_disponivel = quantidade_disponivel + ? WHERE id_material = ?",
        [item.quantidade, item.id_material]
      );
    }

    // Marca a entrega como devolvida
    await connection.query(
      "UPDATE tb_entrega SET status_entrega = 'devolvido', data_efetiva_devolucao = NOW() WHERE id_entrega = ?",
      [req.params.id]
    );

    // Se a entrega veio de uma reserva, marca-a como concluída
    const [[entrega]] = await connection.query(
      "SELECT id_reserva FROM tb_entrega WHERE id_entrega = ?",
      [req.params.id]
    );
    if (entrega?.id_reserva) {
      await connection.query(
        "UPDATE tb_reserva SET status_reserva = 'concluida' WHERE id_reserva = ?",
        [entrega.id_reserva]
      );
    }

    await connection.commit();
    res.json({ sucesso: true, mensagem: "Devolução registada e stock reposto com sucesso!" });
  } catch (err) {
    await connection.rollback();
    console.error("Erro ao registar devolução:", err);
    res.status(500).json({ erro: "Erro ao registar devolução" });
  } finally {
    connection.release();
  }
});

/* ======================================================
   5. GERAR PDF DO RECIBO
====================================================== */
router.get("/:id/recibo-pdf", async (req, res) => {
  try {
    const entregaId = req.params.id;

    const [entregaRows] = await pool.query(
      `SELECT
         id_entrega, codigo_entrega, nome_funcionario_entrega,
         responsavel_recebimento_cliente,
         DATE_FORMAT(data_efetiva_entrega, '%Y-%m-%d %H:%i') AS data_efetiva,
         DATE_FORMAT(data_prevista_devolucao, '%Y-%m-%d') AS data_devolucao,
         metodo_envio, valor_total, status_entrega
       FROM tb_entrega WHERE id_entrega = ?`,
      [entregaId]
    );

    if (entregaRows.length === 0) {
      return res.status(404).json({ erro: "Entrega não encontrada" });
    }

    const entrega = entregaRows[0];

    const [itens] = await pool.query(
      `SELECT ei.quantidade, ei.preco_diaria, ei.dias_aluguel, m.nome AS nome_material
       FROM tb_entrega_item ei
       JOIN tb_material m ON m.id_material = ei.id_material
       WHERE ei.id_entrega = ?`,
      [entregaId]
    );

    const pdfPath = path.join(__dirname, `recibo_${entrega.codigo_entrega}.pdf`);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(20).text("RECIBO DE ENTREGA", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(`Código: ${entrega.codigo_entrega}`)
      .text(`Funcionário: ${entrega.nome_funcionario_entrega}`)
      .text(`Cliente: ${entrega.responsavel_recebimento_cliente}`)
      .text(`Data de Entrega: ${entrega.data_efetiva}`)
      .text(`Devolução Prevista: ${entrega.data_devolucao}`)
      .text(`Método de Envio: ${entrega.metodo_envio || "—"}`)
      .moveDown();

    doc.fontSize(14).text("Itens Entregues:", { underline: true });
    doc.moveDown(0.5);

    itens.forEach((item, i) => {
      doc
        .fontSize(12)
        .text(
          `${i + 1}. ${item.nome_material} — Qtd: ${item.quantidade} — ` +
            `Diária: ${item.preco_diaria} MZN — Dias: ${item.dias_aluguel}`
        );
    });

    doc.moveDown();
    doc
      .fontSize(16)
      .text(`Total: ${entrega.valor_total} MZN`, { align: "right", underline: true });

    doc.end();
    stream.on("finish", () => {
      res.download(pdfPath, `recibo_${entrega.codigo_entrega}.pdf`, (err) => {
        fs.unlinkSync(pdfPath);
        if (err) console.error("Erro ao enviar PDF:", err);
      });
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    res.status(500).json({ erro: "Erro ao gerar recibo PDF" });
  }
});

export default router;