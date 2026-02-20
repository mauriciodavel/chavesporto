require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const supabase = require('../config/supabase');

(async () => {
  try {
    console.log('\n✅ Marcando alertas como enviados...\n');
    
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('key_history')
      .update({ email_first_alert_sent_at: now })
      .eq('status', 'active')
      .is('email_first_alert_sent_at', null)
      .select('id, keys(environment)');
    
    if (error) {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    }
    
    if (data) {
      console.log(`✅ Atualizado ${data.length} registros`);
      data.forEach(r => console.log(`   • ${r.keys?.environment || 'Chave'}`));
    }
    
    console.log('\n⏰ Próxima recobrança: em 30 minutos\n');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
