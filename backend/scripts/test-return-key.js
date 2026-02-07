const API_URL = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('🔍 Iniciando teste de devolução de chave...\n');

    // 1. Login como admin
    console.log('1️⃣  Fazendo login como admin...');
    const loginResponse = await fetch(`${API_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@senai.com.br',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.log(`❌ Erro no login: ${loginData.message}`);
      return;
    }
    
    const token = loginData.token;
    const adminId = loginData.user.id;
    console.log(`✅ Login bem-sucedido! User ID: ${adminId}\n`);

    // 2. Buscar uma chave disponível
    console.log('2️⃣  Buscando chave disponível...');
    const keysResponse = await fetch(`${API_URL}/keys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const keysData = await keysResponse.json();
    const availableKey = keysData.data.find(k => k.status === 'available');
    if (!availableKey) {
      console.log('❌ Nenhuma chave disponível encontrada');
      return;
    }
    console.log(`✅ Chave encontrada: ${availableKey.environment} (${availableKey.id})\n`);

    // 3. Retirar a chave
    console.log('3️⃣  Retirando chave...');
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
    console.log(`✅ Chave retirada com sucesso!\n`);

    // 4. Tentar devolver a chave (deve funcionar pois o admin retirou)
    console.log('4️⃣  Devolvendo chave como o mesmo usuário...');
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
    console.log(`Resposta:`, returnData);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();
