# 🔔 Guia de Configuração - Sistema de Notificação de Chaves Não Devolvidas

## 📋 Problema Resolvido

O sistema foi corrigido para notificar automaticamente:
- **Instrutor**: que não devolveu a chave no prazo
- **Administrador**: para ação necessária

**Horários de Verificação**:
- ⏰ **12:30** - Após turno matutino (11:30 → devolver até 12:00)
- ⏰ **18:30** - Após turno vespertino (17:30 → devolver até 18:00)
- ⏰ **22:35** - Após turno noturno (22:00 → devolver até 22:30)
- ⏰ **A cada 15 minutos** - Failsafe (garante que nenhum alerta seja perdido)

---

## 🚀 Passo 1: Instalar Dependência

Execute no diretório `backend/`:

```bash
npm install node-cron
```

---

## 🔧 Passo 2: Configurar Variáveis de Ambiente

1. Abra ou crie o arquivo `backend/.env`
2. Configure as variáveis de email (se não estiverem já):

```env
# Email Configuration (OBRIGATÓRIO para notificações)
SMTP_HOST=smtp.seuprovedoremail.com
SMTP_PORT=587
SMTP_USER=seu_email@example.com
SMTP_PASS=sua_senha_ou_app_password
ALERT_EMAIL=admin@seudominio.com
```

### Como obter essas credenciais:

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_app_password_de_16_caracteres
```
⚠️ Use [App Password](https://myaccount.google.com/apppasswords) (não sua senha de login)

**Office 365/Outlook:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=seu_email@sua_empresa.com.br
SMTP_PASS=sua_senha
```

**Outro provedor:**
Consulte o suporte do seu provedor de email

---

## ✅ Passo 3: Reiniciar o Servidor

```bash
# Parar o servidor atual (Ctrl+C)
# Depois:
npm start
```

Ou para desenvolvimento:
```bash
npm run dev
```

---

## 📊 Passo 4: Verificar se Está Funcionando

### Verificar nos Logs do Servidor

Ao iniciar, você verá:

```
======================================================================
⏰ INICIALIZANDO AGENDADOR DE NOTIFICAÇÕES
======================================================================
✅ Serviço de email configurado
   SMTP: smtp.gmail.com:587
   Alerta para: admin@seudominio.com

📅 Agendamentos configurados:
   ✓ 12:30 - Verificação após turno MATUTINO
   ✓ 18:30 - Verificação após turno VESPERTINO
   ✓ 22:35 - Verificação após turno NOTURNO
   ✓ A cada 15 min - Failsafe/redundância
======================================================================
```

### Testar Manualmente

Para forçar uma verificação imediata (sem aguardar 12:30):

```bash
# No diretório do projeto:
node backend/jobs/checkLateReturns.js
```

Você verá logs detalhados como:

```
======================================================================
[28/02/2026 14:35:22] 🔍 VERIFICANDO CHAVES NÃO DEVOLVIDAS
======================================================================
📅 Data de hoje (Brasília): 2026-02-28

📦 Encontradas 1 chave(s) ativa(s) em circulação

  ⏰ Reserva era para 2026-02-27, 1 dia(s) em atraso
  🚨 CHAVE EM ATRASO: LAB-001 (Turno: noturno)
     Instrutor: João Silva (3-02919)
     Retirada em: 2026-02-27T22:10:00.000Z

     📧 STATUS: Primeiro alerta será enviado

─────────────────────────────────────────────────────────────────────
⚠️  RESUMO: 1 chave(s) em atraso detectada(s)
─────────────────────────────────────────────────────────────────────

  📧 Enviando ⚠️ ALERTA
     Chave: LAB-001
     Instrutor: João Silva (joao@seudominio.com)

     ✅ Email enviado para ADMIN admin@seudominio.com
     ✅ Email enviado para INSTRUTOR joao@seudominio.com
     ✅ Email registrado como enviado

======================================================================
✓ Verificação concluída em 28/02/2026 14:35:25
  📊 Resumo: 1 email(ns) enviado(s), 0 falha(s)
======================================================================
```

---

## 📧 Fluxo de Notificações

### Primeira Notificação (Alerta)
- **Quando**: Imediatamente após 30 minutos do fim do turno
- **Quem recebe**: Instrutor + Administrador
- **Assunto**: `⚠️ ALERTA: Devolução em Atraso - LAB-001`

### Segunda Notificação (Recobrança)
- **Quando**: Após 24 horas do primeiro alerta
- **Quem recebe**: Instrutor + Administrador
- **Assunto**: `🔴 RECOBRANÇA: Sua Chave Está em Atraso - LAB-001`

---

## 🛡️ Troubleshooting

### Email não é enviado
```
❌ Falha ao enviar email
```

**Soluções:**
1. Verifique as credenciais SMTP_USER e SMTP_PASS
2. Verifique se o email de alerta ALERT_EMAIL está correto
3. Para Gmail: use [App Password](https://myaccount.google.com/apppasswords), não sua senha de login
4. Teste a conexão SMTP manualmente:
```javascript
// No browser console:
fetch('/api/test/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
```

### Agendador não está rodando
```
⚠️  AVISO: Email não configurado!
```

Certifique-se que as três variáveis estão configuradas:
- `SMTP_HOST` ✅
- `SMTP_USER` ✅
- `SMTP_PASS` ✅
- `ALERT_EMAIL` ✅

### Chaves não aparecem como "em atraso"

1. Verifique se a reserva tem status `approved`
2. Verifique se a data de fim da reserva é hoje ou ontem
3. Verifique se a chave tem status `active` no banco
4. Teste o comando manual: `node backend/jobs/checkLateReturns.js`

---

## 📝 Registro de Notificações

As notificações envidas são registradas no banco:
- `email_first_alert_sent_at` - Data do primeiro alerta
- `email_reminder_sent_at` - Data da recobrança

Você pode verificar no Supabase:
```sql
SELECT 
  environment,
  instructor_id,
  withdrawn_at,
  email_first_alert_sent_at,
  email_reminder_sent_at
FROM key_history
WHERE status = 'active'
ORDER BY withdrawn_at DESC;
```

---

## 🔄 Próximas Ações Sugeridas

1. **Testar com uma chave intencional**:
   - Retirar uma chave agora
   - Não devolvê-la até passar de 22:30
   - Esperar até 22:35 (ou testar manualmente)
   - Verificar se o email foi enviado

2. **Configurar regras de email**:
   - Crie uma pasta "Chaves Não Devolvidas" para os alertas
   - Configure filtros automáticos

3. **Monitore os logs**:
   - Mantenha o servidor rodando
   - Verifique periodicamente se há chaves em atraso

---

## ❓ Dúvidas?

Para mais detalhes sobre os tutores e horários dos turnos:
- Veja `backend/utils/shiftTimes.js`
- Veja `backend/jobs/checkLateReturns.js`
- Veja `backend/jobs/scheduleNotifications.js`
