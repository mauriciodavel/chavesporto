# Configuração de Timezone - Brasília

## 📍 Situação Atual

O sistema está configurado para **sempre exibir os horários em Brasília (America/Sao_Paulo)**, independentemente do timezone do navegador do usuário.

## 🔧 Como Funciona

### Backend (Node.js)
- Todos os timestamps são salvos em **UTC (Coordinated Universal Time)** no Supabase
- O PostgreSQL converte automaticamente para UTC quando recebe `now()`
- Não há conversão no backend - os dados são salvos em UTC puro

### Frontend (JavaScript)
- O arquivo `js/timezone.js` fornece a classe `TimezoneFormatter`
- Esta classe converte automaticamente para **America/Sao_Paulo**
- Funções disponíveis:
  - `TimezoneFormatter.formatDateTime(date)` → "DD/MM/YYYY HH:MM"
  - `TimezoneFormatter.formatDate(date)` → "DD/MM/YYYY"
  - `TimezoneFormatter.formatTime(date)` → "HH:MM:SS"

### Funções em app.js
- `formatDateTime(dateString)` usa `TimezoneFormatter.formatDateTime()`
- `formatDate(dateString)` usa `TimezoneFormatter.formatDate()`
- `formatTime(dateString)` usa `TimezoneFormatter.formatTime()`

## 📋 Arquivos Modificados

1. **frontend/js/timezone.js** (novo)
   - Classe TimezoneFormatter com suporte a America/Sao_Paulo
   - Usa Intl.DateTimeFormat nativo do navegador

2. **frontend/js/app.js**
   - `formatDateTime()`, `formatDate()`, `formatTime()` atualizadas
   - Agora usam `TimezoneFormatter`

3. **frontend/dashboard.html**
   - Adicionado `<script src="js/timezone.js"></script>`

4. **frontend/admin.html**
   - Adicionado `<script src="js/timezone.js"></script>`

## ✅ Teste de Verificação

Para verificar que o timezone está correto:

1. Retire uma chave em um horário específico
2. Vá para o histórico
3. Verifique se o horário exibido corresponde **ao horário de Brasília**

### Exemplo:
- Se você retirou a chave às **14h00 de Brasília**
- O sistema vai exibir: `"DD/MM/YYYY 14:00"`

## 🌍 Como Mudar o Timezone

Se no futuro precisar mudar para outro timezone (ex: São Paulo → Rio de Janeiro, que é mesmo timezone):

### 1. Editar `frontend/js/timezone.js`

Linha 3:
```javascript
static readonly BRASILIA_TIMEZONE = 'America/Sao_Paulo';
```

Trocar para outro, como:
- `'America/Recife'` - Fernando de Noronha (UTC-2)
- `'America/Fortaleza'` - Outros estados
- `'UTC'` - Coordinated Universal Time

### Timezones Válidos
Usar nomes da [IANA Timezone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones):
- `America/New_York` - New York
- `Europe/London` - Londres
- `Asia/Tokyo` - Tóquio

## 🔐 Importante

- Nunca altere `withdrawn_at`, `returned_at`, ou `created_at` no banco diretamente
- O PostgreSQL/Supabase sempre mantém em UTC
- A conversão acontece apenas na exibição (frontend)
- Comparações no backend usam UTC puro (isso é correto)

## 📝 Logs e Debugging

Se houver problemas, verificar no console do navegador:
```javascript
// Testar a classe
TimezoneFormatter.format(new Date())
TimezoneFormatter.getTimezoneOffset() // Mostra diferença em minutos
```

---

**Última atualização:** 07/02/2026
**Versão:** 1.0
**Timezone:** America/Sao_Paulo (Brasília)
