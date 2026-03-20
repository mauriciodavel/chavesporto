# 📊 DIAGRAMAS: Sistema de Devolução de Chaves

## 1. Fluxo de Autorização

```
┌─────────────────────────────────────────────────────────────┐
│                    POST /api/keys/:id/return                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│   1. VERIFICAÇÃO DE TOKEN                                   │
│   ┌────────────────────────────────────────────────────┐   │
│   │ Authorization: Bearer eyJhbG...                    │   │
│   │ ↓                                                   │   │
│   │ Decodificar JWT → req.user = {id, role, ...}      │   │
│   └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                         ✅ Token válido?
                        /              \\
                       ❌              ✅
                      /                  \\
        401 Token inválido      ┌──────────────────┐
                                │ Continuar...     │
                                └──────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────┐
│   2. BUSCAR HISTÓRICO ATIVO                                 │
│   ┌────────────────────────────────────────────────────┐   │
│   │ SELECT * FROM key_history                         │   │
│   │ WHERE key_id = :id AND status = 'active'          │   │
│   └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                   ✅ Registro existe?
                      /          \\
                    ❌           ✅
                   /              \\
      400 Sem registro    ┌──────────────────┐
                          │ Continuar...     │
                          └──────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────┐
│   3. VERIFICAR PROPRIEDADE ⬅️ CRÍTICO                       │
│   ┌────────────────────────────────────────────────────┐   │
│   │ IF history.instructor_id == req.user.id           │   │
│   │    OR req.user.role == 'admin'                    │   │
│   │ THEN permitir                                      │   │
│   │ ELSE negar (403)                                   │   │
│   └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ✅ Autorizado?
                      /          \\
                    ❌           ✅
                   /              \\
      403 Não autorizado    ┌──────────────────┐
      "Apenas quem retirou  │ Continuar...     │
       ou admin podem       └──────────────────┘
       devolver"                   ↓
                    ┌──────────────────────┐
                    │4. EFETUAR DEVOLUÇÃO  │
                    ├──────────────────────┤
                    │ UPDATE key_history   │
                    │ status = 'returned'  │
                    │ returned_at = now()  │
                    │                      │
                    │ UPDATE keys          │
                    │ status = 'available' │
                    └──────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │ 200 OK - Success │
                    └──────────────────┘
```

---

## 2. Validação de Propriedade - Estados

```
CENÁRIO 1: Mesmo Instrutor
═════════════════════════════════════════════════════════════

Retirada:           Devolução:
João               João (mesmo token)
  ↓                  ↓
instructor_id   ==  req.user.id
  'abc123'       ==  'abc123'
  ↓ MATCH
✅ PERMITIDO

─────────────────────────────────────────────────────────────

CENÁRIO 2: Instrutor Diferente
═════════════════════════════════════════════════════════════

Retirada:           Devolução:
João                Maria
  ↓                   ↓
instructor_id   !=   req.user.id
  'abc123'       !=   'xyz789'
  ↓ NO MATCH
  
historia.instructor_id != userId AND role != 'admin'
  'abc123'             !=  'xyz789' AND 'instructor' != 'admin'
           TRUE                          AND      TRUE
                      = TRUE (recusa)
❌ 403 FORBIDDEN

─────────────────────────────────────────────────────────────

CENÁRIO 3: Admin Devolvendo Chave de Outro
═════════════════════════════════════════════════════════════

Retirada:           Devolução:
João                Admin
  ↓                   ↓
instructor_id   !=   req.user.id
  'abc123'       !=   'admin1'
  ↓ NO MATCH
  
history.instructor_id != userId AND role != 'admin'
  'abc123'             !=  'admin1' AND 'admin' != 'admin'
           TRUE                          AND      FALSE
                      = FALSE (permite)
✅ 200 OK - PERMITIDO (Admin pode)
```

---

## 3. Estados da Chave

```
                       CICLO DE VIDA DA CHAVE
                       ══════════════════════


    Inicial
      ↓
    ┌─────────────┐
    │  AVAILABLE  │
    │ (verde)     │
    └─────────────┘
         ↑ ↓
         │ │ POST/withdraw
         │ │ (Instrutor retira)
         │ ↓
    ┌─────────────┐
    │   IN_USE    │
    │  (vermelho) │──── [Em atraso?]
    └─────────────┘       │
         ↑ ↓              └→ Modal: "Devolver"
         │ │ POST/return       (confirmReturn)
         │ │ (Instrutor devolve)
         │ ↓
    ┌─────────────┐
    │  AVAILABLE  │
    │ (verde)     │
    └─────────────┘


  Alternativas:

    AVAILABLE → MAINTENANCE → AVAILABLE
    (Admin move para manutenção)
    
    IN_USE → DELETED
    (Admin deleta, não devolvida)
```

