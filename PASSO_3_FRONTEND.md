# 🎨 Passo 3: Frontend de Reservas

## ✅ O que Foi Criado

### 1️⃣ **reservar-chave.html** - Página para Usuários
Uma interface completa para fazer reservas com:
- **Calendário interativo** para selecionar período
- **Seletor de chaves** (carrega do banco)
- **Escolha de turno** com horários
- **Campo de motivo** para justificativa
- **Lista de minhas reservas** com status em tempo real
- **Validações** de datas e campos obrigatórios

### 2️⃣ **admin-reservas.html** - Dashboard do Admin
Interface para gerenciar aprovações com:
- **Filtros** por status e turno
- **Estatísticas** (pendentes, aprovadas, rejeitadas)
- **Cards visuais** de cada reserva
- **Botões de aprovar/rejeitar** diretos
- **Modal de rejeição** com campo de motivo
- **Atualização em tempo real**

---

## 🚀 Como Testar

### Pré-requisitos
1. ✅ Servidor rodando: `npm run dev`
2. ✅ Estar logado como usuário (instructor)
3. ✅ API de reservas funcionando

### Fluxo de Teste Completo

#### **PASSO 1: Usuário Faz uma Reserva**

1. Abra seu navegador e acesse: `http://localhost:3000/reservar-chave.html`
2. Você será redirecionado para login se não tiver token
3. **Faça login** com credenciais de instructor
4. **Preencha o formulário:**
   - Selecione uma chave (ex: "Chave Sala Lab 001")
   - Clique em datas no calendário (data inicial e final)
   - Escolha um turno (☀️ Matutino, 🌤️ Vespertino, etc)
   - Preencha a turma (ex: "SENAI-001")
   - Escreva o motivo da reserva
5. **Clique em "Solicitar Reserva"** ✅
6. Você verá sua reserva aparecer em "Minhas Reservas" com status **⏳ Pendente**

#### **PASSO 2: Admin Aprova a Reserva**

1. Faça logout
2. Faça login como **admin** com:
   - Email: `admin@senai.com.br`
   - Senha: `admin123`
3. Acesse: `http://localhost:3000/admin-reservas.html`
4. Você verá a reserva do usuário no status **Pendente**
5. **Clique em "✅ Aprovar"** para aprovar
6. ✅ Status muda para **Aprovada**

#### **PASSO 3: Testar Rejeição**

1. No dashboard de admin, crie/veja outra reserva pendente
2. **Clique em "❌ Rejeitar"**
3. Uma modal aparecerá pedindo motivo
4. Escreva um motivo (ex: "Sala em manutenção nesse período")
5. **Clique em "Confirmar"**
6. ✅ Status muda para **Rejeitada** com o motivo

#### **PASSO 4: Usuário Vê Resultado**

1. Faça logout como admin
2. Faça login novamente como o usuário que criou a reserva
3. Acesse: `http://localhost:3000/reservar-chave.html`
4. Em "Minhas Reservas" você verá:
   - Se foi **Aprovada** ✅
   - Se foi **Rejeitada** ❌ (com motivo da rejeição)

---

## 📊 Estrutura das Páginas

### **Página de Reserva (reservar-chave.html)**

```
┌─────────────────────────────────────────┐
│    Navbar: 🔑 Chavesporto               │
├─────────────────────────────────────────┤
│                                          │
│  Título: 📅 Reservar Chave              │
│                                          │
│  [Seletor de Chave] [Turma]             │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │     Calendário Interativo        │   │
│  │  ← Fev 2026 →                   │   │
│  │  Do Se Te Qu Qu Se Sa           │   │
│  │  ...                            │   │
│  │  [15] [16] [17] ...             │   │
│  │  Clique para selecionar período │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Turno:  [☀️ Mat] [🌤️ Vesp] [🌙 Not]  │
│                                          │
│  Motivo: [________________]             │
│                                          │
│  [✅ Solicitar] [🔄 Limpar]             │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  📋 Minhas Reservas              │   │
│  │                                  │   │
│  │  ┌────────────────────────────┐  │   │
│  │  │ Chave: Lab 001             │  │   │
│  │  │ Período: 15/02 até 20/02   │  │   │
│  │  │ Status: ⏳ Pendente        │  │   │
│  │  └────────────────────────────┘  │   │
│  └──────────────────────────────────┘   │
│                                          │
└─────────────────────────────────────────┘
```

