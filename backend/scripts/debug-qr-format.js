// Script para debugar QR-Codes - verificar tamanho e formato
require('dotenv').config();
const supabase = require('../config/supabase');

async function debugQRCodes() {
  try {
    console.log('\n📊 DEBUG DE QR-CODES\n');
    
    const { data: keys, error } = await supabase
      .from('keys')
      .select('id, qr_code, environment, qr_code_image')
      .limit(1);
    
    if (error) {
      console.error('❌ ERRO:', error.message);
      return;
    }

    if (!keys || keys.length === 0) {
      console.log('❌ Nenhuma chave encontrada\n');
      return;
    }

    const key = keys[0];
    console.log(`Chave: ${key.environment}`);
    console.log(`QR Code Text: ${key.qr_code}`);
    console.log(`QR Code Image Type: ${typeof key.qr_code_image}`);
    console.log(`QR Code Image Length: ${key.qr_code_image ? key.qr_code_image.length : 0} bytes`);
    
    if (key.qr_code_image) {
      const imageStr = key.qr_code_image.toString();
      console.log(`\n📋 Primeiros 100 chars da imagem:`);
      console.log(imageStr.substring(0, 100));
      
      console.log(`\n📋 Últimos 100 chars da imagem:`);
      console.log(imageStr.substring(imageStr.length - 100));
      
      // Verificar se é um data URL válido
      if (imageStr.startsWith('data:') || imageStr.startsWith('iVBORw0KGgo')) {
        console.log('\n✅ Formato de imagem parece válido');
      } else {
        console.log('\n❌ Formato de imagem pode estar incorreto');
      }
    } else {
      console.log('\n❌ QR Code Image é nulo ou undefined');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  process.exit(0);
}

debugQRCodes();
