// Script para criar usuário admin
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('instructors')
      .insert([{
        matricula: '0000',
        name: 'Administrador',
        email: 'admin@senai.com.br',
        password: hash,
        role: 'admin',
        technical_area: 'Administração'
      }]);

    if (error) {
      console.error('❌ Erro ao criar admin:', error.message);
      return;
    }

    console.log('✅ Admin criado com sucesso!');
    console.log('\n📋 Use estas credenciais para login:');
    console.log('   Matrícula: 0000');
    console.log('   Senha: admin123');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  process.exit(0);
}

createAdmin();
