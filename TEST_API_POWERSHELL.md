rs# Testando APIs com PowerShell

## � Pré-Requisitos

1. ✅ Banco de dados populado com dados de teste (execute [PASSO_2_TESTES.md](PASSO_2_TESTES.md))
2. ✅ Servidor rodando: `npm run dev`
3. ✅ PowerShell aberto como Administrador

---

## 🚀 Opção 1: Executar Script Completo (RECOMENDADO)

### Passo 1: Abra PowerShell
```powershell
# Como Administrador
```

### Passo 2: Navegue até o script
```powershell
cd "c:\Users\mauri\OneDrive\Documentos\VScode Projetos\chavesporto\backend\scripts"
```

### Passo 3: Execute o teste
```powershell
.\test-reservations.ps1
```

### Resultado Esperado
```
=== TESTE DE APIs ===

1. Testando LOGIN...
OK - Token obtido

2. Listando RESERVAS...
OK - 0 reservas encontradas

3. Criando RESERVA...
OK - Reserva criada

4. Obtendo DETALHE...
OK - Detalhe obtido

5. Verificando DISPONIBILIDADE...
OK - Disponibilidade: True

6. Criando PERMISSÃO...
OK - Permissão criada

7. Criando MANUTENÇÃO...
OK - Manutenção criada

8. Aprovando RESERVA...
OK - Reserva aprovada

9. Rejeitando RESERVA...
OK - Reserva rejeitada

=== TESTES FINALIZADOS ===
```

---

## 🔐 Credenciais de Teste

**Login de Admin** (para testes de aprovação/rejeição):
```
Email: admin@senai.com.br
Senha: admin123
```

**Observação:** Se você alterou a senha do admin, atualize o script:
- Abra: `backend/scripts/test-reservations.ps1`
- Encontre a linha: `$loginBody = '{"email":"admin@senai.com.br","password":"admin123"}'`
- Substitua com suas credenciais

---

## 🎯 Opção 2: Comandos Individuais

### 1️⃣ LOGIN - Obter Token

```powershell
$loginResp = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body @{email="seu-email@senai.br"; password="sua-senha"} | ConvertTo-Json

$token = $loginResp.token
Write-Host "Token: $token"
```

Salve o token em uma variável:
```powershell
$token = "seu-jwt-token-aqui"
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
```

---

### 2️⃣ LISTAR RESERVAS

```powershell
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/reservations" `
  -Method GET `
  -Headers $headers | ConvertTo-Json
```

---

### 3️⃣ CRIAR RESERVA

```powershell
$body = @{
    key_id = "uuid-da-chave"
    instructor_id = "seu-uuid"
    start_date = "2026-02-15"
    end_date = "2026-02-20"
    shift = "matutino"
    turma = "SENAI-001"
    motivo_detalhado = "Aula prática"
    created_by_admin = $false
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/reservations" `
  -Method POST `
  -Headers $headers `
  -Body $body | ConvertTo-Json
```

---

### 4️⃣ OBTER DETALHE DA RESERVA

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/reservations/uuid-da-reserva" `
  -Method GET `
  -Headers $headers | ConvertTo-Json
```

---

### 5️⃣ VERIFICAR DISPONIBILIDADE

```powershell
$baseUrl = "http://localhost:3000"
$keyId = "uuid-da-chave"
$url = "$baseUrl/api/reservations/keys/availability/$keyId"
$url += "?start_date=2026-02-15&end_date=2026-02-20&shift=matutino"

Invoke-RestMethod `
  -Uri $url `
  -Method GET `
  -Headers $headers | ConvertTo-Json
```

---

### 6️⃣ CRIAR PERMISSÃO PONTUAL

```powershell
$body = @{
    key_id = "uuid-da-chave"
    instructor_id = "uuid-do-instrutor"
    permission_date = "2026-02-15"
    shift = "matutino"
    reason = "Aula de substituição"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/reservations/permissions" `
  -Method POST `
  -Headers $headers `
  -Body $body | ConvertTo-Json
```

---

### 7️⃣ CRIAR MANUTENÇÃO

```powershell
$body = @{
    key_id = "uuid-da-chave"
    start_date = "2026-02-15"
    end_date = "2026-02-16"
    motivo = "Limpeza"
    shift = $null  # null ou omitir para dia inteiro
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/reservations/maintenance" `
  -Method POST `
  -Headers $headers `
  -Body $body | ConvertTo-Json
```

---

### 8️⃣ APROVAR RESERVA

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/reservations/uuid-da-reserva/approve" `
  -Method PATCH `
  -Headers $headers | ConvertTo-Json
```

---

### 9️⃣ REJEITAR RESERVA

```powershell
$body = @{
    rejection_reason = "Ambiente indisponível"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/reservations/uuid-da-reserva/reject" `
  -Method PATCH `
  -Headers $headers `
  -Body $body | ConvertTo-Json
```

---

## 💡 Dicas PowerShell

### Salvar resposta em variável
```powershell
$response = Invoke-RestMethod -Uri "..." -Method GET -Headers $headers
$response.data | Format-Table
```

### Ver apenas status
```powershell
$response.success
$response.data.status
```

### Formatar JSON bonito
```powershell
$response | ConvertTo-Json | Out-Host
```

### Ver headers da resposta
```powershell
$response = Invoke-WebRequest -Uri "..." -Method GET -Headers $headers
$response.Headers
```

### Salvar resposta em arquivo
```powershell
$response | ConvertTo-Json | Out-File -FilePath "response.json"
```

---

## ⚠️ Erros Comuns

| Erro | Solução |
|------|---------|
| `401 Token não fornecido` | Adicione header: `"Authorization" = "Bearer $token"` |
| `403 Privilégios de admin` | Use token de um usuário admin |
| `The underlying connection was closed` | Servidor não está rodando (execute `npm run dev`) |
| `Invalid URI: The hostname could not be parsed` | Verifique URL - deve ser `http://localhost:3000` |
| `ConvertFrom-Json` syntax error | Certifique-se que o JSON está bem formatado com `ConvertTo-Json` |

---

## 🔄 Exemplo Completo em Uma Linha

Login e listar reservas:
```powershell
$t = (Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"seu-email","password":"sua-senha"}').token; Invoke-RestMethod -Uri "http://localhost:3000/api/reservations" -Method GET -Headers @{"Authorization"="Bearer $t"}
```

---

## ✅ Checklist de Testes

- [ ] Login funciona e retorna token
- [ ] Listar reservas retorna dados
- [ ] Criar reserva gera ID novo
- [ ] Obter detalhe mostra informações corretas
- [ ] Disponibilidade retorna true/false
- [ ] Permissão pode ser criada
- [ ] Manutenção bloqueia chave
- [ ] Aprovação muda status para "approved"
- [ ] Rejeição muda status para "rejected"

Pronto para testar! 🚀
