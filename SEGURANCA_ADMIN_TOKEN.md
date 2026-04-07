# 🔐 Segurança - Token de Autenticação Admin

## Resumo das Melhorias

Implementadas **3 medidas críticas de segurança** para proteção de tokens admin no painel:

---

## 1️⃣ **sessionStorage em vez de localStorage**

### ❌ Problema Anterior
```javascript
// ❌ INSEGURO: localStorage persiste dados mesmo após fechar navegador
localStorage.setItem('painel_admin_token', token);
```

**Riscos:**
- ✗ localStorage persiste entre abas/dispositivos
- ✗ Vulnerável a XSS (Cross-Site Scripting)
- ✗ Token fica acessível indefinidamente se alguém rouba o navegador
- ✗ Sincroniza em múltiplas abas/janelas (risco de exposição)

### ✅ Solução Implementada
```javascript
// ✅ SEGURO: sessionStorage limpa ao fechar aba/navegador
sessionStorage.setItem('painel_admin_token', token);
```

**Benefícios:**
- ✓ Limpa automaticamente ao **fechar a aba/navegador**
- ✓ Isolado por aba (não sincroniza entre abas)
- ✓ Não persiste entre sessões
- ✓ Reduz janela de vulnerabilidade a XSS

**Como funciona:**
| Ação | localStorage | sessionStorage |
|------|-------------|----------------|
| Fechar aba | Persiste | ❌ Limpa |
| Recarregar página | Persiste | ✓ Mantém |
| Fechar navegador | Persiste | ❌ Limpa |
| Nova aba | Acessível | ❌ Não acessível |

---

## 2️⃣ **Timeout de Inatividade (10 minutos)**

### ✅ Implementação

O sistema monitora **atividade do usuário**:

```javascript
// Eventos monitorados
const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

// Se inativo por 10 minutos → logout automático
setTimeout(() => {
  logoutAdmin(); // Remove token e desconecta
}, 10 * 60 * 1000);
```

**O que redefine o timer:**
- ✓ Cliques do mouse
- ✓ Digitação (teclas)
- ✓ Scroll na página
- ✓ Touch (mobile)

**O que NÃO redefine:**
- ✗ Abrir console (F12)
- ✗ Debruçar-se sobre teclado
- ✗ Apenas olhar a página
- ✗ Deixar aba em background (se não há interação)

### Fluxo de Inatividade

```
Admin faz login
    ↓
resetInactivityTimer() inicia contagem de 10 min
    ↓
Admin faz uma ação (clique, digitação, etc)
    ↓
Timer reseta → nova contagem de 10 min começa
    ↓
... (repete enquanto há atividade) ...
    ↓
10 MINUTOS PASSAM SEM ATIVIDADE
    ↓
setTimeout callback executa
    ↓
logoutAdmin() ← Token deletado
    ↓
Exibe mensagem: "⏱️ Sessão expirada por inatividade"
    ↓
Admin volta ao modo de visualização (sem admin)
```

### Exemplo de Console

```javascript
// Login
🔐 Token salvo em sessionStorage (limpa ao fechar aba)
✅ Modo admin ativado - Timer de inatividade iniciado (10 min)

// Após clique
🔐 Monitoramento de inatividade configurado (10 min)

// Após 10 min inativo
⏱️ Timeout de inatividade atingido - fazendo logout...
⏱️ Sessão expirada por inatividade (10 min). Faça login novamente.
✅ Modo admin desativado
```

---

## 3️⃣ **Limpeza de Token em Logout**

### ✅ Implementação

Ao fazer logout:

```javascript
function logoutAdmin() {
  // Remover token de sessionStorage
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  
  // Limpar timer de inatividade
  clearTimeout(inactivityTimer);
  
  // Resetar variáveis globais
  adminToken = null;
  isAdminMode = false;
}
```

**Garante:**
- ✓ Token é **completamente removido** ao logout
- ✓ Não há token "fantasma" em sessionStorage
- ✓ Timer não continua rodando desnecessariamente
- ✓ Modo admin é desativado imediatamente

---

## 📋 Checklist de Segurança Visual

### ✅ Implementadas

- [x] sessionStorage para token admin (em vez de localStorage)
- [x] Timeout de inatividade de 10 minutos
- [x] Monitoramento de atividade do usuário
- [x] Limpeza completa ao logout
- [x] Limpeza automática ao timeout
- [x] Logs de segurança no console
- [x] Remove token ao fechar aba/navegador

### 🔄 Próximas Melhorias (Futuro)

- [ ] Refresh de token (renovar auth antes de expirar)
- [ ] HTTP-only cookies (backend, mais seguro que sessionStorage)
- [ ] CSRF protection
- [ ] Rate limiting em endpoints de login
- [ ] Logging de acesso admin para auditoria
- [ ] 2FA (Two-Factor Authentication)
- [ ] Device fingerprinting

---

## 🧪 Como Testar

### Teste 1: sessionStorage
```javascript
// 1. Login como admin
// 2. Abrir DevTools (F12)
// 3. Ir para Application → Session Storage
// ✓ Ver token em "painel_admin_token"
// 4. Fechar aba
// 5. Voltar ao DevTools
// ✗ Token desapareceu (limpou!)
```

### Teste 2: Timeout de Inatividade
```javascript
// 1. Login como admin
// 2. Abrir console (F12)
// 3. NÃO fazer nada por 10 minutos
// 4. Após 10 minutos:
// ⏱️ Mensagem aparece: "Sessão expirada por inatividade"
// ✗ Botão de remover desaparece (logout automático)
```

### Teste 3: Refresh de Token
```javascript
// 1. Login como admin
// 2. Fazer cliques/digitações durante os 10 minutos
// ✓ Timer continua resetando
// 3. Parar de fazer atividade
// ⏱️ Após 10 minutos → logout
```

---

## 🔒 Diferença Entre localStorage e sessionStorage

```
localStorage                    sessionStorage
─────────────────────────────  ─────────────────────────────
Persiste entre sessões         Limpa ao fechar aba
Sync entre abas                Isolado por aba
Vulnerável a furto             Mais seguro
Ideal: dados não-sensíveis     Ideal: tokens/auth
Exemplo: preferências          Exemplo: token admin
```

---

## 📝 Variáveis Globais de Segurança

```javascript
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
let inactivityTimer = null;                 // Timer ID
let lastActivityTime = Date.now();          // Último evento
```

---

## 🎯 Resumo de Segurança

| Medida | Risco Mitigado | Implementado |
|--------|----------------|--------------|
| sessionStorage | XSS, furto de navegador | ✅ |
| Timeout 10min | Sessão abandonada exposta | ✅ |
| Monitoramento de atividade | Logout desnecessário de usuário ativo | ✅ |
| Limpeza em logout | Token residual | ✅ |
| Remove ao fechar aba | Sessão persistente | ✅ |

---

**Data de Implementação:** 07/04/2026  
**Status:** 🟢 Ativo em Produção  
**Próxima Revisão:** Após implementação de HTTP-only cookies
