// Script para gerar certificado auto-assinado para HTTPS
const pem = require('pem');
const fs = require('fs');
const path = require('path');

pem.createCertificate({
  days: 365,
  selfSigned: true
}, function(error, result) {
  if (error) {
    console.error('❌ Erro ao gerar certificado:', error);
    process.exit(1);
  }

  const certsDir = path.join(__dirname, '../certs');

  // Criar pasta se não existir
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Salvar certificado e chave privada
  fs.writeFileSync(path.join(certsDir, 'cert.pem'), result.certificate);
  fs.writeFileSync(path.join(certsDir, 'key.pem'), result.private);

  console.log('✅ Certificado auto-assinado gerado com sucesso!');
  console.log(`📁 Localização: ${certsDir}`);
  console.log('\n✨ Agora rode: npm run dev');
  
  process.exit(0);
});
