# 🔍 Exploração: Sistema de Devolução de Chaves

**Data:** 20/03/2026  
**Nível:** Medium  
**Status:** Análise Completada ✅

---

## 📋 Sumário Executivo

O sistema de devolução de chaves (key return) é implementado através de:
- **Backend:** Controlador `keyController.js` com verificação de propriedade de chave
- **Frontend:** Dashboard com modal QR Scanner e confirmação
- **Banco:** Tabela `key_history` com registros de retirada/devolução
- **RLS:** Políticas básicas ativas (verificação principal no backend)

---

## 1. 🔄 FLUXO DE DEVOLUÇÃO DE CHAVES

### 1.1 Iniciação (Frontend)
```
Instrutor vê chaves "Em uso"
           ↓
Clica na chave usando filtro "late" (em atraso)
           ↓
Modal abre com:
  - Título: "Devolver Chave - [Nome]"
  - Subtitle: "Escaneie o QR-Code para confirmar a devolução"
  - QR Scanner ativado
```

**Arquivo:** [frontend/js/dashboard.js](frontend/js/dashboard.js#L250-L330)

### 1.2 Envio (API Call)
```
POST /api/keys/{keyId}/return
Headers: Authorization: Bearer {token}
Body: { observation: null } (opcional, apenas admin)

↓

Backend recebe requisição
```

**Arquivo:** [frontend/js/dashboard.js](frontend/js/dashboard.js#L575-L605)

### 1.3 Processamento (Backend)
```
1. Verificar token (via middleware)
2. Buscar registro ATIVO em key_history
3. VALIDAR PROPRIEDADE:
   - history.instructor_id === userId (quem retirou)
   OU
   - userRole === 'admin'
4. Se inválido → 403 Forbidden
5. Se válido:
   - Atualizar key_history: status='returned', returned_at=now()
   - Atualizar keys: status='available'
   - Retornar sucesso
```

**Arquivo:** [backend/controllers/keyController.js](backend/controllers/keyController.js#L540-L640)

### 1.4 Confirmação (Frontend)
```
✅ Sucesso → Fechar modal
         ↓
         Auto-refresh (15s) detecta mudança
         ↓
         Dashboard atualiza com status "Disponível"
         ↓
         Chave sai do filtro "em atraso"
```

---

## 2. 🔐 LÓGICA DE VALIDAÇÃO PARA DEVOLVER

### 2.1 Verificação de Propriedade (Crítico)

**Código:**
```javascript
// backend/controllers/keyController.js - linha 566
if (history.instructor_id !== userId && userRole !== 'admin') {
  return res.status(403).json({
    success: false,
    message: 'Apenas o usuário que retirou a chave ou um administrador pode devolvê-la'
  });
}
```

**Lógica:**
- ✅ Permite: O instrutor que retirou a chave
- ✅ Permite: Admin (qualquer admin pode devolver chave de qualquer instrutor)
- ❌ Nega: Outro instrutor tentando devolver chave de terceiro

**Teste:** [backend/scripts/test-unauthorized-return.js](backend/scripts/test-unauthorized-return.js)

### 2.2 Validação de Registro Ativo

```javascript
// Buscar histórico ativo (status='active')
const { data: history } = await supabase
  .from('key_history')
  .select('*')
  .eq('key_id', id)
  .eq('status', 'active')           // ← Apenas ativo
  .order('withdrawn_at', { ascending: false })
  .limit(1)
  .single();

if (!history) {
  return res.status(400).json({
    success: false,
    message: 'Chave não possui registro de retirada ativa'
  });
}
```

**O que valida:**
- ✅ Chave foi realmente retirada (existe registro em key_history)
- ✅ Registro está ativo (não foi devolvida antes)
- ❌ Impede devolver chave já devolvida

### 2.3 Restrição de Observação (Apenas Admin)

```javascript
// Apenas admin pode adicionar observação
if (observation && userRole !== 'admin') {
  return res.status(403).json({
    success: false,
    message: 'Apenas administradores podem adicionar observações'
  });
}
```

**Comportamento:**
- Admin pode enviar observação ao devolver
- Instrutor pode devolver, mas observação é ignorada

---

## 3. 👤 COMO O SISTEMA VERIFICA O "DONO" DA CHAVE

### 3.1 Fluxo de Verificação

```
1️⃣ Retirada:
   instructor_id = {userId do que fez login}
   ↓
   Salvo em key_history.instructor_id
   
2️⃣ Devolução:
   userId = {userId do token JWT}
   ↓
   Comparação: history.instructor_id === userId ?
   
3️⃣ Se Equal:
   ✅ Você pode devolver
   
4️⃣ Se Different BUT admin:
   ✅ Admin sempre pode devolver
   
5️⃣ Se Different AND not admin:
   ❌ 403 Forbidden
```

### 3.2 Obtenção do userId

**Backend:**
```javascript
const userId = req.user.id;      // Via JWT token (middleware)
const userRole = req.user.role;  // 'instructor' ou 'admin'
```

**Middleware:**
```javascript
// backend/middleware/auth.js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;  // Contém {id, role, ...}
```

**Frontend (login):**
```javascript
// Após login bem-sucedido
const response = await ApiClient.post('/auth/login', {...});
localStorage.setItem('auth_token', response.token);
localStorage.setItem('user_data', JSON.stringify(response.user));
```

### 3.3 Exemplo Prático

**Cenário 1: Mesmo instrutor devolvendo:**
```
Instrutor João (ID: abc123) retira Lab-01
  → key_history.instructor_id = 'abc123'
  → key_history.status = 'active'

João faz logout, logo depois login novamente
  → token.user.id = 'abc123'

João tenta devolver Lab-01
  → history.instructor_id ('abc123') === userId ('abc123') ✅
  → PERMITIDO

Resposta: 200 OK - Chave devolvida
```

**Cenário 2: Instrutor diferente tentando devolver:**
```
Maria (ID: xyz789) tenta devolver Lab-01 que João tem
  → token.user.id = 'xyz789'
  
POST /api/keys/{lab01-id}/return com token de Maria
  → history.instructor_id ('abc123') !== userId ('xyz789')
  → history.instructor_id !== userId && userRole !== 'admin'
  → NEGAÇÃO ❌

Resposta: 403 Forbidden
Mensagem: "Apenas o usuário que retirou a chave ou um administrador pode devolvê-la"
```

**Cenário 3: Admin devolvendo chave de outro:**
```
Admin (ID: admin1, role: 'admin') tenta devolver Lab-01 de João
  → token.user.id = 'admin1'
  → token.user.role = 'admin'

POST /api/keys/{lab01-id}/return com token admin
  → history.instructor_id ('abc123') !== userId ('admin1')
  → PORÉM: userRole === 'admin' ✅
  → PERMITIDO

Resposta: 200 OK - Chave devolvida por admin
```

---

## 4. 🚫 RESTRIÇÕES DE RLS (Row Level Security)

### 4.1 Status Atual

| Tabela | RLS | Políticas | Estado |
|--------|-----|----------|--------|
| `keys` | ✅ Ativada | Todos veem | ✅ Passiva |
| `key_history` | ✅ Ativada | Viewer restrito | ⚠️ Com fallback |
| `instructors` | ✅ Ativada | Básicas | ✅ Passiva |

**Status:** RLS está ativada mas não está bloqueando devoluções (backend valida tudo)

### 4.2 Políticas em Vigor

**Em schema.sql:**
```sql
-- Chaves: Todos podem ver (se não deletada)
CREATE POLICY "Users can view all keys"
  ON keys FOR SELECT
  USING (deleted_at IS NULL);

-- Histórico: Todos podem inserir
CREATE POLICY "Users can insert history"
  ON key_history FOR INSERT
  WITH CHECK (true);

-- Histórico: Cada um vê seu próprio
CREATE POLICY "Instructors can view their own history"
  ON key_history FOR SELECT
  USING (
    instructor_id = auth.uid() 
    OR auth.jwt() ->> 'role' = 'admin'
  );
```

**Arquivo:** [database/schema.sql](database/schema.sql#L87-L100)

### 4.3 Por que RLS Não Bloqueia Devolução

1. **Backend usa verificação em código** (não confia em RLS)
2. **RLS está configurada para SELECT**, não para UPDATE de key_history
3. **Admin pode contornar RLS** via service_role (se configurado)
4. **Validação principal:** `history.instructor_id !== userId`

### 4.4 Políticas Problemáticas Conhecidas

**Problemas resolvidos:**
- ❌ `calendar_blockouts` tinha policy que bloqueava service_role
- ❌ Verificava `auth.jwt()` quando backend usa service_role
- ✅ **Solução atual:** RLS desabilitada em tabelas de bloqueio

**Documentação:** [RLS_ANALISE_PRODUCAO.md](RLS_ANALISE_PRODUCAO.md)

---

## 5. 📌 "INDISPONÍVEL" / "UNAVAILABLE"

### 5.1 Quando Chave é Marcada Indisponível

**Frontend (dashboard.js, linha 260):**
```javascript
if (key.status === 'in_use' && key.lastActivity && currentKeyFilter === 'available') {
  // Mostrar modal de chave indisponível
  showUnavailableKeyModal(key, environment);
  return;
}
```

**Condições:**
- Status = `'in_use'` (não é 'available')
- Tem `lastActivity` (alguém retirou)
- Usuário está no filtro "available" (não "late")

### 5.2 Modal Indisponível

**Modal HTML:** [frontend/dashboard.html](frontend/dashboard.html#L609-L645)

```html
<div class="modal-overlay" id="unavailableKeyModal">
  <div class="modal">
    <h2 class="modal-title">Chave Indisponível</h2>
    <p>A chave <strong id="unavailableKeyName">...</strong> está em uso</p>
    <p>Por: <strong id="instructorWithKey">...</strong></p>
    <p>Desde: <strong id="sinceTime">...</strong></p>
  </div>
</div>
```

### 5.3 Dados Exibidos (lastActivity)

**Backend enriquece resposta:**
```javascript
const { data: history } = await supabase
  .from('key_history')
  .select('*, instructors(name)')
  .eq('key_id', key.id)
  .eq('status', 'active');  // Busca retiradas ativas

return {
  ...key,
  lastActivity: activeHistory ? {
    instructor: activeHistory.instructors?.name,
    withdrawnAt: normalizeSupabaseDate(activeHistory.withdrawn_at)
  } : null
};
```

**Arquivo:** [backend/controllers/keyController.js](backend/controllers/keyController.js#L40-L80)

### 5.4 Validação de Disponibilidade na Retirada

**Quando usuario tenta retirar:**
```javascript
// backend/controllers/keyController.js - withdrawKey()
if (key.status !== 'available') {
  return res.status(400).json({
    success: false,
    message: 'Chave não está disponível para retirada'
  });
}
```

**Scenarios:**
- Status='in_use' → ❌ Não pode retirar (bloqueado)
- Status='maintenance' → ❌ Não pode retirar (bloqueado)
- Status='available' → ✅ Pode retirar

---

## 6. 🔗 FLUXO COMPLETO: EXEMPLO REAL

### Caso: João retira Lab-02, depois devolve

```
T0: João faz login
    ✅ Token: eyJid...-containsId:'abc123' role:'instructor'

T1: João vê lista de chaves
    GET /api/keys
    ✅ Lab-02 status='available'

T2: João clica em Lab-02
    → Abre modal QR Scanner
    → Botão: "Retirar"

T3: João escaneia QR (ou confirma)
    POST /api/keys/{lab02-id}/withdraw
    ✅ Backend:
       - Valida: key.status === 'available' ✓
       - Valida: instructorId = 'abc123' ✓
       - Atualiza: keys.status = 'in_use'
       - Insere: key_history {
           key_id: 'lab02-id',
           instructor_id: 'abc123',
           withdrawn_at: now(),
           status: 'active'
         }
    ✅ Resposta: 200 OK

T4: João sai (sem devolver por 2 horas)
    → Sistema detecta atraso (check-late-returns.js)
    → Email enviado: "Chave sem devolução"
    → Dashboard mostra em filtro "Em atraso"

T5: João retorna e clica em "Devolver"
    → Abre modal QR Scanner
    → Botão: "Devolver Chave"
    → Escaneia QR novamente

T6: João confirma devolução
    POST /api/keys/{lab02-id}/return
    Headers: Authorization: Bearer {token-joão}
    Body: { observation: null }
    
    ✅ Backend:
       1. Valida token:
          - Decodifica JWT → user.id = 'abc123'
          - user.role = 'instructor'
       
       2. Busca histórico ativo:
          SELECT * FROM key_history
          WHERE key_id='lab02-id' AND status='active'
          → Encontra: instructor_id='abc123'
       
       3. Valida propriedade:
          history.instructor_id ('abc123') === userId ('abc123') ? YES ✅
       
       4. Valida observação:
          observation=null → OK ✅
       
       5. Atualiza:
          key_history: status='returned', returned_at=now()
          keys: status='available'
       
       6. Resposta: 200 OK
    
    ✅ Response: "Chave devolvida com sucesso"

T7: Frontend atualiza (auto-refresh 15s)
    GET /api/keys
    ✅ Lab-02 agora tem status='available'
    ✅ Fecha modal
    ✅ Chave some do filtro "Em atraso"
    ✅ Chave reaparece em "Disponíveis"
```

---

## 7. 📊 ESTRUTURA DE DADOS RELEVANTE

### 7.1 Tabela `key_history`

```sql
CREATE TABLE key_history (
  id UUID PRIMARY KEY,
  
  key_id UUID REFERENCES keys(id),        -- Qual chave
  instructor_id UUID REFERENCES instructors(id),  -- Quem retirou
  
  withdrawn_at TIMESTAMP,                 -- Data/hora da retirada
  returned_at TIMESTAMP,                  -- Data/hora da devolução
  
  observation TEXT,                       -- Anotação do Admin ao devolver
  
  status TEXT CHECK (status IN ('active', 'returned')),
    -- 'active': chave foi retirada, não devolvida
    -- 'returned': chave foi devolvida
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 7.2 Tabela `keys`

```sql
CREATE TABLE keys (
  id UUID PRIMARY KEY,
  
  environment TEXT,     -- Ex: "Lab-02 - Organizar"
  qr_code TEXT UNIQUE,  -- QR Code único
  
  status TEXT DEFAULT 'available' 
    CHECK (status IN ('available', 'in_use', 'maintenance')),
    -- 'available': pode retirar
    -- 'in_use': alguém retirou (devolvendo)
    -- 'maintenance': em manutenção (bloqueado)
  
  ...outros campos
);
```

### 7.3 Tabela `instructors`

```sql
CREATE TABLE instructors (
  id UUID PRIMARY KEY,
  
  matricula TEXT UNIQUE,
  name TEXT,
  email TEXT UNIQUE,
  
  role TEXT CHECK (role IN ('instructor', 'admin')),
    -- 'instructor': usuário regular
    -- 'admin': pode gerenciar tudo e devolver por outros
  
  ...outros campos
);
```

---

## 8. 🧪 TESTES EXISTENTES

### Testes de Devolução

| Script | O que testa | Status |
|--------|-----------|--------|
| [test-return-key.js](backend/scripts/test-return-key.js) | Admin fazendo devolução | ✅ OK |
| [test-return-as-instructor.js](backend/scripts/test-return-as-instructor.js) | Instrutor devolvendo sua chave | ✅ OK |
| [test-unauthorized-return.js](backend/scripts/test-unauthorized-return.js) | Instrutor tentando devolver chave de outro | ✅ OK (deve falhar 403) |
| [test-complete-cycle.js](scripts/test-complete-cycle.js) | Ciclo completo: retirada + devolução | ✅ OK |

**Como rodar:**
```bash
node backend/scripts/test-return-key.js
node backend/scripts/test-unauthorized-return.js
```

---

## 9. 🔑 PONTOS CRÍTICOS DE SEGURANÇA

### ✅ Bem Implementado

1. **Verificação de Propriedade**
   - Compara `history.instructor_id` com `req.user.id`
   - Impede transferência de chaves entre instrutores
   - Admin pode sobrePor

2. **Validação de Status Ativo**
   - Verifica `key_history.status = 'active'`
   - Impede devolver chave já devolvida
   - Impede "devoluções duplicadas"

3. **Restrição de Observação**
   - Apenas admin pode adicionar observação
   - Usuário comum não consegue injetar texto

4. **Autenticação JWT**
   - Todo endpoint protegido por middleware
   - Token verificado em cada requisição

### ⚠️ Considerações

1. **RLS Secundária**
   - RLS está ativada mas não é a validação principal
   - Backend é primeira linha de defesa
   - RLS é backup/segurança extra

2. **Frontend Confia em Backend**
   - Não há validação de propriedade no frontend
   - Frontend apenas renderiza UI baseado em resposta API
   - Segurança 100% dependente do backend

3. **Sem Auditoria Detalhada**
   - Não há log de tentativas de devolver por outro usuário
   - Apenas registra sucesso/erro

---

## 📎 REFERÊNCIA RÁPIDA

### Arquivos Principais

```
Sistema de Devolução:
├── backend/controllers/keyController.js      (returnKey() function)
├── backend/routes/keys.js                     (POST /:id/return route)
├── backend/middleware/auth.js                 (Validação JWT)
├── frontend/js/dashboard.js                  (confirmReturn() function)
├── frontend/dashboard.html                   (Modal QR Scanner)
└── database/schema.sql                       (Tabelas + RLS)

Suporte/Testes:
├── backend/scripts/test-unauthorized-return.js
├── backend/scripts/test-return-key.js
└── scripts/test-complete-cycle.js

Documentação Correlata:
├── SYSTEM_STATUS_FINAL.md
├── RLS_ANALISE_PRODUCAO.md
└── ARCHITECTURE.md
```

### Endpoints

```
POST /api/keys/:keyId/return
  ├─ Autenticação: JWT Token (Bearer {token})
  ├─ Autorização: Deve ser quem retirou OU admin
  ├─ Body: { observation: null } (optional, admin only)
  ├─ Status 200: Sucesso
  ├─ Status 400: Sem registro ativo (chave não retirada)
  ├─ Status 403: Não autorizado (não é o dono)
  └─ Status 500: Erro interno
```

---

## ✨ Conclusão

O sistema de devolução de chaves é:
- ✅ **Bem estruturado** - Fluxo claro e documentado
- ✅ **Seguro** - Verificação de propriedade + RLS
- ✅ **Testado** - Scripts de teste para casos nominais e edge cases
- ✅ **Auditável** - Registra retirada/devolução em key_history
- ⚠️ **Podendo melhorar** - Logs detalhados de rejeições, mais observações

