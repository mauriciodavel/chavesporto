#!/usr/bin/env node
/**
 * Script para verificar e adicionar coluna observation no Supabase
 */

const http = require('http');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     Verificando e Adicionando Coluna OBSERVATION            ║
╚═══════════════════════════════════════════════════════════════╝
`);

// 1. Fazer login admin
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
        console.log('✅ Admin logado com sucesso\n');
        
        // 2. Verificar se coluna existe
        checkColumn(response.token);
      } else {
        console.log('❌ Erro ao fazer login:', response.message);
      }
    } catch (err) {
      console.error('Erro:', err.message);
    }
  });
});

loginReq.write(JSON.stringify({ email: 'admin@senai.com.br', password: 'admin123' }));
loginReq.end();

function checkColumn(adminToken) {
  console.log('🔍 Verificando se coluna observation existe...\n');
  
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
          console.log('✅ Coluna observation JÁ EXISTE!');
          console.log('   Nada a fazer.\n');
          console.log('═══════════════════════════════════════════');
          console.log('STATUS: ✅ PRONTO PARA USO');
          console.log('═══════════════════════════════════════════\n');
        } else {
          console.log('❌ Coluna observation NÃO EXISTE\n');
          console.log('🔧 Tentando adicionar via setup...\n');
          addColumn(adminToken);
        }
      } catch (err) {
        console.error('Erro ao processar:', err.message);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Erro na requisição:', err.message);
  });

  req.end();
}

function addColumn(adminToken) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/setup/add-observation-column',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
          console.log('\n✅ Coluna adicionada com sucesso!');
          console.log('\n═══════════════════════════════════════════');
          console.log('STATUS: ✅ PRONTO PARA USO');
          console.log('═══════════════════════════════════════════\n');
        } else if (result.instructions) {
          console.log('\n⚠️  Coluna precisa ser adicionada manualmente\n');
          console.log('📝 Execute este SQL no Supabase SQL Editor:');
          console.log('\n' + result.sql + '\n');
          console.log('🎯 Instruções:');
          result.instructions.forEach((instr, i) => {
            console.log(`${i + 1}. ${instr}`);
          });
          console.log('\n═══════════════════════════════════════════');
          console.log('STATUS: ⏳ AGUARDANDO AÇÃO MANUAL');
          console.log('═══════════════════════════════════════════\n');
        }
      } catch (err) {
        console.error('Erro ao processar resposta:', err.message);
      }
    });
  });

  req.write(JSON.stringify({}));
  req.end();
}
