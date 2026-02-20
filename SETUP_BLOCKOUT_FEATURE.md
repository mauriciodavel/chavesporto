# 🔒 Bloqueios de Ambiente - Guia de Implementação

## Status Geral

✅ **Backend**: 100% implementado e pronto  
✅ **Frontend**: 100% implementado e pronto  
⏳ **Database**: Migration SQL pronta, aguardando execução  

## O que foi implementado

### 1. Frontend (reservar-chave.html)

**Botão de Toggle**
- Novo botão "🔒 Criar Bloqueio de Ambiente" no modo admin
- Aparece apenas quando `?admin=true` na URL
- Alterna entre formulário de reserva/bloqueio

**Formulário de Bloqueio**
- Campo de seleção do ambiente (chave)
- Campos de data (início e término)
- Seletor de turno (matutino, vespertino, noturno, integral)
- Seletor de tipo de bloqueio (manutenção, evento interno, evento externo)
- Campo de motivo/descrição

**JavaScript**
- `toggleBlockoutBtn.addEventListener()` - Toggle entre formulários
- `loadKeysForBlockout()` - Carrega ambientes disponíveis
- `blockoutForm.addEventListener('submit')` - Envia bloqueio
- `cancelBlockoutBtn.addEventListener()` - Cancela e volta

### 2. Backend (reservationController.js)

**Novo Método**: `createEnvironmentBlockout()`
- Valida permissão de admin
- Valida campos obrigatórios
- Valida datas (início ≤ término)
- Valida tipo de bloqueio (maintenance, internal_event, external_event)
- **Verifica conflitos** com reservas normais no período
- Cria bloqueio na tabela `reservations` com `reservation_type='blockout'`

**Modificação**: `createReservation()`
- Agora valida bloqueios antes de permitir reserva normal
- Consulta `reservations` onde `reservation_type='blockout'` e `status='approved'`
- Retorna erro 409 se houver conflito

### 3. Backend (reservationRoutes.js)

**Nova Rota**:
```
POST /api/reservations/blockout
Middleware: verifyToken, verifyAdmin
```

### 4. Database

**Arquivo**: `database/004_add_reservation_type.sql`

**SQL a ser executado**:
```sql
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'normal' CHECK (reservation_type IN ('normal', 'blockout'));

CREATE INDEX IF NOT EXISTS idx_reservations_type_date 
ON reservations(reservation_type, reservation_start_date, reservation_end_date);
```

## ✅ O que fazer para ativar

### Passo 1: Executar Migration SQL no Supabase

1. Acesse: https://app.supabase.com
2. Entre no projeto
3. Vá para **SQL Editor**
4. Crie uma nova query
5. Copie e execute o conteúdo de `database/004_add_reservation_type.sql`
6. Aguarde confirmação ✓

### Passo 2: Reiniciar o Backend

```bash
# Parar o servidor (Ctrl+C)
# Reiniciar
npm start
```

### Passo 3: Testar

#### Opção A: Via Script (Recomendado)
```bash
cd scripts
node test-blockout-creation.js
```

Este script testa:
- ✅ Login como admin
- ✅ Listagem de ambientes
- ✅ Criação de bloqueio
- ✅ Validação de dados
- ✅ Proteção de autenticação

#### Opção B: Via Interface Gráfica

1. Acesse a página de reservas com `?admin=true`
   ```
   http://localhost:3000/reservar-chave.html?admin=true
   ```

2. Certifique-se que está logado como admin

3. Clique no botão "🔒 Criar Bloqueio de Ambiente"

4. Preencha o formulário:
   - **Ambiente**: Selecione uma chave
   - **Data de Início**: Selecione a data inicial
   - **Data de Término**: Selecione a data final
   - **Turno**: Escolha (matutino, vespertino, noturno, integral)
   - **Tipo de Bloqueio**: Escolha (manutenção, evento interno, evento externo)
   - **Motivo**: Digite uma descrição

5. Clique em "🔒 Criar Bloqueio"

6. Verifique se a mensagem de sucesso aparece

7. O bloqueio deve aparecer no calendário com a cor correspondente ao tipo

## 🎨 Cores dos Bloqueios

| Tipo | Cor | Código |
|------|------|---------|
| 🔧 Manutenção | Amarelo | #FFC107 |
| 📢 Evento Interno | Roxo | #6C63FF |
| 🏢 Evento Externo | Azul claro | #17A2B8 |
| 🇧🇷 Feriado Nacional | Vermelho | #DC3545 |
| 🏴 Feriado Estadual | Laranja | #FD7E14 |
| 🏙️ Feriado Municipal | Roxo escuro | #6F42C1 |

## 📋 Estrutura do Bloqueio (Dados)

