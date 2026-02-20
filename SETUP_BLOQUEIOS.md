# 🔧 Setup do Sistema de Bloqueios - Passo a Passo

## ⚡ Resumo Rápido

Você tem 3 funcionalidades novas:

1. **🔒 Página de Admin de Bloqueios** (`/admin-blockouts`)
   - Criar, ver e deletar bloqueios de calendário
   - Suporta dias únicos ou períodos
   - 6 tipos de bloqueio com cores diferentes

2. **📅 Calendário Integrado** (em `/reservar-chave`)
   - Mostra bloqueios com cores
   - Tooltips ao passar mouse
   - Impede seleção de dias bloqueados

3. **🤖 Bloqueios Automáticos** de Domingos
   - Todos os domingos são bloqueados automaticamente
   - Tipo: "Feriado Nacional"
   - Cor: Vermelho

---

## 🚀 SETUP (Siga 4 passos)

### Passo 1️⃣: Criar a Tabela no Supabase (Manual)

Você precisa executar um script SQL. Existem 2 formas:

#### Opção A: Via Supabase Dashboard (Mais Fácil)

1. **Abra o Supabase Dashboard**
   - URL: https://supabase.com
   - Clique no seu projeto
   - Vá para "SQL Editor" (ícone de banco de dados no menu lateral esquerdo)

2. **Crie uma nova query**
   - Clique em "New Query"
   - Nome: "Create Blockouts Table"

3. **Cole o SQL**
   - Abra o arquivo: `database/003_create_calendar_blockouts.sql` no seu editor
   - Copie TODO o conteúdo
   - Cole na query do Supabase

4. **Execute**
   - Clique no botão "Run" (▶️ verde no canto superior direito)
   - Aguarde completar (deve dar sucesso)

#### Opção B: Via Terminal (Se preferir)

```bash
# Não há suporte automático ainda, mas você pode:
# 1. Instalar supabase-cli
npm install -g supabase

# 2. Login
supabase login

# 3. Executar migrações
supabase db push --file database/003_create_calendar_blockouts.sql
```

---

### Passo 2️⃣: Popular Domingos de 2026

Execute este comando depois que a tabela foi criada:

```bash
cd backend
node scripts/populate-sundays.js
```

Deve exibir algo como:
```
📅 Iniciando processo de bloqueio de domingos...

✅ Encontrados 52 domingos em 2026
   Primeiro: 2026-01-04
   Último: 2026-12-27

👤 Usando admin: [ID do admin]

... inserindo lotes ...

✅ Processo concluído!
   Total inseridos: 52
   Total pulados: 0
   Total domingos: 52

✨ Domingos bloqueados com sucesso!
```

**✅ Pronto!** Todos os 52 domingos de 2026 estão bloqueados.

---

### Passo 3️⃣: Reiniciar o Servidor

Se o servidor está rodando, reinicie:

```bash
# No terminal do backend
# Pressione Ctrl+C para parar
# Depois:
npm start
```

Ou em um novo terminal:
```bash
cd backend
npm start
```

Deve exibir:
```
✅ Servidor rodando em http://localhost:3000
```

---

### Passo 4️⃣: Testar o Sistema

#### 4.1 - Acessar Página de Admin de Bloqueios

1. Abra http://localhost:3000/admin.html
2. Você deve estar logado como ADMIN
3. No menu lateral, clique em **"🔒 Bloqueios"**
4. Deve abrir a página `/admin-blockouts`

#### 4.2 - Ver Bloqueios Carregados

- Você deve ver uma tabela com todos os 52 domingos
- Cada linha mostra:
  - Período (ex: "04/01/2026")
  - Turno ("Dia inteiro")
  - Tipo (com cor vermelha: "🇧🇷 Feriado Nacional")
  - Observação ("Domingo - Estabelecimento fechado")

#### 4.3 - Criar um Novo Bloqueio

1. Na página de bloqueios, preencha o formulário:
   - Tipo de Data: **"📅 Um dia"**
   - Data: **Escolha qualquer data (ex: 17/02/2026)**
   - Turno: **"-- Dia inteiro --"**
   - Motivo: **"Manutenção"** (amarelo)
   - Observação: **"Teste de manutenção"**
   - Cor: Deixe em branco (usa amarela padrão)

2. Clique em **"✅ Criar Bloqueio"**

3. Deve aparecer mensagem: **"✅ Bloqueio criado com sucesso!"**

4. O bloqueio deve aparecer na tabela

#### 4.4 - Ver no Calendário

1. Abra http://localhost:3000/reservar-chave
2. Observe o calendário:
   - **Domingos** têm borda vermelha (de cima)
   - **Data que você criou** tem borda amarela
   - Ao passar mouse, aparece tooltip com o motivo
3. **Não consegue clicar**? É o esperado! Dias bloqueados não permitem seleção

---

## 📝 Tipos de Bloqueio Disponíveis

