# Sistema de Controle de Entrega de Chaves de Laboratório

Sistema web para gerenciar a retirada e devolução de chaves de laboratórios e ambientes usando QR-Code.

## Funcionalidades

### Para Instrutores
- Login com credenciais
- Visualizar chaves disponíveis em painel interativo
- Retirar chaves através de leitura de QR-Code
- Devolver chaves ao final do expediente
- Visualizar histórico de suas atividades

### Para Administradores
- Cadastrar e gerenciar chaves
- Gerar QR-Codes para novas chaves
- Cadastrar novos instrutores
- Gerenciar dados de ambientes e áreas tecnológicas
- CRUD completo de chaves e instrutores
- Monitorar histórico de retiradas/devoluções
- Configurar alertas de email para devoluções atrasadas

## Stack Tecnológico

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: JWT
- **QR-Code**: qrcode.js
- **Email**: Nodemailer

## Instalação

### Pré-requisitos
- Node.js v14+
- npm ou yarn
- Conta Supabase

### Configuração

1. Clone o repositório
2. Instale as dependências do backend:
   ```
   cd backend
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```
   cp .env.example .env
   ```
   Preencha as variáveis com suas credenciais Supabase e SMTP

4. Inicie o servidor:
   ```
   npm run dev
   ```

5. Abra o frontend em `http://localhost:3000`

## Estrutura do Projeto

```
chavesporto/
├── backend/
│   ├── config/          # Configurações
│   ├── controllers/     # Lógica de negócio
│   ├── routes/          # Rotas da API
│   ├── middleware/      # Middlewares
│   ├── models/          # Modelos de dados
│   ├── server.js        # Arquivo principal
│   └── package.json
└── frontend/
    ├── css/             # Estilos
    ├── js/              # Scripts
    ├── login.html
    ├── dashboard.html
    └── admin.html
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de instrutor
- `POST /api/auth/admin-login` - Login de admin
- `POST /api/auth/logout` - Logout

### Chaves
- `GET /api/keys` - Listar chaves
- `GET /api/keys/:id` - Obter detalhes da chave
- `POST /api/keys` - Criar nova chave (admin)
- `PUT /api/keys/:id` - Atualizar chave (admin)
- `DELETE /api/keys/:id` - Deletar chave (admin)

### Retirada/Devolução
- `POST /api/keys/:id/withdraw` - Retirar chave
- `POST /api/keys/:id/return` - Devolver chave

### Histórico
- `GET /api/history` - Obter histórico
- `GET /api/history/:keyId` - Obter histórico de uma chave

### Instrutores (Admin)
- `GET /api/instructors` - Listar instrutores
- `POST /api/instructors` - Criar instrutor
- `PUT /api/instructors/:id` - Atualizar instrutor
- `DELETE /api/instructors/:id` - Deletar instrutor

## Banco de Dados

### Tabelas Supabase

#### instructors
- id (uuid)
- matricula (text, unique)
- name (text)
- email (text)
- password (text, hashed)
- technical_area (text)
- created_at (timestamp)

#### keys
- id (uuid)
- qr_code (text, unique)
- environment (text)
- description (text)
- location (text)
- technical_area (text)
- status (enum: available, in_use)
- created_at (timestamp)

#### key_history
- id (uuid)
- key_id (uuid)
- instructor_id (uuid)
- withdrawn_at (timestamp)
- returned_at (timestamp)
- status (enum: active, returned)
- created_at (timestamp)

## Uso

1. Faça login como instrutor ou administrador
2. Visualize as chaves disponíveis
3. Para retirar: Toque na chave e escaneie o QR-Code
4. Para devolver: Escaneie o QR-Code da chave ao final do expediente
5. Administradores podem gerenciar chaves e instrutores na seção admin

## Alertas de Email

- Email é enviado quando uma devolução passa do horário limite (fim do expediente)
- Configurar endereços de email na variável ALERT_EMAIL

## Licença

Desenvolvido especificamente para a escola SENAI - Gestão de Ambientes.
