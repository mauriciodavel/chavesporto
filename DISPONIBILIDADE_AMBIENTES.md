# 📅 Página de Disponibilidade de Ambientes

## 📋 Visão Geral

A página de Disponibilidade de Ambientes é um calendário semanal interativo que permite visualizar o status de todos os laboratórios/ambientes de forma rápida e intuitiva.

**Acesso:**
- URL: `/disponibilidade`
- Menu: Menu lateral → "📅 Disponibilidade"
- Disponível para: Administradores e Instrutores

---

## 🎯 Funcionalidades

### 1. **Calendário Semanal**
- Exibição em tabela com 7 colunas (segunda a domingo)
- Navegação entre semanas (botões "Semana Anterior" e "Próxima Semana")
- Mostra a data de cada dia do calendário

### 2. **Lista de Ambientes**
- Primeira coluna lista todos os laboratórios/ambientes
- Ordem alfabética
- Cada linha = um ambiente

### 3. **Status de Disponibilidade**

Cada célula do calendário mostra a disponibilidade de um ambiente em um dia específico:

#### 🟢 **Verde - Ambiente Livre**
```
Emoji: ✅
Texto: "Livre"
Significa: Disponível para reserva ou uso
```

#### 🟣 **Roxo - Reservado**
```
Emoji: 📌
Texto: "Reservado"
Hover mostra: 
  - Nome do instrutor
  - Status da reserva (⏳ Pendente, ✅ Aprovada, ❌ Rejeitada)
  - Turma/classe
Significa: Tem uma reserva ativa para este dia
```

#### 🔴 **Vermelho - Bloqueado**
```
Emoji: 🚫 ou 🔧
Texto: "Bloqueado" ou "Manutenção"
Hover mostra: Tipo de bloqueio (domingo ou motivo da manutenção)
Significa: Não disponível para uso
- Domingos: Sempre bloqueados
- Manutenção: Entre datas especificadas
```

#### 🔵 **Azul - Feriado** (Reservado para futuro)
```
Emoji: 🎉
Texto: "Feriado"
Hover mostra: Nome do feriado
Significa: Feriado brasileiro (não há aulas)
Nota: Não implementado no sistema ainda
```

---

## 🖱️ Interatividade

### Hover (Passar o mouse)
Ao passar o mouse sobre uma célula com status, aparece um **tooltip** com informações detalhadas:

```
┌─────────────────────────────────────┐
│ Instrutor: João Silva               │
│ Status: ✅ Aprovada                 │
│ Turma: SENAI-2A                     │
└─────────────────────────────────────┘
```

### Navegação de Semanas
- **← Semana Anterior**: Move para a semana anterior
- **Próxima Semana →**: Move para a próxima semana
- **Semana Atual**: Mostra a data inicial e final da semana exibida (ex: "07 de abr a 13 de abr")

### Botão de Atalho
- **🔑 Ir para Reservas**: Link direto para a página de reservas ([reservar-chave.html](../frontend/reservar-chave.html))

---

## 🎨 Legenda

A página possui uma legenda clara com 4 cores:

```
Legend:
┌─────────────────────────────────────────────────────┐
│ 🟢 Verde: Ambiente livre                            │
│ 🟣 Roxo: Ambiente reservado                         │
│ 🔴 Vermelho: Bloqueado (domingo/manutenção)        │
│ 🔵 Azul: Feriado (não implementado)                 │
└─────────────────────────────────────────────────────┘
```

---

## 📱 Responsividade

### Desktop (≥1024px)
- Layout completo com sidebar
- Tabela bem dimensionada
- Hover com tooltips

### Tablet (768px - 1024px)
- Sidebar compactado
- Tabela com scroll horizontal se necessário
- Interface adaptada

### Mobile (<768px)
- Sidebar em modo hamburger (se aplicar)
- Tabela com scroll horizontal
- Fontes menores para economizar espaço

---

## 🔧 Endpoints da API