---

## 4. Fluxo Frontend → Backend

```
┌─── FRONTEND (JavaScript) ────────────────────────────┐
│                                                      │
│  1. Usuário clica "Devolver" em chave em uso       │
│     ↓                                                │
│  2. confirmReturn(keyId) é chamado                 │
│     ↓                                                │
│  3. ApiClient.post(`/keys/${keyId}/return`, {})   │
│     ├─ Headers: Authorization: Bearer {token}      │
│     └─ Body: { observation: null }                 │
│     ↓                                                │
│  4. Requisição HTTP                                 │
│     ┌────────────────────────────────────┐          │
│     │ POST /api/keys/abc123-id/return   │          │
│     │ Bearer eyJhbGc...                  │          │
│     │ Content: { observation: null }     │          │
│     └────────────────────────────────────┘          │
└─────────────────────────┬──────────────────────────┘
                          │
                          ↓ (Network)
                          │
┌─── BACKEND (Node.js) ────────────────────────────┐
│                                                  │
│  1. routes/keys.js:                            │
│     router.post('/:id/return', verifyToken,   │
│                 keyController.returnKey)      │
│     ↓                                           │
│  2. middleware/auth.js (verifyToken):         │
│     - Extrai token do header                   │
│     - Decodifica JWT                           │
│     - Atribui req.user = decoded               │
│     ↓                                           │
│  3. keyController.returnKey():                │
│     ├─ userId = req.user.id                    │
│     ├─ userRole = req.user.role               │
│     ├─ Busca history ativo                     │
│     ├─ Valida: instructor_id == userId        │
│     │           OR role == 'admin'             │
│     └─ Atualiza banco se OK                    │
│     ↓                                           │
│  4. Resposta HTTP                              │
│     ┌────────────────────────────────┐         │
│     │ 200 OK ou 403 Forbidden etc    │         │
│     │ { success: true/false, ... }   │         │
│     └────────────────────────────────┘         │
└─────────────────────────┬──────────────────────┘
                          │
                          ↓ (Network)
                          │
┌─── FRONTEND (JavaScript) ────────────────────────────┐
│                                                      │
│  1. Resposta recebida                             │
│     ↓                                               │
│  2. if (response.success)                         │
│     ├─ Mostrar sucesso                            │
│     ├─ Fechar modal                               │
│     ├─ Auto-refresh loadKeys() (15s)              │
│     └─ Tabela atualiza                            │
│     else                                           │
│     ├─ Mostrar erro                               │
│     └─ Usuario tenta novamente                    │
└──────────────────────────────────────────────────┘
```

---

## 5. JWT Token Anatomy

```
Token na requisição:
────────────────────────────────────────────────────

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...


Decodificado (base64):
────────────────────────────────────────────────────

HEADER:
{
  "alg": "HS256",
  "typ": "JWT"
}

PAYLOAD (⬅️ USO PARA AUTORIZAÇÃO):
{
  "id": "abc123-uuid",           ← user ID
  "role": "instructor",          ← user role
  "email": "joao@senai.com.br",
  "matricula": "1234",
  "iat": 1708347200,             ← issued at
  "exp": 1708433600              ← expires
}

SIGNATURE:
hmacSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  "your-secret-key"
)


FLUXO DE AUTORIZAÇÃO:
────────────────────────────────────────────────────

req.headers.authorization
       ↓ ("Bearer ...")
token extraído
       ↓
jwt.verify(token, JWT_SECRET)
       ↓ se válido
payload decodificado
       ↓
req.user = {
  id: "abc123-uuid",
  role: "instructor"  ← USADO NA VALIDAÇÃO!
}
       ↓
history.instructor_id == req.user.id ?
```

---

## 6. Database State Machine

