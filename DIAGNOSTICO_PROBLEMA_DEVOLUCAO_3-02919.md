# 🔴 DIAGNÓSTICO: Problema de Devolução de Chave - Usuário 3-02919

## Resumo do Problema
Usuário 3-02919 não consegue devolver uma chave que retirou. A chave aparece como "indisponível" como se não fosse ele próprio que tivesse retirado.

---

## 🔍 Raiz do Problema Identificada

### Conflito entre RLS e JWT Customizado

**Localização:** `database/schema.sql` linhas 91-93

```sql
CREATE POLICY "Instructors can view their own history"
  ON key_history FOR SELECT
  USING (instructor_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
```

**O Problema:**
1. O sistema usa **JWT customizado** (gerado em `authController.js`)
2. A policy RLS usa **`auth.uid()`** que só funciona com Supabase Auth
3. Como não estamos usando Supabase Auth, `auth.uid()` retorna **NULL**
4. Então a query SELECT em `key_history` retorna 0 registros

**Fluxo do Erro:**
```
1. Usuário 3-02919 faz request com JWT customizado
2. Backend tenta: SELECT * FROM key_history WHERE key_id=X AND status='active'
3. RLS verifica: (instructor_id = auth.uid() [NULL] OR auth.jwt() ->> 'role' = 'admin')
4. Comparação fails: UUID ≠ NULL
5. Query retorna ZERO registros
6. Backend retorna erro: "Chave não possui registro de retirada ativa"
```

---

## 📍 Código Afetado

### Backend - `keyController.js` linha 540-560 (returnKey função)

```javascript
// ❌ PROBLEMA: Usando 'supabase' (anon key) ao invés de 'supabase.admin'
const { data: history } = await supabase
  .from('key_history')
  .select('*')                      // ← RLS policy bloqueia!
  .eq('key_id', id)
  .eq('status', 'active')
  .order('withdrawn_at', { ascending: false })
  .limit(1)
  .single();

// ❌ Retorna NULL porque RLS bloqueou
if (!history) {
  return res.status(400).json({
    success: false,
    message: 'Chave não possui registro de retirada ativa'  // ← Este erro!
  });
}
```

### RLS Policy Problemática - `schema.sql` linha 91-93

```sql
-- ❌ PROBLEMA: auth.uid() retorna NULL com JWT customizado
CREATE POLICY "Instructors can view their own history"
  ON key_history FOR SELECT
  USING (instructor_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
  
-- ✅ CORRETO seria comparar com a claim do JWT customizado:
-- USING (instructor_id = (auth.jwt() ->> 'id')::uuid OR auth.jwt() ->> 'role' = 'admin');
```

---

## 🛠️ Solução Recomendada

### Opção 1: Usar `supabase.admin` (RÁPIDA - 1 minuto)

Modificar `keyController.js` funções `returnKey`, `withdrawKey`, `getKey` para usar `supabase.admin` quando necessário:

```javascript
// Em returnKey (linha 548) - ANTES:
const { data: history } = await supabase
  .from('key_history')
  .select('*')
  .eq('key_id', id)
  .eq('status', 'active')
  .single();

// DEPOIS:
const { data: history } = await supabase.admin  // ← Adicionar .admin
  .from('key_history')
  .select('*')
  .eq('key_id', id)
  .eq('status', 'active')
  .single();
```

**Vantagens:**
- ✅ Rápido (bypasssa RLS no backend)
- ✅ Backend já valida autorização (linha 566)
- ✅ Sem quebra de segurança (validação dupla)

**Desvantagens:**
- ⚠️ RLS no Supabase fica ineficaz como segunda camada

---

### Opção 2: Corrigir RLS Policy (MELHOR - 5 minutos)

Atualizar as policies RLS para usar a claim `id` do JWT customizado:

```sql
-- Versão corrigida
CREATE POLICY "Instructors can view their own history"
  ON key_history FOR SELECT
  USING (
    instructor_id = (auth.jwt() ->> 'id')::uuid 
    OR auth.jwt() ->> 'role' = 'admin'
  );
```

**Vantagens:**
- ✅ RLS funciona corretamente
- ✅ Segunda camada de segurança eficaz
- ✅ Solução definitiva

**Passos:**
```sql
-- Supabase SQL Editor:
DROP POLICY "Instructors can view their own history" ON key_history;

CREATE POLICY "Instructors can view their own history - Fixed"
  ON key_history FOR SELECT
  USING (
    instructor_id = (auth.jwt() ->> 'id')::uuid 
    OR auth.jwt() ->> 'role' = 'admin'
  );

DROP POLICY "Users can insert history" ON key_history;

CREATE POLICY "Users can insert history - Fixed"
  ON key_history FOR INSERT
  WITH CHECK (
    instructor_id = (auth.jwt() ->> 'id')::uuid 
    OR auth.jwt() ->> 'role' = 'admin'
  );
```

