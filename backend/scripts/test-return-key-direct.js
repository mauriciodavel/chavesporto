#!/usr/bin/env node

/**
 * Script de Teste: Devolver Chave via API
 * 
 * Uso:
 *   node test-return-key-direct.js <keyId> <instructorId> <token>
 * 
 * Exemplo:
 *   node test-return-key-direct.js 550e8400-e29b-41d4-a716-446655440000 user123 eyJhbGc...
 */

const http = require('http');
require('dotenv').config();

const args = process.argv.slice(2);
const keyId = args[0];
const instructorId = args[1];
const token = args[2];

if (!keyId || !instructorId || !token) {
  console.error('❌ Uso: node test-return-key-direct.js <keyId> <instructorId> <token>');
  process.exit(1);
}

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
const url = new URL(`/api/keys/${keyId}/return`, backendUrl);

console.log('\n📤 Testando devolução direta via API...');
console.log(`   URL: POST ${url}`);
console.log(`   KeyId: ${keyId}`);
console.log(`   InstructorId: ${instructorId}`);
console.log(`   Token: ${token.substring(0, 20)}...`);

const options = {
  hostname: url.hostname,
  port: url.port || 3001,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\n📥 Resposta (${res.statusCode}):`);
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ Devolução bem-sucedida!');
      } else {
        console.log('\n❌ Erro na devolução');
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro: ${e.message}`);
});

req.write(JSON.stringify({}));
req.end();
