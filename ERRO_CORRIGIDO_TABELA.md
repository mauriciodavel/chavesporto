# 🔧 ERRO CORRIGIDO: "relation reservations does not exist"

## ❌ O Problema

Ao tentar executar o SQL migration no Supabase, você recebeu:
```
Error: Failed to run sql query: ERROR: 42P01: relation "reservations" does not exist
```

## 🔍 A Causa

O arquivo `database/004_add_reservation_type.sql` estava referenciando uma tabela chamada `reservations`, mas a tabela real no banco de dados é **`key_reservations`**.

```diff
- ALTER TABLE reservations
+ ALTER TABLE key_reservations
- ON reservations(...)
+ ON key_reservations(...)
```

## ✅ Solução

### Arquivo Correto
Use: **`database/004_add_reservation_type_CORRIGIDO.sql`**

Este arquivo agora referencia a tabela correta `key_reservations`.

### Como Aplicar no Supabase

1. Acesse: **https://app.supabase.com**
2. Entre no seu projeto
3. Vá para: **SQL Editor** (lado esquerdo)
4. Clique em: **+ New Query**
5. Abra o arquivo: `database/004_add_reservation_type_CORRIGIDO.sql`
6. Copie TODO o conteúdo
7. Cole no SQL Editor
8. Clique em: **▶ Run**

### SQL Correto (se preferir copiar direto)

```sql
-- Adicionar coluna reservation_type com valores: 'normal' ou 'blockout'
ALTER TABLE key_reservations
ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'normal' CHECK (reservation_type IN ('normal', 'blockout'));

-- Criar índice para buscar bloqueios rapidamente
CREATE INDEX IF NOT EXISTS idx_key_reservations_type_date 
ON key_reservations(reservation_type, reservation_start_date, reservation_end_date);

-- Comentário para documentação
COMMENT ON COLUMN key_reservations.reservation_type IS 'Tipo de reserva: normal = reserva de instrutor, blockout = bloqueio administrativo de ambiente';
```

## 🔧 Mudanças Feitas

### Backend
- ✅ `reservationController.js` - Corrigidas 3 referências de `from('reservations')` → `from('key_reservations')`

### Database
- ✅ `004_add_reservation_type.sql` - Atualizado com nome correto
- ✅ `004_add_reservation_type_CORRIGIDO.sql` - Versão final para usar

## ✨ Próximos Passos

1. Execute o SQL corrigido no Supabase
2. Reinicie o backend: `npm start`
3. Teste: `node scripts/test-blockout-creation.js`

## 📋 Verificação

Após executar o SQL, você pode verificar se funcionou com esta query no Supabase:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'key_reservations'
ORDER BY ordinal_position;
```

Você deve ver a coluna `reservation_type` com tipo `character varying` na lista.

---

**Status**: ✅ Corrigido e pronto para usar!
