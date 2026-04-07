# ✅ Guia de Teste: Correção de Status da Chave

## 🎯 Objetivo
Validar que o status da chave no painel está correto em cada etapa do ciclo de retirada e devolução.

---

## 📋 Pré-requisitos

- ✅ Sistema de reservas rodando
- ✅ Painel de ambientes acessível
- ✅ Reserva aprovada e visível no painel
- ✅ Leitor QRCode (ou simulação) disponível

---

## 🧪 Cenários de Teste

### Cenário 1: Reserva Aprovada (Nunca Retirada)

**Passos:**
1. Admin aprova uma reserva de chave
2. Aguarde a data de início da reserva
3. Abra o painel de ambientes no horário correto do turno
4. Procure a chave na tabela

**Resultado Esperado:**
```
Status: 📦 Reservado
Cor: Azul (status-reserved)
Observação: Chave nunca foi retirada
```

**Validação:**
- ✓ key_history: Vazio (sem registros)
- ✓ Front-end: `keyStatus = 'reservado'`
- ✓ Exibição: `getStatusLabel('reservado')` retorna "📦 Reservado"

---

### Cenário 2: Chave Retirada (Em Uso)

**Passos:**
1. Instrutor realiza leitura do QRCode (POST `/api/keys/:id/withdraw`)
2. Aguarde alguns segundos para propagação de dados
3. Recarregue o painel (F5) ou aguarde a auto-atualização (30s)
4. Procure a chave na tabela

**Resultado Esperado:**
```
Status: 🔑 Em uso
Cor: Laranja (status-withdrawn)
Observação: Chave foi retirada, ainda não devolvida
```

**Validação:**
```sql
SELECT withdrawn_at, returned_at FROM key_history 
WHERE key_id = 'xxx' 
ORDER BY withdrawn_at DESC 
LIMIT 1;

Resultado esperado:
withdrawn_at: 2026-04-07 10:45:23
returned_at:  NULL (vazio)
```

- ✓ Front-end: `keyStatus = 'withdrawn'`
- ✓ Exibição: `getStatusLabel('withdrawn')` retorna "🔑 Em uso"

---

### Cenário 3: Chave Devolvida (Volta para Reservado) ⭐ **TESTE CRÍTICO**

**Passos:**
1. Instrutor realiza leitura do QRCode novamente (POST `/api/keys/:id/return`)
2. Faz GET no endpoint `/api/keys/:id/return` com `returned_at` preenchido
3. Aguarde alguns segundos para propagação de dados
4. Recarregue o painel (F5) ou aguarde a auto-atualização (30s)
5. Procure a chave na tabela

**Resultado Esperado:** ❌ **ANTES DA CORREÇÃO**
```
Status: ✅ Devolvido        (❌ ERRADO)
Cor: Verde (status-returned)
```

**Resultado Esperado:** ✅ **DEPOIS DA CORREÇÃO**
```
Status: 📦 Reservado        (✅ CORRETO)
Cor: Azul (status-reserved)
Observação: Chave volta a estar disponível após devolução
```

**Validação:**
```sql
SELECT withdrawn_at, returned_at FROM key_history 
WHERE key_id = 'xxx' 
ORDER BY withdrawn_at DESC 
LIMIT 1;

Resultado esperado:
withdrawn_at: 2026-04-07 10:45:23
returned_at:  2026-04-07 11:15:00
```

- ✓ Front-end: `keyStatus = 'reservado'` (NOT 'returned')
- ✓ Exibição: `getStatusLabel('reservado')` retorna "📦 Reservado"
- ✓ CSS: Classe `status-reserved` aplicada (Azul)

---

### Cenário 4: Retirada Novamente (Após Devolução)

**Passos:**
1. Garantir que a chave foi devolvida (Cenário 3 completado)
2. Painel mostrando status "📦 Reservado"
3. Instrutor realiza nova leitura de QRCode (POST `/api/keys/:id/withdraw`)
4. Aguarde alguns segundos para propagação de dados
5. Recarregue o painel ou aguarde a auto-atualização

**Resultado Esperado:**
```
Status: 🔑 Em uso
Cor: Laranja (status-withdrawn)
Observação: Nova retirada após devolução
```

**Validação:**
```sql
SELECT withdrawn_at, returned_at FROM key_history 
WHERE key_id = 'xxx' 
ORDER BY withdrawn_at DESC 
LIMIT 1;

Resultado esperado (ÚLTIMA retirada):
withdrawn_at: 2026-04-07 14:00:00
returned_at:  NULL (vazio)
```

- ✓ Há 2 registros na tabela (primeira e segunda retirada)
- ✓ Último registro tem `returned_at = NULL`
- ✓ Front-end lê o ÚLTIMO registro e retorna `keyStatus = 'withdrawn'`

---

## 🔧 Teste Manual (Browser Console)

Você pode testar a lógica de forma isolada no console do navegador:

