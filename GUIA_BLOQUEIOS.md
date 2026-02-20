# 📅 Sistema de Bloqueios de Calendário

## ✅ O que foi implementado

### 1. **Backend - Banco de Dados**
- **Tabela**: `calendar_blockouts`
- **Campos**:
  - `id` (UUID): Identificador único
  - `blockout_date`: Data única do bloqueio
  - `blockout_start_date`: Data inicial do período
  - `blockout_end_date`: Data final do período
  - `shift`: Turno opcional (matutino, vespertino, noturno, integral, ou NULL para dia inteiro)
  - `blockout_type`: Tipo de bloqueio (enum)
  - `color`: Cor personalizada (opcional)
  - `observation`: Descrição do motivo
  - `created_by`: ID do admin que criou
  - `created_at`, `updated_at`: Timestamps

- **Tipos de bloqueio disponíveis**:
  - `maintenance` (Manutenção) - 🔧 #FFC107
  - `external_event` (Evento Externo) - 🏢 #17A2B8
  - `internal_event` (Evento Interno) - 📢 #6C63FF
  - `national_holiday` (Feriado Nacional) - 🇧🇷 #DC3545
  - `state_holiday` (Feriado Estadual) - 🏴 #FD7E14
  - `municipal_holiday` (Feriado Municipal) - 🏙️ #6F42C1

- **Arquivo SQL**: `/database/003_create_calendar_blockouts.sql`

### 2. **Backend - API**

#### Rotas Disponíveis

