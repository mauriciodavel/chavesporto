# 🗄️ EXECUTAR SQL MIGRATION NO SUPABASE

## 🔴 CRÍTICO: Este passo deve ser executado antes de testar bloqueios

---

## Passo 1: Acessar Supabase

### Via Web
1. Acesse: https://supabase.com/dashboard
2. Faça login com suas credenciais
3. Selecione seu projeto "chavesporto"

---

## Passo 2: Abrir SQL Editor

```
No dashboard:
1. Menu esquerdo → SQL Editor
2. Ou direto: https://supabase.com/dashboard/project/[seu-projeto]/sql
```

---

## Passo 3: Copiar SQL Query

### Query a ser executada:

```sql
-- Adicionar coluna reservation_type para rastrear bloqueios
ALTER TABLE key_reservations 
ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'normal';

-- Adicionar constraint para garantir valores válidos  
ALTER TABLE key_reservations 
ADD CONSTRAINT check_reservation_type 
CHECK (reservation_type IN ('normal', 'blockout'));

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_key_reservations_type_date 
ON key_reservations(reservation_type, reservation_start_date, reservation_end_date);
```

---

## Passo 4: Colar no SQL Editor

```
1. Clique no botão "+" para nova query
2. Nomeie: "004_add_reservation_type"
3. Cole o SQL acima
```

---

## Passo 5: Executar Query

```
1. Clique botão "Run" (play verde)
2. Ou pressione: Ctrl+Enter
```

---

## ✅ Verificações após execução

### Mensagem esperada
```
✓ Query executed successfully
```

### Se algo der errado

**Erro: "relation 'key_reservations' does not exist"**
→ Verifique o nome correto da tabela no Supabase

**Erro: "column 'reservation_type' already exists"**
→ Coluna já existe, pode ignorar (query usa IF NOT EXISTS)

**Erro: "constraint 'check_reservation_type' already exists"**
→ Constraint já existe, pode ignorar

---

## 🔍 Verificar se funcionou

### No Supabase:

1. Vá para: **Table Editor**
2. Selecione tabela: **key_reservations**
3. Procure pela coluna: **reservation_type**

**Você deve ver:**
```
Column name: reservation_type
Type: varchar(20)
Default: 'normal'
Nullable: false
```

---

## 📊 Testar a coluna

### Query de teste (opcional)

```sql
-- Ver todas as reservas e suas tipos
SELECT id, key_id, reservation_type, turma, shift 
FROM key_reservations 
LIMIT 5;
```

**Resultado esperado:**
```
id                                    | key_id | reservation_type | turma        | shift
--------------------------------------|--------|------------------|--------------|-------
394ee49c-63b1-470d-a4cd-edc0bade7ed0 | ...    | "normal"         | "HTC-DDS-29" | "...
44316fb2-1a7f-4832-a3e0-845ba21048b0 | ...    | "normal"         | "HTC-DDS-29" | "..."
```

---

## 🚀 Próximo Passo

Após executar a migration:

1. ✅ Volte ao navegador
2. ✅ Acesse: `http://localhost:3000/reservar-chave.html?admin=true`
3. ✅ Crie um bloqueio de teste
4. ✅ Verifique se calendário atualiza

---

## 💾 Backup da Query

### Arquivo de backup
O arquivo SQL também está salvo em:
```
chavesporto/database/004_add_reservation_type.sql
```

### Se precisar novamente
1. Abra arquivo no VS Code
2. Copie conteúdo
3. Cole no Supabase SQL Editor

---

## ⏱️ Tempo estimado

```
- Acessar Supabase: 30 segundos
- Abrir SQL Editor: 10 segundos
- Copiar/colar SQL: 20 segundos
- Executar: 5 segundos
- Verificar: 15 segundos
─────────────────────────
Total: ~1.5 minutos
```

---

## ✨ Após a Migration

### Sistema ativo para:

- ✅ Admin criar bloqueios
- ✅ Salvarem no banco com `reservation_type='blockout'`
- ✅ Usuários verem dias bloqueados
- ✅ Tooltips funcionarem
- ✅ Validação de conflitos ativa

---

## 📞 Troubleshooting

### Query não executa
```
→ Copie exatamente como está (SQL case-sensitive)
→ Verifique acentuação (sem caracteres especiais)
→ Tente executar linha por linha
```

### Migração anterior foi executada
```
→ Sem problema, queries usam IF NOT EXISTS
→ Pode executar de novo sem problemas
```

### Qual é o nome da tabela?
```
→ Verificar em Table Editor no Supabase
→ Screenshots mostram: key_reservations (NOT "reservations")
```

---

## 🎉 Após confirmar

**Parabéns!** Seu sistema de bloqueio está 100% operacional.

Proceda para: **GUIA_TESTE_BLOCKOUT.md**

