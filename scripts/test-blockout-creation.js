#!/usr/bin/env node

/**
 * Script de teste para criação de bloqueios de ambiente
 * Testa o endpoint POST /api/reservations/blockout
 * 
 * Uso: node test-blockout-creation.js
 */

const http = require('http');
const url = require('url');

const API_URL = 'http://localhost:3001/api';

// Variáveis globais
let authToken = null;
let keyId = null;

// Função para fazer requisições HTTP
function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = url.parse(API_URL + path);
    options.method = method;
    options.headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Função para fazer login
async function login() {
  console.log('\n📝 [1/5] Fazendo login como admin...');

  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    if (response.status === 200 && response.data.success) {
      authToken = response.data.data.token;
      console.log('   ✅ Login realizado com sucesso');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.error('   ❌ Erro no login:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Erro ao fazer login:', error.message);
    return false;
  }
}

// Função para listar chaves
async function getKeys() {
  console.log('\n🔑 [2/5] Listando ambientes...');

  try {
    const response = await makeRequest('GET', '/keys', null, authToken);

    if (response.status === 200 && response.data.success) {
      const keys = response.data.data;
      if (keys && keys.length > 0) {
        keyId = keys[0].id;
        console.log(`   ✅ ${keys.length} ambiente(s) encontrado(s)`);
        console.log(`   Primeiro ambiente: ${keys[0].name} (ID: ${keyId})`);
        return true;
      } else {
        console.error('   ❌ Nenhum ambiente encontrado');
        return false;
      }
    } else {
      console.error('   ❌ Erro ao listar chaves:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Erro ao buscar chaves:', error.message);
    return false;
  }
}

// Função para criar bloqueio
async function createBlockout() {
  console.log('\n🔒 [3/5] Criando bloqueio de ambiente...');

  // Usar datas fixas para teste
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  
  const nextDay = new Date(today);
  nextDay.setDate(nextDay.getDate() + 1);
  const endDate = nextDay.toISOString().split('T')[0];

  const blockoutData = {
    key_id: keyId,
    reservation_start_date: startDate,
    reservation_end_date: endDate,
    shift: 'integral',
    blockout_type: 'maintenance',
    motivo_detalhado: '[TESTE AUTOMATIZADO] Manutenção de rotina - teste de bloqueio'
  };

  console.log('   Dados do bloqueio:');
  console.log(`     - Ambiente: ${keyId}`);
  console.log(`     - Período: ${startDate} a ${endDate}`);
  console.log(`     - Turno: integral`);
  console.log(`     - Tipo: maintenance`);
  console.log(`     - Motivo: ${blockoutData.motivo_detalhado}`);

  try {
    const response = await makeRequest('POST', '/reservations/blockout', blockoutData, authToken);

    if (response.status === 201 && response.data.success) {
      console.log('   ✅ Bloqueio criado com sucesso!');
      console.log(`   ID: ${response.data.data.id}`);
      console.log(`   Status: ${response.data.data.status}`);
      return true;
    } else if (response.status === 409) {
      console.warn('   ⚠️  Conflito detectado (já existe reserva no período)');
      return true;  // Esperado se houver conflito
    } else {
      console.error(`   ❌ Erro ao criar bloqueio (HTTP ${response.status}):`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Erro ao criar bloqueio:', error.message);
    return false;
  }
}

// Função para verificar validação
async function testValidation() {
  console.log('\n⚠️  [4/5] Testando validação (deve ser rejeitado)...');

  const invalidBlockout = {
    key_id: keyId,
    // Faltam campos obrigatórios
    shift: 'integral'
  };

  try {
    const response = await makeRequest('POST', '/reservations/blockout', invalidBlockout, authToken);

    if (response.status === 400) {
      console.log('   ✅ Validação funcionando corretamente');
      console.log(`   Erro retornado: ${response.data.message}`);
      return true;
    } else {
      console.error('   ❌ Validação não funcionou como esperado');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Erro no teste de validação:', error.message);
    return false;
  }
}

// Função para testar sem autenticação
async function testAuthProtection() {
  console.log('\n🔐 [5/5] Testando proteção de autenticação (deve ser rejeitado)...');

  const blockoutData = {
    key_id: keyId,
    reservation_start_date: '2026-01-15',
    reservation_end_date: '2026-01-16',
    shift: 'integral',
    blockout_type: 'maintenance',
    motivo_detalhado: 'Teste sem token'
  };

  try {
    const response = await makeRequest('POST', '/reservations/blockout', blockoutData, null);

    if (response.status === 401 || response.status === 403) {
      console.log('   ✅ Proteção funcionando corretamente');
      console.log(`   Erro retornado: ${response.data.message}`);
      return true;
    } else {
      console.error('   ❌ Proteção não funcionou como esperado');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Erro no teste de autenticação:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 TESTE DE CRIAÇÃO DE BLOQUEIOS');
  console.log('═══════════════════════════════════════════');

  const results = [];

  // 1. Login
  const loginOk = await login();
  results.push({ step: 'Login', ok: loginOk });
  
  if (!loginOk) {
    console.error('\n❌ Não foi possível fazer login. Abortando testes.');
    process.exit(1);
  }

  // 2. Listar chaves
  const keysOk = await getKeys();
  results.push({ step: 'Listar Ambientes', ok: keysOk });
  
  if (!keysOk) {
    console.error('\n❌ Não foi possível listar ambientes. Abortando testes.');
    process.exit(1);
  }

  // 3. Criar bloqueio
  const blockoutOk = await createBlockout();
  results.push({ step: 'Criar Bloqueio', ok: blockoutOk });

  // 4. Testar validação
  const validationOk = await testValidation();
  results.push({ step: 'Validação', ok: validationOk });

  // 5. Testar proteção
  const authOk = await testAuthProtection();
  results.push({ step: 'Proteção', ok: authOk });

  // Resumo
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 RESUMO DOS TESTES');
  console.log('═══════════════════════════════════════════');
  
  results.forEach((result, index) => {
    const icon = result.ok ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.step}`);
  });

  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  
  console.log(`\n${passed}/${total} testes passaram`);
  process.exit(passed === total ? 0 : 1);
}

// Executar
main();
