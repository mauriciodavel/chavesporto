# 🔧 Troubleshooting & FAQ

## Problemas Comuns de Instalação

### 1. "npm: command not found"
**Problema:** Node.js não está instalado ou não foi adicionado ao PATH

**Solução:**
```bash
# Verificar se Node.js está instalado
node -v
npm -v

# Se não estiver instalado, download em:
# https://nodejs.org (versão LTS recomendada)

# Após instalação, reinicie o terminal
```

### 2. "Port 3000 already in use"
**Problema:** A porta 3000 já está em uso por outro processo

**Solução:**
```bash
# Opção 1: Usar uma porta diferente
PORT=3001 npm run dev

# Opção 2: Matar o processo usando a porta
# Windows:
netstat -ano | findstr :3000
taskkill /PID {PID} /F

# Linux/Mac:
lsof -i :3000
kill -9 {PID}
```

### 3. "Cannot find module 'cors'"
**Problema:** Dependências não foram instaladas corretamente

**Solução:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### 4. "Variáveis de ambiente não configuradas"
**Problema:** Arquivo `.env` não existe ou está vazio

**Solução:**
```bash
# Na pasta backend:
cp .env.example .env

# Edite o arquivo .env com suas credenciais
# Certifique-se de que SUPABASE_URL e SUPABASE_KEY estão preenchidos
```

## Problemas de Autenticação

### 5. "Email ou senha inválidos" (Admin)
**Causas possíveis:**
- Instrutor/Admin não foi criado no banco de dados
- Email/Matrícula está com erro de digitação
- Senha foi digitada errada
- Hash da senha não foi gerado corretamente

**Solução:**
```bash
# 1. Verificar se admin existe no Supabase:
# SQL Editor → New Query → 
SELECT * FROM instructors WHERE role = 'admin';

# 2. Se não existir, criar um:
INSERT INTO instructors (matricula, name, email, password, role)
VALUES (
  '0000',
  'Admin',
  'admin@senai.com.br',
  '{hash_aqui}',  # Gere o hash usando: node scripts/generate-hash.js
  'admin'
);
```

### 6. "Token inválido" ou "Unauthorized"
**Causa:** Token JWT expirou ou não está sendo enviado corretamente

**Solução:**
```javascript
// Verifique no browser console:
localStorage.getItem('auth_token')

// Se estiver vazio, faça login novamente
// Se estiver preenchido, verifique se o servidor está rodando

// Limpe localStorage se necessário:
localStorage.clear()
```

## Problemas com Banco de Dados

### 7. "Failed to connect to database"
**Causas:**
- Servidores Supabase estão offline (raro)
- SUPABASE_URL está incorreta
- SUPABASE_KEY está inválida
- Internet está desconectada

**Solução:**
```bash
# 1. Verifique as credenciais:
# Supabase Dashboard → Project Settings → API

# 2. Teste a conexão:
# Abra URL do Supabase no navegador
# Você deve ver a dashboard

# 3. Verifique .env:
cat backend/.env

# 4. Reinicie o servidor:
npm run dev
```

### 8. "Table 'keys' doesn't exist"
**Problema:** Schema SQL não foi executado no Supabase

**Solução:**
```sql
-- 1. Abra Supabase Dashboard
-- 2. SQL Editor → New Query
-- 3. Copie todo conteúdo de: database/schema.sql
-- 4. Cole no editor e clique em "Run"
-- 5. Aguarde a execução (leva alguns segundos)

-- 6. Verifique se as tabelas foram criadas:
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Problemas de QR Code

### 9. "QR Code não é lido"
**Causas:**
- Imagem do QR Code está corrompida ou de baixa qualidade
- Câmera do device não está autorizada
- Navegador não suporta acceso à câmera

**Solução:**
```javascript
// 1. Verifique permissões no navegador
// 2. Use "Fazer Upload de Imagem" em vez de câmera
// 3. Para câmera em device, use HTTPS (não HTTP)

// 4. Teste no console:
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('Câmera autorizada');
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => console.log('Erro:', err.message));
```

### 10. "QR Code não foi gerado"
**Problema:** Biblioteca qrcode não foi instalada

**Solução:**
```bash
cd backend
npm install qrcode

# Reinicie o servidor
npm run dev
```

## Problemas de Frontend

### 11. "Dashboard não carrega"
**Causas:**
- Não está autenticado (token inválido ou expirado)
- Servidor backend não está rodando
- Token pertence a admin (tente ir para /admin)

**Solução:**
```bash
# 1. Verifique se servidor está rodando
# Terminal deve mostrar: "Servidor rodando na porta 3000"

# 2. Verifique o console do navegador (F12)
# Procure por erros HTTP (vermelho)

