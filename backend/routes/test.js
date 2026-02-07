// Página de teste de timezone
const express = require('express');
const router = express.Router();

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

module.exports = router;
