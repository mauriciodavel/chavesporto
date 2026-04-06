# 🧪 Teste - Painel de Ambientes

## ✅ Checklist de Testes

### 1️⃣ Frontend - Acesso Público
- [ ] Acessar `http://localhost:3000/painel`
- [ ] Página carrega sem erros
- [ ] Header com hora/data atualiza em tempo real
- [ ] Botão "🔐 Admin" visível
- [ ] Tabela vazia ou com dados (se houver reservas)

### 2️⃣ API - Obter Ambientes
```bash
curl -X GET http://localhost:3000/api/painel
```
**Esperado**: 
```json
{
  "success": true,
  "data": [...]
}
```

### 3️⃣ Busca e Filtros
- [ ] Digitar na caixa de busca filtra a tabela
- [ ] Ordenação funciona para todos os 4 critérios
- [ ] Tabela atualiza visualmente

### 4️⃣ Admin Login
- [ ] Clica em "🔐 Admin"
- [ ] Modal de login abre
- [ ] Insere email/senha de admin
- [ ] Login funciona (token retornado)

### 5️⃣ Gerenciar Mídia (Após Admin Login)
- [ ] Seção "📤 Upload de Mídia" aparece
- [ ] Tabs para Imagem 1, 2 e Vídeo funcionam
- [ ] Pode selecionar arquivo
- [ ] Upload envia com sucesso
- [ ] Mídia aparece no painel

### 6️⃣ Remover Mídia
- [ ] Clica em "🗑️ Remover"
- [ ] Mídia desaparece
- [ ] Arquivo é deletado do servidor

### 7️⃣ Responsividade
- [ ] Redimensionar janela
- [ ] Layout adapta em diferentes tamanhos
- [ ] Tabela permanece acessível

### 8️⃣ Dados de Reserva
- [ ] Criar uma reserva aprovada no admin
- [ ] Data de hoje
- [ ] Aguardar 1 minuto ou forçar reload
- [ ] Ambiente aparece na tabela
- [ ] Horário e turno corretos

---

## 📊 Dados de Teste Recomendados

### Criar Chave (Admin)
```bash
# Acessar /admin
# Criar chave com dados:
- Nome: Lab 201
- Localização: Bloco A, Sala 201
- Descrição: Laboratório de Lógica
- QR: gerar automaticamente
```

### Criar Instrutor (Admin)
```bash
# Via admin ou API:
- Nome: Karla Aparecida
- Email: karla@senai.com
- Senha: senha123
```

### Criar Reserva (Admin)
```json
POST /api/reservations
{
  "key_id": "uuid-da-chave",
  "instructor_id": "uuid-do-instrutor",
  "start_date": "2026-04-02",
  "end_date": "2026-04-02",
  "shift": "matutino",
  "turma": "HTC-LOG-01",
  "motivo_detalhado": "Aula prática de lógica",
  "created_by_admin": true
}
```

### Aprovar Reserva (Admin)
```bash
PATCH /api/reservations/{id}/approve
```

---

## 🔧 Troubleshooting

### ❌ "Nenhum ambiente com reserva ativa"
**Solução**:
1. Verifique se há reservas com:
   - status = 'approved'
   - data de hoje entre start_date e end_date
2. Teste a API: `GET /api/painel`
3. Verifique logs do backend

### ❌ "Erro ao fazer login"
**Solução**:
1. Confirme que o usuário é admin (role = 'admin')
2. Confirm email/senha estão corretos
3. Verifique se `/api/auth/login` funciona

### ❌ "Upload falha silenciosamente"
**Solução**:
1. Abra DevTools (F12)
2. Vá para Console
3. Verifique mensagens de erro
4. Confirme autenticação ativa
5. Teste tamanho do arquivo

### ❌ "Mídia não aparece"
**Solução**:
1. Verifique se pasta `public/media/painel/` existe
2. Confirme permissões de leitura/escrita
3. Revise logs do backend
4. Limpe localStorage: `localStorage.clear()`

### ❌ "Tabela não atualiza"
**Solução**:
1. Abra console (F12)
2. Procure por erros
3. Force reload: Ctrl+F5
4. Verifique se API retorna dados

---

## 📈 Performance

### Recomendações
```javascript
// ✅ BOM:
- Carregar até 100 ambientes
- Atualizar a cada 60 segundos
- Cache em localStorage

// ❌ NÃO FAZER:
- Carregar > 1000 ambientes por padrão
- Atualizar em tempo real (WebSocket)
- Armazenar mídia em BD
```

---

## 🎯 Casos de Uso Real

### **Caso 1: Aluno chega e quer saber o horário de aula**
1. Acessa `/painel` (sem login)
2. Vê sua turma na tabela
3. Sabe o horário e ambiente

### **Caso 2: Admin quer colocar banner no painel**
1. Acessa `/painel`
2. Clica "🔐 Admin"
3. Login
4. Faz upload de imagem/vídeo
5. Imagem aparece para todos

### **Caso 3: Apresentação/Reunião na entrada**
1. Tela grande mostrando `/painel`
2. Alunos veem seus ambientes em tempo real
3. Atualiza a cada minuto
4. Sem intervenção técnica

---

## 📞 Contato / Suporte

Se encontrar problemas não listados aqui, verifique:
1. Logs do backend: `npm run dev`
2. Logs do navegador: F12 > Console
3. Status da API: `curl http://localhost:3000/api/painel`
4. Reinicie o servidor

**Status**: ✅ Pronto para Testes
