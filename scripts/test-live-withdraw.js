#!/usr/bin/env node
// Teste ao vivo: retirar uma chave e verificar a hora

const http = require('http');

console.log('🕐 TESTE AO VIVO: RETIRAR CHAVE AGORA\n');

const serverNow = new Date();
console.log(`Hora do servidor: ${serverNow.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
console.log(`(Hora local da máquina: ${serverNow.toLocaleString('pt-BR')})`);
console.log();

// 1. Login como instructor
const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const loginData = JSON.stringify({
  matricula: '3-02919',
  password: 'senai123'
});

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.success && response.token) {
        console.log('✅ Login como Renisson bem-sucedido');
        
        // Buscar primeira chave disponível
        const keysOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/keys',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${response.token}`
          }
        };

        const keysReq = http.request(keysOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const keysResponse = JSON.parse(data);
              const keys = keysResponse.data || keysResponse;
              
              // Encontrar uma chave disponível
              const availableKey = keys.find(k => k.status === 'available');
              
              if (availableKey) {
                console.log(`✅ Chave disponível encontrada: ${availableKey.environment}`);
                console.log();
                
                // Retirar a chave
                withdrawKey(response.token, availableKey.id, availableKey.environment);
              } else {
                console.log('❌ Nenhuma chave disponível para retirada');
              }
            } catch (err) {
              console.error('Erro:', err.message);
            }
          });
        });
        keysReq.end();
      }
    } catch (err) {
      console.error('Erro login:', err.message);
    }
  });
});
loginReq.write(loginData);
loginReq.end();

function withdrawKey(token, keyId, keyEnvironment) {
  console.log('📝 RETIRANDO CHAVE...\n');
  
  const withdrawOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/keys/${keyId}/withdraw`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const withdrawReq = http.request(withdrawOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success) {
          const history = response.data;
          
          console.log('✅ CHAVE RETIRADA COM SUCESSO!\n');
          console.log('📊 DADOS REGISTRADOS NO BANCO:\n');
          
          console.log(`Chave: ${keyEnvironment}`);
          console.log(`withdrawn_at (bruto do banco): ${history.withdrawn_at}`);
          console.log();
          
          // Verificar se tem Z
          const hasZ = history.withdrawn_at.endsWith('Z');
          console.log(`✓ Tem 'Z' no final? ${hasZ ? 'SIM ✅' : 'NÃO ❌'}`);
          console.log();
          
          // Interpretar como UTC e converter para Brasília
          const dateObj = new Date(history.withdrawn_at);
          const brasilia = dateObj.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          
          console.log(`Interpretado como UTC:`);
          console.log(`  ${dateObj.toISOString()}`);
          console.log();
          console.log(`Convertido para Brasília:`);
          console.log(`  ${brasilia}`);
          console.log();
          
          // Comparar com hora atual
          const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          console.log(`Hora do servidor agora: ${now}`);
          console.log(`Hora registrada:        ${brasilia}`);
          console.log();
          
          // Verificar diferença (deve ser poucos segundos)
          const nowDate = new Date();
          const diff = Math.abs(nowDate - dateObj) / 1000; // em segundos
          
          if (diff < 5) {
            console.log(`✅ SUCESSO: A data foi registrada corretamente! (diferença de ${Math.round(diff)}s)`);
          } else {
            console.log(`⚠️  A data pode estar errada (diferença de ${Math.round(diff)}s)`);
          }
        } else {
          console.log('❌ Erro:', response.message);
        }
      } catch (err) {
        console.error('Erro:', err.message);
      }
    });
  });

  withdrawReq.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
  });

  withdrawReq.end();
}
