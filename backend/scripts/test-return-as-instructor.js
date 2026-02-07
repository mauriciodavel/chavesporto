const API_URL = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('🔍 Testando devolução como Instrutor (Mauricio Davel)...\n');

    // 1. Login como instrutor
    console.log('1️⃣  Fazendo login como instrutor...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matricula: '3-02919',
        password: 'senai123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.log(`❌ Erro no login: ${loginData.message}`);
      console.log(`   Resposta completa:`, loginData);
      return;
    }
    
    const token = loginData.token;
    const userId = loginData.user.id;
    const role = loginData.user.role;
    console.log(`✅ Login bem-sucedido!`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: ${role}\n`);

    // 2. Buscar uma chave disponível
    console.log('2️⃣  Buscando chave disponível...');
    const keysResponse = await fetch(`${API_URL}/keys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const keysData = await keysResponse.json();
    const availableKey = keysData.data.find(k => k.status === 'available');
    if (!availableKey) {
      console.log('❌ Nenhuma chave disponível encontrada');
      console.log('   Chaves atuais:');
      keysData.data.forEach(k => {
        console.log(`   - ${k.environment}: ${k.status}`);
      });
      return;
    }
    console.log(`✅ Chave encontrada: ${availableKey.environment} (${availableKey.id})\n`);

    // 3. Retirar a chave
    console.log('3️⃣  Retirando chave com este instrutor...');
    const withdrawResponse = await fetch(
      `${API_URL}/keys/${availableKey.id}/withdraw`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qrCode: availableKey.qr_code })
      }
    );
    const withdrawData = await withdrawResponse.json();
    if (!withdrawData.success) {
      console.log(`❌ Erro ao retirar:`, withdrawData.message);
      return;
    }
    console.log(`✅ Chave retirada com sucesso!\n`);

    // 4. Tentar devolver como o mesmo user que retirou
    console.log('4️⃣  Devolvendo chave como o instruto que a retirou...');
    const returnResponse = await fetch(
      `${API_URL}/keys/${availableKey.id}/return`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      }
    );
    
    const returnData = await returnResponse.json();
    console.log(`Status: ${returnResponse.status}`);
    if (returnResponse.status === 200 || returnData.success) {
      console.log(`✅ Chave devolvida com sucesso!`);
      console.log(`   Resposta:`, returnData);
    } else {
      console.log(`❌ ERRO ao devolver a chave:`);
      console.log(`   Status: ${returnResponse.status}`);
      console.log(`   Dados:`, returnData);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();
