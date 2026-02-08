# 📧 Guia de Teste - Sistema de Alertas por Email

## Visão Geral

O sistema chavesporto agora envia **alertas automáticos de email** quando há chaves não devolvidas além do horário de expediente.

### Como Funciona:
1. **Job automático** que roda a cada 30 minutos
2. Detecta chaves com `status = 'active'` retiradas antes do horário de expediente (7:00)
3. Envia email para `ALERT_EMAIL` com detalhes da chave e instrutor responsável

---

## 🧪 Passo 1: Testar Configuração de Email

### 1.1 Configure as variáveis necessárias em `backend/.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-app-password-aqui
ALERT_EMAIL=admin@seine.com.br
```

**⚠️ Importante para Gmail:**
- Ative autenticação de 2 fatores
- Gere uma "App Password" em: https://myaccount.google.com/apppasswords
- Use aquela senha, NÃO sua senha do Gmail comum

### 1.2 Execute o script de teste:

```bash
cd backend
node scripts/teste-email.js
```

### 1.3 Esperado:
- ✅ Script verifica variáveis de ambiente
- ✅ Envia um email de teste simulado
- ✅ Você vê na console: `✅ EMAIL ENVIADO COM SUCESSO!`
- ✅ Email chega em alguns segundos na caixa de entrada (ou spam)

### Se falhar:
```
❌ Variáveis de ambiente faltando
❌ FALHA ao enviar email
❌ ERRO ao enviar email
```

**Soluções:**
1. Verifique `.env` foi salvo
2. Reinicie o terminal (variáveis de ambiente não recarregam)
3. Teste credenciais SMTP em: https://mailtester.com
4. Para Gmail: use App Password, não senha comum

---

## 🚀 Passo 2: Testar com Dados Reais

### 2.1 Simular chave não devolvida:

1. Acesse o painel admin: `http://localhost:3000/admin`
2. Faça login como admin
3. Na seção **Instrutores**, retire uma chave (QR Code)
4. **NÃO devolva** a chave

### 2.2 Aguarde verificação automática:

- Job executa **a cada 30 minutos** (ou imediatamente ao iniciar servidor)
- Logs: `[HH:MM:SS] 🔍 Verificando chaves não devolvidas...`

### 2.3 Forçar verificação imediata:

```bash
cd backend
node jobs/checkLateReturns.js
```

Isso executa uma verificação manual e envia emails se houver chaves em atraso.

---

## 📊 Verifying Email Environment Variables

Check:
```bash
# No backend/
node -e "require('dotenv').config(); console.log({
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  ALERT_EMAIL: process.env.ALERT_EMAIL,
  HAS_PASSWORD: !!process.env.SMTP_PASS
})"
```

---

## 🔧 Configurار diferentes provedores SMTP

### Gmail:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-app-password
```

### Outlook/Hotmail:
```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
```

### Servidor corporativo:
```
SMTP_HOST=seu-servidor-smtp.com
SMTP_PORT=587 (ou 465 para secure)
SMTP_USER=seu-usuario
SMTP_PASS=sua-senha
```

---

## ✅ Checklist de Funcionalidade

- [ ] Variáveis SMTP configuradas em `.env`
- [ ] Script `teste-email.js` retorna ✅
- [ ] Email de teste chega na caixa (verifique spam)
- [ ] Retirada uma chave SEM devolver
- [ ] Aguardou 30 minutos OU rodou `node jobs/checkLateReturns.js`
- [ ] Email de alerta chegou com informações da chave
- [ ] Email contém: nome instrutor, matrícula, email, chave, ambiente

---

## 📋 Logs para Monitorar

### Ao iniciar servidor:
```
📧 Email service iniciado - verificando devoluções em atraso a cada 30 minutos
```

### Ao verificar devoluções (a cada 30 min):
```
[HH:MM:SS] 🔍 Verificando chaves não devolvidas...
  📧 Enviando alerta para: Lab Python - Bloco A
     Instrutor: João Silva
     ✅ Email enviado para: admin@seine.com.br
✓ Verificação concluída
```

---

## 🚨 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Variáveis de ambiente faltando" | Configure SMTP_* e ALERT_EMAIL em backend/.env |
| "FALHA ao enviar email" | Verifique credenciais SMTP em https://mailtester.com |
| "Gmail: Senha incorreta" | Use App Password: https://myaccount.google.com/apppasswords |
| "Email não chega" | Verifique pasta spam, remetente confiável |
| "Job não roda ao iniciar" | Reinicie o servidor para recarregar .env |

---

## 📝 Notas Técnicas

- **Frequência**: Job executa a cada 30 minutos (configurável em `server.js`)
- **Critério**: Chaves com `status = 'active'` retiradas ANTES de 7:00
- **Horário**: Fixo em 7:00 (início do expediente)
- **Timezone**: Brasil (pode ser configurado em futuras versões)
- **Duplicação**: Emails podem ser enviados múltiplas vezes se chave não for devolvida

---

## 🔐 Segurança

✅ **Boas práticas implementadas:**
- Senhas SMTP nunca aparecem nos logs
- Credenciais armazenadas em `.env` (nunca em código)
- Email service otimizado para não sobrecarregar servidor
- Job pode ser desativado removendo variáveis SMTP

---

Para dúvidas aviso de erro, execute:
```bash
cd backend
npm run dev
```

E procure por logs com 📧 ou ❌ para diagnóstico.