### **Dashboard de Admin (admin-reservas.html)**

```
┌─────────────────────────────────────────┐
│  Navbar: 🔑 Chavesporto - Admin         │
├─────────────────────────────────────────┤
│                                          │
│  Título: 📋 Gerenciar Reservas [🔄]    │
│                                          │
│  Filtros: [Status ▼] [Turno ▼]        │
│                                          │
│  ┌─────────┬─────────┬─────────┐       │
│  │ ⏳ Pend  │ ✅ Aprov│ ❌ Rej │       │
│  │   5     │   3     │   1     │       │
│  └─────────┴─────────┴─────────┘       │
│                                          │
│  ┌──────────┐ ┌──────────┐             │
│  │Chave: Lab│ │Chave: Lab│             │
│  │Instrutor:│ │Instrutor:│             │
│  │João      │ │Maria     │             │
│  │Pe: 15-20 │ │Pe: 10-15 │             │
│  │Status:   │ │Status:   │             │
│  │⏳Pendente│ │✅Aprovada│             │
│  │[✅][❌]  │ │          │             │
│  └──────────┘ └──────────┘             │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🔧 Funcionalidades Técnicas

### **Calendário**
- ✅ Bloqueia datas passadas
- ✅ Permite selecionar intervalo (data inicial e final)
- ✅ Mostra preview do período selecionado
- ✅ Navegação entre meses

### **Validações**
- ✅ Campos obrigatórios
- ✅ Período com data inicial e final obrigatória
- ✅ Turno obrigatório
- ✅ Mensagens de erro claras

### **Estado da API**
- ✅ Carrega chaves do banco dinamicamente
- ✅ Envia reserva com dados corretos
- ✅ Atualiza lista em tempo real
- ✅ Trata erros com feedback visual

### **Autenticação**
- ✅ Verifica token antes de abrir página
- ✅ Redireciona para login se não autenticado
- ✅ Logout limpa token e cookies

---

## 💾 Dados Enviados

### Criar Reserva (POST /api/reservations)
```json
{
  "key_id": "uuid-da-chave",
  "instructor_id": "seu-uuid",
  "start_date": "2026-02-15",
  "end_date": "2026-02-20",
  "shift": "matutino",
  "turma": "SENAI-001",
  "motivo_detalhado": "Aula prática",
  "created_by_admin": false
}
```

### Aprovar Reserva (PATCH /api/reservations/:id/approve)
```json
{}
```

### Rejeitar Reserva (PATCH /api/reservations/:id/reject)
```json
{
  "rejection_reason": "Sala em manutenção"
}
```

---

## 🎯 Próximos Passos

### ✅ Passo 3 (Frontend) Completo!

Agora você tem:
1. ✅ Página de reserva com calendário
2. ✅ Dashboard de admin com aprovação/rejeição
3. ✅ Integração com APIs
4. ✅ Fluxo completo de reservas

### 📋 Passo 4: Integração com Retirada (Próximo)
- Vincular reserva aprovada ao ato de retirada
- Validar se usuário pode retirar (dentro do período)
- Registrar retirada e devolução

### 🚀 Passo 5: Melhorias Opcionais
- Notificações por email em tempo real
- Histórico de reservas
- Relatórios de uso
- Integração com Google Calendar

---

## ❓ Dúvidas Frequentes

**P: Onde vejo as chaves disponíveis?**
A: Elas são carregadas automaticamente do banco. Certifique-se de ter chaves cadastradas.

**P: A data passada aparece no calendário?**
A: Não! Datas passadas são desabilitadas automaticamente.

**P: Como a aprovação é feita?**
A: Admin clica no botão "✅ Aprovar" direto no card da reserva.

**P: Onde vejo o status da minha reserva?**
A: Em "Minhas Reservas" na página do usuário, com atualização automática.

---

## 🛠️ Troubleshooting

| Problema | Solução |
|----------|---------|
| Chaves não aparecem | Certifique-se de ter inserido chaves no banco |
| Token expirado | Faça login novamente |
| Erro ao submeter | Preencha todos os campos obrigatórios |
| Admin não vê reservas | Verifique se está logado como admin (role = 'admin') |
| Calendário não funciona | Limpe o cache do navegador (Ctrl+Shift+Del) |

---

Pronto! 🎉 Você tem agora um sistema completo de reservas de chaves com frontend funcional!
