# Passo 2: API - Sistema de Reservas

**Status:** ✅ IMPLEMENTADO
**Data:** 09 de Fevereiro de 2026
**Versão:** 1.0

---

## 📋 Resumo

Implementação de 8 endpoints RESTful para gerenciar o sistema de reservas de chaves. Todos os endpoints estão protegidos por autenticação JWT e incluem validações de negócio.

---

## 🔗 Endpoints

### 1. **POST** `/api/reservations` - Criar Reserva

Cria uma nova reserva de chave. Admin pode criar já aprovada; instructor normal cria como pendente.

**Autenticação:** Sim (JWT Token)  
**Permissão:** Qualquer usuário autenticado

**Body:**
```json
{
  "key_id": "uuid-da-chave",
  "instructor_id": "uuid-do-instrutor",
  "start_date": "2026-02-15",
  "end_date": "2026-02-20",
  "shift": "matutino",
  "turma": "SENAI-001",
  "motivo_detalhado": "Aula prática de software",
  "created_by_admin": false
}
```

**Parâmetros:**
- `key_id` (string, UUID, obrigatório) - ID da chave a reservar
- `instructor_id` (string, UUID, obrigatório) - ID do instrutor
- `start_date` (string, YYYY-MM-DD, obrigatório) - Data inicial
- `end_date` (string, YYYY-MM-DD, obrigatório) - Data final
- `shift` (string, obrigatório) - Turno: `matutino`, `vespertino`, `noturno`, `integral`
- `turma` (string, obrigatório) - Código da turma/grupo
- `motivo_detalhado` (string, obrigatório) - Descrição do motivo
- `created_by_admin` (boolean, padrão: false) - Se verdadeiro, cria já como aprovada

**Validações:**
- ❌ Não pode haver múltiplas reservas para mesma chave/período/turno
- ✅ Se `created_by_admin=true`, status fica `approved` automaticamente
- ✅ Se `created_by_admin=false`, status fica `pending` (aguarda aprovação)
- ✅ Se aprovada, envia email de notificação ao instrutor
- ✅ End date não pode ser anterior a start date

**Resposta (201):**
```json
{
  "success": true,
  "message": "Reserva criada com status: pending",
  "data": {
    "id": "uuid-da-reserva",
    "key_id": "uuid-da-chave",
    "instructor_id": "uuid-do-instrutor",
    "reservation_start_date": "2026-02-15",
    "reservation_end_date": "2026-02-20",
    "shift": "matutino",
    "turma": "SENAI-001",
    "motivo_detalhado": "Aula prática de software",
    "status": "pending",
    "approved_by": null,
    "approved_at": null,
    "created_at": "2026-02-09T10:30:45.123Z",
    "updated_at": "2026-02-09T10:30:45.123Z"
  }
}
```

---

### 2. **GET** `/api/reservations` - Listar Reservas

Lista reservas do usuário autenticado (instructor vê suas; admin vê todas).

**Autenticação:** Sim (JWT Token)

**Query Params:** Nenhum (ordenação automática por created_at DESC)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-reserva-1",
      "key_id": "uuid-chave-1",
      "instructor_id": "uuid-instrutor-1",
      "reservation_start_date": "2026-02-15",
      "reservation_end_date": "2026-02-20",
      "shift": "matutino",
      "turma": "SENAI-001",
      "motivo_detalhado": "Aula prática",
      "status": "pending",
      "rejection_reason": null,
      "approved_by": null,
      "approved_at": null,
      "created_at": "2026-02-09T10:30:45.123Z",
      "updated_at": "2026-02-09T10:30:45.123Z",
      "keys": {
        "id": "uuid-chave-1",
        "environment": "Lab Informatica",
        "key_code": "LAB-001"
      },
      "instructors": {
        "id": "uuid-instrutor-1",
        "name": "João Silva",
        "email": "joao@senai.br"
      }
    }
  ]
}
```

---

### 3. **GET** `/api/reservations/:id` - Obter Detalhe da Reserva

Retorna informações completas de uma reserva específica.

**Autenticação:** Sim (JWT Token)  
**Permissão:** Instructor vê sua própria; Admin vê todas

**Path Params:**
- `id` (string, UUID) - ID da reserva

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-reserva-1",
    "key_id": "uuid-chave-1",
    "instructor_id": "uuid-instrutor-1",
    "reservation_start_date": "2026-02-15",
    "reservation_end_date": "2026-02-20",
    "shift": "matutino",
    "turma": "SENAI-001",
    "motivo_detalhado": "Aula prática",
    "status": "pending",
    "rejection_reason": null,
    "approved_by": null,
    "approved_at": null,
    "created_at": "2026-02-09T10:30:45.123Z",
    "updated_at": "2026-02-09T10:30:45.123Z",
    "keys": { ... },
    "instructors": { ... },
    "approved_instructor": null
  }
}
```