**GET** `/api/blockouts`
- Lista todos os bloqueios
- Acesso: Público
- Resposta:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "blockout_start_date": "2026-02-15",
        "blockout_end_date": "2026-02-16",
        "shift": null,
        "blockout_type": "maintenance",
        "observation": "Limpeza da sala",
        "color": null,
        "created_by": "uuid"
      }
    ]
  }
  ```

**GET** `/api/blockouts/date/:date?shift=matutino`
- Verifica bloqueios para uma data específica
- Params:
  - `date` (required): Data em formato YYYY-MM-DD
  - `shift` (query, opcional): Turno específico
- Resposta:
  ```json
  {
    "success": true,
    "data": [...],
    "blocked": true
  }
  ```

**GET** `/api/blockouts/date-range?start=2026-02-01&end=2026-02-28`
- Bloqueios em um período
- Query params:
  - `start`: Data inicial (YYYY-MM-DD)
  - `end`: Data final (YYYY-MM-DD)

**POST** `/api/blockouts` (Admin only)
- Criar novo bloqueio
- Body:
  ```json
  {
    "blockout_date": "2026-02-17",           // Para single-day
    "blockout_start_date": "2026-02-15",     // Para período
    "blockout_end_date": "2026-02-20",       // Para período
    "shift": null,
    "blockout_type": "maintenance",
    "observation": "Manutenção do ar condicionado",
    "color": null                            // Opcional, usa padrão se não fornecer
  }
  ```

**PUT** `/api/blockouts/:id` (Admin only)
- Atualizar bloqueio existente

**DELETE** `/api/blockouts/:id` (Admin only)
- Deletar bloqueio

**GET** `/api/blockouts/color-map`
- Mapa de cores padrão para cada tipo de bloqueio

### 3. **Frontend - Página de Admin**

**URL**: `/admin-blockouts`
**Arquivo**: `/frontend/admin-blockouts.html`

#### Funcionalidades:
- ✅ Formulário para criar novo bloqueio
  - Seleção de data única ou período
  - Seleção de turno (opcional)
  - Escolha de tipo de bloqueio com cores visuais
  - Campo de observação
  - Opção de cor personalizada
- ✅ Tabela listando todos os bloqueios
- ✅ Ações: Deletar bloqueio
- ✅ Legenda de cores
- ✅ Validações de data

#### Acesso ao Menu:
1. Ir para http://localhost:3000/admin.html
2. Clicar em "🔒 Bloqueios" na barra lateral

### 4. **Frontend - Integração com Calendários**

#### Calendário de Reservas (Instrutor/Admin)
**Arquivo**: `/frontend/reservar-chave.html`

#### Integração:
- ✅ Bloqueios carregados ao abrir a página
- ✅ Dias bloqueados mostram:
  - Cor na borda superior (border-top)
  - Indicador visual (pequeno círculo branco)
  - Desabilitado (not-allowed cursor)
  - Opacidade reduzida (0.7)
- ✅ Tooltip ao passar o mouse:
  - Tipo de bloqueio com ícone
  - Observação completa
  - Fundo preto com texto branco

#### Bloqueios Priorários:
1. **Primeiro**: Bloqueios de calendário (calendarBlockouts)
2. **Depois**: Bloqueios por reservas (blockedDates - só pra admin)

---

## 🚀 Como Usar

### Passo 1: Criar a tabela no banco de dados

Você tem duas opções:

#### Opção A: SQL direto (Via Supabase)
1. Acesse o [Supabase Dashboard](https://supabase.com)
2. Vá para sua tabela (chavesporto)
3. Clique em "SQL Editor"
4. Execute o arquivo: `/database/003_create_calendar_blockouts.sql`

#### Opção B: Via script Node.js
```bash
cd backend
node scripts/populate-sundays.js
```

### Passo 2: Popular domingos automaticamente

Execute o script:
```bash
cd backend
node scripts/populate-sundays.js
```

O script vai:
- ✅ Encontrar todos os domingos de 2026
- ✅ Criar bloqueios automáticos para cada domingo
- ✅ Tipo: "national_holiday" (Feriado Nacional)
- ✅ Cor: Vermelho (#DC3545)

### Passo 3: Acessar a página de admin

1. Faça login em http://localhost:3000/login.html com conta admin
2. Clique em "🔒 Bloqueios" na barra lateral
3. Crie um novo bloqueio:
   - Selecione "📅 Um dia" para bloquear um dia específico
   - Ou "📆 Período" para range de datas
   - Escolha o tipo (Manutenção, Evento, Feriado, etc)
   - Adicione observação
   - Clique em "✅ Criar Bloqueio"

### Passo 4: Ver bloqueios no calendário de reservas

1. Vá para http://localhost:3000/reservar-chave
2. Observe que:
   - Domingos agora aparecem com borda vermelha
   - Outros bloqueios aparecem com suas cores
   - Ao passar o mouse vê a descrição completa

---

## 📊 Estrutura de Dados

### Fluxo de Dados:

```
Admin cria bloqueio no /admin-blockouts
         ↓
POST /api/blockouts (com validação de admin)
         ↓
Insere em calendar_blockouts no Supabase
         ↓
Frontend carrega via GET /api/blockouts
         ↓
Renderiza no calendário com cores e tooltips
         ↓
Instructor/Admin vê bloqueios ao reservar
         ↓
