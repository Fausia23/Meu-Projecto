import express from "express";
import pool from "../config/db.js";

const router = express.Router();

console.log("materialRota.js carregado corretamente - rotas de materiais ativas");

// Rota de teste
router.get("/test", (req, res) => {
  res.json({ mensagem: "Rotas de materiais funcionando!" });
});

/* GET – Listar todos os materiais */
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT 
        m.*,
        COALESCE(c.nome, 'Sem categoria') AS nome_categoria
      FROM tb_material m
      LEFT JOIN tb_categoria c ON m.id_categoria = c.id_categoria
      ORDER BY m.nome ASC
    `;

    const [rows] = await pool.query(sql);

    const materiais = rows.map(m => ({
      ...m,
      preco_diaria: Number(m.preco_diaria),
      quantidade_total: Number(m.quantidade_total),
      quantidade_disponivel: Number(m.quantidade_disponivel),
      imagem_url: m.imagem_url 
        ? (typeof m.imagem_url === 'string' && m.imagem_url.startsWith('http') 
            ? m.imagem_url 
            : `/uploads/materiais/imagens/${String(m.imagem_url).replace(/^\/+/, '')}`)
        : null
    }));

    res.json(materiais);
  } catch (error) {
    console.error("Erro na rota GET /api/materiais:", error);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

/* GET – Inventário completo (versão de debug - simplificada) */
router.get("/inventario", async (req, res) => {
  try {
    const sql = `
      SELECT 
        id_material AS id,
        nome,
        id_categoria,
        preco_diaria,
        quantidade_total AS total,
        quantidade_disponivel AS disponivel,
        COALESCE(quantidade_manutencao, 0) AS em_manutencao,
        COALESCE(quantidade_estragada, 0) AS estragado,
        (quantidade_total - quantidade_disponivel) AS alugada
      FROM tb_material
      ORDER BY nome ASC
    `;

    const [rows] = await pool.query(sql);

    const inventario = rows.map(item => ({
      id: item.id,
      nome: item.nome || "Sem nome",
      total: Number(item.total) || 0,
      disponivel: Number(item.disponivel) || 0,
      alugada: Number(item.alugada) > 0 ? Number(item.alugada) : 0,
      reservada: 0,
      em_manutencao: Number(item.em_manutencao) || 0,
      estragado: Number(item.estragado) || 0,
      preco_diaria: Number(item.preco_diaria) || 0,
    }));

    res.json(inventario);
  } catch (error) {
    console.error("ERRO NA ROTA /inventario:", error);
    res.status(500).json({
      erro: "Erro interno ao carregar inventário",
      detalhes: error.message,
      code: error.code // Muito útil para ver se é ER_NO_SUCH_TABLE, etc.
    });
  }
});
/* =========================================================
   POST – Criar novo material
========================================================= */
router.post("/", async (req, res) => {
  try {
    const {
      id_categoria,
      nome,
      descricao,
      imagem_url,
      preco_diaria,
      quantidade_total,
      estado_geral = 'Disponivel'
    } = req.body;

    if (!id_categoria || !nome || !preco_diaria || !quantidade_total) {
      return res.status(400).json({
        erro: "Campos obrigatórios: id_categoria, nome, preco_diaria, quantidade_total"
      });
    }

    const [result] = await pool.query(`
      INSERT INTO tb_material 
        (id_categoria, nome, descricao, imagem_url, preco_diaria, quantidade_total, quantidade_disponivel, estado_geral)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id_categoria,
      nome.trim(),
      descricao?.trim() || null,
      imagem_url?.trim() || null,
      Number(preco_diaria),
      Number(quantidade_total),
      Number(quantidade_total), // disponível inicial = total
      estado_geral
    ]);

    res.status(201).json({
      mensagem: "Material criado com sucesso",
      id_material: result.insertId
    });
  } catch (error) {
    console.error("Erro ao criar material:", error);
    res.status(500).json({ erro: "Erro ao criar material" });
  }
});

/* =========================================================
   PUT – Atualizar material (com proteção de stock)
========================================================= */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const dados = req.body;

  // Remove campos perigosos
  delete dados.id_material;
  delete dados.nome_categoria;

  try {
    const [[materialAtual]] = await pool.query(
      "SELECT quantidade_total, quantidade_disponivel FROM tb_material WHERE id_material = ?",
      [id]
    );

    if (!materialAtual) {
      return res.status(404).json({ erro: "Material não encontrado" });
    }

    const alugados = materialAtual.quantidade_total - materialAtual.quantidade_disponivel;

    if (dados.quantidade_total !== undefined) {
      const novoTotal = Number(dados.quantidade_total);
      if (novoTotal < alugados) {
        return res.status(400).json({
          erro: `Não pode reduzir o stock abaixo de ${alugados} (unidades atualmente alugadas)`
        });
      }
      dados.quantidade_disponivel = novoTotal - alugados;
    }

    const campos = Object.keys(dados)
      .filter(key => dados[key] !== undefined && dados[key] !== null && dados[key] !== "")
      .map(key => `${key} = ?`)
      .join(", ");

    if (!campos) {
      return res.json({ mensagem: "Nada para atualizar" });
    }

    const valores = Object.keys(dados)
      .filter(key => dados[key] !== undefined && dados[key] !== null && dados[key] !== "")
      .map(key => {
        if (key === "preco_diaria") return parseFloat(dados[key]);
        if (["quantidade_total", "quantidade_disponivel"].includes(key)) return Number(dados[key]);
        return dados[key];
      });

    valores.push(id);

    await pool.query(`UPDATE tb_material SET ${campos} WHERE id_material = ?`, valores);

    res.json({ mensagem: "Material atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar material:", error);
    res.status(500).json({ erro: "Erro ao atualizar material" });
  }
});

/* =========================================================
   DELETE – Remover material
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [[emUso]] = await pool.query(
      `SELECT 1 FROM tb_entrega_item WHERE id_material = ? LIMIT 1`,
      [req.params.id]
    );

    if (emUso) {
      return res.status(409).json({
        erro: "Não é possível remover: este material já foi alugado ou entregue."
      });
    }

    const [result] = await pool.query(
      "DELETE FROM tb_material WHERE id_material = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Material não encontrado" });
    }

    res.json({ mensagem: "Material removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover material:", error);
    res.status(500).json({ erro: "Erro ao remover material" });
  }
});

export default router;