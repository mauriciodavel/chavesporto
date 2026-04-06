# 📺 Painel de Ambientes - Guia de Implementação

## 📌 O que foi criado

### 1. **Frontend - Tela Pública**
- **Arquivo**: `frontend/painel-ambientes.html`
- **CSS**: `frontend/css/painel-ambientes.css`
- **JavaScript**: `frontend/js/painel-ambientes.js`
- **Acesso**: `http://seu-dominio/painel` (SEM AUTENTICAÇÃO)

### 2. **Backend - API**
- **Controller**: `backend/controllers/painelController.js`
- **Rotas**: `backend/routes/painel.js`
- **Endpoints Públicos**:
  - `GET /api/painel` - Obter ambientes com reservas ativas
  - `GET /api/painel/media` - Listar mídias disponíveis

- **Endpoints Admin** (autenticação obrigatória):
  - `POST /api/painel/media/upload` - Upload de mídia
  - `DELETE /api/painel/media/:type` - Deletar mídia

### 3. **Armazenamento de Mídia**
- **Pasta**: `public/media/painel/`
- **Tipos**:
  - `media_1_*.jpg|png|gif|webp` - Imagem 1
  - `media_2_*.jpg|png|gif|webp` - Imagem 2
  - `media_3_*.mp4|webm` - Vídeo
- **Sobrescrita**: Novo arquivo remove o anterior automaticamente
- **Limite**: 5MB por imagem, 50MB por vídeo

---

## 🎨 Interface

### **Layout**
```
┌─────────────────────────────────────────────────────────────────────┐
│                        PAINEL DE AMBIENTES                          │
│           [Hora] [Data]        SENAI - Gestão de Ambientes         │
└─────────────────────────────────────────────────────────────────────┘
│    [🔍 Buscar] [Ordenar por ▼] [🔐 Admin]      │  📺 Mídia & Comunicação
│                                                  │  ┌──────────────────┐
│  ┌─ Status ─ Turma ─ Instrutor ─ Ambiente ─┐  │  │ 🖼️Imagem 1      │
│  │ 🟢 HTC-01  Karla     Lab 201             │  │  │ (Max: 5MB)      │
│  │ 🟠 AIT-01  Marcio    Lab 202             │  │  ├──────────────────┤
│  │ 🔴 ..      ..        ..                   │  │  │ 🖼️Imagem 2      │
│  │                                           │  │  │ (Max: 5MB)      │
│  └───────────────────────────────────────────┘  │  ├──────────────────┤
│                                                  │  │ 🎥 Vídeo        │
│                                                  │  │ (Max: 50MB)     │
│                                                  │  ├──────────────────┤
│                                                  │  │ 📤 Upload (Admin)
│                                                  │  │ [Tabs] [Enviar]
│                                                  │  └──────────────────┘
└─────────────────────────────────────────────────────────────────────┘
```

### **Funcionalidades**

#### 🔍 **Busca e Filtro**
- Busca por: Turma, Instrutor, Ambiente, Localização
- Ordenação: Código da Turma, Nome do Instrutor, Unidade Curricular, Horário
- Atualização automática a cada 1 minuto

#### 📊 **Tabela de Ambientes**
Exibe APENAS ambientes com:
- ✅ Reserva **APROVADA** (status = 'approved')
- ✅ Data de hoje dentro do período (data atual entre start_date e end_date)
- ✅ Horários calculados automaticamente pelo turno

| Coluna | Descrição |
|--------|-----------|
| Status | Disponível / Retirada / Pendente |
| Código da Turma | Identificação da turma |
| Nome do Instrutor | Quem reservou a chave |
| Unidade Curricular | Nome da área/ambiente |
| Ambiente | Localização (ex: Lab 201) |
| Horário | Período de aula (baseado no turno) |
| Turno | Matutino / Vespertino / Noturno / Integral |

#### 📺 **Sidebar de Mídia**
- 2 Espaços para imagens (JPG, PNG, GIF, WebP)
- 1 Espaço para vídeo (MP4, WebM)
- Cada novo upload sobrescreve o anterior
- Modo Admin: Interface de upload habilitada
- Modo Público: Apenas visualização

#### 🔐 **Admin Mode**
Login via email e senha:
```
- Verifica role = 'admin'
- Ativa área de upload de mídia
- Token salvo em localStorage
- Botão de logout disponível
```

---

## 📋 Dados da Reserva (BD)

A tabela mostra informações de `key_reservations` filtradas:

```sql
SELECT 
  kr.id,
  kr.turma,
  i.name as instructor_name,
  k.environment,
  k.location,
  kr.reservation_start_date,
  kr.reservation_end_date,
  kr.shift,
  kr.status,
  kr.motivo_detalhado
FROM key_reservations kr
LEFT JOIN instructors i ON kr.instructor_id = i.id
LEFT JOIN keys k ON kr.key_id = k.id
WHERE kr.status = 'approved'
  AND kr.reservation_start_date <= CURRENT_DATE
  AND kr.reservation_end_date >= CURRENT_DATE
ORDER BY kr.reservation_start_date ASC;
```

---

## 🕐 Horários Padrão por Turno

| Turno | Início | Fim |
|-------|--------|-----|
| 🌅 Matutino | 07:00 | 12:00 |
| 🌤️ Vespertino | 13:00 | 18:00 |
| 🌙 Noturno | 19:00 | 22:30 |
| ☀️ Integral | 07:00 | 18:00 |

---

## 📤 Upload de Mídia (Admin)

