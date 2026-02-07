#!/usr/bin/env node
// Verificar o que a API está retornando

const http = require('http');

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
  
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('');

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Raw response:');
    console.log(data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('\n\nParsed response:');
      console.log(JSON.stringify(parsed, null, 2).substring(0, 500) + '...');
    } catch (err) {
      console.error('Não é JSON válido:', err.message);
    }
  });
});

req.on('error', (error) => {
  console.error('ERRO:', error.message);
});

req.end();
