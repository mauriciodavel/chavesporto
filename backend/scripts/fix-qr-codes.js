// Script para corrigir QR-Codes que estão armazenados em hex
require('dotenv').config();
const supabase = require('../config/supabase');
const QRCode = require('qrcode');

async function fixQRCodes() {
  try {
    console.log('\n🔧 CORRIGINDO QR-CODES\n');
    
    const { data: keys, error } = await supabase
      .from('keys')
      .select('id, qr_code, qr_code_image')
      .limit(10);
    
    if (error) throw error;

    if (!keys || keys.length === 0) {
      console.log('❌ Nenhuma chave encontrada\n');
      return;
    }

    console.log(`Processando ${keys.length} chave(s)...\n`);

    for (const key of keys) {
      try {
        // Regenerar QR-Code a partir do texto
        const newQRCodeImage = await QRCode.toDataURL(key.qr_code);
        
        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('keys')
          .update({ qr_code_image: newQRCodeImage })
          .eq('id', key.id);
        
        if (updateError) {
          console.log(`❌ Erro ao atualizar ${key.id}: ${updateError.message}`);
        } else {
          console.log(`✅ ${key.qr_code}`);
        }
      } catch (e) {
        console.log(`❌ Erro ao processar ${key.id}: ${e.message}`);
      }
    }

    console.log('\n✅ Processo concluído!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  process.exit(0);
}

fixQRCodes();
