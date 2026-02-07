#!/usr/bin/env node
// Script para login e teste de histórico com autenticação

const http = require('http');

// 1. Fazer login como admin
console.log('🔐 ETAPA 1: Fazendo login como admin\n');

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

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.success && response.token) {
        console.log('✅ Login bem-sucedido!');
        console.log(`   Token: ${response.token.substring(0, 30)}...`);
        console.log();

        // 2. Agora fazer a requisição de histórico com o token
        testHistoryWithToken(response.token);
      } else {
        console.error('❌ Falha no login:', response.message);
      }
    } catch (err) {
      console.error('❌ Erro ao fazer parse do login:', err.message);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ ERRO na requisição de login:', error.message);
});

loginReq.write(loginData);
loginReq.end();

// Função para testar histórico com token
function testHistoryWithToken(token) {
  console.log('📋 ETAPA 2: Buscando histórico com autenticação\n');

  const historyOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/history',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const historyReq = http.request(historyOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);

        // API retorna { success: true, data: [...] }
        const history = response.data || response;

        if (Array.isArray(history)) {
          console.log(`✅ Recebido ${history.length} registros de histórico\n`);

          // Testar formatação
          testDateFormatting(history);
        } else if (response.success === false) {
          console.error('❌ Erro na API:', response.message);
        } else {
          console.error('❌ Resposta não é um array:');
          console.error(JSON.stringify(response, null, 2).substring(0, 300));
        }
      } catch (err) {
        console.error('❌ Erro ao fazer parse do histórico:', err.message);
        console.error('Response:', data.substring(0, 300));
      }
    });
  });

  historyReq.on('error', (error) => {
    console.error('❌ ERRO na requisição:', error.message);
  });

  historyReq.end();
}

// Função para testar formatação
function testDateFormatting(history) {
  // Simular TimezoneFormatter (como no browser)
  class TimezoneFormatter {
    static formatDateTime(date) {
      return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Sao_Paulo'
      });
    }
  }

  function formatDateTime(dateString) {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return TimezoneFormatter.formatDateTime(date);
    } catch (error) {
      return '⚠️ Erro';
    }
  }

  console.log('🕐 TESTE 3: Formatando datas\n');

  let successCount = 0;
  history.forEach((h, idx) => {
    const withdrawn = formatDateTime(h.withdrawn_at);
    const returned = formatDateTime(h.returned_at);

    if (withdrawn !== '-' && !withdrawn.includes('⚠️')) {
      console.log(`  ✅ [${idx}] ${h.keys?.environment || 'N/A'}`);
      console.log(`     Retirado: ${withdrawn}`);
      if (returned !== '-') {
        console.log(`     Devolvido: ${returned}`);
      }
      successCount++;
    } else {
      console.log(`  ❌ [${idx}] Erro ao formatar datas`);
    }
  });

  console.log();
  if (successCount === history.length) {
    console.log(`✅ SUCESSO: ${successCount}/${history.length} datas formatadas corretamente!`);
  } else {
    console.log(`⚠️  ${successCount}/${history.length} datas formatadas`);
  }
}
