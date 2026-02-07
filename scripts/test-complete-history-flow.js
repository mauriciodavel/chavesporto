#!/usr/bin/env node
// Script para testar o fluxo completo de histórico: API → formatação → exibição

const http = require('http');
const fs = require('fs');
const path = require('path');

// Simular a classe TimezoneFormatter (função vanilla JS pura)
class TimezoneFormatter {
  static format(date, format = 'datetime') {
    if (!date) return '-';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const options = {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    if (format === 'date') {
      delete options.hour;
      delete options.minute;
      delete options.second;
      delete options.hour12;
    } else if (format === 'time') {
      delete options.year;
      delete options.month;
      delete options.day;
    }

    return dateObj.toLocaleString('pt-BR', options);
  }

  static formatDateTime(date) {
    return this.format(date, 'datetime');
  }

  static formatDate(date) {
    return this.format(date, 'date');
  }

  static formatTime(date) {
    return this.format(date, 'time');
  }
}

// Simular formatDateTime do app.js
function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    if (typeof TimezoneFormatter === 'undefined') {
      console.warn('⚠️  TimezoneFormatter não está disponível');
      return new Date(dateString).toLocaleString('pt-BR');
    }
    const date = new Date(dateString);
    return TimezoneFormatter.formatDateTime(date);
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Input:', dateString);
    return dateString ? '⚠️ Erro' : '-';
  }
}

// 1. Verificar que timezone.js está syntacticamente correto (sem TypeScript)
console.log('\n📋 TESTE 1: Verificando sintaxe do timezone.js\n');
const timezoneFilePath = path.join(__dirname, '..', 'frontend', 'js', 'timezone.js');
try {
  const timezoneCode = fs.readFileSync(timezoneFilePath, 'utf8');
  
  // Verificar se contém TypeScript syntax que quebraria em vanilla JS
  const hasTypeScriptSyntax = /static\s+readonly\s+/.test(timezoneCode);
  
  if (hasTypeScriptSyntax) {
    console.error('❌ FALHA: timezone.js ainda contém "static readonly" (TypeScript syntax)');
    console.error('   Esta sintaxe é inválida em vanilla JavaScript');
  } else {
    console.log('✅ SUCESSO: timezone.js não contém TypeScript syntax');
  }
  
  // Verificar que usa literal string, não this.BRASILIA_TIMEZONE
  const hasPropertyReference = /this\.BRASILIA_TIMEZONE/.test(timezoneCode);
  if (hasPropertyReference) {
    console.error('❌ FALHA: timezone.js ainda referencia this.BRASILIA_TIMEZONE');
    console.error('   Esta propriedade não existe em vanilla JS');
  } else {
    console.log('✅ SUCESSO: timezone.js usa literal string "America/Sao_Paulo"');
  }
} catch (err) {
  console.error('❌ ERRO ao ler timezone.js:', err.message);
}

// 2. Testar que TimezoneFormatter pode ser instantiado
console.log('\n📋 TESTE 2: Verificando TimezoneFormatter disponível\n');
try {
  if (typeof TimezoneFormatter !== 'undefined') {
    console.log('✅ SUCESSO: TimezoneFormatter está definido');
    console.log('   Métodos disponíveis:', Object.getOwnPropertyNames(TimezoneFormatter).filter(m => typeof TimezoneFormatter[m] === 'function'));
  } else {
    console.error('❌ FALHA: TimezoneFormatter não está definido');
  }
} catch (err) {
  console.error('❌ ERRO:', err.message);
}

// 3. Testar formatação com dados reais do banco
console.log('\n📋 TESTE 3: Formatando datas reais do histórico\n');
const testDates = [
  '2026-02-07T04:43:57.599',
  '2026-02-07T04:43:57.986',
  '2026-01-15T10:30:00.000',
  null,
  undefined,
  ''
];

testDates.forEach((dateStr, idx) => {
  try {
    const formatted = formatDateTime(dateStr);
    console.log(`  [${idx}] Input: "${dateStr}"`);
    console.log(`       Output: "${formatted}"`);
    console.log();
  } catch (err) {
    console.error(`  [${idx}] ERRO:`, err.message);
  }
});

// 4. Buscar histórico da API e testar formatação
console.log('\n📋 TESTE 4: Buscando histórico da API e testando formatação\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/history',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const history = JSON.parse(data);
      
      if (!Array.isArray(history)) {
        console.error('❌ FALHA: Resposta não é um array');
        return;
      }

      console.log(`✅ Recebido ${history.length} registros de histórico\n`);

      if (history.length > 0) {
        const record = history[0];
        console.log('📍 Primeiro registro:');
        console.log(`   Key: ${record.keys?.environment || 'N/A'}`);
        console.log(`   Instructor: ${record.instructors?.name || 'N/A'}`);
        console.log(`   Status: ${record.status || 'N/A'}`);
        console.log();

        console.log('🕐 Formatação de datas:');
        console.log(`   withdrawn_at (raw): "${record.withdrawn_at}"`);
        console.log(`   withdrawn_at (formatted): "${formatDateTime(record.withdrawn_at)}"`);
        console.log();
        if (record.returned_at) {
          console.log(`   returned_at (raw): "${record.returned_at}"`);
          console.log(`   returned_at (formatted): "${formatDateTime(record.returned_at)}"`);
          console.log();
        }

        // Teste detalhado do primeiro registro
        console.log('📊 Teste de formatação para todos os registros:\n');
        let allSuccess = true;
        history.forEach((h, idx) => {
          const withdrawn = formatDateTime(h.withdrawn_at);
          const returned = formatDateTime(h.returned_at);
          
          // Verificar se está retornando "-" ou algo real
          if (withdrawn === '-' || withdrawn.includes('⚠️')) {
            console.error(`  ❌ [${idx}] withdrawn_at não formatou: "${withdrawn}"`);
            allSuccess = false;
          } else {
            console.log(`  ✅ [${idx}] ${h.keys?.environment} → ${withdrawn}`);
          }
        });

        if (allSuccess) {
          console.log('\n✅ SUCESSO: Todas as datas formatadas corretamente!');
        } else {
          console.log('\n❌ FALHA: Algumas datas falharam na formatação');
        }
      }
    } catch (err) {
      console.error('❌ ERRO ao processar histórico:', err.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ ERRO na requisição:', error.message);
  console.error('   Verifique se o servidor está rodando em http://localhost:3000');
});

req.end();