### **Fluxo**
1. **Login Admin**: Clica em "🔐 Admin"
2. **Autenticação**: Email + Senha
3. **Seleção**: Escolhe Imagem 1, 2 ou Vídeo via tabs
4. **Escolha**: Seleciona arquivo do computador
5. **Envio**: Clica em "📤 Enviar"
6. **Resultado**: Arquivo aparece no painel

### **Validações**
```javascript
✓ Tipo correto (imagem ou vídeo)
✓ Tamanho máximo (5MB ou 50MB)
✓ Formato permitido (JPG, PNG, GIF, WebP, MP4, WebM)
✓ Permissão de admin ativa
```

### **Armazenamento**
```
📁 public/media/painel/
  ├── media_1_1234567890.jpg     (Imagem 1)
  ├── media_2_1234567891.png     (Imagem 2)
  └── media_3_1234567892.mp4     (Vídeo)
```

---

## 🚀 Como Acessar

### **Público (Visualização)**
```
http://seu-dominio/painel
```
- Sem login
- Atualiza automaticamente a cada 1 minuto
- Exibe apenas ambientes com reserva ativa e aprovada

### **Admin (Gerenciar Mídia)**
```
1. Acesse: http://seu-dominio/painel
2. Clique em: 🔐 Admin (canto superior direito)
3. Login: email + senha de administrador
4. Funcionalidade: Upload/remoção de mídia habilitada
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────┐
│ Painel Pública (painel-ambientes.html)              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ GET /api/painel (Public Endpoint)                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ painelController.getAmbientesComReservas()          │
├─────────────────────────────────────────────────────┤
│ 1. Query: key_reservations (status=approved)        │
│ 2. Filter: TODAY between start_date e end_date     │
│ 3. Join: instructors, keys                         │
│ 4. Map: Horários por turno                         │
│ 5. Return: Array de ambientes                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ Response JSON                                       │
├─────────────────────────────────────────────────────┤
│ {                                                   │
│   "success": true,                                 │
│   "data": [                                        │
│     {                                              │
│       "id": "uuid",                                │
│       "turma": "HTC-LOG-01",                       │
│       "instructor_name": "Karla",                  │
│       "environment": "Lab Lógica",                 │
│       "start_time": "07:00",                       │
│       "end_time": "12:00",                         │
│       "shift": "matutino",                         │
│       "status": "approved"                         │
│     }                                              │
│   ]                                                │
│ }                                                  │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ JavaScript renderiza tabela (painel-ambientes.js)   │
├─────────────────────────────────────────────────────┤
│ - Aplica filtros de busca                          │
│ - Aplica ordenação                                 │
│ - Renderiza linhas HTML                            │
│ - Mostra status com indicadores visuais            │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testes

### **Teste 1: Visualizar Painel (Público)**
```bash
# Sem autenticação
curl http://localhost:3000/painel

# Ou no navegador
http://localhost:3000/painel
```

**Esperado**: Página carrega com tabela vazia (se não houver reservas)

### **Teste 2: Obter Ambientes com Reservas**
```bash
curl http://localhost:3000/api/painel

# Resposta esperada
{
  "success": true,
  "data": [
    {
      "id": "...",
      "turma": "HTC-LOG-01",
      "instructor_name": "Karla",
      ...
    }
  ]
}
```

### **Teste 3: Login Admin e Upload**
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@senai.com","password":"senha123"}'

# 2. Upload de mídia
curl -X POST http://localhost:3000/api/painel/media/upload \
  -H "Authorization: Bearer {TOKEN}" \
  -F "file=@imagem.jpg" \
  -F "type=1"

# Resposta esperada
{
  "success": true,
  "message": "Arquivo enviado com sucesso",
  "filename": "media_1_1234567890.jpg",
  "url": "/media/painel/media_1_1234567890.jpg"
}
```

### **Teste 4: Listar Mídias**
```bash
curl http://localhost:3000/api/painel/media

# Resposta esperada
{
  "success": true,
  "data": {
    "1": {
      "filename": "media_1_1234567890.jpg",
      "url": "/media/painel/media_1_1234567890.jpg"
    },
    "2": null,
    "3": null
  }
}
```

---

## 📝 Notas Importantes

### ✅ O que funciona
- Painel público sem autenticação
- Exibição de tabela com dados ao vivo
- Filtros e ordenação funcionam corretamente
- Upload de mídia com sobrescrita automática
- Armazenamento em pasta do projeto (não BD)
- Auto-refresh a cada 1 minuto
- Status visual com indicadores
- Responsivo para mobile

### ⚠️ Limitações
- Horários são padrão por turno (não personalizados por chave)
- Mídia não é replicada em instâncias múltiplas (se usar containerização)
- Sem cache de mídia (sempre lê do disco)

### 🔜 Melhorias Futuras
- Integração com calendário visual
- Notificações em tempo real via WebSocket
- Filtro por bloco/área
- QR code para rápido acesso
- Estatísticas de uso por ambiente

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique** se há reservas aprovadas para hoje
2. **Confirme** data/hora do servidor está correta
3. **Teste** a API diretamente: `/api/painel`
4. **Limpe** localStorage em `painel-ambientes.html` (F12 > Console)
5. **Revise** logs do backend (console do Node)

---

## 📚 Arquivos Criados

```
frontend/
├── painel-ambientes.html       (HTML principal)
├── css/painel-ambientes.css    (Estilos)
└── js/painel-ambientes.js      (Lógica JS)

backend/
├── controllers/painelController.js  (API logic)
├── routes/painel.js                 (API routes)
└── server.js                        (MODIFICADO)

public/
└── media/painel/                    (Pasta de armazenamento)
```

---

**Status**: ✅ Implementação Completa
**Última atualização**: Abril 2026
