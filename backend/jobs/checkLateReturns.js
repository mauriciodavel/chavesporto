// Job para verificar e alertar chaves não devolvidas - backend/jobs/checkLateReturns.js
const supabase = require('../config/supabase');
const emailService = require('../utils/emailService');
const { normalizeSupabaseRecords } = require('../utils/dateNormalizer');
const { isAfterWithdrawWindow } = require('../utils/shiftTimes');

/**
 * Verifica chaves não devolvidas e envia alertas por email
 * Este job deve rodar periodicamente (ex: a cada 30 minutos)
 */
async function checkLateReturns() {
  try {
    console.log(`\n[${new Date().toLocaleString('pt-BR')}] 🔍 Verificando chaves não devolvidas...`);
    
    // Obter data de hoje em formato YYYY-MM-DD (Brasília)
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    const todayString = formatter.format(new Date());
    
    // 1. Buscar TODAS as chaves não devolvidas (status = 'active')
    const { data: activeKeys, error } = await supabase
      .from('key_history')
      .select(`
        *,
        keys(id, environment, description, location, qr_code),
        instructors(id, name, matricula, email)
      `)
      .eq('status', 'active');
    
    if (error) {
      console.error('❌ Erro ao buscar chaves ativas:', error);
      return;
    }
    
    if (!activeKeys || activeKeys.length === 0) {
      console.log('✓ Nenhuma chave em atraso');
      return;
    }
    
    console.log(`📦 Encontradas ${activeKeys.length} chave(s) ativa(s)`);
    
    // 2. Para cada chave ativa, buscar sua reserva e verificar se está em atraso
    const lateReturns = [];
    
    for (const keyHistory of activeKeys) {
      try {
        // Buscar a reserva correspondente que já terminou (a chave deveria ter sido devolvida)
        // Procura reservas onde:
        // - A reserva pertence a essa chave e instrutor
        // - A reserva está aprovada
        // - A data de fim da reserva é <= hoje (reserva já terminou)
        const { data: reservation, error: resError } = await supabase
          .from('key_reservations')
          .select('*')
          .eq('key_id', keyHistory.key_id)
          .eq('instructor_id', keyHistory.instructor_id)
          .eq('status', 'approved')
          .lte('reservation_end_date', todayString)  // Reserva já terminou
          .order('reservation_end_date', { ascending: false })  // Pega a mais recente
          .limit(1)
          .single();

        if (resError && resError.code !== 'PGRST116') {
          // PGRST116 = no rows found, é esperado
          console.warn(`  ⚠️  Erro ao buscar reserva para chave ${keyHistory.key_id}:`, resError.message);
          continue;
        }

        // Se não encontrou reserva, pular (chave órfã)
        if (!reservation) {
          console.log(`  Chave ${keyHistory.keys.environment}: sem reserva finalizada anterior`);
          continue;
        }
        
        // 3. Verificar se PASSOU do fim da janela de retirada
        let hasPassedWindow = false;
        
        // Se a data de fim da reserva é ONTEM ou antes, definitivamente passou do horário
        if (reservation.reservation_end_date < todayString) {
          hasPassedWindow = true;
          console.log(`  ⏰ Reserva era para ${reservation.reservation_end_date}, já passou (hoje é ${todayString})`);
        } else if (reservation.reservation_end_date === todayString) {
          // Se a reserva é de HOJE, verifica a hora atual
          hasPassedWindow = isAfterWithdrawWindow(reservation.shift);
          console.log(`  ⏰ Reserva é para hoje, verificando horário...`);
        }
        
        if (hasPassedWindow) {
          console.log(`  ⏰ Chave ${keyHistory.keys.environment} (${reservation.shift}): EM ATRASO!`);
          
          // Determinar se precisa enviar alerta ou recobrança
          let isReminder = false;
          const emailFirstAlertSentAt = keyHistory.email_first_alert_sent_at;
          
          // Se nunca foi enviado alerta
          if (!emailFirstAlertSentAt) {
            console.log(`     📧 Primeiro alerta será enviado`);
            isReminder = false;
          } else {
            // Verificar se passou 24 horas desde o primeiro alerta
            const horasPassed = (new Date() - new Date(emailFirstAlertSentAt)) / (1000 * 60 * 60);
            console.log(`     ⏳ ${horasPassed.toFixed(1)} horas desde o primeiro alerta`);
            
            // Se passou 24 horas E ainda não foi enviada recobrança
            if (horasPassed >= 24 && !keyHistory.email_reminder_sent_at) {
              console.log(`     🔴 Recobrança será enviada (passou 24 horas)`);
              isReminder = true;
            } else if (horasPassed >= 24 && keyHistory.email_reminder_sent_at) {
              console.log(`     ℹ️  Recobrança já foi enviada`);
              continue;
            } else {
              console.log(`     ℹ️  Aguardando 24 horas para enviar recobrança`);
              continue;
            }
          }
          
          lateReturns.push({
            keyHistory,
            reservation,
            isReminder
          });
        } else {
          console.log(`  ✅ Chave ${keyHistory.keys.environment} (${reservation.shift}): ainda dentro da janela`);
        }
      } catch (err) {
        console.error(`  ❌ Erro ao processar chave ${keyHistory.key_id}:`, err.message);
      }
    }
    
    console.log(`\n⚠️  Chaves em atraso encontradas: ${lateReturns.length}`);
    
    // Para cada chave em atraso, enviar email
    for (const item of lateReturns) {
      const record = item.keyHistory;
      const isReminder = item.isReminder;
      
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
      
      console.log(`\n  📧 Enviando ${isReminder ? 'RECOBRANÇA' : 'ALERTA'} para: ${record.keys.environment}`);
      console.log(`     Instrutor: ${instructorInfo.name} (${instructorInfo.email})`);
      
      // Enviar email (para admin e para instrutor)
      const emailSent = await emailService.sendLateReturnAlert(keyInfo, instructorInfo, isReminder);
      
      if (emailSent) {
        // Atualizar registro com timestamp do email enviado
        const fieldToUpdate = isReminder ? 'email_reminder_sent_at' : 'email_first_alert_sent_at';
        const { error: updateError } = await supabase
          .from('key_history')
          .update({ [fieldToUpdate]: new Date().toISOString() })
          .eq('id', record.id);
        
        if (updateError) {
          console.warn(`     ⚠️  Erro ao atualizar registro: ${updateError.message}`);
        } else {
          console.log(`     ✅ Registro marcado com ${isReminder ? 'recobrança' : 'alerta primeiro'} enviado`);
        }
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
