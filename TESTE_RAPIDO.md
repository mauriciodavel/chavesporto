# 🚀 Guia Rápido de Teste - Sistema de Reservas

## ⚡ Start Rápido (5 minutos)

### Passo 1: Preparar o Banco de Dados ✅
```sql
-- 1. Abra seu Supabase
-- 2. Vá para "SQL Editor"
-- 3. Execute o arquivo: database/001_create_reservations_tables.sql
-- 4. Depois execute: database/002_seed_test_data.sql
```

### Passo 2: Iniciar o Servidor ✅
```bash
npm run dev
# Deve mostrar: Server is running on port 3000
```

### Passo 3: Testar no Navegador ✅

#### **Como Usuário (Fazer Reserva)**
1. Acesse: http://localhost:3000 (ou abra index.html)
2. Faça login com credenciais instructor
3. Clique em "Reservar Chave" (ou acesse diretamente: http://localhost:3000/reservar-chave.html)
4. Siga os passos na página

#### **Como Admin (Aprovar/Rejeitar)**
1. Faça logout
2. Faça login como admin:
   - Email: `admin@senai.com.br`
   - Senha: `admin123`
3. Acesse: http://localhost:3000/admin-reservas.html
4. Veja as reservas pendentes e aprove/rejeite

---

## 📋 Checklist de Testes

### ✅ Testes Básicos

- [ ] **Login**: Consegue fazer login como usuário
- [ ] **Acesso**: Consegue acessar http://localhost:3000/reservar-chave.html
- [ ] **Chaves**: A lista de chaves carrega corretamente
- [ ] **Calendário**: Consegue selecionar datas no calendário
- [ ] **Envio**: Consegue criar uma reserva
- [ ] **Visualização**: Vê a reserva em "Minhas Reservas"
- [ ] **Status**: Reserva aparece com status "⏳ Pendente"

### ✅ Testes de Admin

- [ ] **Login Admin**: Consegue fazer login como admin
- [ ] **Acesso Admin**: Consegue acessar http://localhost:3000/admin-reservas.html
- [ ] **Listar**: Vê todas as reservas pendentes
- [ ] **Filtro**: Pode filtrar por status
- [ ] **Aprovar**: Consegue clicar "✅ Aprovar"
- [ ] **Atualização**: Status muda para "✅ Aprovada"
- [ ] **Rejeitar**: Consegue clicar "❌ Rejeitar"
- [ ] **Modal**: Modal de motivo aparece
- [ ] **Rejeição Salva**: Status muda para "❌ Rejeitada" com motivo

### ✅ Testes de Feedback

- [ ] **Sucesso**: Mensagens de sucesso aparecem
- [ ] **Erro**: Mensagens de erro aparecem quando necessário
- [ ] **Loading**: Botões mostram estado carregando
- [ ] **Validação**: Campos obrigatórios são validados

---

## 🎯 Cenários de Teste Específicos

### Cenário 1: Reserva Aprovada
```
1. Usuário cria reserva → Status: ⏳ Pendente
2. Admin aprova → Status muda para: ✅ Aprovada
3. Usuário vê alteração em tempo real
```

### Cenário 2: Reserva Rejeitada
```
1. Usuário cria reserva → Status: ⏳ Pendente
2. Admin rejeita com motivo "Sala em manutenção"
3. Usuário vê: ❌ Rejeitada (Sala em manutenção)
```

### Cenário 3: Múltiplas Reservas
```
1. Usuário cria 3 reservas para períodos diferentes
2. Admin aprova 2 e rejeita 1
3. Usuário vê todas com status correto
4. Admin filtra por status e vê números corretos
```

### Cenário 4: Filtros do Admin
```
1. Crie reservas com diferentes status
2. Filtre por "Pendentes" → vê apenas pendentes
3. Filtre por "Aprovadas" → vê apenas aprovadas
4. Filtre por turno → vê apenas turno selecionado
```

---

## 🔍 Como Debugar Problemas

### Problema: Chaves não aparecem no seletor
**Solução:**
1. Certifique-se de ter executado `database/002_seed_test_data.sql`
2. Verifique se as chaves foram inseridas:
   - Abra Supabase → Table Editor → keys
   - Deve ter 4 chaves de teste
3. Verifique token no localStorage:
   - Abra DevTools (F12)
   - Console → localStorage
   - Procure por token

### Problema: Reserva não salva
**Solução:**
1. Abra DevTools (F12) → Network
2. Clique em "Solicitar Reserva"
3. Veja a requisição POST /api/reservations
4. Verifique resposta (erro? sucesso?)
5. Se erro, copie e compartilhe a mensagem de erro

### Problema: Admin não vê reservas
**Solução:**
1. Verifique se você é admin:
   - DevTools → localStorage
   - Veja se role = "admin"
2. Verifique se API está retornando dados:
   - DevTools → Network
   - GET /api/reservations
   - Copie a resposta JSON

### Problema: Calendário não funciona
**Solução:**
1. Limpe o cache: Ctrl+Shift+Del
2. Recarregue: F5
3. Verifique console para erros:
   - F12 → Console
   - Procure por erros em vermelho

---

## 📊 Estrutura do Sistema

```
Frontend (Browser)
    ├── index.html (Login)
    ├── reservar-chave.html (User)
    └── admin-reservas.html (Admin)
         ↓
    API (Node.js/Express)
    ├── GET /api/keys
    ├── POST /api/reservations
    ├── GET /api/reservations
    ├── PATCH /api/reservations/:id/approve
    └── PATCH /api/reservations/:id/reject
         ↓
    Database (Supabase PostgreSQL)
    └── Tables:
        ├── keys
        ├── key_reservations
        ├── key_permissions
        └── environment_maintenance
```

---

## 🎓 O que Cada Arquivo Faz

| Arquivo | Função | Usuário |
|---------|--------|---------|
| index.html | Login | Todos |
| reservar-chave.html | Criar/Ver reservas | Instructor |
| admin-reservas.html | Gerenciar reservas | Admin |
| reservationController.js | Lógica de negócio | Backend |
| reservationRoutes.js | Rotas de API | Backend |
| server.js | Servidor Express | Backend |

---

## 💡 Dicas Úteis

1. **Abra DevTools** (F12) enquanto testa para ver logs
2. **Use filtros no Admin** para experimentar a funcionalidade
3. **Crie múltiplas reservas** para testar aprovação em massa
4. **Altere entre usuário e admin** usando logout/login
5. **Verifique Network** se algo não funcionar como esperado

---

## 🚨 Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Token inválido" | Token expirado | Faça login novamente |
| "Chave não encontrada" | Banco vazio | Execute seed_test_data.sql |
| "Acesso negado" | Usuário sem permissão | Verifique role (admin/instructor) |
| "Erro 404" | Rota não existe | Verifique se servidor está rodando |

---

## ✅ Sistema Completo?

Quando você passar por todos os testes acima com sucesso, você tem:

✅ Passo 1 (Banco): Schema + Dados
✅ Passo 2 (API): 8 endpoints funcionando
✅ **Passo 3 (Frontend): Páginas de usuário e admin**
⏳ Passo 4 (Retirada): Próximo
⏳ Passo 5 (Devolução): Próximo

Parabéns! 🎉

---

## 📞 Suporte Rápido

Se tiver dúvida:
1. Abra DevTools (F12)
2. Veja a aba "Console" para erros
3. Veja a aba "Network" para requisições
4. Copie qualquer mensagem de erro
5. Compartilhe para análise

Sucesso! 🚀
