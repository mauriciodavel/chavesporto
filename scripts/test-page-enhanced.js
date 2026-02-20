/**
 * Test: Verifica se a pagina load com tooltips melhorado
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/reservar-chave.html',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`\n📊 STATUS: ${res.statusCode}`);
  console.log(`📋 HEADERS:`, res.headers);
  
  let htmlContent = '';
  
  res.on('data', (chunk) => {
    htmlContent += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📄 TAMANHO: ${htmlContent.length} bytes`);
    
    // Verificar elementos críticos
    const checks = [
      { name: 'Elemento FORM#reservationForm', regex: /id=["']reservationForm["']/ },
      { name: 'Elemento FORM#blockoutForm', regex: /id=["']blockoutForm["']/ },
      { name: 'Botão toggle blockout', regex: /id=["']toggleBlockoutBtn["']/ },
      { name: 'Seletor ambiente para blockout', regex: /id=["']blockoutKeySelect["']/ },
      { name: 'Calendário container', regex: /id=["']calendar["']/ },
      { name: 'Função createDayElement', regex: /function createDayElement/ },
      { name: 'Map para blockedDates', regex: /blockedDates.*=.*new Map\(\)/ },
      { name: 'Tooltip para reservas', regex: /blockout-tooltip/ },
      { name: 'Ícone 📋 para bloqueio', regex: /📋/ },
      { name: 'Verificação de Admin Mode', regex: /isAdminMode.*=/ },
    ];
    
    console.log('\n✅ VERIFICAÇÕES REALIZADAS:\n');
    let allPassed = true;
    
    checks.forEach(check => {
      const found = check.regex.test(htmlContent);
      const status = found ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      if (!found) allPassed = false;
    });
    
    // Procurar por erros JavaScript comuns
    console.log('\n🔍 ANÁLISE DE SEGURANÇA:\n');
    const errorChecks = [
      { name: 'Duplicado "const dateStr"', regex: /const dateStr.*const dateStr/s, shouldFind: false },
      { name: 'Função loadKeysForBlockout', regex: /loadKeysForBlockout\(\)/, shouldFind: true },
      { name: 'Handler submit blockout', regex: /addEventListener\(['"]submit['"].*blockout/, shouldFind: true },
    ];
    
    errorChecks.forEach(check => {
      const found = check.regex.test(htmlContent);
      const expected = check.shouldFind ? found : !found;
      const status = expected ? '✅' : '⚠️';
      console.log(`${status} ${check.name}: ${found ? '🔴 ENCONTRADO' : '✅ OK'}`);
    });
    
    if (allPassed) {
      console.log('\n\n🎉 PÁGINA VALIDADA COM SUCESSO!');
      console.log('✨ Todos os elementos críticos encontrados');
      console.log('✨ Calendário com bloqueios implementado');
      console.log('✨ Tooltips com estilo aprimorado');
      process.exit(0);
    } else {
      console.log('\n\n⚠️ ALGUNS ELEMENTOS ESTÃO FALTANDO');
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ ERRO DE CONEXÃO: ${e.message}`);
  console.error('💡 Dica: Certifique-se de que o servidor está rodando em http://localhost:3000');
  process.exit(1);
});

console.log('🔍 Testando página do calendário com tooltips...');
req.end();
