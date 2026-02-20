# 🎨 Guia Visual - Bloqueios Cadastrados

##📍 Localização da Página
```
http://localhost:3000/admin-blockouts
```

---

## 📐 Estrutura da Página

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Voltar ao Admin                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NOVO BLOQUEIO                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Tipo de Data: ◉ Um dia  ○ Período                       │  │
│  │ • Data: [YYYY-MM-DD]                                      │  │
│  │ • Turno: [-- Dia inteiro --▼]                             │  │
│  │ • Motivo do Bloqueio:                                     │  │
│  │   ◉ 🇧🇷 Feriado Nacional                                  │  │
│  │   ○ 🏴 Feriado Estadual                                   │  │
│  │   ○ 🏙️ Feriado Municipal                                  │  │
│  │ • Observação: [Descrição do motivo...]                    │  │
│  │ • Cor: [Color Picker]                                     │  │
│  │ [✅ Criar Bloqueio]                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  └─────────────────────────────────────────────────────────┘   │
│     Legenda:                                                     │
│     • 🇧🇷 - Feriado Nacional (#DC3545)                       │
│     • 🏴 - Feriado Estadual (#FD7E14)                        │
│     • 🏙️ - Feriado Municipal (#6F42C1)                      │
│     💡 Dica: Os bloqueios aparecem no calendário...           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BLOQUEIOS CADASTRADOS                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 FILTROS                                                │  │
│  │                                                           │  │
│  │ Tipo de Bloqueio          │  Período                      │  │
│  │ ┌─────────────────────┐   │  ┌────────────┬────────────┐ │  │
│  │ │ ◉ Todos os tipos    │   │  │Data Inicial│Data Final  │ │  │
│  │ │ ○ Feriado Nacional  │   │  │[YYYY-MM-DD]│[YYYY-MM-DD]│ │  │
│  │ │ ○ Feriado Estadual  │   │  │            │            │ │  │
│  │ │ ○ Feriado Municipal │   │  └────────────┴────────────┘ │  │
│  │ └─────────────────────┘   │  [🔄 Limpar Filtros]        │  │
│  │                           │                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Mostrando 15 de 55 bloqueio(s)                                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Período    │ Turno         │ Tipo      │ Observação    │   │  │
│  ├─────────────┼───────────────┼───────────┼────────────────┤  │
│  │ 01/01/2026 │ Dia inteiro   │ 🇧🇷 Brasil │ Ano Novo      │   │
│  │ 02/13/2026 │ Dia inteiro   │ 🏴 Estado  │ Sexta-feira.. │   │
│  │ ...         │ ...           │ ...       │ ...           │   │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎛️ Seção de Filtros (NOVA)

### Design
- 🎨 Fundo escuro (#2a2a2a)
- 🟠 Título "FILTROS" em laranja (#FF8C00)
- 📱 Layout de 2 colunas em resolução desktop

### Opções de Tipo
```
Tipo de Bloqueio
┌──────────────────────┐
│ ◉ Todos os tipos     │  (padrão selecionado)
│ ○ 🇧🇷 Feriado Naci...│
│ ○ 🏴 Feriado Estadu..│
│ ○ 🏙️ Feriado Municip..│
└──────────────────────┘
```

### Filtros de Data
```
Período
┌────────────────┬────────────────┐
│ Data Inicial   │ Data Final     │
│ [YYYY-MM-DD]   │ [YYYY-MM-DD]   │
└────────────────┴────────────────┘
[🔄 Limpar Filtros]
```

---

## 🔄 Comportamento dos Filtros

### Exemplo 1: Filtrar por Tipo
```
Ação: Clique em "🇧🇷 Feriado Nacional"
Resultado:
  Antes: Mostrando 55 de 55 bloqueio(s)
  Depois: Mostrando 45 de 55 bloqueio(s)  ← Apenas Nacionais
```

### Exemplo 2: Filtrar por Período
```
Ação: 
  Data Inicial: 2026-02-01
  Data Final: 2026-02-28

Resultado: Mostrando 8 de 55 bloqueio(s)  ← Apenas Fevereiro
```

### Exemplo 3: Combinação
```
Ação:
  Tipo: 🏴 Feriado Estadual
  Período: 2026-02 a 2026-03

Resultado: Mostrando 3 de 55 bloqueio(s)  ← Estaduais em Fev/Mar
```

### Limpar Filtros
```
Ação: [🔄 Limpar Filtros]
Resultado:
  • "Todos os tipos" selecionado
  • Campos de data vazios
  • Volta a mostrar 55 bloqueios
```

---

## 📊 Tabela de Bloqueios

### Colunas
| Período | Turno | Tipo | Observação | Adicionado por | Ações |
|---------|-------|------|-----------|----------------|-------|
| Intervalo de datas | Matutino/Vespertino/Noturno/Integral/Dia inteiro | Icone + Nome | Descrição | Nome do Admin | 🗑️ Deletar |

### Indicador de Resultado
```
Mostrando X de Y bloqueio(s)
```

- **X** = quantidade com filtros aplicados
- **Y** = quantidade total no banco

---

## 📱 Responsividade

### Desktop (1200px+)
- Filtros lado a lado (2 colunas)
- Tabela completa com scroll horizontal se necessário

### Tablet (768px-1199px)
- Filtros empilhados adaptam
- Tabela com scroll

### Mobile (< 768px)
- Filtros em coluna única
- Tabela em grid responsivo
- Radio buttons em coluna

---

## 🎨 Cores Utilizadas

| Elemento | Cor | Código |
|----------|-----|--------|
| Fundo da Página | Preto Escuro | #1a1a1a |
| Fundo Filtros | Cinza Escuro | #2a2a2a |
| Fundo Input | Cinza Mais Escuro | #3a3a3a |
| Texto | Branco Claro | #f0f0f0 |
| Título Filtros | Laranja | #FF8C00 |
| Hover Buttons | Laranja Escuro | #ff7600 |
| Borda Padrão | Cinza | #444 |
| Borda Hover | Laranja | #FF8C00 |

---

## ⚡ Performance & Comportamento

### Carregamento Inicial
```
1. Página abre
2. JS executa DOMContentLoaded
3. Verifica autenticação
4. Inicia carregamento de bloqueios
5. Mostra: ⏳ Carregando bloqueios...
6. Após ~500ms: Tabela aparece com dados
```

### Ao Aplicar Filtro
```
1. Usuário muda seleção
2. Função applyFilters() é chamada
3. Filtra dados em memória
4. Renderiza tabela atualizada
5. Atualiza contador
Tempo total: ~50ms (instantâneo para usuário)
```

### Se Houver Erro
```
Erro ao carregar bloqueios
❌ Erro específico aqui
Debug: Abra o console (F12) para mais detalhes.
[🔄 Tentar Novamente]
```

---

## 🧪 Casos de Uso

### Caso 1: Verificar todos os bloqueios
1. Abra a página
2. Todos os 55 bloqueios aparecem por padrão

### Caso 2: Ver apenas feriados de um estado
1. Selecione "🏴 Feriado Estadual"
2. Tabela filtra automaticamente

### Caso 3: Planejar com base em datas
1. Preencha "Data Inicial: 2026-02-01"
2. Preencha "Data Final: 2026-02-28"
3. Veja bloqueios de fevereiro

### Caso 4: Criar novo bloqueio e ver na tabela
1. Preencha o formulário "Novo Bloqueio"
2. Clique "✅ Criar Bloqueio"
3. ✅ Bloqueio criado com sucesso!
4. Automaticamente recarrega e mostra na tabela

### Caso 5: Deletar bloqueio
1. Na tabela, clique [🗑️ Deletar]
2. Modal: "Tem certeza?"
3. Clique [Deletar]
4. ✅ Bloqueio deletado com sucesso!
5. Tabela atualiza automaticamente

---

## 💡 Dicas de Uso

- **Filtro rápido**: Use apenas tipo OU apenas data
- **Filtro avançado**: Combine tipo + período
- **Busca específica**: Faça várias combinações
- **Sempre visualize**: Clique "Limpar Filtros" para voltar ao início
- **Debug**: Abra F12 se houver problemas para ver logs

---

**Versão**: 1.0  
**Data**: 18/02/2026  
**Status**: ✅ Pronto para Produção
