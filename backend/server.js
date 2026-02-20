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

// Importar jobs
const { checkLateReturns } = require('./jobs/checkLateReturns');

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

// Inicializar job de verificação de devoluções em atraso
// Executa a cada 30 minutos para verificar chaves não devolvidas
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ALERT_EMAIL) {
  console.log('📧 Email service iniciado - verificando devoluções em atraso a cada 30 minutos');
  
  // Executar uma vez ao iniciar
  checkLateReturns();
  
  // Agendar para rodar a cada 30 minutos (1800000 ms)
  setInterval(() => {
    checkLateReturns();
  }, 30 * 60 * 1000);
} else {
  console.log('⚠️  Email service DESATIVADO - configure SMTP_HOST, SMTP_USER, ALERT_EMAIL para ativar');
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