```
KEY_HISTORY Table Lifecycle
════════════════════════════════════════════════════════════

Registro CRIADO (POST /withdraw):
┌──────────────────────────────────────────┐
│ id: uuid                                 │
│ key_id: 'lab-02'                         │
│ instructor_id: 'abc123'  ← IMPORTANTE    │
│ withdrawn_at: '2026-03-20T10:00:00Z'    │
│ returned_at: NULL                        │
│ status: 'active'  ← NOVO REGISTRO        │
│ observation: NULL                        │
└──────────────────────────────────────────┘
           (retirada realizada)
                    ↓
           [Tempo passa - 2 horas]
                    ↓
┌──────────────────────────────────────────┐
│ MESMO REGISTRO, SEM MUDANÇA:             │
│ (Chave continua com João, status=active)│
│ Detectado: checkLateReturns()            │
│ Email disparo: "Devolver chave!"         │
└──────────────────────────────────────────┘
                    ↓
      [João volta e devolve]
                    ↓
┌──────────────────────────────────────────┐
│ REGISTRO ATUALIZADO (POST /return):      │
│                                          │
│ id: uuid (MESMO)                         │
│ key_id: 'lab-02'                         │
│ instructor_id: 'abc123'  ← NÃO MUDA!    │
│ withdrawn_at: '2026-03-20T10:00:00Z' (MESMO)
│ returned_at: '2026-03-20T12:15:00Z' ← UPDATE
│ status: 'returned'  ← UPDATE (ativo→retornado)
│ observation: NULL ou "..." // if admin   │
└──────────────────────────────────────────┘
          (devolução concluída)
```

---

## 7. RLS Protection Layer

```
┌───────────────────────────────────────┐
│   CAMADAS DE SEGURANÇA                │
└───────────────────────────────────────┘

       CAMADA 1: Frontend
       ────────────────────
       - Valida role visualmente
       - Não envia requisição se não for dono
       - ⚠️ Pode ser contornada (F12)
       
              ↓
              
       CAMADA 2: JWT Auth (Middleware)
       ────────────────────────────────
       - Valida assinatura do token
       - Extrai identidade: req.user = {id, role}
       - Rejeita token expirado/inválido
       - Essencial para autorização
       
              ↓
              
       CAMADA 3: Backend Validation (Lógica)
       ──────────────────────────────────────
       - Compara history.instructor_id == req.user.id
       - Verifica role == 'admin'
       - PRINCIPAL DEFESA
       
              ↓
              
       CAMADA 4: RLS Policies (Database)
       ────────────────────────────────
       - ENABLE ROW LEVEL SECURITY
       - SELECT: (instructor_id = auth.uid() OR admin)
       - Backup em caso de bypass
       - ⚠️ Secundária (backend é principal)


┌───────────────────────────────────────┐
│   FLUXO COM ATAQUES                   │
└───────────────────────────────────────┘

Ataque 1: Modificar ID no Frontend
────────────────────────────────────
  ✅ BLOQUEADO em Camada 3
  (Backend não confia em frontend)

Ataque 2: Enviar token fake
────────────────────────────────────
  ✅ BLOQUEADO em Camada 2
  (JWT inválido rejeitado)

Ataque 3: Usar token expirado
────────────────────────────────────
  ✅ BLOQUEADO em Camada 2
  (Verificação de exp)

Ataque 4: Contornar backend (SQL Injection)
────────────────────────────────────────────
  ✅ BLOQUEADO em Camada 4
  (RLS policy impõe WHERE automaticamente)
```

---

## 📐 Tabela Comparativa: Quem pode devolver?

```
┌──────────────────┬────────────┬─────────────────────────────┐
│ Cenário          │ Permitido? │ Motivo                      │
├──────────────────┼────────────┼─────────────────────────────┤
│ João retira e    │     ✅     │ history.instructor_id ==    │
│ João devolve     │            │ req.user.id                 │
│                  │            │ (mesmo token)               │
├──────────────────┼────────────┼─────────────────────────────┤
│ João retira e    │     ❌     │ history.instructor_id       │
│ Maria tenta      │     403    │ ('abc123') !=               │
│ devolver         │            │ req.user.id ('xyz789')      │
│                  │            │ AND role != 'admin'         │
├──────────────────┼────────────┼─────────────────────────────┤
│ João retira e    │     ✅     │ Mesmo status == 'active',   │
│ João (dia depois)│            │ token ainda válido          │
│ devolve          │            │ (ou novo login)             │
├──────────────────┼────────────┼─────────────────────────────┤
│ João retira e    │     ✅     │ Admin sempre pode devolver  │
│ Admin devolve    │            │ qualquer chave              │
│                  │            │ (role == 'admin')           │
├──────────────────┼────────────┼─────────────────────────────┤
│ Chave já         │     ❌     │ Busca histórico ativo não   │
│ devolvida, tenta │     400    │ encontra nada               │
│ devolver novamente            │ (status ja='returned')      │
└──────────────────┴────────────┴─────────────────────────────┘
```