```javascript
// Simular dados do banco para Cenário 3 (Chave devolvida)
const mostRecentRecord = {
  withdrawn_at: "2026-04-07T10:45:23Z",
  returned_at: "2026-04-07T11:15:00Z"
};

// Reproduzir lógica do backend
let keyStatus = 'reservado'; // default

if (mostRecentRecord.withdrawn_at && !mostRecentRecord.returned_at) {
  keyStatus = 'withdrawn'; // Em uso
} else if (mostRecentRecord.withdrawn_at && mostRecentRecord.returned_at) {
  keyStatus = 'reservado'; // ✅ Devolvida, volta a estar disponível
}

console.log('Status resultado:', keyStatus);
// Esperado: "reservado"
// ❌ Antes da correção: "returned"
// ✅ Depois da correção: "reservado"
```

---

## 📊 Tabela de Validação

| Cenário | Ação | withdrawn_at | returned_at | Status Esperado | Status Antigo (❌) |
|---------|------|--------------|-------------|-----------------|-------------------|
| 1 | Nenhuma | - | - | 📦 Reservado | 📦 Reservado |
| 2 | Retira | ✓ | NULL | 🔑 Em uso | 🔑 Em uso |
| 3 | Devolve | ✓ | ✓ | 📦 Reservado | ✅ Devolvido ❌ |
| 4 | Retira novamente | ✓ | NULL | 🔑 Em uso | 🔑 Em uso |

---

## 🚀 Como Executar Testes

### Opção 1: Teste Manual na Interface

```
1. Abra o painel: http://localhost/frontend/painel-ambientes.html
2. Crie uma reserva de teste
3. Admin aprova a reserva
4. Aguarde o horário do turno
5. Simule retirada e devolução via QRCode
6. Valide o status em cada etapa
```

### Opção 2: Teste via API (usando curl ou Postman)

```bash
# Buscar ambientes com reservas ativas
curl http://localhost:3000/api/painel

# Procure pela chave e verifique o campo "key_status"
# Deve estar: 'reservado', 'withdrawn', ou (NOT) 'returned'
```

### Opção 3: Teste via Banco de Dados (SQL Console)

```sql
-- Verificar último status de uma chave
SELECT 
  k.environment,
  kh.withdrawn_at,
  kh.returned_at,
  CASE 
    WHEN kh.withdrawn_at IS NULL THEN 'reservado'
    WHEN kh.withdrawn_at IS NOT NULL AND kh.returned_at IS NULL THEN 'withdrawn'
    WHEN kh.withdrawn_at IS NOT NULL AND kh.returned_at IS NOT NULL THEN 'reservado'
    ELSE 'desconhecido'
  END as expected_status
FROM key_history kh
JOIN keys k ON kh.key_id = k.id
WHERE k.id = 'seu-key-id-aqui'
ORDER BY kh.withdrawn_at DESC
LIMIT 1;
```

---

## ✅ Checklist de Aprovação

- [ ] Cenário 1: Chave nunca retirada → "📦 Reservado" ✓
- [ ] Cenário 2: Chave retirada → "🔑 Em uso" ✓
- [ ] Cenário 3: **Chave devolvida → "📦 Reservado"** ✓ (NÃO "✅ Devolvido")
- [ ] Cenário 4: Retirada novamente → "🔑 Em uso" ✓
- [ ] Cores CSS aplicadas corretamente em cada estado
- [ ] Painel auto-atualiza a cada 30 segundos
- [ ] Histórico no banco reflete as mudanças

---

## 🐛 Se Falhar

Se os testes não passarem, verifique:

1. **Servidor backend rodando?**
   ```bash
   npm run dev  # Na pasta backend/
   ```

2. **Banco de dados atualizado?**
   ```bash
   npm run migrate  # Se houver migrations
   ```

3. **Cache do navegador?**
   - Abra DevTools (F12)
   - Vá para Storage → Clear All
   - Reload (Ctrl+Shift+R)

4. **Código foi comitado corretamente?**
   ```bash
   git log --oneline | head -5
   # Deve conter: b652cd2 (correção do status)
   ```

5. **Teste isolado em Node.js:**
   ```bash
   node -e "
   const h = { withdrawn_at: '2026-04-07T10:45:23Z', returned_at: '2026-04-07T11:15:00Z' };
   let keyStatus = 'reservado';
   if (h.withdrawn_at && !h.returned_at) keyStatus = 'withdrawn';
   else if (h.withdrawn_at && h.returned_at) keyStatus = 'reservado';
   console.log('Resultado:', keyStatus);
   "
   # Esperado: reservado
   ```

---

## 📞 Referências

- **Arquivo corrigido:** [backend/controllers/painelController.js](backend/controllers/painelController.js)
- **Commit:** b652cd2
- **Documentação:** [ESTADOS_CHAVES.md](ESTADOS_CHAVES.md)
- **Data:** 2026-04-07

