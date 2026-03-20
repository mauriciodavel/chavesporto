# 🔴 PROBLEMA: Devolução Bloqueada por RLS

## Sintomas
- ✅ Botão "Devolver" aparece corretamente
- ❌ Ao clicar e escanear QR Code: **"Não existe um registro de retirada ativo"**

## Raiz do Problema
O sistema **ainda está bloqueado pelas RLS policies** que usam `auth.uid()` (que retorna NULL com JWT customizado).

Fluxo:
```
1. Frontend envia POST /keys/{id}/return
2. Backend tenta: SELECT * FROM key_history WHERE status='active'
3. RLS verifica: instructor_id = auth.uid() [NULL] ← FALHA!
4. Query retorna 0 registros
5. Backend retorna: "Não existe um registro de retirada ativo"
```

---

## 🛠️ Solução Recomendada: Opção 1 (RÁPIDO - 5 min)

### Verificar se `SUPABASE_SERVICE_ROLE` está configurada em Produção

**O que é:**
- Chave de admin do Supabase que permite bypassar RLS
- Backend usa ela para queries que precisam de privilégios elevados

**Onde Verificar:**

#### Se usa Vercel:
```
Dashboard → Seu Projeto → Settings → Environment Variables
Procurar por: SUPABASE_SERVICE_ROLE
```

#### Se usa Railway:
```
Railway Dashboard → Seu Projeto → Variables
Procurar por: SUPABASE_SERVICE_ROLE
```

#### Se usa outro host:
```
Verificar no painel de variáveis de ambiente da plataforma
```

**Se NÃO estiver lá, adicione:**

```
Nome: SUPABASE_SERVICE_ROLE
Valor: <copie abaixo>
```

**Como obter o valor:**

1. Acesse Supabase Console: https://app.supabase.com
2. Selecione seu projeto
3. Settings → API
4. Procure por **"Service Role Key"** (lê "SECRET")
5. Copie o valor completo
6. Cole na variável de ambiente

**Após adicionar:**
- Redeploy sua aplicação
- Teste: Login → Tentar devolver chave
- ✅ Deve funcionar!

---

## 🛠️ Solução Alternativa: Opção 2 (MELHOR - Permanente)

### Corrigir as RLS Policies para usar JWT Customizado

**O que faz:**
- Faz RLS funcionar com seu JWT customizado
- Segunda camada de segurança ativada
- Não depende de `SUPABASE_SERVICE_ROLE`

**Como Aplicar:**

1. **Abra Supabase SQL Editor:**
   - https://app.supabase.com/project/[seu-projeto-id]/sql/new

2. **Cole o SQL:**
   ```sql
   -- Copie todo o conteúdo de CORRIGIR_RLS_POLICIES.sql
   -- E cole no SQL Editor
   ```

3. **Execute o SQL:**
   - Botão "Run" ou Ctrl+Enter

4. **Pronto!** RLS agora funciona com JWT customizado

---

## 📋 Qual Solução Escolher?

| Aspecto | Opção 1 | Opção 2 |
|--------|---------|---------|
| **Tempo** | 5 min | 5 min |
| **Complexidade** | Muito fácil | Muito fácil |
| **Segurança** | ✅ Boa | ✅ Melhor |
| **Recomendado** | ✅ Se já foi usado antes | ✅ Melhor opção |
| **Robustez** | Depende de env var | Independente |

**Recomendação:** Faça **AMBAS**:
1. Adicione `SUPABASE_SERVICE_ROLE` em produção (é essencial ter mesmo assim)
2. Aplique a correção RLS (segunda camada)

---

## 🧪 Como Testar Após Aplicar

### Teste Imediato (Opção 1 ou 2)

```bash
# 1. Login como usuário 3-02919
# 2. Dashboard → Chaves Disponíveis
# 3. Ver chave em "Sua Reserva" com status "Em uso"
# 4. Clicar em "Devolver"
# 5. Escanear QR Code

✅ Esperado: "✓ Chave devolvida com sucesso!"
❌ Antes: "Não existe um registro de retirada ativo"
```

### Teste de Segurança (Verificar Autorização)

```bash
# 1. Usando curl ou Postman, testar se outro instrutor consegue devolver

curl -X POST "https://seu-backend.com/api/keys/{keyId}/return" \
  -H "Authorization: Bearer <JWT_DE_OUTRO_INSTRUTOR>" \
  -H "Content-Type: application/json" \
  -d '{}'

✅ Esperado: 403 Forbidden - "Apenas o usuário que retirou..."
```

---

## 📁 Arquivo para Aplicar Opção 2

Arquivo: [CORRIGIR_RLS_POLICIES.sql](CORRIGIR_RLS_POLICIES.sql)

Contém:
- SQL para remover policies antigas
- SQL para criar policies novas com JWT customizado
- Verificação para confirmar que funcionou

---

## 🚀 Deploy Após Aplicar Correções

```bash
# Se aplicou Opção 1 (env var):
# 1. Redeploy da aplicação (geralmente automático)
# 2. Aguardar 2-3 minutos

# Se aplicou Opção 2 (SQL):
# 1. Executar SQL no Supabase Console
# 2. Não precisa redeploy! Está em produção já
# 3. Testar imediatamente

# Se aplicou AMBAS:
# Melhor ainda! Máxima redundância
```

---

## ⚠️ Se Continuar Não Funcionando

### Debug 1: Verificar se SQL foi executado
```sql
-- Execute no Supabase SQL Editor:
SELECT policyname, qual, definition 
FROM pg_policies 
WHERE tablename = 'key_history';

-- Deve retornar policies com "Fixed" no nome
-- Se retornar policies antigas (com auth.uid()), repita o SQL
```

### Debug 2: Verificar variável de ambiente
```bash
# No host (Vercel, Railway, etc):
# Confirme que SUPABASE_SERVICE_ROLE está com valor (não vazio)
# Se vazio, copie novamente da Supabase Console
```

### Debug 3: Verificar logs do backend
```
Procurar por:
✅ "Histórico atualizado com sucesso"
✅ "Chave marcada como disponível"
❌ Erros de RLS ou banco de dados
```

### Debug 4: Teste direto no SQL Editor
```sql
-- Simular query da devolução:
SELECT * FROM key_history 
WHERE key_id = '<ID_DA_CHAVE>' 
AND status = 'active';

-- Deve retornar 1 registro se está correto
-- Se retornar 0, RLS ainda está bloqueando
```

---

## 📞 Próximos Passos

1. **Agora:** Escolha Opção 1 ou 2 e aplique
2. **Depois:** Teste com usuário 3-02919
3. **Se funcionar:** Teste com outros usuários
4. **Confirmar:** Admin consegue devolver chaves de qualquer um?

---

**Status:** 🟡 AGUARDANDO APLICAÇÃO DE UMA DAS SOLUÇÕES