Sistema impede seleção de dias bloqueados
```

---

## 🔔 Validações

### No Backend:
- ✅ Apenas admins podem criar/editar/deletar bloqueios
- ✅ Data inicial não pode ser posterior a data final
- ✅ Tipo de bloqueio deve ser válido (enum)
- ✅ Observação é obrigatória
- ✅ Campo de cor é opcional (usa padrão se não fornecer)

### No Frontend:
- ✅ Data mínima: hoje
- ✅ Impede seleção de dias bloqueados
- ✅ Tooltip mostra informações ao passar mouse
- ✅ Validação de datas antes de submeter

---

## 🎨 Cores Padrão

| Tipo | Cor | Ícone |
|------|-----|-------|
| Manutenção | #FFC107 (Amarelo) | 🔧 |
| Evento Externo | #17A2B8 (Azul) | 🏢 |
| Evento Interno | #6C63FF (Roxo) | 📢 |
| Feriado Nacional | #DC3545 (Vermelho) | 🇧🇷 |
| Feriado Estadual | #FD7E14 (Laranja) | 🏴 |
| Feriado Municipal | #6F42C1 (Roxo Escuro) | 🏙️ |

---

## 📝 Exemplos

### Exemplo 1: Bloquear um único dia para manutenção
```json
POST /api/blockouts
{
  "blockout_date": "2026-02-28",
  "blockout_start_date": "2026-02-28",
  "blockout_end_date": "2026-02-28",
  "shift": null,
  "blockout_type": "maintenance",
  "observation": "Manutenção do ar condicionado na sala 101"
}
```

### Exemplo 2: Bloquear período completo para evento interno
```json
POST /api/blockouts
{
  "blockout_start_date": "2026-03-15",
  "blockout_end_date": "2026-03-17",
  "shift": null,
  "blockout_type": "internal_event",
  "observation": "Semana Acadêmica - Laboratórios fechados",
  "color": null
}
```

### Exemplo 3: Bloquear turno específico
```json
POST /api/blockouts
{
  "blockout_date": "2026-02-20",
  "blockout_start_date": "2026-02-20",
  "blockout_end_date": "2026-02-20",
  "shift": "matutino",
  "blockout_type": "external_event",
  "observation": "Visita técnica - Turno matutino indisponível",
  "color": "#17A2B8"
}
```

---

## 🛠️ Troubleshooting

### Bloqueios não aparecem no calendário
- [ ] Verificar se GET /api/blockouts retorna dados
- [ ] Verificar se `loadCalendarBlockouts()` é chamada na inicialização
- [ ] Verificar console para erros

### Não consigo criar bloqueios
- [ ] Verificar se está logado como admin
- [ ] Verificar se token está correto em localStorage
- [ ] Verificar resposta do POST /api/blockouts (erros 401 = não autorizado, 400 = dados inválidos)

### Domingos não foram bloqueados automaticamente
- [ ] Executar script: `node scripts/populate-sundays.js`
- [ ] Verificar se existe um admin no banco de dados
- [ ] Verificar logs do script para erros

---

## 📱 Responsividade

A página de admin é totalmente responsiva:
- ✅ Desktop (1200px+): 2 colunas (formulário + legenda)
- ✅ Tablet (768px+): 1 coluna
- ✅ Mobile: Layout otimizado touch

---

## 🔐 Segurança

- ✅ RLS policies ativadas no Supabase
- ✅ Apenas admins podem gerenciar bloqueios
- ✅ Validação de autorização no backend (middleware auth.requireAdmin)
- ✅ Tokens JWT para autenticação
- ✅ Validação de entrada (data, tipos enum, etc)

---

## 🔄 Próximas Melhorias Sugeridas

1. **Edição de bloqueios**: Adicionar botão "Editar" na tabela
2. **Filtros**: Filtrar bloqueios por tipo ou data
3. **Recorrência**: Bloquear automaticamente domingos/feriados
4. **Conflito de reservas**: Avisar se há reservas em dias bloqueados
5. **Relatórios**: Gerar relatórios de bloqueios/impacto
6. **Integração com feriados**: Pull automático de feriados brasileiros

---

## 📂 Arquivo criado/modificado

### Novos:
- ✅ `/database/003_create_calendar_blockouts.sql` - Schema SQL
- ✅ `/backend/controllers/blockoutController.js` - Controllers
- ✅ `/backend/routes/blockouts.js` - Rotas
- ✅ `/backend/scripts/populate-sundays.js` - Script populador
- ✅ `/frontend/admin-blockouts.html` - Página de admin

### Modificados:
- ✅ `/backend/server.js` - Adicionadas rotas e página
- ✅ `/frontend/admin.html` - Link no menu
- ✅ `/frontend/reservar-chave.html` - Integração de bloqueios
