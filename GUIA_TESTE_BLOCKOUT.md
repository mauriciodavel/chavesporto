# 🧪 GUIA DE TESTE - SISTEMA DE BLOQUEIO DE AMBIENTE

## ✅ Pré-requisitos

- [x] Servidor backend rodando: `npm start` no `/backend`
- [x] Supabase conectado e funcional
- [x] Navegador moderno (Chrome, Firefox, Edge)
- [x] SQL Migration executada no Supabase (CRÍTICO)

---

## 🔍 TESTE 1: Verificar Componentes Frontend

### Passo 1: Abrir página normal
```
URL: http://localhost:3000/reservar-chave.html
```

**Verificações:**
- ✅ Calendário carregado
- ✅ Ambientes em dropdown
- ✅ Botão "🔒 Criar Bloqueio" NÃO está visível
- ✅ Dias com reservas aparecem em rosa

### Passo 2: Abrir página em modo admin
```
URL: http://localhost:3000/reservar-chave.html?admin=true
```

**Verificações:**
- ✅ Calendário carregado
- ✅ Botão "🔒 Criar Bloqueio de Ambiente" está visível
- ✅ Botão tem cor laranja
- ✅ Formulário de reservas visível inicialmente

### Passo 3: Clicar no botão toggle
```
Ação: Clique em "🔒 Criar Bloqueio de Ambiente"
```

**Verificações:**
- ✅ Formulário de registro some
- ✅ Formulário de bloqueio aparece com animação
- ✅ Botão muda texto para "← Voltar para Reservas"
- ✅ Card informativo amarelo/laranja visível

---

## 🎯 TESTE 2: Testar Tooltips em Dias Bloqueados

### Passo 1: Selecionar ambiente com bloqueios
```
1. Vá para modo normal (sem ?admin=true)
2. Selecione "Lab-04 - Inovar"
3. Observe o calendário
```

**Verificações:**
- ✅ Alguns dias aparecem em rosa
- ✅ Dias rosa têm ícone 📋 no canto inferior direito
- ✅ Dias rosa têm borda vermelha

### Passo 2: Passar mouse sobre dia bloqueado
```
Ação: Mova mouse sobre um dia rosa
```

**Verificações:**
- ✅ Tooltip aparece acima do dia
- ✅ Tooltip tem:
  - 👨‍🏫 **RESERVADO**
  - **Instrutor**: Nome do instrutor
  - **Turma**: Ambiente/Código
  - **Turno**: Matutino/Vespertino/Noturno
  - **Status**: ✅ Confirmado (texto verde) ou ⏳ Pendente (texto rosa)
- ✅ Tooltip desaparece ao sair do mouse

### Passo 3: Tooltip visual
```
Características observadas:
```

- ✅ Fundo preto
- ✅ Texto em ouro
- ✅ Borda laranja/ouro
- ✅ Sombra suave
- ✅ Transição suave ao aparecer/desaparecer

---

## 🔒 TESTE 3: Criar Novo Bloqueio (Admin)

### Passo 1: Abrir formulário
```
URL: http://localhost:3000/reservar-chave.html?admin=true
Ação: Clique em botão "🔒 Criar Bloqueio de Ambiente"
```

### Passo 2: Preencher formulário
```
Campo 1: Ambiente
├─ Selecione: "Lab-02 - Criar"
│
Campo 2: Data de Início
├─ Selecione: 2026-03-15
│
Campo 3: Data de Término
├─ Selecione: 2026-03-20
│
Campo 4: Turno
├─ Selecione: ⏰ Integral
│
Campo 5: Tipo de Bloqueio
├─ Selecione: 🔧 Manutenção
│
Campo 6: Motivo/Descrição
├─ Digite: "Manutenção preventiva do hardware"
```

### Passo 3: Enviar formulário
```
Ação: Clique em "🔒 Criar Bloqueio"
```

**Verificações:**
- ✅ Loading spinner aparece
- ✅ Botão fica desabilitado
- ✅ Após 2-3 segundos, modal de sucesso aparece
- ✅ Modal mostra: "✅ Bloqueio Criado com Sucesso!"
- ✅ Mensagem: "O bloqueio foi criado para o período de 2026-03-15 a 2026-03-20"

### Passo 4: Formulário reset
```
Verificações:
```

- ✅ Formulário fecha automaticamente
- ✅ Volta para modo de reservas
- ✅ Calendário atualiza
- ✅ Novo período aparece em rosa
- ✅ Ícone 📋 visível nos dias bloqueados

---

## ⚠️ TESTE 4: Validação de Conflitos

### Scenario: Tentar reservar durante bloqueio

```
1. Usuário normal acessa página (sem ?admin=true)
2. Seleciona "Lab-02 - Criar"
3. Observa calendário: dias 15-20 março em rosa (bloqueados)
4. Tenta selecionar período 18-22 março para fazer reserva
```

**Verificações:**
- ✅ Dia 18, 19, 20 estão bloqueados (rosa)
- ✅ Ao tentar clicar, sistema detecta conflito
- ✅ Mensagem de erro: "Erro: Ambiente bloqueado neste período"
- ✅ Reserva NÃO é criada

---

## 🛡️ TESTE 5: Verificações de Segurança

### Admin pode criar, normal não

