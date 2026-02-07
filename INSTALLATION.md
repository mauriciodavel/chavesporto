# Guia de Instalação e Configuração

## Pré-requisitos

- Node.js v14 ou superior
- npm ou yarn
- Conta Supabase (gratuita em https://supabase.com)
- Git (opcional)

## Passo 1: Clonar e Instalar Dependências

```bash
cd chavesporto
cd backend
npm install
```

## Passo 2: Configurar Supabase

### 2.1 Criar Projeto Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preencha os dados:
   - **Name**: chavesporto
   - **Database Password**: Use uma senha forte
   - **Region**: Selecione a região mais próxima (ex: São Paulo)
4. Aguarde o projeto ser criado (pode levar alguns minutos)

### 2.2 Criar Tabelas no Supabase

1. No painel do Supabase, vá até **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `database/schema.sql`
4. Cole na query e clique em **Run**
5. Aguarde a execução

### 2.3 Obter Credenciais

1. Vá para **Project Settings** → **API**
2. Copie:
   - **Project URL** → Use como `SUPABASE_URL`
   - **Public anon key** → Use como `SUPABASE_KEY`

## Passo 3: Configurar Variáveis de Ambiente

### 3.1 Backend

1. Na pasta `backend`, crie um arquivo `.env`:

```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com sua preferência:

```
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_publica

# JWT Configuration
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Email Configuration (Opcional - para alertas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app_specific
ALERT_EMAIL=admin@senai.com.br

# Server Configuration
NODE_ENV=development
PORT=3000
```

### 3.2 Configurar SMTP (Alertas de Email - Opcional)

Se quiser receber alertas de devoluções atrasadas:

**Usando Gmail:**
1. Ative 2FA em sua conta Google
2. Gere uma "App Password" em https://myaccount.google.com/apppasswords
3. Use essa senha no campo `SMTP_PASS`

**Usando outro provedor:**
- Configure conforme as recomendações do seu provedor SMTP

## Passo 4: Criar Admin Padrão

Execute este comando para adicionar um admin ao banco:

```bash
# Acesse SQL Editor do Supabase e execute:

INSERT INTO instructors (matricula, name, email, password, role, technical_area)
VALUES (
  '0000',
  'Administrador',
  'admin@senai.com.br',
  '$2b$10$YIj1nLbG2SJ2E5.5F5w9D.5F5w9D5F5w9D5F5w9D5F5w9D5F5w9D5', -- bcrypt hash de 'admin123'
  'admin',
  'Administração'
);
```

**IMPORTANTE**: Esse hash é um exemplo. Para gerar um hash bcrypt seguro, execute no Node.js:

```javascript
const bcrypt = require('bcrypt');
bcrypt.hash('sua_senha_aqui', 10).then(hash => console.log(hash));
```

## Passo 5: Iniciar o Servidor

```bash
cd backend
npm run dev
```

Você deverá ver:
```
Servidor rodando na porta 3000
Acesse http://localhost:3000
```

## Passo 6: Acessar a Aplicação

### Login de Instrutor
- URL: `http://localhost:3000`
- Matrícula: (conforme cadastrado no banco)
- Senha: (conforme cadastrado no banco)

### Login de Admin
- URL: `http://localhost:3000`
- Email: `admin@senai.com.br` (ou conforme configurado)
- Senha: `admin123` (ou conforme configurado)

## Estrutura de Dados

### Tabela: instructors
```
id (UUID) - ID único
matricula (TEXT) - Matrícula do instrutor
name (TEXT) - Nome completo
email (TEXT) - Email
password (TEXT) - Senha com hash bcrypt
technical_area (TEXT) - Área tecnológica
role (TEXT) - 'instructor' ou 'admin'
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
deleted_at (TIMESTAMP) - Para soft delete
```

### Tabela: keys
```
id (UUID) - ID único
qr_code (TEXT) - Código QR único
environment (TEXT) - Nome do ambiente/laboratório
description (TEXT) - Descrição da chave
location (TEXT) - Lotação/Localização
technical_area (TEXT) - Área tecnológica
status (TEXT) - 'available', 'in_use', 'maintenance'
qr_code_image (BYTEA) - Imagem do QR Code
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
deleted_at (TIMESTAMP)
```

### Tabela: key_history
```
id (UUID) - ID único
key_id (UUID) - ID da chave
instructor_id (UUID) - ID do instrutor
withdrawn_at (TIMESTAMP) - Data/hora da retirada
returned_at (TIMESTAMP) - Data/hora da devolução
status (TEXT) - 'active' ou 'returned'
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login instrutor
- `POST /api/auth/admin-login` - Login admin
- `POST /api/auth/logout` - Logout

### Chaves
- `GET /api/keys` - Listar todas as chaves
- `GET /api/keys/:id` - Detalhes de chave específica
- `POST /api/keys/by-qr` - Buscar chave por QR Code
- `POST /api/keys` - Criar nova chave (admin)
- `PUT /api/keys/:id` - Atualizar chave (admin)
- `DELETE /api/keys/:id` - Deletar chave (admin)
- `POST /api/keys/:id/withdraw` - Retirar chave
- `POST /api/keys/:id/return` - Devolver chave

### Histórico
- `GET /api/history` - Listar histórico geral
- `GET /api/history/keys/:keyId` - Histórico de uma chave
- `GET /api/history/instructors/:instructorId` - Histórico de um instrutor
- `GET /api/history/late-returns` - Devoluções em atraso (admin)

### Instrutores
- `GET /api/instructors` - Listar todos (admin)
- `POST /api/instructors` - Criar novo (admin)
- `PUT /api/instructors/:id` - Atualizar (admin)
- `DELETE /api/instructors/:id` - Deletar (admin)

## Troubleshooting

### Erro: "Variáveis de ambiente Supabase não configuradas"
- Verifique se o arquivo `.env` existe na pasta `backend`
- Confirme que `SUPABASE_URL` e `SUPABASE_KEY` estão preenchidos

### Erro: "Failed to connect to database"
- Verifique a conexão com a internet
- Confirme que as credenciais Supabase estão corretas
- Verifique se o projeto Supabase está ativo

### QR Code não está sendo gerado
- Certifique-se de que a biblioteca `qrcode` foi instalada (`npm install qrcode`)
- A imagem QR Code é gerada automaticamente ao criar uma chave

### Erro ao fazer login
- Verifique se o instrutor/admin foi cadastrado corretamente
- Confirme a matrícula/email e senha
- Verifique se o hash da senha foi gerado corretamente com bcrypt

## Próximas Melhorias

- [ ] Implementar leitura real de QR Code com câmera
- [ ] Adicionar sistema de permissões mais granular
- [ ] Implementar autenticação com múltiplos fatores
- [ ] Adicionar relatórios avançados
- [ ] Integração WhatsApp para notificações
- [ ] App mobile (React Native)
- [ ] Sistema de notificações em tempo real

## Suporte

Para dúvidas ou problemas, verifique:
1. A documentação do Supabase: https://supabase.com/docs
2. A documentação do Express: https://expressjs.com
3. Stack Overflow para issues específicas

## Licença

Desenvolvido para SENAI - Gestão de Ambientes
