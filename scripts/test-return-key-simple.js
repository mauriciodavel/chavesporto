#!/usr/bin/env node
// Teste simples: devolver uma chave específica

const http = require('http');

// 1. Login como admin
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
        console.log('✅ Admin logado');
        
        // Tentar devolver a chave Lab-03
        const keyId = '13a1bcbc-7786-4281-a287-084c8b3bade7';
        console.log(`\n📝 Tentando devolver Lab-03 (${keyId})\n`);
        
        returnKey(response.token, keyId);
      }
    } catch (err) {
      console.error('Erro login:', err.message);
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function returnKey(token, keyId) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/keys/${keyId}/return`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const data = JSON.stringify({
    // observation: 'Teste debug'  // Descomentado para testar
  });

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log('Resposta:', body);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
  });

  req.write(data);
  req.end();
}
