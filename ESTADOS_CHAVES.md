# 🔑 Documentação: Estados das Chaves no Painel

## 📋 Estados Válidos

O status de uma chave no painel pode ser um dos seguintes:

### 1. **RESERVADO** 📦 (`'reservado'`)
**Quando ocorre:**
- Reserva foi aprovada pelo admin
- Chave nunca foi retirada (primeira vez)
- Chave foi devolvida após ser retirada (volta ao estado anterior)

**Características:**
- Disponível para retirada
- Instrutor pode usar no seu horário
- Cor: Azul (ciano) - `.status-reserved`

**Histórico (`key_history`):**
- Sem registros: nunca foi retirada
- OU tem registro com `withdrawn_at` + `returned_at` preenchidos (devolvida)

**Exemplos:**
```
Cenarion 1: Primeiro uso
├─ Reserva aprovada: 2026-02-15
├─ key_history: VAZIO
└─ Status: 📦 RESERVADO ✅

Cenário 2: Depois de devolver
├─ Retirada em: 2026-02-15 10:00
├─ Devolvida em: 2026-02-15 11:00
├─ key_history: { withdrawn_at: 10:00, returned_at: 11:00 }
└─ Status: 📦 RESERVADO ✅ (disponível novamente)
```

---

### 2. **EM USO** 🔑 (`'withdrawn'`)
**Quando ocorre:**
- Instrutor retirou a chave via leitura de QRCode
- Chave ainda não foi devolvida

**Características:**
- Indisponível para outras retiradas
- Instrutor está usando a chave
- Cor: Laranja - `.status-withdrawn`

**Histórico (`key_history`):**
- Registro com `withdrawn_at` preenchido
- `returned_at` é NULL (vazio)

**Exemplos:**
```
Cenário: Chave em uso
├─ Retirada em: 2026-02-15 10:00
├─ Devolvida em: (ainda não devolvida)
├─ key_history: { withdrawn_at: 10:00, returned_at: NULL }
└─ Status: 🔑 EM USO ✅
```

---

### 3. **DEVOLVIDO** ✅ (`'returned'`)
**⚠️ NOTA IMPORTANTE:**
Este status é um registro histórico, não um estado de disponibilidade!
Quando uma chave é devolvida, ela volta para `'reservado'`, não fica como `'returned'`.

**Quando é usado:**
- Apenas no histórico (`key_history.status`)
- Para marcar que uma retirada específica foi concluída
- Não aparece no painel como status da chave

---

## 🔄 Máquina de Estados

```
┌─────────────┐
│             │
│ RESERVADO   │
│ (Disponível)│
│             │
└──────┬──────┘
       │ Instrutor retira (QRCode)
       ▼
┌──────────────┐
│              │
│ EM USO       │
│ (Em posse)   │
│              │
└──────┬───────┘
       │ Instrutor devolve (QRCode)
       ▼
┌─────────────┐
│             │
│ RESERVADO   │ ← VOLTA AO ESTADO INICIAL!
│ (Disponível)│
│             │
└─────────────┘
```

---

## 🛠️ Implementação Técnica

### Front-end (HTML/CSS)
**Arquivo:** [painel-ambientes.js](frontend/js/painel-ambientes.js)

```javascript
function getStatusLabel(keyStatus) {
  const statusMap = {
    'reservado': '📦 Reservado',    // Disponível para retirada
    'withdrawn': '🔑 Em uso',       // Em posse do instrutor
    'returned': '✅ Devolvido'      // ❌ NÃO DEVE APARECER NO PAINEL
  };
  return statusMap[keyStatus] || 'Desconhecido';
}

function getStatusClass(keyStatus) {
  const statusMap = {
    'reservado': 'status-reserved',     // Azul
    'withdrawn': 'status-withdrawn',    // Laranja
    'returned': 'status-returned'       // Verde (histórico)
  };
  return statusMap[keyStatus] || 'status-inactive';
}
```

### Back-end (Node.js)
**Arquivo:** [painelController.js](backend/controllers/painelController.js)

```javascript
let keyStatus = 'reservado'; // Default

const { data: history } = await supabase
  .from('key_history')
  .select('withdrawn_at, returned_at')
  .eq('key_id', res.key_id)
  .order('withdrawn_at', { ascending: false })
  .limit(1); // Último registro

if (history && history.length > 0) {
  const h = history[0];
  
  if (h.withdrawn_at && !h.returned_at) {
    // Retirada mas não devolvida
    keyStatus = 'withdrawn'; // 🔑 EM USO
  } else if (h.withdrawn_at && h.returned_at) {
    // Foi devolvida (volta ao estado anterior)
    keyStatus = 'reservado'; // 📦 RESERVADO (disponível novamente)
  }
  // Se nenhuma condição, mantém 'reservado' (nunca foi retirada)
}
```

---

## 📝 Banco de Dados

### Tabela: `key_history`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do registro |
| `key_id` | UUID | Chave envolvida |
| `instructor_id` | UUID | Instrutor que retirou |
| `withdrawn_at` | TIMESTAMP | Data/hora de retirada |
| `returned_at` | TIMESTAMP\|NULL | Data/hora de devolução (NULL se ainda em uso) |
| `status` | TEXT | 'active' ou 'returned' |
| `observation` | TEXT | Observações opcionais |

### Exemplos de Dados

**Cenário 1: Chave nunca foi retirada**
```
key_history: (vazio)
Status do painel: 📦 RESERVADO
```

**Cenário 2: Chave foi retirada e devolvida**
```
key_history:
| id | key_id | withdrawn_at | returned_at | status |
|----|--------|--------------|-------------|--------|
| 1  | xyz    | 10:00        | 11:00       | returned |

Status do painel: 📦 RESERVADO (voltou a estar disponível)
```

**Cenário 3: Chave foi retirada novamente (após devolução)**
```
key_history:
| id | key_id | withdrawn_at | returned_at | status |
|----|--------|--------------|-------------|--------|
| 1  | xyz    | 10:00        | 11:00       | returned |
| 2  | xyz    | 14:00        | NULL        | active   |

Status do painel: 🔑 EM USO (última retirada, sem devolução)
```

---

## ✅ Validação de Lógica

Para verificar se a lógica está correta, o painel deve mostrar:

### ✓ Correto
- [ ] Após aprovação da reserva: `📦 Reservado`
- [ ] Após retirada via QRCode: `🔑 Em uso`
- [ ] Após devolução via QRCode: `📦 Reservado` ✨ (VOLTA ao estado anterior)
- [ ] Se retirada novamente: `🔑 Em uso`

### ✗ Incorreto (Bug anterior)
- ❌ Após devolução, status permanecia como `✅ Devolvido`
- ❌ Não permitia retirada novamente

---

## 🐛 Bug Corrigido (b652cd2)

**Problema:**
```javascript
// ❌ CÓDIGO ANTIGO (ERRADO)
if (h.withdrawn_at && h.returned_at) {
  keyStatus = 'returned'; // Ficar como devolvido para sempre
}
```

**Solução:**
```javascript
// ✅ CÓDIGO NOVO (CORRETO)
if (h.withdrawn_at && h.returned_at) {
  keyStatus = 'reservado'; // Volta a estar disponível
}
```

---

## 📞 Referências

- **Sistema:** Chavesporto - Controle de Chaves
- **Commit de correção:** b652cd2
- **Data:** 2026-04-07
- **Arquivos afetados:** 
  - [backend/controllers/painelController.js](backend/controllers/painelController.js)
  - [frontend/js/painel-ambientes.js](frontend/js/painel-ambientes.js)
  - [database/schema.sql](database/schema.sql) (tabela key_history)
