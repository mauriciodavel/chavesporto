const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Servir arquivos estáticos de mídia
app.use('/media', express.static(path.join(__dirname, '../public/media')));

// Importar rotas
const authRoutes = require('./routes/auth');
const keyRoutes = require('./routes/keys');
const historyRoutes = require('./routes/history');
const instructorRoutes = require('./routes/instructors');
const qrRoutes = require('./routes/qr');
const testRoutes = require('./routes/test');
const setupRoutes = require('./routes/setup');
const reservationRoutes = require('./routes/reservationRoutes');
const blockoutRoutes = require('./routes/blockouts');
const painelRoutes = require('./routes/painel');
const environmentRoutes = require('./routes/environments');
const turmasRoutes = require('./routes/turmas');

// Importar schedulers
const { initializeScheduler } = require('./jobs/scheduleNotifications');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/test', testRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/blockouts', blockoutRoutes);
app.use('/api/painel', painelRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/turmas', turmasRoutes);

// Rota para painel de ambientes (público)
app.get('/painel', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/painel-ambientes.html'));
});

// Rota para disponibilidade de ambientes
app.get('/disponibilidade', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/disponibilidade-ambientes.html'));
});

// Rota raiz - servir login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Rota para dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Rota para admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Rota para imprimir QR-Codes
app.get('/print-qr', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/print-qr.html'));
});

// Rota para reservar chave (usuário)
app.get('/reservar-chave', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/reservar-chave.html'));
});

// Rota para admin gerenciar reservas
app.get('/admin-reservas', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin-reservas.html'));
});

// Rota para admin gerenciar bloqueios de calendário
app.get('/admin-blockouts', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin-blockouts.html'));
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

// ========== HANDLERS PARA ERROS NÃO CAPTURADOS ==========
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Manter o servidor rodando mesmo com erros não tratados
});

// ========== INICIAR SERVIDOR ==========
// Com jobs em horários específicos: 12:30, 18:30, 22:35 (30 min após fim de cada turno)
// E failsafe a cada 15 minutos
console.log('\n📧 Verificando configuração de email...');
const emailConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ALERT_EMAIL;

if (emailConfigured) {
  console.log('✅ Email configurado! Inicializando agendador de notificações...');
  try {
    const { getSchedulerState } = require('./jobs/scheduleNotifications');
    initializeScheduler();
    const state = getSchedulerState();
    console.log(`✅ Agendador inicializado com sucesso (${state.jobs.length} jobs)`);
  } catch (err) {
    console.error('❌ Erro ao inicializar agendador de notificações:', err.message);
    console.error('   Verifique o arquivo .env e tente reiniciar o servidor');
  }
} else {
  const missing = [];
  if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
  if (!process.env.SMTP_USER) missing.push('SMTP_USER');
  if (!process.env.ALERT_EMAIL) missing.push('ALERT_EMAIL');
  
  console.warn('\n⚠️  AVISO: Email não totalmente configurado!');
  console.warn(`   Variáveis faltando: ${missing.join(', ')}`);
  console.warn('   Para ativar notificações de chaves não devolvidas, configure:');
  console.warn('   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL');
  console.warn('   - Veja o arquivo .env.example para mais detalhes\n');
}

// Exportar para Vercel
module.exports = app;

// Iniciar servidor localmente
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT}`);
  });
}
