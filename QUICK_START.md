# 🚀 Quick Start - 5 Minutos

Se você quer começar rapidamente, siga este guia!

## ⚡ Instalação Rápida

### 1. Clonar/Copiar Projeto
```bash
cd chavesporto/backend
npm install
```

### 2. Configurar Supabase (2 minutos)
1. Acesse https://supabase.com → Nova Conta (grátis)
2. Crie um novo projeto
3. Vá para **SQL Editor** → **New Query**
4. Copie todo conteúdo de `database/schema.sql`
5. Execute

### 3. Configurar .env
```bash
cd backend
cp .env.example .env
```

Edite `.env` com suas credenciais:
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_aqui
JWT_SECRET=qualquer_texto_secreto_aqui
```

### 4. Iniciar Servidor
```bash
npm run dev
```

Abra: **http://localhost:3000**

## 👤 Credenciais de Teste

### Admin
- Email: `admin@senai.com.br`
- Senha: `admin123`

### Instrutor (criar primeiro no painel admin)
- Use o painel admin para criar

## 📱 Usando o Sistema

1. **Login**: Use as credenciais acima
2. **Dashboard**: Veja as chaves disponíveis
3. **Retirar**: Clique em uma chave → Simule QR Code
4. **Admin**: Acesse `/admin` para gerenciar

## 🔑 QR Code (Simulado)

Como não temos câmera de verdade neste quick start:
- Clique em "Fazer Upload de Imagem"
- Ou digite manualmente o código quando solicitar

Código de exemplo: `KEY-12345`

## 🆘 Problemas?

| Erro | Solução |
|------|---------|
| Port 3000 em uso | `npm run dev -- --port 3001` |
| Erro Supabase | Verifique URL e KEY |
| Login não funciona | Crie instrutor via painel admin |

## 📚 Documentação Completa

- `INSTALLATION.md` - Guia detalhado
- `USER_MANUAL.md` - Manual do usuário
- `README.md` - Visão geral do projeto
- `CHECKLIST.md` - O que foi implementado

## 🎯 Próximos Passos

1. ✅ Criar mais instrutores
2. ✅ Adicionar mais chaves
3. ✅ Testar retirada/devolução
4. ✅ Revisar histórico

## 🚀 Deploy (Opcional)

Para colocar online:
- Backend: Heroku, Vercel, Railway
- Frontend: GitHub Pages, Vercel, Netlify

## 💡 Dicas

- Use DevTools (F12) para ver erros
- Logs no terminal ajudam a debugar
- Database Schema está em `database/schema.sql`

---

**Pronto? Vá para http://localhost:3000 e comece!** 🎉
