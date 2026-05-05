// scripts/seed.js
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config(); 

import pool from './config/db.js';

async function seed() {
  try {
    const senhaHash = await bcrypt.hash('admin123', 10);

    await pool.query(
      `INSERT IGNORE INTO tb_usuario (nome, email, senha_hash, perfil, ativo)
       VALUES (?, ?, ?, ?, 1)`,
      ['Administrador', 'admin@alexconstructions.com', senhaHash, 'admin']
    );

    console.log(' Admin criado com sucesso!');
    console.log('   Email: admin@alexconstructions.com');
    console.log('   Senha: admin123');
    console.log('  Mude a senha após o primeiro login!');
  } catch (error) {
    console.error(' Erro ao rodar o seed:', error.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

seed();