---

### 4. **PATCH** `/api/reservations/:id/approve` - Aprovar Reserva

Admin aprova uma reserva pendente. Envia email de confirmação ao instrutor.

**Autenticação:** Sim (JWT Token)  
**Permissão:** Admin apenas

**Path Params:**
- `id` (string, UUID) - ID da reserva

**Body:** Vazio (não requer body)

**Validações:**
- ❌ Apenas admins podem executar
- ❌ Reserva deve estar com status `pending`
- ✅ Muda status para `approved`
- ✅ Registra `approved_by` e `approved_at`
- ✅ Envia email de aprovação ao instrutor

**Resposta (200):**
```json
{
  "success": true,
  "message": "Reserva aprovada e email enviado ao instrutor",
  "data": {
    "id": "uuid-reserva-1",
    "status": "approved",
    "approved_by": "uuid-admin",
    "approved_at": "2026-02-09T11:00:00.123Z",
    ...
  }
}
```

---

### 5. **PATCH** `/api/reservations/:id/reject` - Rejeitar Reserva

Admin rejeita uma reserva pendente. Envia email com motivo ao instrutor.

**Autenticação:** Sim (JWT Token)  
**Permissão:** Admin apenas

**Path Params:**
- `id` (string, UUID) - ID da reserva

**Body:**
```json
{
  "rejection_reason": "Ambiente indisponível durante este período"
}
```

**Parâmetros:**
- `rejection_reason` (string, obrigatório) - Motivo da rejeição

**Validações:**
- ❌ Apenas admins podem executar
- ❌ Reserva deve estar com status `pending`
- ✅ Muda status para `rejected`
- ✅ Armazena `rejection_reason`
- ✅ Envia email de rejeição

**Resposta (200):**
```json
{
  "success": true,
  "message": "Reserva rejeitada e email enviado ao instrutor",
  "data": {
    "id": "uuid-reserva-1",
    "status": "rejected",
    "rejection_reason": "Ambiente indisponível durante este período",
    ...
  }
}
```

---

### 6. **GET** `/api/keys/:key_id/availability` - Verificar Disponibilidade

Verifica se uma chave está disponível em um período específico.

**Autenticação:** Sim (JWT Token)

**Path Params:**
- `key_id` (string, UUID) - ID da chave

**Query Params:**
- `start_date` (string, YYYY-MM-DD, obrigatório)
- `end_date` (string, YYYY-MM-DD, obrigatório)
- `shift` (string, obrigatório) - `matutino`, `vespertino`, `noturno`, `integral`

**Exemplo:**
```
GET /api/keys/uuid-chave-1/availability?start_date=2026-02-15&end_date=2026-02-20&shift=matutino
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "is_available": false,
    "reason": "Manutenção: Limpeza da sala",
    "key_id": "uuid-chave-1",
    "start_date": "2026-02-15",
    "end_date": "2026-02-20",
    "shift": "matutino"
  }
}
```

---

### 7. **POST** `/api/reservations/permissions` - Criar Permissão Pontual

Admin cria uma permissão de exceção para um dia/turno específico (para retiradas de última hora).

**Autenticação:** Sim (JWT Token)  
**Permissão:** Admin apenas

**Body:**
```json
{
  "key_id": "uuid-da-chave",
  "instructor_id": "uuid-do-instrutor",
  "permission_date": "2026-02-15",
  "shift": "matutino",
  "reason": "Aula de substituição"
}
```

**Parâmetros:**
- `key_id` (string, UUID, obrigatório)
- `instructor_id` (string, UUID, obrigatório)
- `permission_date` (string, YYYY-MM-DD, obrigatório)
- `shift` (string, obrigatório) - `matutino`, `vespertino`, `noturno`, `integral`
- `reason` (string, obrigatório) - Motivo da permissão

**Validações:**
- ❌ Apenas admins podem criar
- ✅ Motivo é obrigatório
- ✅ Registra automática `authorized_at` e `authorized_by`

**Resposta (201):**
```json
{
  "success": true,
  "message": "Permissão criada com sucesso",
  "data": {
    "id": "uuid-permissao-1",
    "key_id": "uuid-da-chave",
    "instructor_id": "uuid-do-instrutor",
    "permission_date": "2026-02-15",
    "shift": "matutino",
    "reason": "Aula de substituição",
    "authorized_by": "uuid-admin",
    "authorized_at": "2026-02-09T11:00:00.123Z",
    "created_at": "2026-02-09T11:00:00.123Z"
  }
}
```

---

### 8. **POST** `/api/reservations/maintenance` - Criar Manutenção

Admin cria um período de manutenção, bloqueando uma chave. Pode bloquear por turno específico ou dia inteiro.

**Autenticação:** Sim (JWT Token)  
**Permissão:** Admin apenas

