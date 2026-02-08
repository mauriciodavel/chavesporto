// Job para verificar e alertar chaves não devolvidas - backend/jobs/checkLateReturns.js
const supabase = require('../config/supabase');
const emailService = require('../utils/emailService');
const { normalizeSupabaseRecords } = require('../utils/dateNormalizer');

/**
 * Verifica chaves não devolvidas e envia alertas por email
 * Este job deve rodar periodicamente (ex: a cada 30 minutos)
 */
async function checkLateReturns() {
  try {
    console.log(`\n[${new Date().toLocaleString('pt-BR')}] 🔍 Verificando chaves não devolvidas...`);
    
    // Buscar chaves que estão em uso (status = 'active')
    // e que foram retiradas antes de hoje às 7:00 (início do expediente)
    const today = new Date();
    today.setHours(7, 0, 0, 0);
    
    const { data: activeKeys, error } = await supabase
      .from('key_history')
      .select(`
        *,
        keys(id, environment, description, location, qr_code),
        instructors(id, name, matricula, email)
      `)
      .eq('status', 'active')
      .lt('withdrawn_at', today.toISOString());
    
    if (error) {
      console.error('❌ Erro ao buscar chaves ativas:', error);
      return;
    }
    
    if (!activeKeys || activeKeys.length === 0) {
      console.log('✓ Nenhuma chave em atraso');
      return;
    }
    
    console.log(`⚠️  Encontradas ${activeKeys.length} chave(s) em atraso`);
    
    // Normalizar registros
    const normalizedKeys = normalizeSupabaseRecords(activeKeys);
    
    // Para cada chave em atraso, enviar email
    for (const record of normalizedKeys) {
      if (!record.keys || !record.instructors) {
        console.warn(`  ⚠️  Registro incompleto, pulando...`);
        continue;
      }
      
      const keyInfo = {
        id: record.key_id,
        environment: record.keys.environment,
        description: record.keys.description || '-',
        location: record.keys.location || '-',
        qr_code: record.keys.qr_code
      };
      
      const instructorInfo = {
        id: record.instructor_id,
        name: record.instructors.name,
        matricula: record.instructors.matricula,
        email: record.instructors.email,
        withdrawnAt: record.withdrawn_at
      };
      
      console.log(`\n  📧 Enviando alerta para: ${record.keys.environment}`);
      console.log(`     Instrutor: ${instructorInfo.name}`);
      
      // Enviar email
      const emailSent = await emailService.sendLateReturnAlert(keyInfo, instructorInfo);
      
      if (emailSent) {
        console.log(`     ✅ Email enviado para: ${process.env.ALERT_EMAIL}`);
        
        // Atualizar registro para não enviar novamente
        // (Opcional: você pode adicionar um campo "email_sent_at" na tabela)
      } else {
        console.log(`     ❌ Falha ao enviar email`);
      }
    }
    
    console.log(`\n✓ Verificação concluída`);
    
  } catch (error) {
    console.error('❌ Erro no job de verificação de devoluções:', error);
  }
}

// Exportar função
module.exports = { checkLateReturns };

// Se rodado diretamente, executar uma vez
if (require.main === module) {
  require('dotenv').config();
  checkLateReturns().then(() => process.exit(0));
}
