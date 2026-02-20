#!/usr/bin/env node

/**
 * Teste rápido para verificar se o calendário está funcionando
 * Verifica se a página carrega sem erros
 */

const http = require('http');

console.log('🧪 Testando se a página carrega...\n');

const req = http.get('http://localhost:3000/reservar-chave.html', (res) => {
    if (res.statusCode === 200) {
        console.log('✅ Página carregou com sucesso (HTTP 200)\n');
        console.log('📋 Próximos passos:');
        console.log('   1. Abra: http://localhost:3000/reservar-chave.html');
        console.log('   2. Abra o DevTools (F12)');
        console.log('   3. Vá para a aba "Console"');
        console.log('   4. Procure por erros em vermelho\n');
        console.log('✅ Se o calendário aparecer, tudo está OK!');
        return;
    }
    
    console.error(`❌ Página retornou erro HTTP ${res.statusCode}`);
    process.exit(1);
});

req.on('error', (err) => {
    console.error(`❌ Erro ao conectar: ${err.message}`);
    console.log('\n💡 Dica: Execute "cd backend; npm start" primeiro\n');
    process.exit(1);
});

req.setTimeout(5000, () => {
    console.error('❌ Timeout ao conectar');
    process.exit(1);
});
