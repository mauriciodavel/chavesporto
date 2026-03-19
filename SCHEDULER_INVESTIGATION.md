# 📊 Investigação do Scheduler de Notificações

## 1️⃣ COMO O SCHEDULER FUNCIONA

### Inicialização
- **Arquivo:** [backend/server.js](backend/server.js#L28) - Linha 28-104
- **Acionamento:** Automático ao ligar o servidor
- **Dependência:** Requer variáveis de ambiente SMTP configuradas (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL`)
- **Tecnologia:** `node-cron` (agendador de tarefas cron)

```javascript
// Apenas se EMAIL estiver configurado
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ALERT_EMAIL) {
  initializeScheduler();
} else {
  console.warn('⚠️  AVISO: Email não configurado!');
}
```

### Cronograma de Execução
**Arquivo:** [backend/jobs/scheduleNotifications.js](backend/jobs/scheduleNotifications.js)

| Horário | Objetivo | Turno | Detalhes |
|---------|----------|-------|---------|
| **12:30** | Verificação MATUTINO | Manhã (11:30 - 12:00) | 30min após fim do turno |
| **18:30** | Verificação VESPERTINO | Tarde (17:30 - 18:00) | 30min após fim do turno |
| **22:35** | Verificação NOTURNO | Noite (22:00 - 22:30) | 5min após fim do turno |
| **A cada 15 min** | Failsafe/Redundância | Todos | Executa mesmo se servidor reinicia |

```javascript
// Job 1: 12:30
cron.schedule('30 12 * * *', ...)

// Job 2: 18:30
cron.schedule('30 18 * * *', ...)

// Job 3: 22:35
cron.schedule('35 22 * * *', ...)

// Job 4: Failsafe a cada 15 min
cron.schedule('*/15 * * * *', ...)
```

### Execução na Inicialização
```javascript
// Executar uma vez ao inicializar (para pegar alertas pendentes)
checkLateReturns().catch(err => console.error('❌ Erro na verificação inicial:', err));
```

---

## 2️⃣ DEPENDÊNCIA DE LOGIN/CLIENTE ❌

### Resposta: **NÃO HÁ NENHUMA DEPENDÊNCIA**

✅ **O scheduler é completamente independente do cliente:**
- Roda no **backend/servidor** Node.js
- Executa **continuamente** sem necessidade de requisição do cliente
- **Não requer** login ou autenticação de usuário
- **Não há rotas HTTP** que disparem o scheduler
- Funciona mesmo que nenhum cliente esteja conectado

### Confirmação
Buscas realizadas em:
- `backend/routes/` - Nenhuma rota dispara o scheduler
- `backend/controllers/` - Nenhum controller dispara o scheduler
- Apenas inicialização em [backend/server.js](backend/server.js#L104)

---

## 3️⃣ LÓGICA DE VERIFICAÇÃO DE CHAVES NÃO DEVOLVIDAS

### Arquivo Principal
**[backend/jobs/checkLateReturns.js](backend/jobs/checkLateReturns.js)**

### Fluxo de Verificação

```
1. Obter data de hoje (Brasília - YYYY-MM-DD)
   ↓
2. Buscar TODAS chaves com status = 'active' no banco
   ├─ Inclui: id, informações da chave, instrutor, status
   ↓
3. Para cada chave ativa:
   ├─ Buscar RESERVA correspondente onde:
   │  ├─ key_id = chave atual
   │  ├─ instructor_id = instrutor da chave
   │  ├─ status = 'approved'
   │  ├─ reservation_end_date ≤ hoje (reserva já terminou)
   │  └─ Pega a MAIS RECENTE
   │
   ├─ SE reserva não encontrada → SKIP (chave órfã)
   │
   ├─ VERIFICAR se passou da janela de devolução:
   │  ├─ SE reservation_end_date < hoje → **PASSOU** (dias em atraso)
   │  └─ SE reservation_end_date = hoje → Verificar hora (isAfterWithdrawWindow)
   │
   └─ SE passou:
      ├─ SE email_first_alert_sent_at = NULL
      │  └─ Marcar como: ENVIAR PRIMEIRO ALERTA
      │
      ├─ SENÃO SE passou 24h E email_reminder_sent_at = NULL
      │  └─ Marcar como: ENVIAR RECOBRANÇA
      │
      └─ SENÃO recobrança já foi enviada → SKIP
      
4. Para cada chave em atraso:
   ├─ Enviar email de ALERTA ou RECOBRANÇA
   ├─ Enviar para ADMIN (ALERT_EMAIL)
   ├─ Enviar para INSTRUTOR (email do instrutor)
   └─ Registrar timestamp no banco: email_first_alert_sent_at ou email_reminder_sent_at

5. Log com resumo: X emails enviados, Y falhas
```

### Timestamps de Controle
**Campo no banco `key_history`:**
| Campo | Função |
|-------|--------|
| `email_first_alert_sent_at` | Quando primeiro alerta foi enviado |
| `email_reminder_sent_at` | Quando recobrança foi enviada (24h depois) |

### Função responsável
[backend/jobs/checkLateReturns.js - Função checkLateReturns](backend/jobs/checkLateReturns.js#L11)

---

## 4️⃣ FUNÇÃO QUE ENVIA EMAILS

### EmailService
**Arquivo:** [backend/utils/emailService.js](backend/utils/emailService.js)

### Método de Envio
```javascript
async sendLateReturnAlert(keyInfo, instructorInfo, isReminder = false)
```

### O que é enviado

**📧 Email 1: Para o ADMIN**
- `To:` process.env.ALERT_EMAIL
- `Subject:` `⚠️ ALERTA: Devolução em Atraso - [CHAVE]` ou `🔴 RECOBRANÇA: Devolução em Atraso - [CHAVE]`
- Conteúdo:
  - Informações da chave (ambiente, descrição, localização, QR code)
  - Instrutor responsável (nome, matrícula, email)
  - Data/hora retirada (formatada em Brasília)
  - Ação recomendada

**📧 Email 2: Para o INSTRUTOR** (se houver email cadastrado)
- `To:` instructorInfo.email
- `Subject:` `⚠️ AVISO: Sua Chave Está em Atraso - [CHAVE]` ou `🔴 RECOBRANÇA: Sua Chave Está em Atraso - [CHAVE]`
- Template específico para instrutor (menos técnico, mais amigável)

### Template HTML
- Headers coloridos (laranja para alerta, vermelho para recobrança)
- Informações estruturadas
- Aviso destacado em vermelho para recobrança (após 24h)

### Formatação de Data
```javascript
// Converter para formato DD/MM/YYYY HH:MM:SS em Brasília
formatDateBrasilia(dateString)
```

---

## 5️⃣ CONFIGURAÇÃO DO SCHEDULER

### É contínuo? ✅ SIM
- Roda **continuamente** após inicialização
- Executa em **horários fixos** (node-cron)
- Executa a **cada 15 minutos** (failsafe)
- **Não precisa** de trigger do cliente

### Precisa de login/cliente? ❌ NÃO
- Completamente independente
- Funciona mesmo offline do cliente
- Autônomo no servidor

---

## ⚠️ ERROS POTENCIAIS DETECTADOS

### 1. 🔴 CRÍTICO - Exports duplicados em checkLateReturns.js
**Localização:** [backend/jobs/checkLateReturns.js - Linhas 221-235](backend/jobs/checkLateReturns.js#L221-L235)

```javascript
// Linha 221 - Primeiro export
module.exports = { checkLateReturns };

// Se rodado diretamente, executar uma vez
if (require.main === module) {
  require('dotenv').config();
  checkLateReturns().then(() => process.exit(0));
}

// Linha 230 - EXPORT DUPLICADO ❌
module.exports = { checkLateReturns };

// Linha 235 - IF DUPLICADO ❌
if (require.main === module) {
  require('dotenv').config();
  checkLateReturns().then(() => process.exit(0));
}
```

**Impacto:** Pode causar comportamento imprevisível. Recomenda-se remover as linhas duplicadas (230-235).

### 2. ⚠️ Email não configurado = Scheduler não inicia
**Localização:** [backend/server.js - Linhas 100-114](backend/server.js#L100-L114)

```javascript
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ALERT_EMAIL) {
  // Scheduler inicia
} else {
  console.warn('⚠️  AVISO: Email não configurado!');
  // Scheduler NÃO INICIA - apenas warning
}
```

**Impacto:** Se variáveis de email não estão no `.env`, nenhuma notificação será enviada (silenciosamente).

**Solução:** Verificar `.env` e confirmar:
```
SMTP_HOST=smtp.xxx.com
SMTP_PORT=587
SMTP_USER=seu-email@xxx.com
SMTP_PASS=sua-senha
ALERT_EMAIL=admin@xxx.com
```

### 3. ⚠️ Dependência de pacotes não verificada
- `node-cron` - Necessário para agendamento
- `nodemailer` - Necessário para enviar emails
- `@supabase/supabase-js` - Necessário para acessar banco

**Solução:** Verificar `backend/package.json` se contém estas dependências.

### 4. ⚠️ Timezone hardcoded em Brasília
```javascript
timezone: 'America/Sao_Paulo'
```

Se o servidor for rodado em outro timezone, pode haver confusão. Recomenda-se documentar que DEVE ser deployado em servidor em timezone de Brasília.

### 5. ⚠️ Tratamento de erro silencioso em failsafe
```javascript
// Job 4: Failsafe - logs muito simples
checkLateReturns().catch(err => console.error('❌ Erro em job4 (failsafe):', err));
```

Se falhar silenciosamente 15 minutos, o alerta pode ser perdido.

---

## 📋 RESUMO EXECUTIVO

| Aspecto | Status | Detalhes |
|--------|--------|---------|
| **Scheduler Roda?** | ✅ SIM | Contínuo via node-cron |
| **Independente de Cliente?** | ✅ SIM | Backend autônomo |
| **Horários Configurados?** | ✅ SIM | 12:30, 18:30, 22:35 + failsafe 15min |
| **Emails Funcionam?** | ✅ SIM (se configurado) | Para admin e instrutor |
| **Verificação Automática?** | ✅ SIM | Após fim de cada turno + redundância |
| **Erros Críticos?** | ⚠️ SIM | Exports duplicados, email não obrigatório |
| **Deploy Pronto?** | ⚠️ PARCIAL | Verificar `.env` e `package.json` |

---

## 🧪 COMO TESTAR

### Teste automático completo
```bash
node backend/scripts/test-notifications.js
```

Verifica:
1. Variáveis de ambiente
2. Conexão Supabase
3. Email SMTP
4. Chaves em atraso
5. Agendador

### Executar verificação manual (uma vez)
```bash
node backend/jobs/checkLateReturns.js
```

### Verificar logs ao ligar servidor
```bash
npm start
# Procure por: "⏰ INICIALIZANDO AGENDADOR DE NOTIFICAÇÕES"
```

---

## 📞 CONTATO / SUPORTE

Se o scheduler não começar:
1. Verifique `.env` - todas as 5 variáveis SMTP configuradas?
2. Execute teste: `node backend/scripts/test-notifications.js`
3. Verifique logs no console: `npm start`
4. Se erro de módulo: `npm install node-cron nodemailer`
