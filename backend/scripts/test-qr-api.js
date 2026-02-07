// Teste da API de QR-Codes
require('dotenv').config();

async function testQRAPI() {
  try {
    console.log('\n🧪 TESTANDO API DE QR-CODES\n');
    
    // Primeiro, fazer login para obter token
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matricula: '0000',
        password: 'admin123'
      })
    });

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log(`✅ Token obtido: ${token.substring(0, 20)}...\n`);

    // Fazer requisição ao endpoint de QR-Codes
    const qrRes = await fetch('http://localhost:3000/api/qr/for-printing', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const qrData = await qrRes.json();
    console.log(`✅ QR-Codes retornados: ${qrData.data.length}\n`);

    if (qrData.data.length > 0) {
      const first = qrData.data[0];
      console.log(`Primeira chave: ${first.environment}`);
      console.log(`QR Code Text: ${first.qr_code}`);
      const imgStart = first.qr_code_image ? first.qr_code_image.substring(0, 50) : 'NULA';
      console.log(`Imagem começa com: ${imgStart}`);
      console.log(`Imagem tamanho: ${first.qr_code_image ? first.qr_code_image.length : 0} bytes`);
      
      // Verificar se é válido
      if (first.qr_code_image && first.qr_code_image.startsWith('data:')) {
        console.log('\n✅ Formato data URL válido!');
      } else {
        console.log('\n⚠️ Formato pode não ser data URL');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  process.exit(0);
}

testQRAPI();
