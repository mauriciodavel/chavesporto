#!/usr/bin/env node
/**
 * Script interativo para preparar deploy no Vercel
 * Uso: node scripts/prepare-deploy.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║           🚀 PREPARAÇÃO PARA DEPLOY NO VERCEL                        ║
║                                                                       ║
║           Este script verifica tudo que você precisa                 ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
`);

// Checklist
const checks = {
  'vercel.json existe': () => fs.existsSync(path.join(__dirname, '../vercel.json')),
  '.gitignore existe': () => fs.existsSync(path.join(__dirname, '../.gitignore')),
  '.env.production existe': () => fs.existsSync(path.join(__dirname, '../.env.production')),
  'package.json (raiz) existe': () => fs.existsSync(path.join(__dirname, '../package.json')),
  'backend/package.json existe': () => fs.existsSync(path.join(__dirname, '../backend/package.json')),
  'backend/server.js existe': () => fs.existsSync(path.join(__dirname, '../backend/server.js')),
  'frontend/admin.html existe': () => fs.existsSync(path.join(__dirname, '../frontend/admin.html')),
  'frontend/dashboard.html existe': () => fs.existsSync(path.join(__dirname, '../frontend/dashboard.html')),
};

console.log('\n✓ VERIFICANDO ARQUIVOS:\n');

let allGood = true;
for (const [check, fn] of Object.entries(checks)) {
  const ok = fn();
  console.log(`${ok ? '✅' : '❌'} ${check}`);
  if (!ok) allGood = false;
}

if (!allGood) {
  console.log('\n❌ Alguns arquivos estão faltando!');
  process.exit(1);
}

console.log('\n\n✓ TODOS OS ARQUIVOS VERIFICADOS COM SUCESSO!\n');

// Verificar Git
console.log('✓ VERIFICANDO GIT:\n');

try {
  execSync('git status', { stdio: 'ignore' });
  console.log('✅ Repositório Git inicializado');
} catch {
  console.log('❌ Git não inicializado. Execute: git init');
  process.exit(1);
}

// Resumo
console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║           ✅ PRONTO PARA DEPLOY! (PRÓXIMOS PASSOS)                   ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝

1️⃣  Fazer commit e push:
    git add .
    git commit -m "Deploy - Chavesporto Sistema de Chaves"
    git push -u origin main

2️⃣  Abrir Vercel:
    https://vercel.com

3️⃣  Importar repositório:
    New Project → Import Git Repository → chavesporto

4️⃣  Adicionar variáveis de ambiente:
    Settings → Environment Variables
    (Copie de .env.production)

5️⃣  Deploy:
    Clique "Deploy"

6️⃣  Teste:
    Visite URL gerada e teste admin/dashboard

`);
