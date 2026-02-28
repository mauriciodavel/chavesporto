// Agendador de notificações para chaves não devolvidas
// Executa verificações em horários específicos e como fallback a cada 15 minutos

const cron = require('node-cron');
const { checkLateReturns } = require('./checkLateReturns');

/**
 * Inicializa o sistema de agendamento de notificações
 * Horários configurados:
 * - 12:30 (30 minutos após fim do turno matutino 11:30 → 12:00)
 * - 18:30 (30 minutos após fim do turno vespertino 17:30 → 18:00)
 * - 22:35 (5 minutos após fim do turno noturno 22:00 → 22:30)
 * - A cada 15 minutos como fallback (para não perder nenhum alerta)
 */
function initializeScheduler() {
  console.log('\n' + '='.repeat(70));
  console.log('⏰ INICIALIZANDO AGENDADOR DE NOTIFICAÇÕES');
  console.log('='.repeat(70));
  
  // Verificar se variáveis de ambiente estão configuradas
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.error('❌ ERRO: Variáveis de email não configuradas!');
    console.error('   Configure SMTP_HOST, SMTP_USER, SMTP_PASS e ALERT_EMAIL no .env');
    console.log('   As notificações por email NÃO FUNCIONARÃO até essa configuração!\n');
  } else {
    console.log('✅ Serviço de email configurado');
    console.log(`   SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    console.log(`   Alerta para: ${process.env.ALERT_EMAIL}\n`);
  }

  // Job 1: Executar exatamente às 12:30 (após matutino)
  // Minuto 30, hora 12, todos os dias
  const job1 = cron.schedule('30 12 * * *', () => {
    console.log('\n🔔 [Agendado] Executando verificação do turno MATUTINO (12:30)');
    checkLateReturns().catch(err => console.error('❌ Erro em job1:', err));
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Job 2: Executar exatamente às 18:30 (após vespertino)
  // Minuto 30, hora 18, todos os dias
  const job2 = cron.schedule('30 18 * * *', () => {
    console.log('\n🔔 [Agendado] Executando verificação do turno VESPERTINO (18:30)');
    checkLateReturns().catch(err => console.error('❌ Erro em job2:', err));
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Job 3: Executar exatamente às 22:35 (após noturno)
  // Minuto 35, hora 22, todos os dias
  const job3 = cron.schedule('35 22 * * *', () => {
    console.log('\n🔔 [Agendado] Executando verificação do turno NOTURNO (22:35)');
    checkLateReturns().catch(err => console.error('❌ Erro em job3:', err));
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Job 4: Failsafe - executar a cada 15 minutos
  // Para garantir que nenhum alerta é perdido mesmo se o servidor reiniciar
  // Minutos: 0, 15, 30, 45
  const job4 = cron.schedule('*/15 * * * *', () => {
    // Silencioso durante execução - apenas logs importantes do checkLateReturns
    checkLateReturns().catch(err => console.error('❌ Erro em job4 (failsafe):', err));
  }, {
    timezone: 'America/Sao_Paulo'
  });

  console.log('\n📅 Agendamentos configurados:');
  console.log('   ✓ 12:30 - Verificação após turno MATUTINO');
  console.log('   ✓ 18:30 - Verificação após turno VESPERTINO');
  console.log('   ✓ 22:35 - Verificação após turno NOTURNO');
  console.log('   ✓ A cada 15 min - Failsafe/redundância');
  console.log('='.repeat(70) + '\n');

  // Executar uma vez ao inicializar (para pegar alertas pendentes)
  console.log('⏳ Executando verificação inicial...\n');
  checkLateReturns().catch(err => console.error('❌ Erro na verificação inicial:', err));

  return { job1, job2, job3, job4 };
}

module.exports = {
  initializeScheduler
};