**Teste A: Sem admin=true**
```
URL: http://localhost:3000/reservar-chave.html
Verificação: Botão "🔒 Criar Bloqueio" NOT visível
```

**Teste B: Com admin=true**
```
URL: http://localhost:3000/reservar-chave.html?admin=true
Verificação: Botão "🔒 Criar Bloqueio" VISÍVEL
```

### Validação de campos obrigatórios

```
1. Abra formulário de bloqueio
2. Deixe campos em branco
3. Tente clicar "🔒 Criar Bloqueio"
```

**Verificações:**
- ✅ Navegador valida campos obrigatórios
- ✅ Um tooltip HTML5 aparece: "Este campo é obrigatório"
- ✅ Foco vai para primeiro campo vazio
- ✅ Envio é blocado até preencher

---

## 📊 TESTE 6: Validações de Data

### Data fim deve ser > data início

```
1. Data início: 2026-03-20
2. Data fim: 2026-03-15 (anterior)
3. Tente criar
```

**Verificações:**
- ✅ Backend retorna erro: "Data de fim deve ser posterior à data de início"
- ✅ Modal de erro aparece
- ✅ Bloqueio NÃO é criado

---

## 🔄 TESTE 7: Múltiplos Bloqueios

### Criar dois bloqueios diferentes

**Bloqueio 1:**
- Ambiente: Lab-02 - Criar
- Período: 15-20 março
- Tipo: Manutenção

**Bloqueio 2:**
- Ambiente: Lab-02 - Criar
- Período: 25-28 março
- Tipo: Evento Interno

**Verificações:**
- ✅ Ambos bloqueios são criados com sucesso
- ✅ Calendário mostra ambos períodos como bloqueados
- ✅ Tooltips mostram informações corretas
- ✅ Tentativa de reservar em qualquer período bloqueado falha

---

## 🔄 TESTE 8: Alternância de Ambientes

### Trocar ambiente e ver bloqueios

```
1. Selecione Lab-02 no dropdown
2. Observe os bloqueios específicos de Lab-02
3. Mude para Lab-04 no dropdown
4. Observe os bloqueios específicos de Lab-04
```

**Verificações:**
- ✅ Bloqueios mudam ao trocar ambiente
- ✅ Calendário atualiza automaticamente
- ✅ Tooltips mostram dados corretos do ambiente

---

## 📱 TESTE 9: Responsividade

### Desktop (1920px)
```
Verificações:
✅ Calendário 7 dias em grid 2 colunas
✅ Formulário com 2 colunas
✅ Tooltips bem posicionados
```

### Tablet (768px)
```
Verificações:
✅ Calendário legível
✅ Formulário com 1 coluna
✅ Botões acessíveis
```

### Mobile (375px)
```
Verificações:
✅ Calendário em stack
✅ Formulário em vertical
✅ Botões full-width
✅ Tooltips não saem da tela
```

---

## 🐛 TESTE 10: Debug & Console

### Abrir Developer Tools

```
Tecla: F12 ou Ctrl+Shift+I
Aba: Console
```

**Verificações:**
- ✅ Nenhuma erro em vermelho
- ✅ Logs informacionais aparecem
- ✅ Nenhum warning crítico

### Verificar dados de bloqueio

```javascript
// Cole no console:
console.log('Bloqueios:', blockedDates);
console.log('Admin mode:', isAdminMode);
console.log('Token:', localStorage.getItem('auth_token')?.substring(0,20) + '...');
```

**Verificações:**
- ✅ Map com bloqueios é exibido
- ✅ Admin mode mostra true ou false correto
- ✅ Token presente (não exibe token completo por segurança)

---

## ✅ Checklist de Teste Completo

| # | Teste | Status | Data |
|-|-------|--------|------|
| 1 | Componentes frontend | [ ] | ___ |
| 2 | Tooltips em dias bloqueados | [ ] | ___ |
| 3 | Criar novo bloqueio | [ ] | ___ |
| 4 | Validação de conflitos | [ ] | ___ |
| 5 | Segurança admin/normal | [ ] | ___ |
| 6 | Validação de datas | [ ] | ___ |
| 7 | Múltiplos bloqueios | [ ] | ___ |
| 8 | Alternância ambientes | [ ] | ___ |
| 9 | Responsividade | [ ] | ___ |
| 10 | Console debug | [ ] | ___ |

---

## 🚀 Comando Rápido para Testar

```powershell
# Terminal 1: Inicie o servidor
cd backend
npm start

# Terminal 2: Deixe rodando, abra navegador
http://localhost:3000/reservar-chave.html?admin=true
```

---

## 📞 Se Algo Falhar

### Página não carrega
```
→ Verifique: npm start está rodando em /backend
→ URL: http://localhost:3000 (não :3001)
```

### Botão toggle não aparece
```
→ Verifique: URL termina com ?admin=true
→ Limpe cache: Ctrl+Shift+Delete
```

### Bloqueio não salva
```
→ Verifique: SQL migration foi executada no Supabase
→ Logs do servidor: procure por erros
```

### Tooltip não aparece
```
→ Abra console: F12
→ Procure por erros de JavaScript
→ Verifique: dados de bloqueio existem
```

---

**Tempo estimado para testes**: ~30 minutos  
**Resultado esperado**: ✅ TODOS OS TESTES PASSAM

