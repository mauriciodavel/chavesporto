const API_URL = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('🔍 Testando ERRO: Um instrutor tentando devolver chave de outro...\n');

    // 1. Login como Renisson
    console.log('1️⃣  Fazendo login como Renisson...');
    const renissonLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matricula: '3-1234',
        password: 'senai123'
      })
    });
    
    const renissonLoginData = await renissonLogin.json();
    if (!renissonLoginData.success) {
      console.log(`❌ Não consegui fazer login como Renisson`);
      console.log(`   ${renissonLoginData.message}`);
      return;
    }
    
    const renissonToken = renissonLoginData.token;
    const renissonId = renissonLoginData.user.id;
    console.log(`✅ Login bem-sucedido como Renisson`);
    console.log(`   User ID: ${renissonId}\n`);

    // 2. A chave Lab-03 já está retirada por Mauricio Davel
    console.log('2️⃣  Buscando chave Lab-03...');
    const keysResponse = await fetch(`${API_URL}/keys`, {
      headers: { Authorization: `Bearer ${renissonToken}` }
    });
    
    const keysData = await keysResponse.json();
    const lab03 = keysData.data.find(k => k.environment.includes('Lab-03'));
    
    if (!lab03) {
      console.log('❌ Chave Lab-03 não encontrada');
      return;
    }
    
    const keyId = lab03.id;
    const inUseByInstructor = lab03.lastActivity?.instructor || 'Desconhecido';
    console.log(`✅ Chave encontrada: ${lab03.environment}`);
    console.log(`   ID: ${keyId}`);
    console.log(`   Status: ${lab03.status}`);
    if (lab03.lastActivity) {
      console.log(`   Em uso por: ${inUseByInstructor}\n`);
    } else {
      console.log(`   ⚠️  Não está em uso! Pulando teste.\n`);
      return;
    }

    // 3. Tentar devolver como Renisson (vai falhar com 403)
    console.log('3️⃣  Renisson tentando devolver a chave...');

    // 4. Fazer a requisição de devolução
    console.log('4️⃣  Enviando POST /keys/{keyId}/return com token de Renisson...');
    const returnResponse = await fetch(
      `${API_URL}/keys/${keyId}/return`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${renissonToken}`
        },
        body: JSON.stringify({})
      }
    );
    
    const returnData = await returnResponse.json();
    console.log(`Status HTTP: ${returnResponse.status}`);
    console.log(`Resposta:`, returnData);
    
    if (returnResponse.status === 403) {
      console.log(`\n✅ ESPERADO: Recebido erro 403 Proibido`);
      console.log(`   Mensagem: "${returnData.message}"`);
    } else if (returnResponse.status === 200) {
      console.log(`\n❌ INESPERADO: Devolvida com sucesso (não deveria ser possível)`);
    } else {
      console.log(`\n⚠️  Status inesperado: ${returnResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();
