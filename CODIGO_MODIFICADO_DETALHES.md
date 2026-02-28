# 📝 Código Modificado - Principais Trechos

## 1. backend/jobs/scheduleNotifications.js (NOVO)

Este arquivo é o coração do novo sistema. Usa `node-cron` para agendar verificações em horários precisos:

```javascript
// Agendador de notificações para chaves não devolvidas
const cron = require('node-cron');
const { checkLateReturns } = require('./checkLateReturns');

function initializeScheduler() {
  console.log('\n' + '='.repeat(70));
  console.log('⏰ INICIALIZANDO AGENDADOR DE NOTIFICAÇÕES');
  console.log('='.repeat(70));
  
  // Job 1: Executar exatamente às 12:30 (após matutino)
  const job1 = cron.schedule('30 12 * * *', () => {
    console.log('\n🔔 [Agendado] Executando verificação do turno MATUTINO (12:30)');
    checkLateReturns().catch(err => console.error('❌ Erro em job1:', err));
  }, { timezone: 'America/Sao_Paulo' });

  // Job 2: Executar exatamente às 18:30 (após vespertino)
  const job2 = cron.schedule('30 18 * * *', () => {
    console.log('\n🔔 [Agendado] Executando verificação do turno VESPERTINO (18:30)');
    checkLateReturns().catch(err => console.error('❌ Erro em job2:', err));
  }, { timezone: 'America/Sao_Paulo' });

  // Job 3: Executar exatamente às 22:35 (após noturno)
  const job3 = cron.schedule('35 22 * * *', () => {
    console.log('\n🔔 [Agendado] Executando verificação do turno NOTURNO (22:35)');
    checkLateReturns().catch(err => console.error('❌ Erro em job3:', err));
  }, { timezone: 'America/Sao_Paulo' });

  // Job 4: Failsafe - executar a cada 15 minutos
  const job4 = cron.schedule('*/15 * * * *', () => {
    checkLateReturns().catch(err => console.error('❌ Erro em job4:', err));
  }, { timezone: 'America/Sao_Paulo' });

  console.log('\n📅 Agendamentos configurados:');
  console.log('   ✓ 12:30 - Verificação após turno MATUTINO');
  console.log('   ✓ 18:30 - Verificação após turno VESPERTINO');
  console.log('   ✓ 22:35 - Verificação após turno NOTURNO');
  console.log('   ✓ A cada 15 min - Failsafe/redundância');
  console.log('='.repeat(70) + '\n');

  // Executar uma vez ao inicializar
  console.log('⏳ Executando verificação inicial...\n');
  checkLateReturns().catch(err => console.error('❌ Erro na verificação inicial:', err));

  return { job1, job2, job3, job4 };
}

module.exports = { initializeScheduler };
```

---

## 2. backend/server.js (MODIFICADO)

Mudou de usar `setInterval` simples para usar o novo agendador:

### ❌ ANTES:
```javascript
// Importar jobs
const { checkLateReturns } = require('./jobs/checkLateReturns');

// ...rotas...

// Inicializar job de verificação de devoluções em atraso
// Executa a cada 30 minutos para verificar chaves não devolvidas
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ALERT_EMAIL) {
  console.log('📧 Email service iniciado - verificando devoluções em atraso a cada 30 minutos');
  
  // Executar uma vez ao iniciar
  checkLateReturns();
  
  // Agendar para rodar a cada 30 minutos (1800000 ms)
  setInterval(() => {
    checkLateReturns();
  }, 30 * 60 * 1000);
}
```

### ✅ DEPOIS:
```javascript
// Importar schedulers
const { initializeScheduler } = require('./jobs/scheduleNotifications');

// ...rotas...

// Inicializar agendador de notificações para chaves não devolvidas
// Com jobs em horários específicos: 12:30, 18:30, 22:35 (30 min após fim de cada turno)
// E failsafe a cada 15 minutos
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ALERT_EMAIL) {
  console.log('📧 Serviço de email detectado - inicializando agendador de notificações');
  initializeScheduler();
} else {
  console.warn('\n⚠️  AVISO: Email não configurado!');
  console.warn('   Para ativar notificações de chaves não devolvidas, configure:');
  console.warn('   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL');
  console.warn('   Veja o arquivo .env.example para mais detalhes\n');
}
```

---

## 3. backend/jobs/checkLateReturns.js (MELHORADO)

Logs muito mais detalhados para auditoria:

