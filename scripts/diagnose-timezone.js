#!/usr/bin/env node
// Verificar hora atual do servidor vs hora sendo salva no banco

const http = require('http');

console.log('🕐 DIAGNÓSTICO DE TIMEZONE\n');

// 1. Verificar hora do servidor
console.log('1️⃣  HORA DO SERVIDOR NODE.JS:');
const serverNow = new Date();
console.log(`   UTC: ${serverNow.toISOString()}`);
console.log(`   Local: ${serverNow.toString()}`);
console.log();

// 2. Fazer login e pegar os dados do histórico
const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/admin-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const loginData = JSON.stringify({
  email: 'admin@senai.com.br',
  password: 'admin123'
});

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.success && response.token) {
        console.log('✅ Login bem-sucedido');
        
        // Obter histórico
        const historyOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/history',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${response.token}`
          }
        };

        const historyReq = http.request(historyOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              const history = response.data || response;

              if (Array.isArray(history) && history.length > 0) {
                console.log();
                console.log('2️⃣  ÚLTIMOS REGISTROS DO BANCO:');
                console.log();

                history.slice(0, 3).forEach((h, idx) => {
                  console.log(`[${idx}] ${h.keys?.environment}`);
                  console.log(`    withdrawn_at (bruto): ${h.withdrawn_at}`);
                  
                  // Interpretar como UTC (correto)
                  const dateUTC = new Date(h.withdrawn_at);
                  const brasilia = dateUTC.toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  });
                  console.log(`    Convertido para Brasília: ${brasilia}`);
                  
                  if (h.returned_at) {
                    const dateReturned = new Date(h.returned_at);
                    const brasiliaReturned = dateReturned.toLocaleString('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    });
                    console.log(`    returned_at: ${brasiliaReturned}`);
                  }
                  
                  // Mostrar offset
                  const offset = dateUTC.getTimezoneOffset() / 60;
                  console.log(`    ⚠️  Offset da máquina: ${offset}h (se for 0, está em UTC; se for -5 ou -4, é local)`);
                  console.log();
                });

                console.log('=' .repeat(60));
                console.log('3️⃣  ANÁLISE:');
                console.log('=' .repeat(60));
                console.log();
                console.log('Se as datas estão 3 horas ADIANTADAS:');
                console.log('  → Backend está salvando a hora CERTA em UTC');
                console.log('  → Mas frontend estáinterpretando como horário local (BRT)');
                console.log('  → Logo, BRT + 3h = UTC + 6h = erro!');
                console.log();
                console.log('CAUSA RAIZ:');
                console.log('  O servidor Node.js está em UTC-3 (America/Sao_Paulo)');
                console.log('  Então new Date() retorna a hora de Brasília internamente');
                console.log('  Mas .toISOString() converte para UTC (+3 horas)');
                console.log('  E o frontend não sabe disso!');
                console.log();
              }
            } catch (err) {
              console.error('Erro:', err.message);
            }
          });
        });
        historyReq.end();
      }
    } catch (err) {
      console.error('Erro login:', err.message);
    }
  });
});
loginReq.write(loginData);
loginReq.end();