```javascript
{
  key_id: "uuid",                          // ID do ambiente
  instructor_id: "uuid",                   // ID do admin que criou
  reservation_start_date: "2026-01-15",    // Data inicial
  reservation_end_date: "2026-01-16",      // Data final
  shift: "integral",                       // matutino|vespertino|noturno|integral
  blockout_type: "maintenance",           // maintenance|internal_event|external_event
  turma: "BLOQUEIO: maintenance",          // Prefixo automático
  motivo_detalhado: "...",                 // Descrição
  status: "approved",                      // Sempre approved (admin criou)
  reservation_type: "blockout",            // Identifica como bloqueio
}
```

## ⚙️ Como Funciona

### 1. Criação de Bloqueio
- Admin acessa interface com `?admin=true`
- Preenche formulário de bloqueio
- Clica "Criar"
- Backend valida:
  - ✓ É admin?
  - ✓ Todos os campos foram preenchidos?
  - ✓ Data início ≤ data fim?
  - ✓ Tipo de bloqueio válido?
  - ✓ Há conflito com reservas normais?
- Se ok: insere em `reservations` com `reservation_type='blockout'`

### 2. Validação ao Criar Reserva Normal
- Instrutor tenta criar reserva
- Backend valida se há bloqueios no período
- Consulta: `SELECT * FROM reservations WHERE reservation_type='blockout' AND status='approved' AND ...`
- Se houver bloqueio: retorna erro 409 "Ambiente bloqueado"
- Se não houver: permite criar reserva

### 3. Exibição no Calendário
- Bloqueios aparecem em dias específicos com cores únicas
- Tooltip mostra: tipo + motivo
- Clique pode exibir mais detalhes (se implementado)

## 🧪 Testes Recomendados

### Teste 1: Criar Bloqueio Simples
1. Ir para admin page com `?admin=true`
2. Clicar em "🔒 Criar Bloqueio"
3. Selecionar ambiente, datas e tipo
4. Clicar "Criar"
5. Verificar se mensagem de sucesso aparece
6. Verificar se bloqueio aparece no calendário

### Teste 2: Tentar Criar Reserva Durante Bloqueio
1. (Após Teste 1) Voltar para modo normal
2. Selecionar o mesmo ambiente e data bloqueada
3. Tentar criar reserva
4. Verificar se retorna erro "Ambiente bloqueado"

### Teste 3: Criar Bloqueio com Conflito
1. Criar uma reserva normal normalmente
2. Ir para admin mode
3. Tentar criar bloqueio no mesmo período/chave
4. Verificar se retorna erro "Já existem reserva(s) normal(is) em conflito"

### Teste 4: Validação (sem script)
1. Abrir DevTools (F12)
2. Ir para tab Network
3. Tentar enviar formulário incompleto
4. Verificar se API retorna erro 400 com campos faltando

## 📱 Fluxo de Interação

```
[Admin] → Clica "🔒 Criar Bloqueio"
    ↓
[Toggle] → Esconde formulário de reserva, mostra formulário de bloqueio
    ↓
[Preenchimento] → Admin preenche: chave, datas, turno, tipo bloqueio, motivo
    ↓
[Envio] → POST /api/reservations/blockout
    ↓
[Backend] → Valida tudo, verifica conflitos
    ↓
[Sucesso] → Insere em reservations com reservation_type='blockout'
    ↓
[Feedback] → Modal de sucesso
    ↓
[Reload] → Calendário atualizado, bloqueio visível
```

## 🚨 Possíveis Erros e Soluções

### Erro 401/403 Não Autorizado
**Causa**: Token não enviado ou expirado  
**Solução**: Fazer logout e login novamente

### Erro 400 Campos Obrigatórios
**Causa**: Algum campo está vazio  
**Solução**: Preencher todos os campos do formulário

### Erro 409 Período Indisponível
**Causa**: Já existe reserva normal no período  
**Solução**: Escolher outro período ou deletar a reserva anterior

### Bloqueio não aparece no calendário
**Causa**: Cache do navegador  
**Solução**: Pressionar F5 para atualizar

### Status "PAUSED" na database
**Causa**: Migration ainda não foi uma executada  
**Solução**: Executar SQL em database/004_add_reservation_type.sql no Supabase

## 📝 Próximos Passos (Bonus)

- [ ] Adicionar tooltips nas reservas normais (mostrar instrutor + turma)
- [ ] Permitir edição de bloqueios criados
- [ ] Permitir cancelamento de bloqueios
- [ ] Histórico de bloqueios criados
- [ ] Report mensal de bloqueios
- [ ] Validação de turnos compatíveis para bloqueios

## 📞 Debug

Se algo não funcionar:

1. Verificar logs do backend:
   ```
   Consertar logs com [CREATE BLOCKOUT]
   ```

2. Verificar console do navegador (F12 → Console):
   ```
   Ver logs com "🔒 [CREATE BLOCKOUT]"
   ```

3. Verificar se migration foi executada:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'reservations';
   ```
   Deve retornar `reservation_type` na lista.

4. Executar script de teste:
   ```bash
   node scripts/test-blockout-creation.js
   ```

---

**Status**: Pronto para ativar! 🚀
