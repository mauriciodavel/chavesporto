# ⚡ QUICK REFERENCE: Sistema de Devolução de Chaves

## 🎯 Em uma linha

**POST /api/keys/{keyId}/return** permite que um instrutor devolva uma chave IF o mesmo instrutor que a retirou; admins podem devolver chaves de qualquer um.

---

## 📍 Verificação Crítica

```javascript
// backend/controllers/keyController.js - linha 566
if (history.instructor_id !== userId && userRole !== 'admin') {
  return 403;  // NEGADO - Não é o dono nem admin
}
```

**Regra:** `owner_id == my_id OR my_role == 'admin'`

---

## 🔑 Componentes Principais

| Componente | Arquivo | Função |
|-----------|---------|--------|
| **Endpoint** | `backend/routes/keys.js` | `POST /:id/return` |
| **Lógica** | `backend/controllers/keyController.js` | `exports.returnKey()` |
| **Auth** | `backend/middleware/auth.js` | `verifyToken()` |
| **Frontend** | `frontend/js/dashboard.js` | `confirmReturn()` |
| **Database** | `database/schema.sql` | `key_history` table |

---

## 🔄 Fluxo Rápido

```
1. Usuario clica "Devolver"
   ↓
2. POST /api/keys/{id}/return + JWT Token
   ↓
3. Backend verifica:
   a) Token é válido? (JWT decode)
   b) Registro ativo existe? (key_history status='active')
   c) É o dono OU admin? (instructor_id == userId)
   ↓
4. Se OK → UPDATE key_history (status='returned')
          → UPDATE keys (status='available')
          → 200 OK
   ↓
5. Se ERRO → 400/403/500 + mensagem
   ↓
6. Frontend atualiza (auto-refresh 15s)
```

---

## 🚫 Rejeições Possíveis

```
400 Bad Request
  └─ "Chave não possui registro de retirada ativa"
    (tentativa de devolver chave não retirada ou já devolvida)

403 Forbidden
  └─ "Apenas o usuário que retirou a chave ou um administrador..."
    (instrutor tentando devolver chave de outro)

401 Unauthorized
  └─ "Token não fornecido" ou "Token inválido"
    (problemas com autenticação JWT)

500 Internal Server Error
  └─ "Erro ao devolver chave"
    (erro no banco de dados)
```

---

## 👤 Como Identifica o "Dono"

```
Retirada (withdrawKey):
  instructor_id = token.user.id
  └─ Salvo em key_history.instructor_id

Devolução (returnKey):
  userId = token.user.id
  ↓
  if (history.instructor_id == userId)
    ✅ Permitido (é o dono)
  else if (userRole == 'admin')
    ✅ Permitido (é admin)
  else
    ❌ Negado 403
```

---

## 💾 Banco de Dados

### key_history
```sql
-- Ao retirar:
INSERT INTO key_history {
  id, key_id, instructor_id, withdrawn_at, status='active', ...
}

-- Ao devolver:
UPDATE key_history SET {
  returned_at = now(), status='returned', observation=?
} WHERE id = X
```

### keys
```sql
-- Ao retirar:
UPDATE keys SET status = 'in_use'

-- Ao devolver:
UPDATE keys SET status = 'available'
```

---

## 🔐 RLS (Row Level Security)

**Status:** ✅ Ativada, mas **não é primeira linha de defesa**

**Backend valida tudo** - RLS é backup

```sql
Política em SELECT:
  (instructor_id = auth.uid() OR auth.jwt()->'role' = 'admin')

Policy em INSERT/UPDATE:
  (true) -- Backend valida
```

---

## 🧪 Testar Localmente

```bash
# Admin devolvendo chave
node backend/scripts/test-return-key.js

# Instrutor devolvendo sua chave
node backend/scripts/test-return-as-instructor.js

# Instrutor tentando devolver chave de outro (expecta 403)
node backend/scripts/test-unauthorized-return.js

# Ciclo completo: retirada + devolução
node scripts/test-complete-cycle.js
```