| Tipo | Cor | Ícone | Uso |
|------|-----|-------|-----|
| **Manutenção** | 🟨 Amarelo | 🔧 | Manutenção predial/equipamentos |
| **Evento Externo** | 🟦 Azul | 🏢 | Eventos de terceiros |
| **Evento Interno** | 🟪 Roxo | 📢 | Eventos da instituição |
| **Feriado Nacional** | 🟥 Vermelho | 🇧🇷 | Feriados federais |
| **Feriado Estadual** | 🟧 Laranja | 🏴 | Feriados do estado |
| **Feriado Municipal** | 🟪 Roxo Escuro | 🏙️ | Feriados da cidade |

---

## 🎯 Cenários de Uso

### Cenário 1: Bloquear um Dia Inteiro

**Exemplo**: Evento interno na terça-feira

```
Tipo de Data: Um dia
Data: 25/02/2026
Turno: -- Dia inteiro --
Motivo: Evento Interno
Observação: Semana Acadêmica - Laboratórios fechados
Cor: [deixe em branco]
```

**Resultado**: Ninguém consegue reservar chaves em 25/02/2026

---

### Cenário 2: Bloquear um Período

**Exemplo**: Manutenção de 3 dias

```
Tipo de Data: Período
Data Inicial: 20/02/2026
Data Final: 22/02/2026
Turno: -- Dia inteiro --
Motivo: Manutenção
Observação: Reforma da sala 101 - Sistema elétrico
Cor: [deixe em branco]
```

**Resultado**: Chaves bloqueadas de 20 até 22 de fevereiro

---

### Cenário 3: Bloquear apenas um Turno

**Exemplo**: Visita técnica no turno matutino

```
Tipo de Data: Um dia
Data: 28/02/2026
Turno: Matutino (7:30 - 11:30)
Motivo: Evento Externo
Observação: Visita técnica - Turno matutino indisponível
Cor: [deixe em branco]
```

**Resultado**: Chaves podem ser reservadas nos turnos vespertino/noturno, mas não matutino em 28/02

---

## ✅ Checklist de Setup

- [ ] Executei o SQL em Supabase Dashboard
- [ ] Executei `node scripts/populate-sundays.js`
- [ ] Reiniciei o servidor (`npm start`)
- [ ] Acessei `/admin.html` como admin
- [ ] Cliquei em "🔒 Bloqueios"
- [ ] Vi a tabela com 52 domingos
- [ ] Criei um novo bloqueio de teste
- [ ] Abri `/reservar-chave` e vi os bloqueios no calendário
- [ ] Passei mouse sobre um bloqueio e vi o tooltip
- [ ] Tentei clicar em um dia bloqueado (não deve permitir)

---

## 🐛 Troubleshooting

### ❌ "Tabela não encontrada" ao abrir `/admin-blockouts`

**Causa**: SQL não foi executado

**Solução**:
1. Abra Supabase Dashboard → SQL Editor
2. Cole o conteúdo de `database/003_create_calendar_blockouts.sql`
3. Execute (botão Run)
4. Reinicie o servidor

---

### ❌ "Erro 401 Unauthorized" ao criar bloqueio

**Causa**: Não está logged como admin OU token inválido

**Solução**:
1. Saia de `/admin-blockouts`
2. Volte para `/admin.html`
3. Se não vê menu, faça logout e login novamente
4. Certifique-se que seu usuário tem `role = 'admin'`

---

### ❌ Domingos não aparecem bloqueados no calendário

**Causa**: Script `populate-sundays.js` não foi executado

**Solução**:
```bash
cd backend
node scripts/populate-sundays.js
```

---

### ❌ Bloqueios aparecem mas calendário não recarrega

**Causa**: Cache do navegador

**Solução**:
1. Abra devtools (F12)
2. Pressione Ctrl+Shift+R (hard refresh)
3. Ou limpe cache do navegador

---

### ❌ Erro ao executar `populate-sundays.js`

**Causa**: .env não configurado, ou Supabase indisponível

**Solução**:
1. Verifique `/backend/.env` tem as credenciais corretas:
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_KEY=seu_anon_key
   ```
2. Teste conexão: `node -e "const s = require('./config/supabase'); console.log('OK')"`
3. Se ainda falhar, execute o SQL manualmente

---

## 📞 Suporte

Se tiver problemas:

1. **Verificar logs**:
   - Terminal do servidor (console.log)
   - Devtools do navegador (F12 → Console)
   - SQL Editor do Supabase (ver erros)

2. **Verificar base de dados**:
   - Abra Supabase → Sua tabela (chavesporto)
   - Vá em "calendar_blockouts"
   - Veja se tem dados

3. **Reexecutar setup**:
   ```bash
   node backend/scripts/setup-blockouts.js
   ```

---

## 🎓 Próximas Etapas

Depois de tudo funcionando:

1. ✅ **Editar bloqueios**: Clique em um bloqueio e edite
2. ✅ **Deletar bloqueios**: Clique 🗑️ para remover
3. ✅ **Ver impacto**: Reservas mostram conflitos com bloqueios
4. ✅ **Relatórios**: Gerar relatório de todos os bloqueios

---

## 📚 Documentação Completa

Para detalhes técnicos, veja: `GUIA_BLOQUEIOS.md`

---

**Pronto para começar? Siga o Setup acima! 🚀**