**Body:**
```json
{
  "key_id": "uuid-da-chave",
  "start_date": "2026-02-15",
  "end_date": "2026-02-15",
  "motivo": "Limpeza da sala",
  "shift": null
}
```

**Parâmetros:**
- `key_id` (string, UUID, obrigatório)
- `start_date` (string, YYYY-MM-DD, obrigatório)
- `end_date` (string, YYYY-MM-DD, obrigatório)
- `motivo` (string, obrigatório) - Descrição da manutenção
- `shift` (string, opcional) - Se preenchido, bloqueia apenas esse turno. Se null/vazio, bloqueia dia inteiro
  - Valores: `matutino`, `vespertino`, `noturno`, `integral`, ou deixar vazio

**Validações:**
- ❌ Apenas admins podem criar
- ❌ End date não pode ser anterior a start date
- ✅ Se shift for NULL → bloqueia dia inteiro
- ✅ Se shift for preenchido → bloqueia apenas aquele turno

**Resposta (201):**
```json
{
  "success": true,
  "message": "Manutenção criada para dia inteiro",
  "data": {
    "id": "uuid-manutencao-1",
    "key_id": "uuid-da-chave",
    "maintenance_start_date": "2026-02-15",
    "maintenance_end_date": "2026-02-15",
    "motivo_resumido": "Limpeza da sala",
    "shift": null,
    "created_by": "uuid-admin",
    "created_at": "2026-02-09T11:00:00.123Z",
    "updated_at": "2026-02-09T11:00:00.123Z"
  }
}
```

---

## 🔐 Autenticação

Todos os endpoints requerem header `Authorization`:

```
Authorization: Bearer <seu-jwt-token>
```

O token é obtido no login via `/api/auth/login`.

---

## 📧 Notificações por Email

### Aprovação de Reserva
Quando uma reserva é aprovada (por admin ou criada já como aprovada):
- **Para:** Email do instrutor
- **Assunto:** ✅ Reservation Approved
- **Conteúdo:** Detalhes da chave, período, turno, e horário de retirada permitida

### Rejeição de Reserva
Quando uma reserva é rejeitada:
- **Para:** Email do instrutor
- **Assunto:** ❌ Reservation Rejected
- **Conteúdo:** Motivo da rejeição e sugestão de criar nova reserva

---

## ⏰ Regras de Horário para Retirada

Quando uma reserva for aprovada, o instrutor pode retirar a chave:

| Turno | Horário de Funcionamento | Retirada Permitida (30 min antes) |
|-------|--------------------------|----------------------------------|
| Matutino | 7:30 - 11:30 | 7:00 - 11:30 |
| Vespertino | 13:30 - 17:30 | 13:00 - 17:30 |
| Noturno | 18:30 - 22:00 | 18:00 - 22:00 |
| Integral | 08:00 - 17:00 | 07:30 - 17:00 |

---

## 🔍 Fluxo de Negócio

### 1. Criar Reserva (Instructor)
```
POST /api/reservations
→ status: "pending" (aguarda admin)
→ Email: Nenhum neste momento
```

### 2. Admin Aprova
```
PATCH /api/reservations/:id/approve
→ status: "approved"
→ Email: Notificação ao instructor com detalhes
```

### 3. Instructor Retira Chave
```
POST /api/keys/:id/withdraw
→ Validar: Data/turno correto?
→ Validar: Hora dentro do permitido (30 min antes)?
→ Validar: Sem manutenção?
→ Retirada feita
```

### 4. Manutenção Bloqueia
```
POST /api/reservations/maintenance
→ Chave indisponível durante período
→ Reservas neste período rejeitadas automaticamente
```

### 5. Permissão de Última Hora
```
POST /api/reservations/permissions
→ Admin autoriza exceção para um dia/turno
→ Instructor consegue retirar sem reserva formal
```

---

## 📝 Notas

- O banco de dados (`key_reservations`, `key_permissions`, `environment_maintenance`, `key_availability`) já foi criado no Passo 1
- RLS (Row Level Security) está ativado em todas as tabelas
- Todos os dados incluem auditor Automaticamente `created_at` e `updated_at`
- Admins conseguem ver/gerenciar todas as reservas
- Instructors veem apenas suas reservas
- Próximo passo: Passo 3 (Frontend para instructor fazer reservações)

---

## ✅ Implementação Completa

- ✅ Endpoint 1: Criar Reserva
- ✅ Endpoint 2: Listar Reservas
- ✅ Endpoint 3: Obter Detalhe
- ✅ Endpoint 4: Aprovar
- ✅ Endpoint 5: Rejeitar
- ✅ Endpoint 6: Verificar Disponibilidade
- ✅ Endpoint 7: Criar Permissão
- ✅ Endpoint 8: Criar Manutenção
- ✅ Notificações por Email
- ✅ Integração com Server.js

**Status:** Pronto para Passo 3 (Frontend)
