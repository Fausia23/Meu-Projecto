import express from 'express';
import bcrypt from 'bcryptjs';
import pool from "../config/db.js"; // Importamos a conexão do arquivo db.js

const router = express.Router();

// --- VALIDAÇÃO NUIT (Duplicado, idealmente seria um utilitário compartilhado) ---
const validarNUIT = (nuit) => {
    if (!/^[0-9]{9}$/.test(nuit)) return false;
    // TODO: A validação do dígito de controlo foi temporariamente desativada.
    return true;
};

// --- ROTA REGISTAR POR ADMINISTRADOR/GESTOR ---
router.post('/register', async (req, res) => {
  const { nome, email, senha, nuit, perfil } = req.body;

  // Validação básica
  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ error: 'Nome, email, senha e perfil são obrigatórios.' });
  }

  // Validar o perfil fornecido
  const perfisValidos = ['admin', 'gestor', 'funcionario', 'cliente'];
  if (!perfisValidos.includes(perfil)) {
    return res.status(400).json({ error: 'Perfil inválido fornecido.' });
  }

  // NUIT é opcional para perfis internos, mas se fornecido, deve ser válido
  if (nuit && !validarNUIT(nuit)) {
    return res.status(400).json({ error: 'NUIT inválido.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
 
    const connection = await pool.getConnection();
    await connection.beginTransaction();
 
    // 1. Inserir na tabela de utilizadores
    const [userResult] = await connection.query(
      'INSERT INTO tb_usuario (nome, email, senha_hash, nuit, perfil, ativo) VALUES (?, ?, ?, ?, ?, 1)',
      [nome, email, senhaHash, nuit || null, perfil] // NUIT pode ser null
    );
    const id_usuario = userResult.insertId;
 
    // 2. Inserir na tabela de clientes se o perfil for 'cliente'
    if (perfil === 'cliente') {
      await connection.query(
        'INSERT INTO tb_cliente (id, nome_completo, email, nuit, tipo_cliente) VALUES (?, ?, ?, ?, ?)',
        [id_usuario, nome, email, nuit, 'Particular']
      );
    }
    // TODO: Se houver outras tabelas específicas para gestor/operador, inserir aqui.
    // Exemplo:
    // if (perfil === 'gestor') {
    //   await connection.query('INSERT INTO tb_gestores (id, nome, email) VALUES (?, ?, ?)', [id_usuario, nome, email]);
    // }
    // if (perfil === 'operador-armazem') {
    //   await connection.query('INSERT INTO tb_operadores (id, nome, email) VALUES (?, ?, ?)', [id_usuario, nome, email]);
    // }
 
    await connection.commit();
    connection.release();
    res.status(201).json({ message: `Conta de ${perfil} criada com sucesso!` });
  } catch (error) {
    await connection.rollback(); // Garante que a transação é desfeita em caso de erro
    connection.release();
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage && error.sqlMessage.includes('nuit')) return res.status(409).json({ error: 'NUIT já registado.' });
        return res.status(409).json({ error: 'Email já registado.' });
    }
    console.error("Erro no registo administrativo:", error);
    res.status(500).json({ error: 'Erro interno ao criar conta.' });
  }
});

export default router;