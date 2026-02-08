// Test script para validar envio de emails - teste-email.js
const emailService = require('./utils/emailService');
require('dotenv').config();

async function testEmailService() {
  console.log('\n📧 TESTE DE ENVIO DE EMAIL - CHAVESPORTO\n');
  console.log('=' .repeat(50));
  
  // Validar variáveis de ambiente
  console.log('\n✓ Verificando variáveis de ambiente...');
  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'ALERT_EMAIL'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error(`\n❌ Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
    console.error('Configure estas variáveis em backend/.env antes de testar');
    process.exit(1);
  }
  
  console.log(`✓ SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`✓ SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`✓ SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`✓ ALERT_EMAIL: ${process.env.ALERT_EMAIL}`);
  
  // Dados simulados para teste
  const mockKeyInfo = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    environment: 'Lab Python - Bloco A',
    description: 'Chave para Laboratório Python',
    location: 'Sala 301',
    qr_code: 'KEY-LAB-PYTHON-001'
  };
  
  const mockInstructorInfo = {
    id: '660e8400-e29b-41d4-a716-446655440001',
    name: 'João Silva',
    matricula: 'MAT-2024-001',
    email: 'joao.silva@senai.br',
    withdrawnAt: new Date(Date.now() - 2 * 3600000).toISOString() // 2 horas atrás
  };
  
  console.log('\n📋 Dados do teste:');
  console.log(`  • Chave: ${mockKeyInfo.environment}`);
  console.log(`  • Instrutor: ${mockInstructorInfo.name} (${mockInstructorInfo.matricula})`);
  console.log(`  • Retirada há: 2 horas`);
  console.log(`  • Email será enviado para: ${process.env.ALERT_EMAIL}`);
  
  console.log('\n🚀 Enviando email de teste...');
  console.log('=' .repeat(50));
  
  try {
    const result = await emailService.sendLateReturnAlert(mockKeyInfo, mockInstructorInfo);
    
    if (result) {
      console.log('\n✅ EMAIL ENVIADO COM SUCESSO!');
      console.log('=' .repeat(50));
      console.log('\n📧 Detalhes do email:');
      console.log(`  • Para: ${process.env.ALERT_EMAIL}`);
      console.log(`  • Assunto: ⚠️ ALERTA: Devolução em Atraso - ${mockKeyInfo.environment}`);
      console.log(`  • Tipo: HTML`);
      console.log('\n✓ Verifique sua caixa de entrada ou pasta de spam');
      process.exit(0);
    } else {
      console.log('\n❌ FALHA ao enviar email');
      console.log('=' .repeat(50));
      console.log('\nVerifique:');
      console.log('  1. SMTP_HOST e SMTP_PORT estão corretos?');
      console.log('  2. SMTP_USER e SMTP_PASS estão corretos?');
      console.log('  3. Se usar Gmail, ativa a "App Password" (não senha comum)');
      console.log('  4. Verifique logs de erro acima');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ERRO ao enviar email:');
    console.error(error.message);
    console.log('\n' + '=' .repeat(50));
    console.log('Dicas de resolução:');
    console.log('  • Verifique a conexão com SMTP_HOST');
    console.log('  • Verifique credenciais SMTP_USER/SMTP_PASS');
    console.log('  • Se usar Gmail: https://myaccount.google.com/apppasswords');
    console.log('  • Se usar outro email, verifique configurações SMTP');
    process.exit(1);
  }
}

// Executar teste
testEmailService();
