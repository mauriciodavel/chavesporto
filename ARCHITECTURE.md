# 📊 Arquitetura do Sistema

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                     NAVEGADOR (Frontend)                    │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Login Page     │  │  Dashboard   │  │ Admin Panel  │  │
│  │  (HTML/CSS/JS)   │  │ (HTML/CSS/JS)│  │(HTML/CSS/JS) │  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/HTTPS
                         API REST JSON
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR (Backend)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express.js Server (Node.js)                        │   │
│  │  ┌──────────┐  ┌────────────┐  ┌──────────────────┐│   │
│  │  │ Routes   │→ │ Controllers│→ │ Business Logic   ││   │
│  │  │ /api/*   │  │ (Auth,Keys,│  │ (QR Code, Hash)  ││   │
│  │  │          │  │  History)  │  │                  ││   │
│  │  └──────────┘  └────────────┘  └──────────────────┘│   │
│  │       ↓              ↓                      ↓       │   │
│  │  ┌────────────────────────────────────────────────┐│   │
│  │  │        Middleware (Auth, CORS, etc)           ││   │
│  │  └────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────┘   │
│                              ↕
│  ┌────────────────────────────────────────────────────┐    │
│  │            Supabase Client                         │    │
│  │  (@supabase/supabase-js)                          │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (Supabase)                      │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  instructors     │  │ keys         │  │ key_history  │  │
│  │  (ID, matrícula, │  │ (ID, QRCode, │  │ (key_id,     │  │
│  │   name, email,   │  │  status,     │  │  instructor_ │  │
│  │   password, role)│  │  environment)│  │  id, dates)  │  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  email_settings                                      │  │
│  │  (alert_email, business_hours, timezone)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

### 1. Login (Instructor)
```
Usuário digita matrícula/senha
              ↓
    Form Submit (POST /api/auth/login)
              ↓
    Backend: Hash compare com banco
              ↓
    Gera JWT Token
              ↓
    Retorna token ao frontend
              ↓
    Frontend: Armazena em localStorage
              ↓
    Redireciona para /dashboard
```

### 2. Retirada de Chave
```
Instrutor clica em chave
              ↓
    Modal abre (QR Scanner)
              ↓
    Lê/escaneia QR Code
              ↓
    POST /api/keys/:id/withdraw
              ↓
    Backend: Atualiza status para "in_use"
              ↓
    Cria registro em key_history
              ↓
    Retorna sucesso
              ↓
    Frontend: Atualiza display
    Registra data/hora/quem retirou
```

### 3. Devolução de Chave
```
Instrutor toca em chave em uso
              ↓
    Modal abre (QR Scanner)
              ↓
    Lê QR Code da chave
              ↓
    POST /api/keys/:id/return
              ↓
    Backend: Atualiza status para "available"
              ↓
    Fecha registro em key_history
              ↓
    Retorna success
              ↓
    Frontend: Atualiza display
    Registra data/hora da devolução
```

## Estrutura de Pastas

```
chavesporto/
│
├── backend/                          # Servidor Node.js
│   ├── config/
│   │   └── supabase.js              # Inicializa cliente Supabase
│   │
│   ├── controllers/                  # Lógica de negócio
│   │   ├── authController.js        # Login/Logout
│   │   ├── keyController.js         # CRUD de chaves
│   │   ├── historyController.js     # Histórico
│   │   └── instructorController.js  # Gerenciar instrutores
│   │
│   ├── routes/                       # Rotas da API
│   │   ├── auth.js                  # /api/auth
│   │   ├── keys.js                  # /api/keys
│   │   ├── history.js               # /api/history
│   │   └── instructors.js           # /api/instructors
│   │
│   ├── middleware/
│   │   └── auth.js                  # Verificação de token
│   │
│   ├── utils/
│   │   └── emailService.js          # Envio de emails
│   │
│   ├── scripts/
│   │   └── generate-hash.js         # Gerar hash bcrypt
│   │
│   ├── server.js                    # Arquivo principal
│   ├── package.json                 # Dependências
│   ├── .env.example                 # Variáveis exemplo
│   └── .env                         # Variáveis (NÃO VERSIONADO)
│
├── frontend/                         # Aplicação web
│   ├── css/
│   │   └── styles.css               # Estilos gerais
│   │
│   ├── js/
│   │   ├── app.js                   # Funções compartilhadas
│   │   ├── dashboard.js             # Lógica do dashboard
│   │   └── admin.js                 # Lógica do painel admin
│   │
│   ├── login.html                   # Página de login
│   ├── dashboard.html               # Painel do instrutor
│   └── admin.html                   # Painel administrativo
│
├── database/
│   └── schema.sql                   # Script SQL para Supabase
│
├── docs/                            # Documentação
│   ├── README.md                    # Visão geral
│   ├── INSTALLATION.md              # Guia de instalação
│   ├── USER_MANUAL.md               # Manual do usuário
│   ├── QUICK_START.md               # Start rápido
│   ├── CHECKLIST.md                 # Resumo de features
│   └── ARCHITECTURE.md              # Este arquivo
│
├── install.sh                       # Script instalação (Linux/Mac)
├── install.bat                      # Script instalação (Windows)
└── .gitignore                       # Arquivos ignorados pelo Git
```

## Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENTE (Frontend)                                         │
│                                                             │
│  1. Usuario faz login                                      │
│  2. Credenciais enviadas: POST /api/auth/login             │
│  3. Recebe JWT token                                       │
│  4. localStorage.setItem('auth_token', token)              │
│  5. Em cada requisição, inclui header:                     │
│     Authorization: Bearer {token}                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│  SERVIDOR (Backend)                                         │
│                                                             │
│  1. Middleware: verifyToken()                              │
│  2. Extrai token do header                                 │
│  3. jwt.verify(token, JWT_SECRET)                          │
│  4. Se válido: atribui req.user com payload                │
│  5. Se inválido: retorna 401 Unauthorized                  │
│                                                             │
│  Middleware: verifyAdmin()                                 │
│  - Verifica se req.user.role === 'admin'                   │
│  - Se não: retorna 403 Forbidden                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Modelos de Dados

### Instrutor
```javascript
{
  id: "uuid",
  matricula: "12345",           // Único
  name: "João Silva",
  email: "joao@senai.com.br",  // Único
  password: "$2b$10...",        // Hash bcrypt
  technical_area: "Eletrônica",
  role: "instructor",           // instructor | admin
  created_at: "2026-02-06T10:00:00Z",
  updated_at: "2026-02-06T10:00:00Z",
  deleted_at: null
}
```

### Chave
```javascript
{
  id: "uuid",
  qr_code: "KEY-12345abc",     // Único
  environment: "Lab Eletrônica",
  description: "Armário de componentes",
  location: "Coordenação",
  technical_area: "Eletrônica",
  status: "available",          // available | in_use | maintenance
  qr_code_image: <base64>,      // PNG codificada
  created_at: "2026-02-06T10:00:00Z",
  updated_at: "2026-02-06T10:00:00Z",
  deleted_at: null
}
```

### Histórico
```javascript
{
  id: "uuid",
  key_id: "uuid",
  instructor_id: "uuid",
  withdrawn_at: "2026-02-06T08:30:00Z",
  returned_at: "2026-02-06T10:15:00Z",  // null se ainda em uso
  status: "returned",           // active | returned
  created_at: "2026-02-06T08:30:00Z",
  updated_at: "2026-02-06T10:15:00Z"
}
```

## Segurança

### 1. Hash de Senhas
```
Senha do usuário
    ↓
    bcrypt.hash(password, 10)
    ↓
Armazenar no banco
```

### 2. Autenticação JWT
```
Login bem-sucedido
    ↓
    jwt.sign({ id, role, ...}, JWT_SECRET)
    ↓
Token para cliente
    ↓
Cliente inclui em cada requisição
    ↓
Backend verifica com jwt.verify()
```

### 3. Row Level Security (RLS) - Supabase
```
- Apenas usuários autenticados podem acessar dados
- Instrutores veem apenas seu histórico (com policy)
- Admins veem tudo
```

## Performance

### Índices do Banco
```sql
- instructors.matricula    → Busca rápida de instrutor
- instructors.email        → Busca rápida de admin
- keys.qr_code            → Busca por QR Code
- keys.status             → Filtro de disponibilidade
- key_history.key_id      → Histórico de chave
- key_history.instructor_id → Histórico de instrutor
- key_history.withdrawn_at → Ordenação temporal
```

### Cache Frontend
```
- localStorage: Token JWT e dados do usuário
- sessionStorage: Dados temporários da sessão
- Refresh automático a cada 30s (dashboard admin)
```

## Deployment

Veja `DEPLOYMENT.md` para informações sobre:
- Deploy no Heroku (Backend)
- Deploy no Vercel (Frontend)
- Deploy no Railway
- Setup de CI/CD com GitHub Actions

---

**Última Atualização:** Fevereiro 2026
**Stack:** Node.js + Express + Supabase + Vanilla JS