# 3. Se erro 401:
localStorage.clear()
# Faça login novamente

# 4. Se erro 404:
# Verifique se a URL está correta: http://localhost:3000
```

### 12. "Elementos HTML não aparecem"
**Causas:**
- CSS não está carregando
- JavaScript não está rodando
- Elemento foi ocultado com `display: none`

**Solução:**
```javascript
// 1. Abra DevTools (F12)

// 2. Verifique Network tab:
// - Todos os .css devem ter status 200 (verde)
// - Todos os .js devem ter status 200 (verde)

// 3. Console: procure por erros (vermelho)

// 4. Teste em element inspector:
document.getElementById('keysContainer')
// Deve retornar o elemento, não null
```

### 13. "Modal não abre"
**Solução:**
```javascript
// Teste no console:
openModal('keyModal')

// Se não abrir, verifique:
document.getElementById('keyModal')
// Deve retornar elemento, não null

// Verifique CSS:
// Modal deve ter: display: none por padrão
// E display: flex quando .show está ativo
```

## Problemas de Email

### 14. "Email de alerta não é enviado"
**Causas:**
- SMTP não está configurado
- Credenciais SMTP estão incorretas
- Firewall está bloqueando conexão

**Solução:**
```bash
# 1. Verifique .env:
cat backend/.env | grep SMTP

# 2. Se estiver usando Gmail:
# - Vá para: https://myaccount.google.com/apppasswords
# - Gere uma "App Password"
# - Use essa senha em SMTP_PASS

# 3. Teste a conexão:
# Edite backend/utils/emailService.js
// Adicione no constructor:
this.transporter.verify((error, success) => {
  if (error) console.log('SMTP Error:', error);
  else console.log('SMTP OK:', success);
});
```

### 15. "Não consigo gerar hash bcrypt"
**Solução:**
```bash
cd backend

# Opção 1: Usar o script
node scripts/generate-hash.js

# Opção 2: Node.js interativo
node
> const bcrypt = require('bcrypt');
> bcrypt.hash('sua_senha_aqui', 10)
>   .then(hash => console.log(hash))
>   .catch(err => console.log(err));

# Copie o hash gerado e use no SQL
```

## Problemas de Performance

### 16. "Sistema está lento"
**Causas:**
- Muitos registros no histórico
- Banco de dados sobrecarregado
- Internet lenta
- Navegador com muitas abas abertas

**Solução:**
```javascript
// 1. Verifique Network Performance (F12)
// Abra Developer Tools → Network
// Veja quanto tempo leva cada requisição

// 2. Otimize queries:
// Adicione filtros/paginação em requests grandes

// 3. Limpe localStorage:
localStorage.clear()

// 4. Atualize o navegador:
Ctrl+F5 (força atualização sem cache)
```

## Linha de Comando Úteis

```bash
# Iniciar servidor em desenvolvimento
npm run dev

# Iniciar servidor em produção
npm start

# Testar API com curl
curl -X GET http://localhost:3000/api/keys \
  -H "Authorization: Bearer {token}"

# Verificar qual processo está usando a porta
netstat -ano | findstr :3000

# Gerar hash bcrypt
node -e "require('bcrypt').hash('senha', 10).then(console.log)"

# Limpar node_modules
rm -rf node_modules && npm install
```

## Ferramentas de Debug

### VS Code
- **Extensão Recommended:** Thunder Client (testar API)
- **Abrir Console Integrado:** Ctrl+`
- **Abrir Terminal:** Ctrl+J

### Navegador
- **DevTools:** F12
- **Network Tab:** Veja requisições HTTP
- **Console Tab:** Veja logs e erros
- **Application Tab:** localStorage, cookies

### Supabase
- **Dashboard:** https://supabase.com/dashboard
- **SQL Editor:** Teste queries
- **Auth Tab:** Gerencie usuários

## Quando Tudo Falha

```bash
# Nuclear option: Reiniciar tudo
cd backend
rm -rf node_modules package-lock.json .env
cp .env.example .env
# Edite .env com credenciais
npm install
npm run dev
```

Se ainda não funcionar:
1. Verifique `INSTALLATION.md` novamente
2. Leia os logs do terminal em detalhes
3. Procure o erro específico em Stack Overflow
4. Reporte o problema com screenshots dos erros

## Recursos Úteis

- **Documentação Supabase:** https://supabase.com/docs
- **Documentação Express:** https://expressjs.com
- **MDN Web Docs:** https://developer.mozilla.org
- **Stack Overflow:** Procure [-tag:username] [erro específico]
- **Node.js Docs:** https://nodejs.org/docs/

---

**Dúvidas?** Revise `INSTALLATION.md` e `USER_MANUAL.md`
