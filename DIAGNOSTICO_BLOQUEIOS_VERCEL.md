# 🔍 Diagnóstico: Bloqueios Não Aparecem no Calendário em Vercel

## Problema
Os bloqueios estão sendo **carregados** (4 bloqueios no console), mas **não aparecem visualmente** no calendário de disponibilidade.

## Status em Produção
- ✅ 4 bloqueios carregados do servidor
- ✅ Console mostra dados corretos
- ❌ Calendário não renderiza bloqueios
- 🔍 Causa: Provável mismatch entre `key_id` dos bloqueios e `id` dos ambientes

---

## 📋 Passos de Diagnóstico

### 1️⃣ Abra o Console do Navegador (F12)

No Vercel em produção, acesse:
```
https://seu-dominio/disponibilidade-ambientes
```

Pressione **F12** → Aba **Console**

### 2️⃣ Procure pelos Logs de Debug

Copie e cole este código no console:

```javascript
// Verificar mapeamento de IDs
console.log('=== DIAGNOSTICO DE BLOQUEIOS ===');
console.log('Total de ambientes:', window.environments?.length || 0);
console.log('Total de bloqueios:', window.blockouts?.length || 0);

if (window.blockouts && window.blockouts.length > 0) {
  console.log('\n📊 BLOQUEIOS DETALHADOS:');
  window.blockouts.forEach((b, idx) => {
    const matchingEnv = window.environments?.find(e => e.id === b.key_id);
    console.log(`${idx}. ID: ${b.id}`);
    console.log(`   key_id: ${b.key_id}`);
    console.log(`   Encontrado em ambientes? ${matchingEnv ? '✅ SIM: ' + matchingEnv.environment : '❌ NÃO'}`);
    console.log(`   Período: ${b.start_date} a ${b.end_date}`);
    console.log(`   Tipo: ${b.type}`);
    console.log('');
  });
}

if (window.environments && window.environments.length > 0) {
  console.log('\n📍 PRIMEIROS 5 AMBIENTES E SEUS IDS:');
  window.environments.slice(0, 5).forEach(e => {
    console.log(`  ${e.environment}: ${e.id}`);
  });
}
```

### 3️⃣ Analise a Saída

**Cenário A: Bloqueios com key_id encontrados**
```
✅ SIM: Lab-01 - Prototipar
```
→ Os IDs estão casando, o problema é na renderização

**Cenário B: Bloqueios com "❌ NÃO"**
```
❌ NÃO
```
→ Os `key_id` nos bloqueios não existem na lista de ambientes
→ **Este é o problema!**

---

## 🔧 Possíveis Causas

### Causa 1: Dados Duplicados/Desincronizados
- Bloqueios criados com `key_id` de um ambiente que foi deletado
- Supabase com dados diferentes

**Solução:**
```sql
-- Verificar no Supabase:
SELECT b.id, b.key_id, b.observation, COUNT(k.id) as env_exists
FROM calendar_blockouts b
LEFT JOIN keys k ON k.id = b.key_id
GROUP BY b.id
HAVING COUNT(k.id) = 0;

-- Se esse query retornar linhas, limpar:
DELETE FROM calendar_blockouts 
WHERE key_id NOT IN (SELECT id FROM keys WHERE deleted_at IS NULL);
```

### Causa 2: RLS Bloqueando Acesso
Se o backend não pode ler todos os ambientes devido a RLS:

**Solução:**
1. Verifique se `SUPABASE_SERVICE_ROLE` está configurado no Vercel
2. Verifique as políticas RLS da tabela `keys`

---

## 🛠️ Diagnóstico no Backend

### Via API Direta

Abra no navegador (em produção):

```
https://seu-dominio/api/environments/weekly-availability?startDate=2026-07-20
```

Verifique:
1. Se `blockouts` array tem 4 elementos
2. Cada `key_id` existe em `environments`
3. Datas estão em formato `YYYY-MM-DD`

### Copie a Resposta Completa

Se houver problema, salve o JSON e envie para análise:

```javascript
// No console, após carregar a página:
console.log(JSON.stringify({
  environments: window.environments?.map(e => ({ id: e.id, env: e.environment })),
  blockouts: window.blockouts?.map(b => ({ key_id: b.key_id, start: b.start_date, end: b.end_date, reason: b.reason }))
}, null, 2));
```

---

## ✅ Verificação Rápida

### Em localhost (onde funciona):

```javascript
// Copie os dados de ambientes
const localEnvIds = new Set(window.environments.map(e => e.id));

// Verifique os bloqueios
window.blockouts.filter(b => b.key_id && !localEnvIds.has(b.key_id))
.map(b => ({ key_id: b.key_id, reason: b.reason }));

// Se retornar array vazio [], os IDs combinam!
// Se retornar dados, os IDs NÃO combinam!
```

### Em Vercel (produção):

Execute o mesmo código e compare os resultados.

---

## 🔧 Soluções Recomendadas

### Solução Rápida: Limpar Bloqueios Órfãos

Se os bloqueios têm `key_id` de ambientes deletados:

```sql
-- Executar no Supabase Console (em produção)
DELETE FROM calendar_blockouts 
WHERE key_id IS NOT NULL 
AND key_id NOT IN (SELECT id FROM keys WHERE deleted_at IS NULL);
```

Depois recarregar a página.

### Solução Alternativa: Mudar para Bloqueios Globais

Se os bloqueios devem se aplicar a TODOS os ambientes:

```javascript
// Executar no console do navegador em Vercel (admin access)
// Abra admin-blockouts, crie bloqueio SEM selecionar um ambiente específico
// O novo bloqueio terá key_id = NULL e aparecerá para todos
```

---

## 📞 Próxima Ação

1. ✅ Execute os comandos de diagnóstico acima
2. 📸 Tire screenshots do console
3. 📝 Com base nos resultados, identifique qual cenário se aplica
4. 🔧 Aplique a solução correspondente
5. 🧪 Teste em Vercel recarregando a página

**Após fazer as mudanças:**
```bash
git add .
git commit -m "fix: Corrigir bloqueios no calendário - limpar dados órfãos"
git push
# Vercel redeploy automático em ~2 minutos
```
