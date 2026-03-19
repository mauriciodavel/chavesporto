// Página de teste de timezone
const express = require('express');
const router = express.Router();
const { checkLateReturns } = require('../jobs/checkLateReturns');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/timezone-test', (req, res) => {
  const now = new Date();
  
  // Função JavaScript nativa para converter para Brasília
  const brasiliaTime = new Date(now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  const localTime = new Date(now.toLocaleString('pt-BR'));
  const utcTime = new Date(now.toLocaleString('pt-BR', { timeZone: 'UTC' }));
  
  res.json({
    success: true,
    message: 'Teste de Timezone',
    data: {
      iso: now.toISOString(),
      brasilia: brasiliaTime.toString(),
      local: localTime.toString(),
      utc: utcTime.toString(),
      timezone_offset_minutes: (localTime.getTime() - brasiliaTime.getTime()) / (1000 * 60)
    }
  });
});

// ROTA DE TESTE PARA DISPARAR VERIFICAÇÃO DE EMAILS MANUALMENTE
// GET /api/test/trigger-check-late-returns (admin only)
// Útil para testar se o sistema de notificações está funcionando
router.get('/trigger-check-late-returns', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const startTime = new Date();
    console.log('\n✅ [TEST] Disparo manual de checkLateReturns por admin');
    console.log(`   Admin ID: ${req.user.id}`);
    console.log(`   Horário: ${startTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // Chamar a verificação
    await checkLateReturns();
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    res.json({
      success: true,
      message: 'Verificação de atrasos disparada com sucesso (verifique os logs do servidor)',
      data: {
        started_at: startTime.toISOString(),
        completed_at: endTime.toISOString(),
        duration_seconds: duration.toFixed(2)
      }
    });
  } catch (error) {
    console.error('❌ [TEST] Erro ao disparar verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao disparar verificação',
      error: error.message
    });
  }
});

// ROTA DE DIAGNÓSTICO DO SCHEDULER
// GET /api/test/scheduler-status
// Verifica se o scheduler está inicializado e configurado
router.get('/scheduler-status', (req, res) => {
  const emailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ALERT_EMAIL);
  const jwtConfigured = !!process.env.JWT_SECRET;
  const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  
  res.json({
    success: true,
    message: 'Status do Agendador de Notificações',
    data: {
      email_configured: emailConfigured,
      email_host: process.env.SMTP_HOST ? '✓' : '✗',
      email_user: process.env.SMTP_USER ? '✓' : '✗',
      alert_email: process.env.ALERT_EMAIL ? '✓' : '✗',
      jwt_configured: jwtConfigured,
      supabase_configured: supabaseConfigured,
      node_env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      brasilia_time: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    }
  });
});

module.exports = router;
