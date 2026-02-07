const API_URL = 'http://localhost:3000/api';

async function testHistoryAPI() {
  try {
    console.log('🔍 Testando API de Histórico...\n');

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
      console.error('❌ Erro no login');
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login bem-sucedido!\n');

    // 2. Chamar GET /history
    console.log('2️⃣  Chamando GET /api/history...');
    const historyResponse = await fetch(`${API_URL}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const historyData = await historyResponse.json();
    
    console.log(`Status: ${historyResponse.status}`);
    console.log(`Sucesso: ${historyData.success}`);
    console.log(`Total de registros: ${historyData.data?.length || 0}\n`);

    if (historyData.data && historyData.data.length > 0) {
      console.log('📋 Primeiro registro:');
      const first = historyData.data[0];
      console.log(JSON.stringify(first, null, 2));
      
      console.log('\n🔍 Campos importantes:');
      console.log(`- withdrawn_at: ${first.withdrawn_at}`);
      console.log(`- returned_at: ${first.returned_at}`);
      console.log(`- keys: ${JSON.stringify(first.keys, null, 2)}`);
      console.log(`- instructors: ${JSON.stringify(first.instructors, null, 2)}`);
    } else {
      console.log('⚠️  Nenhum histórico encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testHistoryAPI();
