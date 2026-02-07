// Script para verificar QR-Codes no banco
require('dotenv').config();
const supabase = require('../config/supabase');

async function listKeysWithQR() {
  try {
    console.log('\n📋 LISTANDO CHAVES COM QR-CODES\n');
    
    const { data: keys, error } = await supabase
      .from('keys')
      .select('id, qr_code, environment, status, qr_code_image')
      .limit(10);
    
    if (error) {
      console.error('❌ ERRO:', error.message);
      return;
    }

    if (!keys || keys.length === 0) {
      console.log('❌ Nenhuma chave encontrada\n');
      console.log('💡 Você precisa criar chaves no painel admin primeiro!\n');
      return;
    }

    console.log(`✅ Encontradas ${keys.length} chave(s):\n`);
    
    keys.forEach((key, i) => {
      console.log(`${i + 1}. ${key.environment}`);
      console.log(`   ID: ${key.id}`);
      console.log(`   QR Code: ${key.qr_code}`);
      console.log(`   Status: ${key.status}`);
      console.log(`   QR Image: ${key.qr_code_image ? '✅ Presente (' + key.qr_code_image.substring(0, 50) + '...)' : '❌ Faltando'}\n`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  process.exit(0);
}

listKeysWithQR();