---

## 📋 Checklist de Segurança

- [x] JWT Token obrigatório
- [x] Verificação de propriedade (instructor_id == userId)
- [x] Admin overrride habilitado
- [x] Histórico ativo validado (não pode devolver 2x)
- [x] RLS como segunda camada
- [x] Observação restrita a admin
- [x] Testes de autorização
- [ ] Logs detalhados de rejeições (em TODO)
- [ ] Auditoria de quem devolveu (parcial via key_history)

---

## 🔗 Mensagens Importantes

| Mensagem | Significa |
|----------|-----------|
| "Chave não possui registro de retirada ativa" | Chave nunca foi retirada ou já foi devolvida |
| "Apenas o usuário que retirou... pode devolvê-la" | Outro instrutor tentou devolver |
| "Token não fornecido" | Falta Authorization header |
| "Token inválido" | JWT expirado ou com assinatura ruim |

---

## 🎬 Estado Final (Após Devolução)

```
key.status = 'available'           ← Pode retirar novamente
key_history.status = 'returned'    ← Registro fechado
key_history.returned_at = timestamp ← Quando devolveu
key_history.observation = "..."     ← Se admin preencheu

Frontend:
├─ Modal fecha
├─ Chave sai do filtro "Em atraso"
├─ Reaparece em "Disponíveis"
└─ Auto-refresh acontece em 15s
```

---

## 🚨 Casos de Teste Críticos

```bash
# DEVE PASSAR (✅ = esperado funcionar)
POST /keys/abc123/return  [token: João] 
  where João retirou → 200 OK ✅

POST /keys/abc123/return  [token: Admin]
  where João retirou → 200 OK ✅

POST /keys/xyz789/return  [token: João]
  where xyz789 nunca foi retirado → 400 Bad Request ✅

# DEVE FALHAR (❌ = esperado rejeitar)
POST /keys/abc123/return  [token: Maria]
  where João retirou → 403 Forbidden ❌

POST /keys/abc123/return  [token: expired-jwt]
  → 401 Unauthorized ❌

POST /keys/abc123/return  [token: João]
  twice (já devolvida) → 400 Bad Request ❌
```

---

## 📞 Debug Rápido

**"É seguro deixar usuário devolver?"**
```
Não por frontend - sim por backend
├─ Frontend pode ser contornado (DevTools)
└─ Backend valida SEMPRE (instructor_id check)
```

**"Admin sempre consegue devolver?"**
```
Sim
└─ Condição: userRole == 'admin' contorna propriedade
```

**"Pode devolver chave que nunca retirou?"**
```
Não
└─ Validação: history.status = 'active' required
             Se não existe → 400 Bad Request
```

**"RLS está ajudando ou bloqueando?"**
```
Ajudando (como backup)
├─ RLS configurada para SELECT
├─ Mas não bloqueia UPDATE de devolução
├─ Backend é defesa primária
└─ RLS é segunda camada
```

---

## 📚 Arquivos Relacionados Obrigatórios

1. **EXPLORACAO_SISTEMA_DEVOLUCAO.md** ← Documentação completa
2. **DIAGRAMAS_DEVOLUCAO_CHAVES.md** ← Fluxogramas visuais
3. **ARCHITECTURE.md** ← Arquitetura geral
4. **RLS_ANALISE_PRODUCAO.md** ← Detalhes de segurança RLS

---

## ✨ TLDR (Too Long; Didn't Read)

1. **Endpoint:** `POST /api/keys/{id}/return`
2. **Autorização:** `history.instructor_id == req.user.id OR admin`
3. **Backend valida tudo** (Frontend não é confiável)
4. **Resposta:** 200 OK ou 400/403/500 erro
5. **Testes:** Rode `test-unauthorized-return.js` para confirmar rejeição

---

Generated: 2026-03-20  
Last Updated: Exploratory Analysis Complete ✅

