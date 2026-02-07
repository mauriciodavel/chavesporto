# 📚 Documentação do Projeto

## Índice de Documentos

### 🚀 Começar Aqui
1. **[QUICK_START.md](QUICK_START.md)** - Começe em 5 minutos
2. **[README.md](README.md)** - Visão geral do projeto

### 📖 Guias Detalhados
3. **[INSTALLATION.md](INSTALLATION.md)** - Instalação completa passo-a-passo
4. **[USER_MANUAL.md](USER_MANUAL.md)** - Manual para usuários finais
5. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Entenda a arquitetura do sistema

### 🔧 Solução de Problemas
6. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problemas comuns e soluções
7. **[CHECKLIST.md](CHECKLIST.md)** - O que foi implementado

## Estrutura do Projeto

```
chavesporto/
├── 📂 backend/                      # Servidor Node.js
│   ├── 📂 config/                   # Configurações
│   ├── 📂 controllers/              # Lógica de negócio
│   ├── 📂 routes/                   # Rotas da API
│   ├── 📂 middleware/               # Middlewares
│   ├── 📂 utils/                    # Utilitários
│   ├── 📂 scripts/                  # Scripts úteis
│   ├── server.js                    # Arquivo principal
│   └── package.json                 # Dependências
│
├── 📂 frontend/                     # Aplicação web
│   ├── 📂 css/                      # Estilos
│   ├── 📂 js/                       # Scripts
│   ├── login.html                   # Página de login
│   ├── dashboard.html               # Dashboard instrutor
│   └── admin.html                   # Painel admin
│
├── 📂 database/                     # Base de dados
│   └── schema.sql                   # Script SQL
│
├── 📖 Documentação
│   ├── README.md
│   ├── QUICK_START.md
│   ├── INSTALLATION.md
│   ├── USER_MANUAL.md
│   ├── ARCHITECTURE.md
│   ├── TROUBLESHOOTING.md
│   └── CHECKLIST.md
│
├── Scripts de instalação
│   ├── install.sh                   # Para Linux/Mac
│   └── install.bat                  # Para Windows
│
└── Configuração
    └── .gitignore
```

## Começar Rapidamente

### Primeira Vez?
```bash
# 1. Clonar/extrair projeto
cd chavesporto

# 2. Instalar dependências
cd backend
npm install

# 3. Configurar variáveis
cp .env.example .env
# Edite .env com credenciais Supabase

# 4. Setup banco de dados
# Vá para Supabase Dashboard → SQL Editor
# Cole conteúdo de database/schema.sql

# 5. Iniciar servidor
npm run dev

# 6. Abrir navegador
# Acesse: http://localhost:3000
```

### Próximas Vezes
```bash
cd backend
npm run dev
# Acesse: http://localhost:3000
```

## Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript | ES6+ |
| **Backend** | Node.js + Express.js | 14+ |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Auth** | JWT + bcrypt | - |
| **QR Code** | qrcode.js | 1.5.3 |
| **Email** | nodemailer | 6.9.3 |

## Funcionalidades Implementadas

### ✅ Para Instrutores
- [x] Login com matrícula
- [x] Dashboard com chaves disponíveis
- [x] Retirada de chaves via QR Code
- [x] Devolução de chaves via QR Code
- [x] Histórico de retiradas
- [x] Visualização de status de chaves
- [x] Logout

### ✅ Para Administradores
- [x] Login com email/senha
- [x] Dashboard com estatísticas
- [x] CRUD de chaves
  - [x] Criar com geração automática de QR Code
  - [x] Editar propriedades
  - [x] Deletar
  - [x] Buscar e filtrar
- [x] CRUD de instrutores
  - [x] Criar novo
  - [x] Editar dados
  - [x] Deletar
  - [x] Buscar e filtrar
- [x] Visualizar histórico completo
- [x] Identificar devoluções em atraso
- [x] Sistema de notificação por email (opcional)
- [x] Logout

### ✅ Sistema em Geral
- [x] Autenticação e autorização
- [x] Criptografia de senhas
- [x] Geração de QR Codes
- [x] Histórico de movimentação
- [x] Interface responsiva
- [x] Design similiar ao modelo fornecido
- [x] Suporte a múltiplos usuários simultâneos
- [x] Validação de dados
- [x] Tratamento de erros

## Como Usar

### Primeiro Acesso
1. Leia [QUICK_START.md](QUICK_START.md)
2. Siga os 5 passos de instalação
3. Use credenciais padrão (ou crie sua própria conta)

### Aprender Mais
- Usuários: Leia [USER_MANUAL.md](USER_MANUAL.md)
- Instalação Profunda: Leia [INSTALLATION.md](INSTALLATION.md)
- Arquitetura: Leia [ARCHITECTURE.md](ARCHITECTURE.md)
- Solução de Problemas: Leia [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Chaves de Teste

### Admin
```
Email: admin@senai.com.br
Senha: admin123
```

### Instrutor
Crie através do painel admin

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login instrutor
- `POST /api/auth/admin-login` - Login admin
- `POST /api/auth/logout` - Logout

### Chaves
- `GET /api/keys` - Listar chaves
- `POST /api/keys/by-qr` - Buscar por QR Code
- `POST /api/keys` - Criar chave (admin)
- `PUT /api/keys/:id` - Atualizar chave (admin)
- `DELETE /api/keys/:id` - Deletar chave (admin)
- `POST /api/keys/:id/withdraw` - Retirar
- `POST /api/keys/:id/return` - Devolver

### Histórico
- `GET /api/history` - Listar histórico
- `GET /api/history/keys/:keyId` - Histórico da chave
- `GET /api/history/instructors/:instructorId` - Histórico do instrutor
- `GET /api/history/late-returns` - Devoluções em atraso (admin)

### Instrutores
- `GET /api/instructors` - Listar (admin)
- `POST /api/instructors` - Criar (admin)
- `PUT /api/instructors/:id` - Atualizar (admin)
- `DELETE /api/instructors/:id` - Deletar (admin)

## Configuração de Produção

Quando estiver pronto para deploy:
1. Leia sobre deployment (hospedagem)
2. Configure variáveis de ambiente seguras
3. Use HTTPS (obrigatório)
4. Configure backup de banco de dados
5. Monitore logs e performance

## Contribuindo

Este é um projeto educacional. Para melhorias:

1. Teste bem antes de propor mudanças
2. Mantenha código legível e bem comentado
3. Siga a estrutura existente
4. Atualize documentação se mudar funcionalidades

### Ideias de Melhorias
- [ ] App mobile (React Native)
- [ ] Leitura real de QR Code com câmera
- [ ] Relatórios PDF
- [ ] Integração WhatsApp
- [ ] Dashboard de Analytics
- [ ] Integração com LDAP

## Suporte

### Problemas Técnicos
1. Consulte [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Procure a mensagem de erro em Stack Overflow
3. Verifique se o servidor está rodando: `npm run dev`

### Dúvidas Funcionais
1. Leia [USER_MANUAL.md](USER_MANUAL.md)
2. Consulte [INSTALLATION.md](INSTALLATION.md)
3. Revise [ARCHITECTURE.md](ARCHITECTURE.md)

## Licença

Desenvolvido para SENAI - Gestão de Ambientes

## Contato

Para dúvidas técnicas, abra uma issue ou contacte o administrador do sistema.

---

**Bem-vindo ao Sistema de Controle de Chaves!** 🔑

Comece com [QUICK_START.md](QUICK_START.md) e bom trabalho! 🚀
