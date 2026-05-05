// import pool from './db.js';

// async function cadastrarNovoMaterial() {
//     console.log(' Iniciando cadastro de material...');

//     try {
//         // DEFININDO O PRODUTO (Simulação de um formulário)
//         const novoMaterial = {
//             id_categoria: 1, // Atenção: Esse ID precisa existir na tabela tb_categoria
//             nome: 'Furadeira de Impacto Bosch',
//             descricao: 'Furadeira profissional 750W 220v com maleta',
//             imagem_url: 'imgFuradeira.jpg',
//             preco_diaria: 450.00, // 450 Meticais (exemplo)
//             quantidade_total: 10,
//             // Ao cadastrar, a qtd disponível geralmente é igual à total
//             quantidade_disponivel: 10, 
//             estado_geral: 'Disponivel' // Tem que ser exatamente como está no ENUM
//         };

//         const sql = `
//             INSERT INTO tb_material 
//             (id_categoria, nome, descricao, imagem_url, preco_diaria, quantidade_total, quantidade_disponivel, estado_geral)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//         const values = [
//             novoMaterial.id_categoria,
//             novoMaterial.nome,
//             novoMaterial.descricao,
//             novoMaterial.imagem_url,
//             novoMaterial.preco_diaria,
//             novoMaterial.quantidade_total,
//             novoMaterial.quantidade_disponivel,
//             novoMaterial.estado_geral
//         ];

//         // Executa a inserção
//         const [resultado] = await pool.query(sql, values);

//         console.log('✅ Material Cadastrado com Sucesso!');
//         console.log(`🆔 ID do novo material: ${resultado.insertId}`);

//         // --- CONFERÊNCIA ---
//         // Vamos buscar esse item que acabamos de criar para ver se gravou certo
//         const [consulta] = await pool.query('SELECT * FROM tb_material WHERE id_material = ?', [resultado.insertId]);
//         console.log('\n📦 Dados gravados no banco:');
//         console.table(consulta);

//     } catch (erro) {
//         console.error('❌ Erro ao cadastrar:', erro.message);
//     } finally {
//         await pool.end();
//     }
// }

// cadastrarNovoMaterial();