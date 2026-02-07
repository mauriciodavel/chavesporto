// Script para listar todos os usuários
require('dotenv').config();
const supabase = require('../config/supabase');

async function listUsers() {
  try {
    console.log('\n📋 LISTANDO INSTRUTORES\n');
    
    const { data: instructors, error } = await supabase
      .from('instructors')
      .select('id, matricula, name, email, role');
    
    if (error) {
      console.error('❌ ERRO:', error.message);
      return;
    }

    if (!instructors || instructors.length === 0) {
      console.log('❌ Nenhum instrutor encontrado');
      console.log('\n💡 Você precisa criar o admin! Execute este SQL no Supabase:\n');
      
      const bcrypt = require('bcrypt');
      const password = 'admin123';
      const hash = bcrypt.hashSync(password, 10);
      
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
      return;
    }

    console.log(`Encontrados ${instructors.length} instrutor(es):\n`);
    instructors.forEach((inst, i) => {
      console.log(`${i + 1}. ${inst.name}`);
      console.log(`   Matrícula: ${inst.matricula}`);
      console.log(`   Email: ${inst.email}`);
      console.log(`   Role: ${inst.role}\n`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  process.exit(0);
}

listUsers();