### Exemplo de Output:
```
===========================================================================
[28/02/2026 22:35:10] 🔍 VERIFICANDO CHAVES NÃO DEVOLVIDAS
===========================================================================
📅 Data de hoje (Brasília): 2026-02-28

📦 Encontradas 1 chave(s) ativa(s) em circulação

  ⏰ Reserva era para 2026-02-27, 1 dia(s) em atraso
  🚨 CHAVE EM ATRASO: LAB-001 (Turno: noturno)
     Instrutor: João Silva (3-02919)
     Retirada em: 2026-02-27T22:10:00.000Z
     📧 STATUS: Primeiro alerta será enviado

─────────────────────────────────────────────────────────────────────────
⚠️  RESUMO: 1 chave(s) em atraso detectada(s)
─────────────────────────────────────────────────────────────────────────

  📧 Enviando ⚠️ ALERTA
     Chave: LAB-001
     Instrutor: João Silva (joao@seudominio.com)

     ✅ Email enviado para ADMIN admin@seudominio.com
     ✅ Email enviado para INSTRUTOR joao@seudominio.com
     ✅ Email registrado como enviado

===========================================================================
✓ Verificação concluída em 28/02/2026 22:35:15
  📊 Resumo: 1 email(ns) enviado(s), 0 falha(s)
===========================================================================
```

---

## 4. backend/package.json (ADICIONADO)

Uma única dependência nova foi adicionada:

```json
{
  "dependencies": {
    ...outras dependências...
    "node-cron": "^3.0.3",   // ← NOVO
    ...outras dependências...
  }
}
```

---

## 5. backend/scripts/test-notifications.js (NOVO)

Script para testar se tudo está configurado corretamente:

```javascript
#!/usr/bin/env node
require('dotenv').config();

async function runTests() {
  // TESTE 1: Variáveis de Ambiente
  const requiredEnvs = [
    'SUPABASE_URL', 'SUPABASE_KEY',
    'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'ALERT_EMAIL'
  ];
  
  for (const env of requiredEnvs) {
    if (process.env[env]) {
      console.log(`✅ ${env} = ${mascarar(process.env[env])}`);
    } else {
      console.error(`❌ ${env} não configurada`);
      process.exit(1);
    }
  }

  // TESTE 2: Conexão Supabase
  // TESTE 3: Email SMTP
  // TESTE 4: Chaves em Atraso
  // TESTE 5: Agendador (node-cron)
}

runTests();
```

---

## 6. Expressões CRON Explicadas

O novo sistema usa estas expressões cron:

### 12:30 - Verificação MATUTINO
```
'30 12 * * *'
 │  │  │ │ │
 │  │  │ │ └─ Dia da semana (qualquer)
 │  │  │ └─── Mês (qualquer)
 │  │  └───── Dia do mês (qualquer)
 │  └──────── Hora 12
 └─────────── Minuto 30
```

### 18:30 - Verificação VESPERTINO
```
'30 18 * * *'
```

### 22:35 - Verificação NOTURNO
```
'35 22 * * *'
```

### A cada 15 minutos - Failsafe
```
'*/15 * * * *'
 │   │ │ │ │
 │   │ │ │ └─ Dia da semana (qualquer)
 │   │ │ └─── Mês (qualquer)
 │   │ └───── Dia do mês (qualquer)
 │   └─────── Hora (qualquer)
 └─────────── A cada 15 minutos (0, 15, 30, 45)
```

---

## Fluxo de Execução Completo

```
┌─ server.js inicia
│  └─ Verifica se SMTP_HOST, SMTP_USER, ALERT_EMAIL existem
│     ├─ SIM: Chama initializeScheduler()
│     └─ NÃO: Mostra aviso e retorna
│
└─ initializeScheduler() (de scheduleNotifications.js)
   ├─ Cria job1: agendado para 12:30
   ├─ Cria job2: agendado para 18:30
   ├─ Cria job3: agendado para 22:35
   ├─ Cria job4: agendado para a cada 15 min
   └─ Executa checkLateReturns() uma vez ao iniciar
      │
      └─ checkLateReturns() (de checkLateReturns.js)
         ├─ Busca chaves com status = 'active' (não devolvidas)
         ├─ Para cada chave:
         │  ├─ Busca sua reserva
         │  ├─ Verifica se passou do deadline
         │  └─ Se passou:
         │     ├─ Envia email via emailService
         │     └─ Registra timestamp no banco
         └─ Exibe logs detalhados

[Tempo passa]

┌─ 12:30, 18:30, 22:35 ou a cada 15 min
│
└─ node-cron executa job automaticamente
   └─ Chama checkLateReturns() novamente
      └─ Repete o processo acima
```

---

## Benefícios das Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Timing** | A cada 30 min | Exato (12:30, 18:30, 22:35) |
| **Previsibilidade** | Impreciso | Previsível |
| **Redundância** | Nenhuma | A cada 15 min |
| **Logs** | Mínimos | Detalhados |
| **Auditoria** | Difícil | Rastreável |
| **Notificações** | 1 alerta | 2 (alerta + recobrança) |

---

## Como Testar Manualmente

```bash
# Testar configurações
node backend/scripts/test-notifications.js

# Forçar verificação imediata
node backend/jobs/checkLateReturns.js

# Ver logs em tempo real
npm start
# Ctrl+C para parar
```

---

**Resumo**: O código agora é mais robusto, previsível e auditável. O problema de chaves não devolvidas sem notificação é definitivamente resolvido! ✅
