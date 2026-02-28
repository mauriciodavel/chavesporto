#!/usr/bin/env node
/**
 * Script de Verificação Pré-Deploy para Vercel
 * Valida se tudo está pronto para fazer git push
 * 
 * Uso: node backend/scripts/check-ready-to-deploy.js
 */

const fs = require('fs');
const path = require('path');

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
};

let allChecks = true;

log.header('📦 PRÉ-DEPLOY CHECK - VERCEL DEPLOYMENT');

// ========== Verificação 1: package.json ==========
log.header('VERIFICAÇÃO 1️⃣ : package.json');

try {
  const packageJson = require(path.join(__dirname, '../package.json'));
  
  // Verificar node-cron
  if (packageJson.dependencies && packageJson.dependencies['node-cron']) {
    log.success(`node-cron: ${packageJson.dependencies['node-cron']}`);
  } else {
    log.error('node-cron não encontrado em dependencies');
    allChecks = false;
  }
  
  // Verificar outras dependências críticas
  const requiredDeps = [
    '@supabase/supabase-js',
    'express',
    'cors',
    'dotenv',
    'nodemailer',
    'jsonwebtoken'
  ];
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      log.success(`${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      log.error(`${dep} não encontrado`);
      allChecks = false;
    }
  }
  
} catch (err) {
  log.error(`Erro ao ler package.json: ${err.message}`);
  allChecks = false;
}

// ========== Verificação 2: Arquivos novos ==========
log.header('VERIFICAÇÃO 2️⃣ : Arquivos Novos Criados');

const requiredFiles = [
  '../jobs/scheduleNotifications.js',
  '../scripts/test-notifications.js'
];

for (const file of requiredFiles) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    log.success(`Encontrado: ${file}`);
  } else {
    log.error(`NÃO encontrado: ${file}`);
    allChecks = false;
  }
}

// ========== Verificação 3: server.js ==========
log.header('VERIFICAÇÃO 3️⃣ : server.js - Agendador Ativado');

try {
  const serverPath = path.join(__dirname, '../server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  if (serverContent.includes('initializeScheduler')) {
    log.success('initializeScheduler importado em server.js');
  } else {
    log.error('initializeScheduler NÃO encontrado em server.js');
    allChecks = false;
  }
  
  if (serverContent.includes('scheduleNotifications')) {
    log.success('scheduleNotifications importado em server.js');
  } else {
    log.error('scheduleNotifications NÃO importado em server.js');
    allChecks = false;
  }
} catch (err) {
  log.error(`Erro ao ler server.js: ${err.message}`);
  allChecks = false;
}

// ========== Verificação 4: API index.js ==========
log.header('VERIFICAÇÃO 4️⃣ : API/index.js - Wrapper Correto');

try {
  const apiPath = path.join(__dirname, '../../api/index.js');
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  if (apiContent.includes('backend/server.js')) {
    log.success('api/index.js exporta backend/server.js corretamente');
  } else {
    log.error('api/index.js pode não estar exportando server.js');
    allChecks = false;
  }
} catch (err) {
  log.warn(`api/index.js não encontrado: ${err.message}`);
}

// ========== Verificação 5: package-lock.json ==========
log.header('VERIFICAÇÃO 5️⃣ : package-lock.json');

try {
  const lockPath = path.join(__dirname, '../package-lock.json');
  if (fs.existsSync(lockPath)) {
    log.success('package-lock.json existe (necessário para Vercel)');
  } else {
    log.warn('package-lock.json NÃO existe');
    log.info('Execute: npm install para criar package-lock.json');
  }
} catch (err) {
  log.warn(`Erro ao verificar package-lock.json: ${err.message}`);
}

// ========== Verificação 6: .env.example ==========
log.header('VERIFICAÇÃO 6️⃣ : Variáveis de Ambiente');

try {
  const envExamplePath = path.join(__dirname, '../.env.example');
  if (fs.existsSync(envExamplePath)) {
    log.success('.env.example existe');
    
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_KEY',
      'JWT_SECRET',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS',
      'ALERT_EMAIL'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (envContent.includes(envVar)) {
        log.success(`${envVar} documentado em .env.example`);
      } else {
        log.warn(`${envVar} NÃO em .env.example`);
      }
    }
  } else {
    log.error('.env.example não encontrado');
  }
} catch (err) {
  log.error(`Erro ao verificar .env.example: ${err.message}`);
}

// ========== Resumo ==========
console.log('\n' + colors.cyan + colors.bold + '═'.repeat(70) + colors.reset);

if (allChecks) {
  log.header('🟢 TUDO PRONTO PARA DEPLOY!');
  console.log(`
${colors.green}${colors.bold}Próximos passos:${colors.reset}

1. Execute no terminal:
   git add .
   git commit -m "feat: adicionar sistema de notificações"
   git push origin main

2. Vercel detectará automaticamente:
   └─ Nova build iniciará
   └─ npm install executará
   └─ Deploy em produção

3. Verifique no Vercel Dashboard:
   └─ https://vercel.com/projects
   └─ Procure seu projeto → Deployments
   └─ Deve estar "Ready" em poucos minutos

4. Configure variáveis no Vercel (se ainda não fez):
   Settings → Environment Variables → Adicione:
   • SMTP_HOST
   • SMTP_PORT
   • SMTP_USER
   • SMTP_PASS
   • ALERT_EMAIL

5. Redeploy para ativar notificações:
   vercel --prod
  `);
} else {
  log.header('🔴 ERROS ENCONTRADOS - NÃO FAÇA PUSH');
  console.log(`
${colors.yellow}Corrija os erros acima antes de fazer git push.${colors.reset}

Se precisar de ajuda:
• Veja: DEPLOY_VERCEL_NOTIFICACOES.md
• Veja: GUIA_COMECO_RAPIDO.txt
  `);
}

console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');

process.exit(allChecks ? 0 : 1);
