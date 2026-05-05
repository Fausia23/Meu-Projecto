// routes/usuarios.js
import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { soAdmin, soGestor, qualquerAutenticado } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ─── GET / — Listar todos os utilizadores (só admin)
router.get('/', soGestor, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario, nome, email, perfil, ativo, data_criacao
       FROM tb_usuario
       ORDER BY data_criacao DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ error: 'Erro ao obter utilizadores.' });
  }
});

// ─── GET /:id — Obter utilizador por ID (admin e gestor) ──────────────────────
router.get('/:id', soGestor, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario, nome, email, perfil, ativo, data_criacao
       FROM tb_usuario
       WHERE id_usuario = ?`,
      [req.params.id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: 'Utilizador não encontrado.' });

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao obter utilizador:', error);
    res.status(500).json({ error: 'Erro ao obter utilizador.' });
  }
});

// ─── POST /admin — Criar admin/gestor/funcionario (só admin) ──────────────────
router.post('/admin', soAdmin, async (req, res) => {
  const { nome, email, senha, perfil } = req.body;

  if (!nome || !email || !senha || !perfil)
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });

  const PERFIS_VALIDOS = ['admin', 'gestor', 'funcionario'];
  if (!PERFIS_VALIDOS.includes(perfil))
    return res.status(400).json({ error: `Perfil inválido. Use: ${PERFIS_VALIDOS.join(', ')}.` });

  try {
    const senhaHash = await bcrypt.hash(senha, 12);

    const [result] = await pool.query(
      `INSERT INTO tb_usuario (nome, email, senha_hash, perfil, ativo)
       VALUES (?, ?, ?, ?, 1)`,
      [nome, email, senhaHash, perfil]
    );

    res.status(201).json({
      message: `Utilizador '${perfil}' criado com sucesso.`,
      id: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email já registado.' });

    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ─── PUT /:id — Actualizar utilizador (só admin) ──────────────────────────────
router.put('/:id', soAdmin, async (req, res) => {
  const { nome, email, senha, perfil, ativo } = req.body;

  if (!nome || !email || !perfil)
    return res.status(400).json({ error: 'Nome, email e perfil são obrigatórios.' });

  try {
    // Monta query dinamicamente — senha só actualizada se fornecida
    let query = `
      UPDATE tb_usuario SET
        nome   = ?,
        email  = ?,
        perfil = ?,
        ativo  = ?
    `;
    const params = [nome, email, perfil, ativo ?? 1];

    if (senha) {
      const senhaHash = await bcrypt.hash(senha, 12);
      query += `, senha_hash = ?`;
      params.push(senhaHash);
    }

    query += ' WHERE id_usuario = ?';
    params.push(req.params.id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Utilizador não encontrado.' });

    res.json({ message: 'Utilizador actualizado com sucesso.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email já registado.' });

    console.error('Erro ao actualizar utilizador:', error);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ─── PATCH /:id/ativo — Activar ou desactivar conta (só admin) ────────────────
router.patch('/:id/ativo', soAdmin, async (req, res) => {
  const { ativo } = req.body;

  if (typeof ativo !== 'boolean' && ativo !== 0 && ativo !== 1)
    return res.status(400).json({ error: 'Campo ativo deve ser true/false ou 0/1.' });

  try {
    const [result] = await pool.query(
      'UPDATE tb_usuario SET ativo = ? WHERE id_usuario = ?',
      [ativo ? 1 : 0, req.params.id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Utilizador não encontrado.' });

    res.json({ message: `Conta ${ativo ? 'activada' : 'desactivada'} com sucesso.` });
  } catch (error) {
    console.error('Erro ao alterar estado:', error);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ─── DELETE /:id — Remover utilizador (só admin) ──────────────────────────────
router.delete('/:id', soAdmin, async (req, res) => {
  // ✅ Impede o admin de se apagar a si próprio
  if (parseInt(req.params.id) === req.usuario.id)
    return res.status(400).json({ error: 'Não pode eliminar a sua própria conta.' });

  try {
    const [result] = await pool.query(
      'DELETE FROM tb_usuario WHERE id_usuario = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Utilizador não encontrado.' });

    res.json({ message: 'Utilizador removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover utilizador:', error);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;