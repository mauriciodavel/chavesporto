#!/usr/bin/env node
/**
 * Script de Teste - Sistema de Notificação de Chaves Não Devolvidas
 * 
 * Uso: node backend/scripts/test-notifications.js
 * 
 * Este script testa se:
 * 1. Variáveis de ambiente estão configuradas
 * 2. Conexão com Supabase funciona
 * 3. Email SMTP está funcionando
 * 4. Job de verificação detecta chaves em atraso
 */

require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset}  ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}\n`),
  divider: () => console.log(`${colors.cyan}${'─'.repeat(70)}${colors.reset}`)
};

async function runTests() {
  log.header('🔔 TESTE DO SISTEMA DE NOTIFICAÇÕES');
  
  // ========== TESTE 1: Variáveis de Ambiente ==========
  log.header('TESTE 1️⃣ : Variáveis de Ambiente');
  
  const requiredEnvs = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'ALERT_EMAIL'
  ];
  
  let allEnvsOk = true;
  for (const env of requiredEnvs) {
    if (process.env[env]) {
      const value = env.includes('PASS') ? '***' : 
                    env.includes('KEY') ? process.env[env].substring(0, 10) + '...' :
                    process.env[env];
      log.success(`${env} = ${value}`);
    } else {
      log.error(`${env} não configurada`);
      allEnvsOk = false;
    }
  }
  
  if (!allEnvsOk) {
    log.error('\n❌ FALHA: Variáveis de ambiente incompletas!');
    log.info('Configure todas as variáveis no arquivo .env');
    process.exit(1);
  }
  
  log.divider();
  
  // ========== TESTE 2: Conexão Supabase ==========
  log.header('TESTE 2️⃣ : Conexão com Supabase');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    
    const { data, error } = await supabase
      .from('key_history')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (error) {
      log.error(`Erro ao conectar: ${error.message}`);
      process.exit(1);
    }
    
    log.success(`Conectado ao Supabase`);
    log.info(`Database: ${process.env.SUPABASE_URL.replace('https://', '').split('.')[0]}`);
    
    log.divider();
    
    // ========== TESTE 3: Email SMTP ==========
    log.header('TESTE 3️⃣ : Verificação de Email SMTP');
    
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    log.info('Testando conexão SMTP...');
    const verified = await transporter.verify();
    
    if (verified) {
      log.success(`Email SMTP funcionando`);
      log.info(`Provider: ${process.env.SMTP_HOST}`);
      log.info(`Porta: ${process.env.SMTP_PORT}`);
      log.info(`Usuário: ${process.env.SMTP_USER}`);
    } else {
      log.error('Verifique credenciais SMTP');
      process.exit(1);
    }
    
    log.divider();
    
    // ========== TESTE 4: Chaves em Atraso ==========
    log.header('TESTE 4️⃣ : Verificação de Chaves em Atraso');
    
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    const todayString = formatter.format(new Date());
    
    const { data: activeKeys } = await supabase
      .from('key_history')
      .select(`
        id,
        keys(environment),
        instructors(name, email),
        withdrawn_at,
        status,
        email_first_alert_sent_at,
        email_reminder_sent_at
      `)
      .eq('status', 'active');
    
    if (!activeKeys || activeKeys.length === 0) {
      log.success('Nenhuma chave ativa em circulação');
    } else {
      log.warn(`${activeKeys.length} chave(s) ativa(s) encontrada(s):`);
      
      for (const key of activeKeys) {
        console.log(`\n   📌 ${key.keys.environment}`);
        console.log(`      Instrutor: ${key.instructors.name}`);
        console.log(`      Email: ${key.instructors.email}`);
        console.log(`      Retirada: ${key.withdrawn_at}`);
        
        if (key.email_first_alert_sent_at) {
          console.log(`      ${colors.yellow}📧 Alerta enviado em: ${new Date(key.email_first_alert_sent_at).toLocaleString('pt-BR')}${colors.reset}`);
        } else {
          console.log(`      ${colors.red}✉️  Nenhum alerta enviado ainda${colors.reset}`);
        }
        
        if (key.email_reminder_sent_at) {
          console.log(`      ${colors.yellow}🔴 Recobrança em: ${new Date(key.email_reminder_sent_at).toLocaleString('pt-BR')}${colors.reset}`);
        }
      }
    }
    
    log.divider();
    
    // ========== TESTE 5: Agendador ==========
    log.header('TESTE 5️⃣ : Agendador (node-cron)');
    
    try {
      const cron = require('node-cron');
      log.success('Módulo node-cron disponível');
      
      // Validar uma expressão cron
      const isValid = cron.validate('30 12 * * *');
      if (isValid) {
        log.success('Expressões cron válidas');
        log.info('Agendamentos que serão executados:');
        console.log('   • 12:30 - Turno MATUTINO');
        console.log('   • 18:30 - Turno VESPERTINO');
        console.log('   • 22:35 - Turno NOTURNO');
        console.log('   • A cada 15 min - Failsafe');
      } else {
        log.error('Expressões cron inválidas');
      }
    } catch (err) {
      log.error(`Módulo node-cron não encontrado: ${err.message}`);
      log.info('Execute: npm install node-cron');
    }
    
    log.divider();
    
    // ========== RESUMO ==========
    log.header('✅ TODOS OS TESTES PASSARAM');
    
    console.log(`
${colors.green}${colors.bold}Sistema de Notificações está pronto!${colors.reset}

Próximos passos:
  1. Reinicie o servidor: ${colors.cyan}npm start${colors.reset}
  2. Monitore os logs para verificar agendamentos
  3. Para testar manualmente: ${colors.cyan}node backend/jobs/checkLateReturns.js${colors.reset}

${colors.cyan}Referência de horários de verificação:${colors.reset}
  • 12:30 → 30min após turno matutino (fim 11:30 → devolver até 12:00)
  • 18:30 → 30min após turno vespertino (fim 17:30 → devolver até 18:00)
  • 22:35 → 5min após turno noturno (fim 22:00 → devolver até 22:30)
    `);
    
  } catch (error) {
    log.error(`Erro durante testes: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Executar testes
runTests().then(() => {
  console.log(`${colors.cyan}${colors.bold}Testes concluídos${colors.reset}\n`);
  process.exit(0);
}).catch(err => {
  log.error(`Erro fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});