### GET `/api/environments`
Obtém lista de todos os ambientes (laboratórios).

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "environment": "Lab Python",
      "location": "Sala 101",
      "description": "Laboratório de programação em Python"
    },
    {
      "id": "uuid-2",
      "environment": "Lab Java",
      "location": "Sala 102",
      "description": "Laboratório de linguagem Java"
    }
  ]
}
```

### GET `/api/environments/weekly-availability?startDate=YYYY-MM-DD`
Obtém disponibilidade de todos os ambientes para uma semana específica.

**Parâmetros:**
- `startDate` (obrigatório): Data da segunda-feira (formato: YYYY-MM-DD)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "environments": [
      { "id": "uuid-1", "environment": "Lab Python", ... }
    ],
    "reservations": [
      {
        "id": "uuid-res",
        "key_id": "uuid-1",
        "reservation_start_date": "2026-04-10",
        "reservation_end_date": "2026-04-14",
        "status": "approved",
        "turma": "SENAI-2A",
        "instructors": { "name": "João Silva" }
      }
    ],
    "blockouts": [
      {
        "id": "uuid-block",
        "environment_id": "uuid-2",
        "start_date": "2026-04-12",
        "end_date": "2026-04-12",
        "reason": "Limpeza geral"
      }
    ],
    "weekStart": "2026-04-07",
    "weekEnd": "2026-04-13"
  }
}
```

---

## 📊 Fluxo de Dados

```
┌──────────────────────────────┐
│  Página Carrega              │
│  (DOMContentLoaded)          │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│  GET /api/environments/weekly-availability           │
│  (Data da semana como parâmetro)                     │
└────────────┬─────────────────────────────────────────┘
             │
             ├─► Ambientes
             ├─► Reservas aprovadas da semana
             └─► Bloqueios da semana
             │
             ▼
┌──────────────────────────────┐
│  Renderizar Calendário       │
│  - Header com dias/datas     │
│  - Linhas com ambientes      │
│  - Células com status/cores  │
└──────────────────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  Usuário Interage            │
│  - Navega semanas (prev/next) │
│  - Passa mouse (tooltip)     │
│  - Clica em "Ir para Reservas"
└──────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Calendário não carrega
1. Verifique se o servidor backend está rodando
2. Abra console (F12) e procure por erros
3. Verifique se os ambientes estão registrados no banco de dados

### Tooltips não aparecem
1. Certifique-se de que há uma reserva ou bloqueio para o ambiente
2. Passe o mouse sobre uma célula com reserva (roxo)

### Cores erradas
1. Verifique CSS em `<style>` tag
2. Cores são definidas por classes: `.day-free`, `.day-reserved`, `.day-blocked`

---

## 🔐 Permissões

- **Admin**: Acesso completo
- **Instrutor**: Acesso completo
- **Não autenticado**: Acesso negado (redireciona para login)

---

## 📝 Arquivo Principal

- **Frontend:** [frontend/disponibilidade-ambientes.html](../frontend/disponibilidade-ambientes.html)
- **Backend Controller:** [backend/controllers/environmentController.js](../backend/controllers/environmentController.js)
- **Backend Routes:** [backend/routes/environments.js](../backend/routes/environments.js)

---

## 🎯 Casos de Uso

### Caso 1: Consultar disponibilidade geral
```
Admin/Instrutor abre a página de disponibilidade
→ Vê calendário da semana atual
→ Identifica ambientes livres (verde)
→ Identificar quais estão em manutenção (vermelho)
```

### Caso 2: Reservar um ambiente
```
Instrutor vê no calendário que Lab Python está livre na terça
→ Clica em "Ir para Reservas"
→ Vai para formulário de reser va
→ Faz reserva para terça-feira
```

### Caso 3: Verificar status de reserva
```
Admin monitora reservas via calendário
→ Vê ambiente marcado em roxo
→ Passa mouse para ver detalhes
→ Verifica: Status (aprovada/pendente), turma, instrutor
```

---

## 🚀 Futuras Melhorias

- [ ] Integração com feriados brasileiros (banco de dados)
- [ ] Visualização de múltiplas semanas (modo mês)
- [ ] Filtros por ambiente ou status
- [ ] Exportação para PDF/Excel
- [ ] Indicador de tempo real (destaque dia atual)
- [ ] Atalho para criar reserva diretamente do calendário
- [ ] Notificações visuais para atualizações em tempo real

---

## 📞 Contato

Para dúvidas sobre a página de disponibilidade, consulte:
- [ARQUITETURA.md](../ARCHITECTURE.md)
- [README.md](../README.md)
