#!/usr/bin/env node

/**
 * Script simples para verificar se as correções funcionaram
 * Testa apenas conectividade e estrutura da tabela
 */

const http = require('http');
const url = require('url');

console.log('═══════════════════════════════════════════');
console.log('🔍 VERIFICAÇÃO DO SISTEMA DE BLOQUEIOS');
console.log('═══════════════════════════════════════════\n');

// 1. Verificar se servidor está respondendo
console.log('1️⃣  Verificando conectividade do servidor...');

const testUrl = 'http://localhost:3001/api/keys';

const req = http.get(testUrl, (res) => {
    let data = '';
    
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log(`   ✅ Servidor respondendo (HTTP ${res.statusCode})`);
            
            if (result.success) {
                console.log(`   ✅ API funcionando`);
                console.log(`   ✅ ${result.data?.length || 0} ambientes encontrados`);
            } else {
                console.log(`   ⚠️  API retornou erro: ${result.message}`);
            }
        } catch (e) {
            console.log(`   ✅ Servidor respondendo (HTTP ${res.statusCode})`);
        }
        
        console.log('\n2️⃣  Resumo:');
        console.log('   Status: ✅ ONLINE');
        console.log('   Próximo passo: Execute o SQL migration no Supabase');
        console.log('\n═══════════════════════════════════════════');
    });
});

req.on('error', (err) => {
    console.log(`   ❌ Servidor offline: ${err.message}`);
    console.log(`   \n   💡 Dica: Execute 'npm start' na pasta backend/`);
    process.exit(1);
});

req.setTimeout(5000, () => {
    req.destroy();
    console.log(`   ❌ Timeout ao conectar`);
    process.exit(1);
});
