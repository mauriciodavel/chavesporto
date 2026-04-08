#!/bin/bash
# Script para testar bloqueios da API

echo "🔍 Testando API de bloqueios..."
echo ""

# 1. Teste de conexão básica
echo "1️⃣  Verificando todos os bloqueios:"
echo "   GET http://localhost:3000/api/blockouts/debug/all"
echo ""

# 2. Buscar bloqueios
RESPONSE=$(curl -s http://localhost:3000/api/blockouts/debug/all)

# 3. Contar bloqueios
COUNT=$(echo $RESPONSE | grep -o '"id"' | wc -l)

echo "✅ Resposta recebida"
echo "📊 Total de bloqueios encontrados: $COUNT"
echo ""

# 4. Mostrar bloqueios
echo "📋 Bloqueios na tabela:"
echo $RESPONSE | jq '.data[] | {start: .blockout_start_date, end: .blockout_end_date, reason: .blockout_reason, shift: .shift, deleted: .deleted_at}' 2>/dev/null || echo "   (JSON parsing não disponível - use o endpoint direto no navegador)"

echo ""
echo "🔗 Abra no navegador para visualizar:"
echo "   http://localhost:3000/api/blockouts/debug/all"
echo ""
echo "📅 Lembre-se:"
echo "   - Bloqueios de 21/04/2026 só aparecem na semana 20/04-26/04"
echo "   - Clique 'Próxima Semana' para navegar"
