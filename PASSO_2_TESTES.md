# 📋 Passo 2: Preparar Banco de Dados para Testes

## ✅ O que Você Precisa Fazer Agora

### Etapa 1: Executar SQL do Passo 1 (se ainda não fez)
1. Abra o Supabase: https://app.supabase.com
2. Vá para seu projeto chavesporto
3. Abra **SQL Editor**
4. Execute o arquivo: [database/001_create_reservations_tables.sql](../001_create_reservations_tables.sql)
5. ✅ Isso cria as 4 tabelas necessárias

### Etapa 2: Popular com Dados de Teste
1. No mesmo **SQL Editor** do Supabase
2. Execute o arquivo: [database/002_seed_test_data.sql](002_seed_test_data.sql)
3. ✅ Isso insere 4 chaves de teste no banco

### Etapa 3: Verificar Dados Inseridos
Você verá um resultado como:
```
id | name | qr_code | location | status
---|------|---------|----------|--------
uuid1 | Chave Sala Lab 001 | QR-LAB-001 | Bloco A - Sala 201 | available
uuid2 | Chave Sala Lab 002 | QR-LAB-002 | Bloco A - Sala 202 | available
uuid3 | Chave Sala Lab 003 | QR-LAB-003 | Bloco A - Sala 203 | available
uuid4 | Chave Sala Prática | QR-PRAT-001 | Bloco B - Sala 101 | available
```

### Etapa 4: Testar as APIs
```powershell
cd 'c:\Users\mauri\OneDrive\Documentos\VScode Projetos\chavesporto\backend\scripts'
.\test-reservations.ps1
```

---

## 🎯 Resultado Esperado

Após executar o teste, você verá:

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

## 📊 Estrutura de Dados

### Tabelas Criadas (Passo 1):
- `key_reservations` - Registra períodos de reserva
- `key_permissions` - Permissões pontuais (1 dia)
- `environment_maintenance` - Blocos de manutenção
- `key_availability` - Cache de disponibilidade

### Dados de Teste (Passo 2):
4 chaves de teste:
1. Chave Sala Lab 001 (Bloco A, Sala 201)
2. Chave Sala Lab 002 (Bloco A, Sala 202)
3. Chave Sala Lab 003 (Bloco A, Sala 203)
4. Chave Sala Prática (Bloco B, Sala 101)

---

## 🚀 Próximos Passos (Passo 3)

Após confirmar que os testes passam:

1. **Criar Frontend de Reserva** (Passo 3)
   - Calendário para selecionar datas
   - Seletor de turnos e salas
   - Submissão de reserva

2. **Criar Dashboard de Admin** (Passo 4)
   - Índice de reservas pendentes
   - Aprovação/Rejeição visual
   - Gestão de manutenção

3. **Integração com Retirada** (Passo 5)
   - Vincular reserva ao ato de retirada
   - Validar período permitido
   - Bloquear retorno fora do período

---

## 💡 Dicas

### Ver todas as chaves:
```sql
SELECT id, name, qr_code, location FROM keys ORDER BY created_at DESC;
```

### Ver todas as reservas:
```sql
SELECT * FROM key_reservations ORDER BY created_at DESC;
```

### Limpar dados de teste (CUIDADO!):
```sql
DELETE FROM key_reservations;
DELETE FROM key_permissions;
DELETE FROM environment_maintenance;
DELETE FROM keys WHERE qr_code LIKE 'QR-%';
```

---

## ❓ Dúvidas Frequentes

**P: Meu token não funciona?**
A: Certifique-se que está usando `/api/auth/admin-login` com `email` e `password`.

**P: Erro "Campos obrigatórios faltando"?**
A: Verifique se a chave existe no banco (veja UUIDs com SELECT acima).

**P: Preciso inserir mais chaves?**
A: Use o dashboard do Supabase ou adicione mais linhas em `002_seed_test_data.sql`.

---

## ✅ Checklist

- [ ] Script 001 executado em Supabase ✅
- [ ] Script 002 executado em Supabase ✅
- [ ] 4 chaves de teste inseridas ✅
- [ ] Servidor rodando: `npm run dev` ✅
- [ ] Script de teste executado ✅
- [ ] Todos os 9 testes passaram ✅
- [ ] Pronto para Passo 3 (Frontend) ✅

Quando tudo estiver ok, me avise e começamos o Passo 3! 🎉
