// Script para listar todos os instrutores cadastrados
const supabase = require('../config/supabase');

async function list() {
  try {
    const { data: instructors } = await supabase
      .from('instructors')
      .select('id, matricula, name, email, role')
      .order('name');

    console.log('\n📋 Instrutores Cadastrados:\n');
    instructors.forEach((instr) => {
      console.log(`  ${instr.name}`);
      console.log(`    Matrícula: ${instr.matricula}`);
      console.log(`    Email: ${instr.email}`);
      console.log(`    Função: ${instr.role}`);
      console.log(`    ID: ${instr.id}\n`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

list();
