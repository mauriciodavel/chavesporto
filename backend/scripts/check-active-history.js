// Script para verificar se há históricos múltiplos ativos
const supabase = require('../config/supabase');

async function check() {
  try {
    // Buscar todas as chaves atuais
    const { data: keys } = await supabase
      .from('keys')
      .select('id, environment')
      .eq('status', 'in_use');

    console.log(`\n✅ Encontradas ${keys.length} chaves em uso\n`);

    for (const key of keys) {
      const { data: histories, error } = await supabase
        .from('key_history')
        .select('id, instructor_id, withdrawn_at, status, instructors(name)')
        .eq('key_id', key.id)
        .eq('status', 'active')
        .order('withdrawn_at', { ascending: false });

      if (error) {
        console.error(`❌ Erro ao buscar histórico de ${key.environment}:`, error.message);
      } else {
        console.log(`📋 Chave: ${key.environment}`);
        if (histories.length === 0) {
          console.log('   ⚠️  Nenhum histórico ativo encontrado (inconsistência!)');
        } else if (histories.length === 1) {
          console.log(`   ✅ Exatamente 1 record ativo`);
          console.log(`      - Retirado por: ${histories[0].instructors?.name}`);
          console.log(`      - Em: ${new Date(histories[0].withdrawn_at).toLocaleString('pt-BR')}`);
        } else {
          console.log(`   ❌ PROBLEMA: ${histories.length} records ativos encontrados!`);
          histories.forEach((h, idx) => {
            console.log(`      [${idx + 1}] ${h.instructors?.name} - ${new Date(h.withdrawn_at).toLocaleString('pt-BR')}`);
          });
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

check();
