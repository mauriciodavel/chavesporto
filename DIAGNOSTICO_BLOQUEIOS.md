# 🔍 Diagnóstico de Bloqueios Não Exibidos

Siga estes passos para descobrir por que os bloqueios (feriados, manutenção) não aparecem no calendário.

## Passo 1: Verificar Bloqueios na Tabela

### Via API (mais rápido):
```
GET http://localhost:3000/api/blockouts/debug/all
```

Isso retornará TODOS os bloqueios da tabela, inclusive deletados.

**O que procurar:**
- [ ] Existem bloqueios para a data 21/04/2026?
- [ ] Qual é o `blockout_start_date` e `blockout_end_date`?
- [ ] Qual é o `blockout_reason`?
- [ ] O `deleted_at` é `null` (ativo) ou tem um valor?

---

## Passo 2: Verificar o Console do Backend

1. Abra o terminal onde npm run dev está rodando
2. Procure por mensagens com:
   - 🔒 `"Buscando bloqueios com filtros"`
   - 📋 `"TODOS OS BLOQUEIOS:"`
   - 📅 Mensagens mostrando cada bloqueio sendo avaliado
   - ✅ `"Bloqueios filtrados para semana"`

**Exemplo de saída esperada:**

```
🔒 Buscando bloqueios com filtros: { startStr: '2026-04-20', endStr: '2026-04-26' }
🔒 Total de bloqueios na tabela calendar_blockouts: 5
📋 TODOS OS BLOQUEIOS: [
  { id: 'abc1234', start: '2026-04-21', end: '2026-04-21', reason: 'Feriado...', shift: null, deleted: null }
]
  📅 2026-04-21 a 2026-04-21: ✅ PASSA (semana: 2026-04-20 a 2026-04-26)
✅ Bloqueios filtrados para semana de 2026-04-20 a 2026-04-26: 1 encontrados
   - 2026-04-21 a 2026-04-21: Feriado nacional (todos os turnos)
```

---

## Passo 3: Verificar Data da Semana Atual

1. Abra: http://localhost:3000/painel/disponibilidade
2. Veja qual semana está sendo mostrada (topo da página)
3. Comprare com a data do bloqueio:

**IMPORTANTE:** O calendário mostra a SEMANA correspondente!
- Se hoje é 07/04/2026 (segunda), a semana é **06/04 a 12/04**
- O feriado 21/04/2026 é da **próxima próxima semana (20/04 a 26/04)**
- **Você precisa navegar para a próxima semana!**

---

## Passo 4: Confirmar Bloqueio Apareceu

1. Clique em "Próxima Semana →" quantas vezes precisar
2. Até chegar na semana do dia 21/04
3. Procure por: **🔧 M** (Manutenção/Bloqueio)

**Se o bloqueio aparecer agora = problema resolvido!** ✅

---

## Diagnóstico Rápido

| Cenário | Causa Provável | Solução |
|---------|---|---|
| 📋 API retorna 0 bloqueios | Nenhum bloqueio cadastrado | Crie um bloqueio em admin-blockouts |
| 📋 API retorna bloqueios MAS não aparecem | Data fora da semana atual | Navegar para semana do bloqueio |
| 📋 API retorna bloqueios E está na semana certa | Filtro de shift está escondendo | Selecionar "Todos" no filtro de turnos |
| 📋 Backend não log nada | Erro na API | Verificar console do backend |

---

## Teste Prático

### Para Feriado 21/04:
```
1. Abra /painel/disponibilidade
2. Anote qual semana está mostrando (ex: 06/04 a 12/04)
3. Clique "Próxima Semana" 
4. Continue até ver semana 20/04 a 26/04
5. Procure pelo dia 21 (segunda)
6. Deve ter: 🔧 M M M (bloqueio em 3 turnos)
```

### Se não aparecer:
```
1. Abra F12 (Dev Tools)
2. Vá para Console
3. Carregue a página
4. Cole: fetch('http://localhost:3000/api/blockouts/debug/all').then(r=>r.json()).then(d=>console.log(d.data))
5. Veja se bloqueios aparecem
```

---

## Debug Extra

**No console do navegador (F12), cole:**
```javascript
// Ver todos os bloqueios carregados no calendário
console.log('Bloqueios carregados:', window.blockouts || 'não encontrado');

// Ver qual semana está sendo exibida
console.log('Semana atual:', document.getElementById('currentWeekDisplay').textContent);
```

---

## Reportar Problema

Se mesmo assim não funcionar, compartilhe:
1. Saída de: GET /api/blockouts/debug/all
2. Logs do backend mostrando a semana sendo procurada
3. Qual semana o calendário está mostrando
4. Screenshot do calendário
