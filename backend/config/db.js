
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env
dotenv.config();



console.log('=== DEBUG .ENV ===');
console.log('DB_HOST:', JSON.stringify(process.env.DB_HOST));
console.log('DB_PORT:', JSON.stringify(process.env.DB_PORT));
console.log('DB_USER:', JSON.stringify(process.env.DB_USER));
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'UNDEFINED');
console.log('DB_PASSWORD char codes (5 primeiros):', process.env.DB_PASSWORD ? [...process.env.DB_PASSWORD.slice(0, 5)].map(c => c.charCodeAt(0)).join(',') : 'UNDEFINED');
console.log('DB_PASSWORD char codes (5 ultimos):', process.env.DB_PASSWORD ? [...process.env.DB_PASSWORD.slice(-5)].map(c => c.charCodeAt(0)).join(',') : 'UNDEFINED');
console.log('DB_NAME:', JSON.stringify(process.env.DB_NAME));
console.log('DB_SSL:', JSON.stringify(process.env.DB_SSL));
console.log('==================');
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Log apenas de criação do pool (não tenta conectar ainda)
console.log('Pool de conexões MySQL configurado (esperando requisições)');

export default pool;