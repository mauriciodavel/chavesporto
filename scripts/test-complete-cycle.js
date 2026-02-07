#!/usr/bin/env node
/**
 * TESTE FINAL COMPLETO
 * 
 * Simula o ciclo completo:
 * 1. Retirar uma chave
 * 2. Admin devolve a chave
 * 3. Verifica que o histórico foi atualizado
 */

const http = require('http');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║         TESTE FINAL: CICLO COMPLETO DE RETIRADA/DEVOLUÇÃO     ║
╚════════════════════════════════════════════════════════════════╝
`);

// 1. Retirar uma chave como instructor
retireKeyAsInstructor();

function retireKeyAsInstructor() {
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
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
          console.log('1️⃣  PASSO 1: Instructor retirando chave');
          console.log('   ✅ Login realizado\n');
          
          // Buscar chave disponível
          const keysOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/keys',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${response.token}` }
          };

          const keysReq = http.request(keysOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              const keys = JSON.parse(data).data;
              const availableKey = keys.find(k => k.status === 'available');
              
              if (availableKey) {
                console.log(`   ✅ Chave encontrada: ${availableKey.environment}`);
                withdrawKeyNow(response.token, availableKey.id, availableKey.environment);
              }
            });
          });
          keysReq.end();
        }
      } catch (err) {
        console.error('Erro:', err.message);
      }
    });
  });

  loginReq.write(JSON.stringify({ matricula: '3-02919', password: 'senai123' }));
  loginReq.end();
}

function withdrawKeyNow(token, keyId, keyName) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/keys/${keyId}/withdraw`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const response = JSON.parse(data);
      if (response.success) {
        console.log(`   ✅ Chave retirada com sucesso\n`);
        
        // Aguardar um pouco e depois devolver
        setTimeout(() => {
          returnKeyAsAdmin(keyId, keyName);
        }, 1000);
      }
    });
  });

  req.write(JSON.stringify({}));
  req.end();
}

function returnKeyAsAdmin(keyId, keyName) {
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
      const response = JSON.parse(data);
      if (response.success && response.token) {
        console.log('2️⃣  PASSO 2: Admin devolvendo chave');
        console.log('   ✅ Admin logado\n');
        
        const returnOptions = {
          hostname: 'localhost',
          port: 3000,
          path: `/api/keys/${keyId}/return`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${response.token}`
          }
        };

        const returnReq = http.request(returnOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            const result = JSON.parse(data);
            if (result.success) {
              console.log(`   ✅ Chave devolvida\n`);
              
              // Aguardar um pouco e verificar histórico
              setTimeout(() => {
                checkHistory(response.token, keyId);
              }, 500);
            }
          });
        });

        returnReq.write(JSON.stringify({ observation: null }));
        returnReq.end();
      }
    });
  });

  loginReq.write(JSON.stringify({ email: 'admin@senai.com.br', password: 'admin123' }));
  loginReq.end();
}

function checkHistory(adminToken, keyId) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/history/keys/${keyId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const response = JSON.parse(data);
      const history = response.data || response;
      
      if (Array.isArray(history) && history[0]) {
        const record = history[0];
        
        console.log('3️⃣  PASSO 3: Verificando histórico');
        console.log(`   Status: ${record.status}`);
        console.log(`   Retirada: ${record.withdrawn_at}`);
        console.log(`   Devolvida: ${record.returned_at || '-'}\n`);
        
        console.log('════════════════════════════════════════════════════════════════');
        
        if (record.status === 'returned' && record.returned_at) {
          console.log('✅ SUCESSO! CICLO COMPLETO FUNCIONANDO');
          console.log();
          console.log('✓ Chave foi retirada');
          console.log('✓ Admin devolveu');  
          console.log('✓ Histórico atualizou com status "DEVOLVIDA"');
          console.log('✓ Data de devolução foi registrada');
          console.log();
          console.log('No dashboard admin agora você verá:');
          console.log('• Data Devolução: preenchida (não mais "-")');
          console.log('• Status: DEVOLVIDA (em verde)');
          console.log('• Atualização automática a cada 15 segundos');
        } else {
          console.log('❌ FALHA: Histórico não atualizou corretamente');
        }
      }
    });
  });

  req.end();
}
