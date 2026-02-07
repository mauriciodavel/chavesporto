const supabase = require('../config/supabase');

async function check() {
  try {
    // Buscar a chave Lab-03
    const { data: key } = await supabase
      .from('keys')
      .select('id')
      .eq('environment', 'Lab-03 - Organizar')
      .single();

    console.log(`\n🔍 Verificando quem retirou Lab-03...\n`);

    // Buscar o histórico ativo
    const { data: history } = await supabase
      .from('key_history')
      .select('id, instructor_id, withdrawn_at, instructors(id, name, matricula)')
      .eq('key_id', key.id)
      .eq('status', 'active')
      .order('withdrawn_at', { ascending: false })
      .limit(1)
      .single();

    if (!history) {
      console.log('Nenhum histórico ativo encontrado');
      return;
    }

    console.log(`Retirada por: ${history.instructors.name}`);
    console.log(`Matrícula: ${history.instructors.matricula}`);
    console.log(`ID: ${history.instructors.id}`);
    console.log(`Retirada em: ${new Date(history.withdrawn_at).toLocaleString('pt-BR')}`);
    console.log(`\n⚠️  Para devolver, o usuário DEVE ser exatamente este mesmo ID: ${history.instructors.id}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

check();
