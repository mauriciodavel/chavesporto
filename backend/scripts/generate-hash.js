// Script para gerar hash bcrypt seguro

const bcrypt = require('bcrypt');

async function generateHash() {
  // Altere 'admin123' para a senha desejada
  const password = 'admin123';
  
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash gerado com sucesso:');
    console.log(hash);
    console.log('\nUse este hash no comando SQL:');
    console.log(`
    INSERT INTO instructors (matricula, name, email, password, role, technical_area)
    VALUES (
      '0000',
      'Administrador',
      'admin@senai.com.br',
      '${hash}',
      'admin',
      'Administração'
    );
    `);
  } catch (error) {
    console.error('Erro ao gerar hash:', error);
  }
}

generateHash();
