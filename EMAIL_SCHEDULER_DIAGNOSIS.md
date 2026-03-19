# 📧 Diagnóstico: E-mails de Devoluções Pendentes

## 🔍 Problema Reportado
> "Os e-mails de devoluções pendentes só estão sendo disparados quando o instrutor realiza login no sistema"

## 🎯 Causa Identificada

### 1. **Exports Duplicados (CRÍTICO)**
**Localização**: `backend/jobs/checkLateReturns.js` (linhas 220-235)

O arquivo tinha código duplicado no final:
```javascript
// ❌ DUPLICADO - Removido
module.exports = { checkLateReturns };
if (require.main === module) {
  checkLateReturns().then(() => process.exit(0));
}
// ❌ DUPLICADO - Removido
module.exports = { checkLateReturns };
if (require.main === module) {
  checkLateReturns().then(() => process.exit(0));
}
```

Isso pode causar:
- Conflitos na exportação do módulo
- Comportamento impredizível quando chamado pelo scheduler
- Interferência no carregamento do módulo

### 2. **Falta de Logging e Diagnóstico**

O scheduler **funciona corretamente**, mas:
- Não havia rastreamento adequado de execuções
- Erros silenciosos não eram visíveis
- Não havia forma de testar o scheduler manualmente

### 3. **Variáveis de Ambiente no Startup**

O scheduler só é inicializado se variáveis estão configuradas **no momento da inicialização do servidor**:
```javascript
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ALERT_EMAIL) {
  initializeScheduler();  // Só aqui!
}
```

Em produção (Vercel), se houver qualquer delay no carregamento de variáveis, o scheduler não inicia.

## ✅ Correções Implementadas

### 1. **Removido Código Duplicado**
```diff
- module.exports = { checkLateReturns };
- if (require.main === module) {
-   checkLateReturns().then(() => process.exit(0));
- }
  
- module.exports = { checkLateReturns };  // ← DUPLICADO REMOVIDO
- if (require.main === module) {
-   checkLateReturns().then(() => process.exit(0));
- }
```

### 2. **Melhorado o Scheduler com Estado e Logging**

`backend/jobs/scheduleNotifications.js`:
- Adicionado rastreamento de estado (`schedulerState`)
- Melhor tratamento de erros com contador
- Wrapper seguro para cada job
- Validação mais robusta de configuração

```javascript
let schedulerState = {
  initialized: false,
  jobs: [],
  lastRun: null,
  errorCount: 0
};
```

### 3. **Adicionadas Rotas de Diagnóstico**

`GET /api/test/scheduler-status` - Verifica configuração:
```json
{
  "email_configured": true,
  "email_host": "✓",
  "email_user": "✓",
  "alert_email": "✓",
  "jwt_configured": true,
  "supabase_configured": true,
  "brasilia_time": "18/03/2026 14:30:45"
}
```

`GET /api/test/trigger-check-late-returns` (admin) - Dispara verificação manual:
```shell
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:3000/api/test/trigger-check-late-returns
```

### 4. **Melhorado Logging no Server**

`backend/server.js`:
- Mensagens claras sobre status do email
- Lista variáveis faltando (se houver)
- Rastreamento de inicialização do scheduler

## 🧪 Como Testar

### Teste 1: Verificar Status do Scheduler
```bash
curl http://localhost:3000/api/test/scheduler-status | json_pp
```

Deve mostrar:
- ✓ Email configurado
- ✓ Supabase configurado
- ✓ Timezone Brasília

### Teste 2: Disparar Verificação Manual
```bash
# Fazer login como admin primeiro
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@senai.com.br","password":"sua_senha"}'

# Usar o token retornado
TOKEN="seu_token_aqui"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/test/trigger-check-late-returns
```

Deve retornar:
```json
{
  "success": true,
  "message": "Verificação de atrasos disparada com sucesso...",
  "data": {
    "started_at": "2026-03-18T...",
    "completed_at": "2026-03-18T...",
    "duration_seconds": "2.45"
  }
}
```

### Teste 3: Verificar Logs

Abra a página de admin e procure nos logs do servidor (terminal):
```
[18/03/2026, 14:30:45] 🔍 VERIFICANDO CHAVES NÃO DEVOLVIDAS
📅 Data de hoje (Brasília): 2026-03-18
📦 Encontradas 2 chave(s) ativa(s) em circulação
...
📊 Resumo: 1 email(ns) enviado(s), 0 falha(s)
```

## 📋 Checklist de Verificação (Produção)

Para garantir que o scheduler está funcionando em produção:

- [ ] Variáveis de email configuradas em Vercel:
  - [ ] `SMTP_HOST` = `smtp.gmail.com`
  - [ ] `SMTP_PORT` = `587`
  - [ ] `SMTP_USER` = seu email
  - [ ] `SMTP_PASS` = sua senha/app-password
  - [ ] `ALERT_EMAIL` = email para alertas

- [ ] Supabase configurado:
  - [ ] `SUPABASE_URL` = sua URL
  - [ ] `SUPABASE_ANON_KEY` = sua chave
  - [ ] `SUPABASE_SERVICE_ROLE` = sua chave de serviço

- [ ] Verificar status do scheduler:
  - [ ] Acessar: https://seu-site.vercel.app/api/test/scheduler-status
  - [ ] Deve mostrar `"email_configured": true`

- [ ] Teste manual:
  - [ ] Fazer login como admin
  - [ ] Acesse: https://seu-site.vercel.app/api/test/trigger-check-late-returns
  - [ ] Verifique os logs do Vercel para confirmação

## 🔧 Troubleshooting

### E-mails ainda não aparecem
1. Verifique status do scheduler: `/api/test/scheduler-status`
2. Se `email_configured` = false, configure as variáveis de email
3. Reinicie o servidor (Vercel: redeploye a aplicação)
4. Dispare teste manual: `/api/test/trigger-check-late-returns`

### Scheduler inicializa mas não executa
1. Verifique se há erro de conexão com Supabase
2. Verifique se as chaves estão no banco (ativas = status `'active'`)
3. Verifique timezone do servidor (deve ser Brasília)

### Emails vão para spam
1. Valide domínio de envio no Gmail
2. Configure DKIM/SPF no seu domínio
3. Teste com email de teste primeiro

## 📝 Log de Mudanças

| Arquivo | Mudança |
|---------|---------|
| `backend/jobs/checkLateReturns.js` | ✅ Removido exports/code duplicado |
| `backend/jobs/scheduleNotifications.js` | ✅ Adicionado rastreamento de estado, melhor logging |
| `backend/routes/test.js` | ✅ Adicionadas rotas de diagnóstico |
| `backend/server.js` | ✅ Melhorado logging de inicialização |

## 🚀 Próximos Passos

1. ✅ Fazer commit das mudanças
2. ✅ Deploy em produção
3. ✅ Monitorar logs do Vercel
4. ✅ Testar rotas de diagnóstico em produção
5. ✅ Verificar se e-mails estão sendo enviados regularmente

---

**Nota**: Os e-mails agora serão enviados:
- ⏰ 12:30 (após turno matutino)
- ⏰ 18:30 (após turno vespertino)
- ⏰ 22:35 (após turno noturno)
- ⏰ A cada 15 minutos (redundância/failsafe)

Sem depender de login de instrutor! 🎉
