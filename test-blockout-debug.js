#!/usr/bin/env node

/**
 * Script de Debug - Teste de Carregamento de Bloqueios
 * Use: node test-blockout-debug.js
 */

const BASE_URL = 'http://localhost:3000';

async function testBlockoutAPI() {
  console.log('🧪 Iniciando teste de API de Bloqueios\n');

  try {
    // 1. Testar conectividade básica
    console.log('📡 1. Testando conectividade do servidor...');
    const testResponse = await fetch(`${BASE_URL}/`);
    console.log(`✅ Servidor respondendo: ${testResponse.status}\n`);

    // 2. Testar GET /api/blockouts (sem token)
    console.log('🔍 2. Testando GET /api/blockouts (sem token)...');
    const response = await fetch(`${BASE_URL}/api/blockouts`);
    console.log(`Status: ${response.status}`);
    
    const data = await response.json();
    console.log('Resposta:', JSON.stringify(data, null, 2));

    if (response.ok && data.data) {
      console.log(`✅ API funcionando! Total de bloqueios: ${data.data.length}\n`);
      
      if (data.data.length > 0) {
        console.log('📋 Exemplo de bloqueio:');
        console.log(JSON.stringify(data.data[0], null, 2));
      }
    } else {
      console.log('❌ Erro na resposta da API');
    }

  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    console.log('\n💡 Possíveis problemas:');
    console.log('- Servidor não está rodando (entre em backend/ e execute: npm start)');
    console.log('- Porta 3000 está em uso por outro processo');
    console.log('- Verificar se há erros no console do backend');
  }
}

// Executar
testBlockoutAPI();
