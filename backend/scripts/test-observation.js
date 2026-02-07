#!/usr/bin/env node
/**
 * Verifica se coluna observation existe no Supabase
 * E faz testes de devolução
 */

const http = require('http');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     VERIFICAÇÃO: Coluna OBSERVATION no Supabase              ║
╚════════════════════════════════════════════════════════════════╝
`);

// Fazer login admin primeiro
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
        
        // Buscar um registro de histórico
        const historyOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/history',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${response.token}` }
        };

        const historyReq = http.request(historyOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              const records = result.data || [];
              
              if (records.length > 0) {
                const record = records[0];
                console.log('📋 Primeiro registro do histórico:');
                console.log(JSON.stringify(record, null, 2));
                
                console.log('\n🔍 VERIFICAÇÃO:');
                if ('observation' in record) {
                  console.log('✅ Coluna OBSERVATION já existe no banco!');
                  console.log(`   Tipo: ${typeof record.observation}`);
                  console.log(`   Valor: ${record.observation || 'null/vazio'}`);
                } else {
                  console.log('❌ Coluna OBSERVATION NÃO ENCONTRADA!');
                  console.log('\n📝 PRÓXIMOS PASSOS:');
                  console.log('1. Abra arquivo: backend/scripts/SQL_ADD_OBSERVATION_COLUMN.sql');
                  console.log('2. Acesse: https://supabase.com → seu projeto');
                  console.log('3. SQL Editor → New query');
                  console.log('4. Cole o conteúdo do arquivo SQL');
                  console.log('5. Clique RUN (Ctrl+Enter)');
                  console.log('6. Após sucesso, rode este script novamente: node scripts/test-observation.js');
                }
              }
            } catch (err) {
              console.error('Erro ao processar resposta:', err.message);
            }
          });
        });

        historyReq.on('error', (err) => {
          console.error('Erro na requisição:', err.message);
        });

        historyReq.end();
      } else {
        console.log('❌ Erro ao fazer login:', response.message);
      }
    } catch (err) {
      console.error('Erro ao processar login:', err.message);
    }
  });
});

loginReq.write(JSON.stringify({ email: 'admin@senai.com.br', password: 'admin123' }));
loginReq.end();
