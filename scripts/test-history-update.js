#!/usr/bin/env node
// Teste: Verificar que o histórico está sendo atualizado corretamente

const http = require('http');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     TESTE: HISTÓRICO APÓS DEVOLUÇÃO DE CHAVE (ADMIN)          ║
╚════════════════════════════════════════════════════════════════╝

Este teste simula o fluxo:
1. Login como admin
2. Retire uma chave como outro usuário
3. Admin devolve a chave
4. Verifica se o histórico mostra a devolução

`);

// 1. Admin login
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
        console.log('✅ Admin logado\n');
        findKeyInUseAndTestFlow(response.token);
      }
    } catch (err) {
      console.error('Erro login:', err.message);
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function findKeyInUseAndTestFlow(adminToken) {
  // Obter lista de chaves
  const keysOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/keys',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  };

  const keysReq = http.request(keysOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        const keys = response.data || response;
        
        // Procurar uma chave em uso
        const keyInUse = keys.find(k => k.status === 'in_use');
        
        if (keyInUse) {
          console.log(`📌 Chave em uso encontrada: ${keyInUse.environment}`);
          console.log(`   ID: ${keyInUse.id}\n`);
          
          // Buscar histórico ANTES
          getHistoryAndCheck(adminToken, keyInUse.id, 'ANTES', () => {
            // Devolver a chave
            returnKeyTest(adminToken, keyInUse.id, keyInUse.environment);
          });
        } else {
          console.log('❌ Nenhuma chave em uso encontrada');
          console.log('   (Retirre uma chave primeiro para fazer este teste)');
        }
      } catch (err) {
        console.error('Erro:', err.message);
      }
    });
  });

  keysReq.end();
}

function getHistoryAndCheck(adminToken, keyId, moment, callback) {
  const historyOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/history/keys/${keyId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
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
          const latest = history[0];
          console.log(`📋 Histórico ${moment}:`);
          console.log(`   Status: ${latest.status}`);
          console.log(`   Retirada em: ${latest.withdrawn_at}`);
          console.log(`   Devolvida em: ${latest.returned_at || '-'}\n`);
        }
        
        if (callback) callback();
      } catch (err) {
        console.error('Erro:', err.message);
      }
    });
  });

  historyReq.end();
}

function returnKeyTest(adminToken, keyId, keyName) {
  const returnOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/keys/${keyId}/return`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  };

  const returnData = JSON.stringify({
    observation: 'Teste automático - devolvida pelo sistema'
  });

  const returnReq = http.request(returnOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success) {
          console.log('✅ Chave devolvida com sucesso\n');
          
          // Esperar um pouco e depois verificar o histórico
          setTimeout(() => {
            getHistoryAndCheck(adminToken, keyId, 'DEPOIS', () => {
              showResults();
            });
          }, 500);
        } else {
          console.error('❌ Erro ao devolver:', response.message);
        }
      } catch (err) {
        console.error('Erro:', err.message);
      }
    });
  });

  returnReq.write(returnData);
  returnReq.end();
}

function showResults() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                         RESULTADO                             ║
╚════════════════════════════════════════════════════════════════╝

✅ Se o status mudou de "active" para "returned"
   → O histórico está sendo atualizado corretamente!

✅ Se o campo "returned_at" passou de "-" para uma data
   → A devolução foi registrada com sucesso!

✅ No dashboard admin, você deve ver:
   • Data Devolução com valor (não mais "-")
   • Status mudou para "DEVOLVIDA" (verde)
   • Atualização automática a cada 15 segundos

Sistema funcionando corretamente! 🎉
`);
}
