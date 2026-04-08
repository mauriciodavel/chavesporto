# 🚀 Guia Rápido: Página de Disponibilidade de Ambientes

## ⚡ Acesso Rápido

| O que | Como |
|-------|------|
| **Abrir página** | Clique em "📅 Disponibilidade" no menu lateral OU acesse `/disponibilidade` |
| **Voltar para reservas** | Clique no botão "🔑 Ir para Reservas" |
| **Ver detalhes** | Passe o mouse sobre uma célula (aparce tooltip) |
| **Semana anterior** | Clique "← Semana Anterior" |
| **Próxima semana** | Clique "Próxima Semana →" |

---

## 🎨 Cores e Significados

```
┌────────────────────────────────────────┐
│ Cor      │ Status           │ Ação     │
├──────────├──────────────────┼──────────┤
│ 🟢 Verde │ Livre/Disponível │ Reservar │
│ 🟣 Roxo  │ Reservado        │ Ver info │
│ 🔴 Vermelho│ Bloqueado       │ Nenhuma  │
└────────────────────────────────────────┘
```

---

## 📅 Exemplo de Uso

**Cenário:** Você quer saber se "Lab Python" está disponível na terça-feira que vem.

**Passos:**
1. Abra a página de disponibilidade
2. Procure "Lab Python" na primeira coluna
3. Olhe para a coluna "Terça"
4. Se verde ✅ → Disponível! Clique em "Ir para Reservas" para cadastrar um
5. Se roxo 📌 → Já tem reserva. Passe o mouse para ver quem reservou
6. Se vermelho 🚫 → Bloqueado. Não pode usar

---

## 💡 Dicas

### Dica 1: Domingos sempre bloqueados
- Toda coluna de domingo (7º dia) é sempre vermelha 🚫
- Você não pode reservar ambientes no domingo
- Sistema bloqueia automaticamente

### Dica 2: Ver informações da reserva
```
Ambiente em roxo → Passe mouse
│
↓
Aparece caixa com:
├─ Nome do instrutor
├─ Status (Pendente/Aprovada/Rejeitada)
└─ Turma/classe
```

### Dica 3: Navegar semanas rapidamente
- Use os botões "← Semana Anterior" e "Próxima Semana →"
- A data exibida no meio mostra qual semana está vendo
- Todos os dados são atualizados automaticamente

### Dica 4: Manutenção/Bloqueios
- Se vir 🔧 em vermelho = manutenção do ambiente
- Passe mouse para ver motivo
- Exemplo: "Limpeza geral" ou "Reparo de equipamento"

---

## ❓ Perguntas Frequentes

### P: Por que domingo é sempre bloqueado?
**R:** Porque não há aulas no domingo. Sistema bloqueia automaticamente para evitar reservas.

### P: Consigo reservar pela página de disponibilidade?
**R:** Não, a página é apenas para **consulta**. Clique em "🔑 Ir para Reservas" para fazer a reserva.

### P: As informações são atualizadas em tempo real?
**R:** Sim, cada vez que você carrega a página ou navega uma semana, os dados mais recentes são buscados.

### P: Consigo ver feriados aqui?
**R:** Não ainda. No futuro, feriados aparecerão em azul.

### P: Por que a página está vazia?
**R:** Significa que não há ambientes cadastrados no banco de dados. Adicione ambientes primeiro.

### P: Preciso estar autenticado para ver?
**R:** Sim, apenas admins e instrutores podem acessar. Não autenticados vão para login.

---

## 🎯 Fluxo Típico

```
┌─────────────────────────────────────────┐
│  1. Abrir "Disponibilidade"             │
│     (Menu lateral → 📅 Disponibilidade) │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  2. Ver calendário da semana            │
│     - Primeira coluna: ambientes        │
│     - Outras colunas: dias (Seg-Dom)    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  3. Identificar status (cor)            │
│     🟢 Verde → Livre                    │
│     🟣 Roxo → Reservado                 │
│     🔴 Vermelho → Bloqueado             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  4. (Opcional) Passar mouse para mais   │
│     informações (tooltip)               │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  5. (Opcional) Clicar "Ir para Reservas"│
│     se quiser fazer uma nova reserva    │
└─────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Página branca | Aguarde carregar (vê "Carregando...") ou refresh F5 |
| Nenhum ambiente | Administrador deve cadastrar ambientes primeiro |
| Tooltip não aparece | Passe mouse sobre célula roxo (reservada) |
| Cores erradas | Limpe cache (Ctrl+Shift+Del) e reload |
| Não consigo acessar | Faça login primeiro |

---

## 📱 Em Celular/Tablet

- A tabela pode ter scroll horizontal (deslize para os lados)
- Toque para ver tooltips no lugar do mouse
- Menu lateral pode virar hamburguer (≡)
- Botões de navegação compactos

---

## 🎓 Exemplos de Interpretação

### Exemplo 1: Lab Python - Segunda-feira
```
Status: 🟢 Verde
Interpretação: Livre/Disponível
Ação: Clique em "Ir para Reservas" para reservar
```

### Exemplo 2: Lab Java - Terça-feira
```
Célula: Roxo (🟣) com "📌 Reservado"
Mouse over: 
  Instrutor: Maria Silva
  Status: ✅ Aprovada
  Turma: SENAI-1A
Interpretação: Tem uma aula de Maria na terça
Ação: Nenhuma (já está reservado)
```

### Exemplo 3: Lab C/C++ - Quarta-feira
```
Status: 🔴 Vermelho com "🔧 Manutenção"
Mouse over: "Limpeza geral"
Interpretação: Está em manutenção/limpeza
Ação: Nenhuma (não pode usar ou reservar)
```

---

## 🔗 Links Úteis

- [Documentação Completa](DISPONIBILIDADE_AMBIENTES.md)
- [Página de Reservas](frontend/reservar-chave.html)
- [Painel de Ambientes](frontend/painel-ambientes.html)

---

## ✅ Checklist de Uso

- [ ] Conseguiu abrir a página
- [ ] Vê ambientes listados
- [ ] Consegue navegar semanas
- [ ] Entende as cores
- [ ] Conseguiu passar mouse (tooltip)
- [ ] Conseguiu clicar em "Ir para Reservas"

Se todos ✅, está tudo funcionando! 🎉

---

**Última atualização:** 2026-04-07
**Versão:** 1.0
