// Agendador de notificações para chaves não devolvidas
// Executa verificações em horários específicos e como fallback a cada 15 minutos

const cron = require('node-cron');
const { checkLateReturns } = require('./checkLateReturns');

// Rastrear estado do scheduler
let schedulerState = {
  initialized: false,
  jobs: [],
  lastRun: null,
  errorCount: 0
};

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
  
  // Verificar variáveis obrigatórias
  const emailConfigOK = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ALERT_EMAIL;
  const supabaseConfigOK = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
  
  if (!emailConfigOK) {
    console.error('❌ ERRO: Variáveis de email não configuradas!');
    console.error('   Configure SMTP_HOST, SMTP_USER, SMTP_PASS e ALERT_EMAIL no .env');
    console.error('   As notificações por email NÃO FUNCIONARÃO até essa configuração!\n');
    return;
  }
  
  if (!supabaseConfigOK) {
    console.error('❌ ERRO: Variáveis do Supabase não configuradas!');
    console.error('   Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env\n');
    return;
  }

  console.log('✅ Variáveis de configuração validadas');
  console.log(`   SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
  console.log(`   Alerta para: ${process.env.ALERT_EMAIL}\n`);

  // Função wrapper para tratamento de erros
  const safeCheckLateReturns = async (jobName) => {
    try {
      console.log(`\n🔔 [${jobName}] Iniciando...`);
      await checkLateReturns();
      schedulerState.lastRun = new Date();
      schedulerState.errorCount = 0; // Reset error count on success
    } catch (err) {
      schedulerState.errorCount++;
      console.error(`❌ Erro em ${jobName}:`, err.message);
      if (schedulerState.errorCount >= 5) {
        console.error(`⚠️  Múltiplas falhas detectadas (${schedulerState.errorCount}x). Verifique a configuração!`);
      }
    }
  };

  // Job 1: Executar exatamente às 12:30 (após matutino)
  const job1 = cron.schedule('30 12 * * *', () => {
    safeCheckLateReturns('Turno MATUTINO (12:30)').catch(() => {});
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Job 2: Executar exatamente às 18:30 (após vespertino)
  const job2 = cron.schedule('30 18 * * *', () => {
    safeCheckLateReturns('Turno VESPERTINO (18:30)').catch(() => {});
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Job 3: Executar exatamente às 22:35 (após noturno)
  const job3 = cron.schedule('35 22 * * *', () => {
    safeCheckLateReturns('Turno NOTURNO (22:35)').catch(() => {});
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Job 4: Failsafe - executar a cada 15 minutos (sem logs silenciosos)
  const job4 = cron.schedule('*/15 * * * *', () => {
    safeCheckLateReturns('Failsafe (15 min)').catch(() => {});
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Armazenar jobs no estado
  schedulerState.jobs = [job1, job2, job3, job4];
  schedulerState.initialized = true;

  console.log('\n📅 Agendamentos configurados:');
  console.log('   ✓ 12:30 (BR) - Verificação após turno MATUTINO');
  console.log('   ✓ 18:30 (BR) - Verificação após turno VESPERTINO');
  console.log('   ✓ 22:35 (BR) - Verificação após turno NOTURNO');
  console.log('   ✓ A cada 15 min - Failsafe/redundância');
  console.log('='.repeat(70));

  // Executar uma vez ao inicializar (para pegar alertas pendentes)
  console.log('\n⏳ Executando verificação inicial...\n');
  safeCheckLateReturns('Verificação Inicial').catch(() => {});

  return { job1, job2, job3, job4 };
}

// Exportar funções
module.exports = {
  initializeScheduler,
  getSchedulerState: () => schedulerState
};
