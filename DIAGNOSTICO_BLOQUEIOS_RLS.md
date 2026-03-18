# 🔴 Erro de RLS ao Criar Bloqueios em Produção

## Problema
```
error: "new row violates row-level security policy for table \"calendar_blockouts\""
```

Ao tentar criar bloqueios de calendário em produção, retorna erro 500 de RLS (Row Level Security).

---

## Causa

A tabela `calendar_blockouts` tem uma política RLS que verifica:

```sql
CREATE POLICY "Only admins can create blockouts"
  ON calendar_blockouts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

**O Problema**: Essa política está verificando o JWT do usuário autenticado, mas quando o backend cria bloqueios via `supabase.admin` (service_role), não há um JWT de usuário para verificar. A política acaba rejeitando a operação mesmo com service_role.

---

## Solução (Passo a Passo)

### 1️⃣ Verificar se SUPABASE_SERVICE_ROLE está configurada em produção

Execute o script de diagnóstico:

```bash
cd backend
node scripts/test-blockout-rls.js
```

Se receber mensagem **"SUPABASE_SERVICE_ROLE não configurada"**, você precisa:

- Acessar: https://app.supabase.com/project/[seu-projeto]/settings/api
- Copiar a **SERVICE ROLE KEY**
- Configurar em produção (Vercel, Railway, etc):
  ```
  SUPABASE_SERVICE_ROLE=sua_service_role_key_aqui
  ```
- Reiniciar o servidor

### 2️⃣ Se SERVICE_ROLE está configurada mas ainda falha

A política RLS `"Only admins can create blockouts"` está bloqueando a operação. Você precisa:

**No Dashboard Supabase (Web):**

1. Acesse sua tabela `calendar_blockouts`
2. Vá para **Authentication → Policies**
3. Procure por: `"Only admins can create blockouts"`
4. **Remova essa política** (ou edite para permitir service_role)

**Comando SQL Alternativo** (execute no SQL Editor do Supabase):

```sql
-- Remover a política que está bloqueando
DROP POLICY IF EXISTS "Only admins can create blockouts" ON calendar_blockouts;

-- Se precisar de uma new policy que funcione com service_role:
CREATE POLICY "Admins can create blockouts"
  ON calendar_blockouts FOR INSERT
  WITH CHECK (
    -- Permitir se for admin via JWT OU se for service_role
    auth.jwt() ->> 'role' = 'admin' 
    OR auth.role() = 'service_role'
  );
```

---

## Por que funciona em dev mas não em produção?

- **Dev**: RLS provavelmente está desabilitada  
  → Qualquer client consegue inserir

- **Produção**: RLS está habilitada  
  → Política está rejeitando porque JWT não tem 'role' = 'admin'

---

## Resumo das Correções Aplicadas

✅ **backend/config/supabase.js**
- Adicionado aviso se SERVICE_ROLE não estiver configurada
- Removido fallback silencioso que usava cliente regular
- Agora retorna erro claro se SERVICE_ROLE não existir

✅ **backend/controllers/blockoutController.js**
- Adicionado logging detalhado de erro de RLS
- Mostra qual a política que está rejeitando
- Identifica se é problema de SERVICE_ROLE ou de política

✅ **backend/scripts/test-blockout-rls.js**
- Novo script para diagnosticar problemas de RLS
- Testa inserção/deleção com service_role
- Fornece soluções específicas

---

## Checklist de Resolução

- [ ] Executar `node scripts/test-blockout-rls.js`
- [ ] Se SERVICE_ROLE não configurada: configurar em produção
- [ ] Se erro de RLS persistir: remover política no Supabase
- [ ] Reiniciar servidor
- [ ] Testar criação de bloqueio novamente

