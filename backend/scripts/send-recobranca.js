require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const supabase = require('../config/supabase');
const emailService = require('../utils/emailService');

(async () => {
  try {
    console.log('\n🔍 Verificando chaves em atraso...\n');
    
    // 1. Buscar chaves ativas
    const { data: activeKeys, error } = await supabase
      .from('key_history')
      .select(`
        id,
        status,
        withdrawn_at,
        email_first_alert_sent_at,
        email_reminder_sent_at,
        keys(environment, description, location, qr_code),
        instructors(name, matricula, email)
      `)
      .eq('status', 'active')
      .limit(10);
    
    if (error) {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    }
    
    console.log(`📦 Encontradas ${activeKeys.length} chave(s) ativa(s)\n`);
    
    if (activeKeys.length === 0) {
      console.log('Sem chaves em atraso');
      process.exit(0);
    }
    
    // 2. Marcar como enviado e forçar recobrança
    for (const record of activeKeys) {
      console.log(`\n📧 Processando: ${record.keys.environment}`);
      console.log(`   Instrutor: ${record.instructors.name}`);
      console.log(`   Retirada: ${record.withdrawn_at.substring(0, 19)}`);
      
      const keyInfo = {
        id: record.id,
        environment: record.keys.environment,
        description: record.keys.description || '-',
        location: record.keys.location || '-',
        qr_code: record.keys.qr_code
      };
      
      const instructorInfo = {
        id: record.id,
        name: record.instructors.name,
        matricula: record.instructors.matricula,
        email: record.instructors.email,
        withdrawnAt: record.withdrawn_at
      };
      
      // Enviar email de recobrança
      console.log(`   📨 Enviando email de recobrança...`);
      const sent = await emailService.sendLateReturnAlert(keyInfo, instructorInfo, true);
      
      if (sent) {
        // Marcar como enviado
        const now = new Date().toISOString();
        await supabase
          .from('key_history')
          .update({ email_reminder_sent_at: now })
          .eq('id', record.id);
        
        console.log(`   ✅ Email enviado e marcado`);
      }
    }
    
    console.log('\n✅ Processo concluído\n');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
