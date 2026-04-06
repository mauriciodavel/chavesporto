# 🪣 Configuração do Supabase Storage - Painel de Ambientes

## ⚠️ O PROBLEMA

O erro 500 ao fazer upload ocorre porque o **bucket `painel-media` ainda NÃO FOI CRIADO** no Supabase.

---

## ✅ SOLUÇÃO: Criar e Configurar o Bucket

### PASSO 1: Acessar o Supabase Console

1. Abra: https://app.supabase.com
2. Faça login com sua conta
3. Selecione o projeto: **gxkmcqcgorkscabzuhks**
4. No menu esquerdo, clique em **Storage** (ícone de pasta)

---

### PASSO 2: Criar o Bucket `painel-media`

1. Clique no botão **"Create a new bucket"** (ou "+ New bucket")
2. Digite o nome: **`painel-media`** (exatamente com este nome)
3. **NÃO marque** "Private bucket" (deixe público para que getPublicUrl() funcione)
4. Clique em **"Create bucket"**

**Resultado esperado:**
```
✅ Bucket 'painel-media' criado com sucesso
```

---

### PASSO 3: Configurar Acesso Público (CRÍTICO)

1. Clique no bucket **`painel-media`** para abrir suas configurações
2. Verá uma aba **"Policies"** (políticas de acesso)
3. Adicione a seguinte política de leitura pública:

**Nome da Política:** `Allow public read`
**Tipo:** SELECT
**Usuários:** Público (anon)
**Caminhos:** `painel/*`

**Para adicionar:**
- Clique em "+ New policy"
- Selecione "For queries only" → "SELECT"
- Configure:
  ```
  ✓ Allow only anon users
  Roles: (deixe padrão)
  ```

---

### PASSO 4: Configurar CORS (Se necessário)

Se estiver testando com frontend local, adicione CORS:

1. Vá para **Settings** → **CORS**
2. Adicione sua URL local:
   ```
   http://localhost:3000
   http://localhost:5000
   http://192.168.10.47:3000
   ```

---

## 🧪 TESTE A CONEXÃO

Depois de criar o bucket, teste a conexão do backend:

### Terminal 1: Inicie o backend
```bash
cd backend
npm run dev
```

### Terminal 2: Faça um teste de upload

```powershell
# Teste com arquivo de teste
$imagemPath = "C:\seu\caminho\para\imagem.jpg"  # Ajuste o caminho
$form = @{
    type = '1'
    file = Get-Item -Path $imagemPath
}

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/painel/media/upload" `
    -Headers @{ Authorization = "Bearer YOUR_JWT_TOKEN" } `
    -Form $form `
    -Method Post `
    -UseBasicParsing

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

**Se funcionar, verá:**
```json
{
  "success": true,
  "message": "Arquivo enviado com sucesso",
  "url": "https://gxkmcqcgorkscabzuhks.supabase.co/storage/v1/object/public/painel-media/painel/media_1_17752345678.jpg"
}
```

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [ ] Bucket `painel-media` criado no Supabase
- [ ] Bucket está **PÚBLICO** (não marcado como privado)
- [ ] Política de leitura pública configurada (SELECT para anon) 
- [ ] CORS adicionado (se testando localmente)
- [ ] Backend iniciado: `npm run dev` na pasta `backend/`
- [ ] Upload testado com sucesso
- [ ] URL Supabase Storage retorna corretamente

---

## 🔗 CREDENCIAIS USADAS

Seu projeto Supabase (veja em `backend/.env`):
- **URL:** `https://[seu-projeto].supabase.co`
- **Anon Key:** `sb_publishable_[sua-chave-publica]`
- **Service Role Key:** Guardado em `backend/.env` (não exponha!)
- **Bucket:** `painel-media`

⚠️ **NUNCA** exponha as chaves em commits git. Use as variáveis de ambiente em `backend/.env` que já está em `.gitignore`.

---

## 🚀 EM PRODUÇÃO (Vercel)

Assim que o bucket estiver configurado:

1. As variáveis já estão no `.env.production`:
   ```
   SUPABASE_BUCKET=painel-media
   NODE_ENV=production
   ```

2. Faça: `git push` para redeplorar no Vercel

3. O upload em produção usará automaticamente Supabase Storage

---

## ❓ DÚVIDAS COMUNS

### P: Por que preciso deixar o bucket público?
**R:** O `getPublicUrl()` precisa conseguir gerar URLs acessíveis. Se for privado, o upload funciona, mas a URL gerada não será acessível.

### P: Consigo fazer upload, mas a imagem não carrega?
**R:** Verifique:
- Bucket está público?
- A URL está correta: `https://gxkmcqcgorkscabzuhks.supabase.co/storage/v1/object/public/painel-media/painel/...`
- CORS está configurado?

### P: Erro "Bucket does not exist"?
**R:** O nome do bucket **deve ser exatamente** `painel-media` (com hífen).

---

**Próximo passo após configurar:** 
Teste no painel em `http://localhost:3000/painel` e tente fazer upload de uma imagem.