---

## 🧪 Como Reproduzir o Problema

### Teste 1: Verificar RLS bloqueando

```bash
# Login com usuário 3-02919
cd frontend
# Abrir console do navegador (F12)

// Cole no console:
localStorage.getItem('token')  // Copiar JWT

# No backend, simular query direto:
curl -H "Authorization: Bearer <JWT_DO_USUARIO>" \
     -H "Accept: application/json" \
     "https://seu-supabase.co/rest/v1/key_history?key_id=eq.<KEY_ID>&status=eq.active" \
     -v 2>&1 | grep -i "error\|count"
```

### Teste 2: Verificar sem RLS (admin bypass)

```javascript
// No backend, linha 548 em keyController.js:

// Versão com RLS (atual - quebrada):
console.log('[RLS] Query iniciada...');
const { data: history1, error: err1 } = await supabase
  .from('key_history')
  .select('*')
  .eq('key_id', id)
  .eq('status', 'active')
  .limit(1)
  .single();
console.log('[RLS] Resultado:', history1 ? 'ENCONTROU' : 'NÃO ENCONTROU');

// Versão sem RLS (admin):
console.log('[ADMIN] Query iniciada...');
const { data: history2, error: err2 } = await supabase.admin
  .from('key_history')
  .select('*')
  .eq('key_id', id)
  .eq('status', 'active')
  .limit(1)
  .single();
console.log('[ADMIN] Resultado:', history2 ? 'ENCONTROU' : 'NÃO ENCONTROU');
```

---

## 📋 Checklist de Verificação Rápida

- [ ] Usuário 3-02919 consegue retirar chaves?
  - Se SIM → RLS está bloqueando SELECT de `key_history` na devolução
  - Se NÃO → Problema diferente (não é este)

- [ ] Admin consegue devolver chaves do usuário 3-02919?
  - Se SIM → Confirma que é problema de autorização (não validação)
  - Se NÃO → Problema diferente

- [ ] Testar: Qual é a mensagem de erro exata?
  ```
  ❌ "Chave não possui registro de retirada ativa" → É este problema
  ❌ "Apenas o usuário que retirou..." → Problema diferente (autorização)
  ❌ "Erro ao devolver chave" → Problema de banco de dados
  ```

---

## 📁 Arquivos Afetados a Modificar

### Opção 1 - Quick Fix (usar admin):
- [ ] `backend/controllers/keyController.js` - função `returnKey` (linha 548)
- [ ] `backend/controllers/keyController.js` - função `withdrawKey` (pode também usar admin)
- [ ] `backend/controllers/keyController.js` - função `getKey` (se usar SELECT em key_history)

### Opção 2 - Solução Correta:
- [ ] `database/schema.sql` - 4 policies de RLS em `key_history`
- [ ] Deploy atualizar RLS no Supabase

---

## 🚀 Próximos Passos Recomendados

1. **Imediato (5 min):** Aplicar Opção 1 (usar `supabase.admin`)
   - Resolve o problema do usuário 3-02919 agora
   - Teste: `node backend/scripts/test-return-as-instructor.js`

2. **Curto prazo (30 min):** Aplicar Opção 2 (corrigir RLS)
   - Torna a segurança mais robusta
   - Segundo layer de proteção eficaz

3. **Verificação:** Rodar testes de autorização após cada mudança
   ```bash
   node backend/scripts/test-unauthorized-return.js  # Deve rejeitar
   node backend/scripts/test-return-as-instructor.js # Deve aceitar
   ```

---

## 🔐 Impacto de Segurança

**Status Atual:** 🟡 DEGRADADO (RLS ineficaz)
- Backend valida corretamente ✅
- RLS não funciona com JWT customizado ❌
- Segunda camada de proteção não está operacional ❌

**Após Opção 1:** 🟢 SEGURO
- Backend valida ✅
- RLS ineficaz mas backend é suficiente ✅

**Após Opção 2:** 🟢 SEGURO + ROBUSTO
- Backend valida ✅
- RLS funciona ✅
- Duas camadas de proteção ✅

---

## 📞 Perguntas de Debug

Para o usuário reportar:

1. Qual exatamente é a mensagem de erro que aparece quando tenta devolver?
2. A chave foi retirada por ele mesmo (não por outro instrutor)?
3. Quanto tempo faz que retirou a chave?
4. Admin consegue devolver a chave dele?

