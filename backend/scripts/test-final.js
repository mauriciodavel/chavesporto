#!/usr/bin/env node
/**
 * Script de TESTE FINAL - Verifica observation em toda pipeline
 */

const http = require('http');

let adminToken;

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║     TESTE FINAL: Coluna OBSERVATION Completa                    ║
╚═══════════════════════════════════════════════════════════════════╝
`);

// Step 1: Login
console.log('\n1️⃣  Fazendo login como admin...');
const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/admin-login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.success && response.token) {
        adminToken = response.token;
        console.log('   ✅ Admin logado\n');
        checkObservationColumn();
      } else {
        console.log('   ❌ Erro ao fazer login:', response.message);
      }
    } catch (err) {
      console.error('   ❌ Erro:', err.message);
    }
  });
});

loginReq.write(JSON.stringify({ email: 'admin@senai.com.br', password: 'admin123' }));
loginReq.end();

function checkObservationColumn() {
  console.log('2️⃣  Verificando se coluna observation existe...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/setup/check-observation-column',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (result.exists) {
          console.log('   ✅ Coluna observation EXISTE\n');
          getHistoryData();
        } else {
          console.log('   ❌ Coluna observation NÃO EXISTE');
          console.log('\n   Para adicionar, execute no Supabase SQL Editor:');
          console.log('   ALTER TABLE key_history ADD COLUMN IF NOT EXISTS observation TEXT DEFAULT NULL;\n');
        }
      } catch (err) {
        console.error('   ❌ Erro:', err.message);
      }
    });
  });

  req.on('error', (err) => console.error('   ❌ Erro:', err.message));
  req.end();
}

function getHistoryData() {
  console.log('3️⃣  Carregando dados do histórico...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/history',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        const records = result.data || [];
        
        if (records.length === 0) {
          console.log('   ⚠️  Nenhum registro no histórico\n');
          return;
        }

        console.log('   ✅ ' + records.length + ' registros carregados\n');
        
        // Check if observation is present
        const firstRecord = records[0];
        console.log('4️⃣  Verificando estrutura do registro...');
        
        // List all fields
        const fields = Object.keys(firstRecord);
        console.log('   Campos presentes:', fields.join(', '));
        
        if (fields.includes('observation')) {
          console.log('   ✅ Campo OBSERVATION está presente\n');
        } else {
          console.log('   ⚠️  Campo OBSERVATION NÃO está no retorno\n');
        }
        
        // Show sample
        console.log('5️⃣  Exemplo de registro:');
        console.log('   Chave: ' + (firstRecord.keys?.environment || '-'));
        console.log('   Instrutor: ' + (firstRecord.instructors?.name || '-'));
        console.log('   Retirada: ' + (firstRecord.withdrawn_at || '-'));
        console.log('   Devolução: ' + (firstRecord.returned_at || '-'));
        console.log('   Status: ' + (firstRecord.status || '-'));
        console.log('   Observation: ' + (firstRecord.observation || '(vazio)'));
        
        // Summary
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✅ SISTEMA PRONTO PARA USO');
        console.log('═══════════════════════════════════════════════════════');
        console.log('\nPróximos passos:');
        console.log('1. Abra http://localhost:3000/admin');
        console.log('2. Devolva uma chave');
        console.log('3. Adicione uma observação');
        console.log('4. Veja a observação na tabela de histórico\n');
        
      } catch (err) {
        console.error('   ❌ Erro ao processar dados:', err.message);
      }
    });
  });

  req.on('error', (err) => console.error('   ❌ Erro:', err.message));
  req.end();
}
