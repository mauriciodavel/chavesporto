# 🗄️ Guia de Implementação - Sistema de Reservas (Banco de Dados)

## 📌 Overview

Este documento descreve como executar o script SQL que cria as tabelas para o sistema de reservas de chaves.

---

## 🚀 Passo a Passo

### 1. Abra o Supabase Console

1. Acesse: https://app.supabase.com
2. Selecione seu projeto `chavesporto`
3. Vá para **SQL EDITOR** (lado esquerdo)

### 2. Execute o Script

1. Clique em **+ New Query**
2. Copie todo o conteúdo de `database/001_create_reservations_tables.sql`
3. Cole no editor
4. Clique em **Run** (ou Ctrl+Enter)

**Esperado:**
```
✅ Success. No rows returned
```

### 3. Verifique as Tabelas Criadas

No **Table Editor** (lado esquerdo), você deve ver:
- ✅ `key_reservations`
- ✅ `key_permissions`
- ✅ `environment_maintenance`
- ✅ `key_availability`

---

## 📋 O Que Foi Criado

### **1. key_reservations** (Tabela Principal)
Armazena solicitações de reserva de chaves.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único da reserva |
| `key_id` | UUID | Referência à chave |
| `instructor_id` | UUID | Instrutor que solicitou |
| `reservation_start_date` | DATE | Data de início (ÚNICO registro para período) |
| `reservation_end_date` | DATE | Data de fim |
| `shift` | TEXT | Turno: matutino, vespertino, noturno, integral |
| `turma` | TEXT | Turma que usará |
| `motivo_detalhado` | TEXT | Por que precisa da chave |
| `status` | TEXT | pending, approved, rejected |
| `rejection_reason` | TEXT | Por que foi rejeitada |
| `approved_by` | UUID | Admin que aprovou |
| `approved_at` | TIMESTAMP | Quando foi aprovada |

**Exemplo:**
```
Reserva ID: abc123
Chave: Lab Python
Instrutor: João Silva
Datas: 20/02/2026 até 07/03/2026 (ÚNICO REGISTRO para todo período)
Turno: matutino
Turma: TEC-2A
Status: pending → approved
```

### **2. key_permissions** (Permissões Pontuais)
Exceções de última hora para um dia específico.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único |
| `key_id` | UUID | Chave autorizada |
| `instructor_id` | UUID | Quem pode usar |
| `permission_date` | DATE | Apenas este dia |
| `shift` | TEXT | Apenas neste turno |
| `authorized_by` | UUID | Admin que autorizou |

**Exemplo:**
```
Permissão urgente para João Silva
Chave: Lab Python
Data: 10/02/2026 (apenas este dia)
Turno: matutino
Admin: Martinez
```

### **3. environment_maintenance** (Manutenção)
Bloqueia chaves durante manutenção.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único |
| `key_id` | UUID | Chave bloqueada |
| `maintenance_start_date` | DATE | Quando inicia |
| `maintenance_end_date` | DATE | Quando termina |
| `motivo_resumido` | TEXT | "Limpeza", "Reparo", etc |
| `created_by` | UUID | Admin que registrou |

**Exemplo:**
```
Lab Python bloqueado
Período: 15-16/02/2026
Motivo: Limpeza da sala
```

### **4. key_availability** (Cache - Performance)
Tabela auxiliar para melhor performance (pode ser gerada automaticamente).

---

## 🔐 Segurança (RLS - Row Level Security)

Foram configuradas políticas de segurança:

✅ **Instrutores**: Veem apenas suas reservas  
✅ **Admins**: Acessam tudo e podem aprovar/rejeitar  
✅ **Permissões**: Apenas admins podem criar permissões  
✅ **Manutenção**: Apenas admins gerenciam  

---

## 🔧 Função SQL Criada

### `is_key_available(key_id, date, shift)`

Verifica se chave pode ser retirada em um dia/turno.

**Exemplo de uso:**
```sql
SELECT is_key_available('550e8400-e29b-41d4-a716-446655440000', '2026-02-10', 'matutino');
-- Retorna: TRUE ou FALSE
```

**Lógica:**
- ❌ Se houver reserva aprovada naquele período → Indisponível
- ❌ Se houver manutenção agendada → Indisponível
- ✅ EXCETO se houver permissão pontual → Disponível

---

## ✅ Checklist Pós-Execução

Após executar o script, verifique:

- [ ] Script executado sem erros
- [ ] 4 tabelas criadas no Supabase
- [ ] Índices criados (melhor performance)
- [ ] RLS habilitado em todas as tabelas
- [ ] Função `is_key_available` funcionando

---

## 🧪 Teste a Função (Opcional)

Para testar se tudo funciona, execute no SQL Editor:

```sql
-- Teste 1: Verificar disponibilidade de uma chave
SELECT is_key_available(
  (SELECT id FROM keys LIMIT 1),  -- primeira chave
  '2026-02-10',
  'matutino'
);

-- Teste 2: Listar todas as chaves
SELECT * FROM keys LIMIT 5;

-- Teste 3: Ver estrutura da tabela
SELECT * FROM key_reservations LIMIT 1;
```

---

## 📞 Próximos Passos

Após confirmar que o banco está criado:

1. **API**: Implementar endpoints (CRUD de reservas)
2. **Frontend Usuário**: Tela de solicitação com calendário
3. **Frontend Admin**: Painel de aprovação
4. **Integração**: Validar reserva antes de retirar chave

---

## ⚠️ Troubleshooting

### Erro: "Syntax error at line X"
→ Verifique se há caracteres inválidos. Recrie a query.

### Erro: "Permission denied"
→ Verifique suas permissões no Supabase (role deve ser admin/owner)

### Tabelas não aparecem
→ Atualize o navegador ou feche e reabra o Supabase Console

---

## 📄 Documentação Técnica

Para queries úteis e exemplos completos, veja o final do arquivo SQL.

**Dúvidas?** Avise! 🚀
