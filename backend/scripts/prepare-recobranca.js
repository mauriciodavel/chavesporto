require('dotenv').config();
const supabase = require('./config/supabase');

(async () => {
  try {
    console.log('\n🔍 Verificando chaves ativas...\n');
    
    // Listar todas as chaves ativas
    const { data: activeKeys, error: checkError } = await supabase
      .from('key_history')
      .select('id, status, email_first_alert_sent_at, withdrawn_at')
      .eq('status', 'active');
    
    if (checkError) {
      console.error('Erro:', checkError.message);
      process.exit(1);
    }
    
    console.log(`Encontradas ${activeKeys.length} chave(s) ativa(s)`);
    activeKeys.forEach((k, i) => {
      console.log(`\n${i+1}. ID: ${k.id}`);
      console.log(`   Retirada: ${k.withdrawn_at}`);
      console.log(`   Alerta enviado: ${k.email_first_alert_sent_at || 'NÃO'}`);
    });
    
    // Agora atualizar aquelas sem alerta
    console.log('\n\n📝 Atualizando registros...\n');
    const { data: updated, error: updateError } = await supabase
      .from('key_history')
      .update({ email_first_alert_sent_at: new Date().toISOString() })
      .eq('status', 'active')
      .is('email_first_alert_sent_at', null);
    
    if (updateError) {
      console.error('Erro ao atualizar:', updateError.message);
      process.exit(1);
    }
    
    console.log(`✅ Atualizadas ${updated.length} chave(s)\n`);
    
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
