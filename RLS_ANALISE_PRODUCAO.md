# 🔓 RLS Desabilitado - Análise e Recomendações

## O que aconteceu

1. ✅ Configurou `SUPABASE_SERVICE_ROLE` no Vercel
2. ❌ Continuou recebendo erro: `violates row-level security policy`
3. ✅ Desabilitou RLS no Supabase e funcionou

**Causa:** As políticas de RLS foram criadas de forma a **bloquear até mesmo o `service_role`**, que deveria contornar as regras.

---

## Análise das Políticas RLS Problemáticas

### Política que estava bloqueando (calendar_blockouts)

```sql
-- ❌ PROBLEMA: Verifica JWT mesmo com service_role
CREATE POLICY "Only admins can create blockouts"
  ON calendar_blockouts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

**Por que falhou:**
- O backend usa `service_role` (não há sessão de usuário/JWT)
- `auth.jwt()` retorna `NULL` quando não há JWT
- A condição `NULL = 'admin'` é sempre `FALSE`
- ❌ Bloqueado mesmo com service_role

---

## Soluções Possíveis

### Opção 1: RLS Desabilitada (Atual ✅)
**Segurança:** ⚠️ Baixa
**Performance:** ⚡ Alta

```sql
ALTER TABLE calendar_blockouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE key_reservations DISABLE ROW LEVEL SECURITY;
```

**Quando usar:** Desenvolvimento / prototipagem rápida

---

### Opção 2: RLS com Exceção para Service Role (Recomendado)
**Segurança:** 🟢 Alta
**Performance:** ⚡ Alta

```sql
-- Para INSERT: Permitir admin ou service_role
CREATE POLICY "Permitir criação para admins e service_role"
  ON calendar_blockouts FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'  -- Via JWT (frontend/user)
    OR auth.role() = 'service_role'   -- Via backend
  );

-- Para UPDATE/DELETE: Mesmo padrão
CREATE POLICY "Permitir modificação para admins e service_role"
  ON calendar_blockouts FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );
```

---

### Opção 3: RLS Habilitada mas Sem Policies Restritivas
**Segurança:** 🟡 Média
**Performance:** ⚡ Alta

```sql
-- Apenas SELECT disponível para todos
CREATE POLICY "Qualquer um pode visualizar"
  ON calendar_blockouts FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE apenas via service_role (backend)
CREATE POLICY "Apenas backend pode modificar"
  ON calendar_blockouts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

---

## Recomendação para Produção

### 🟢 Implementar Opção 2 (Service Role Awareness)

**Passo a passo:**

1. **Reabilitar RLS:**
```sql
ALTER TABLE calendar_blockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_reservations ENABLE ROW LEVEL SECURITY;
```

2. **Remover políticas antigas:**
```sql
DROP POLICY IF EXISTS "Only admins can create blockouts" ON calendar_blockouts;
DROP POLICY IF EXISTS "Only admins can update blockouts" ON calendar_blockouts;
DROP POLICY IF EXISTS "Only admins can delete blockouts" ON calendar_blockouts;
```

3. **Criar novas políticas com service_role aware:**
```sql
-- SELECT: Todos podem visualizar
CREATE POLICY "Everyone can view blockouts"
  ON calendar_blockouts FOR SELECT
  USING (true);

-- INSERT: Admin via JWT ou service_role via backend
CREATE POLICY "Admins and service_role can create"
  ON calendar_blockouts FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );

-- UPDATE
CREATE POLICY "Admins and service_role can update"
  ON calendar_blockouts FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );

-- DELETE
CREATE POLICY "Admins and service_role can delete"
  ON calendar_blockouts FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );
```

4. **Fazer o mesmo para key_reservations:**
```sql
-- Similar às políticas acima para calendar_blockouts
```

---

## Status Atual (DESENVOLVIMENTO)

| Tabela | RLS | Estado |
|--------|-----|--------|
| calendar_blockouts | ❌ Desabilitada | ✅ Funciona |
| key_reservations | ❌ Desabilitada | ✅ Funciona |
| Outras tabelas | ❌ Desabilitada | ✅ Funciona |

**Segurança:** ⚠️ Qualquer um pode acessar dados diretamente no Supabase se souber a chave de acesso

---

## Checklist para Produção

- [ ] Reabilitar RLS em todas as tabelas
- [ ] Criar policies com suporte a `auth.role() = 'service_role'`
- [ ] Testar com `SUPABASE_SERVICE_ROLE` configurada
- [ ] Testar com JWT de usuário comum (não deve ter acesso)
- [ ] Testar com Anon key (deve ter apenas acesso SELECT)
- [ ] Documentar todas as policies criadas

---

## Verificar Políticas Atuais

```sql
-- Ver todas as policies da tabela
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'calendar_blockouts';
```

---

## Links Úteis

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [auth.role() vs auth.jwt()](https://supabase.com/docs/guides/auth/row-level-security#policies-with-security-roles)
- [Service Role Key Usage](https://supabase.com/docs/guides/auth/service-role-key)

