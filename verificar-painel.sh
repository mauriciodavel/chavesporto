#!/bin/bash
# ============================================
# VERIFICAÇÃO DE INSTALAÇÃO - Painel Ambientes
# ============================================

echo "🔍 Verificando Instalação do Painel de Ambientes..."
echo ""

# 1. Verificar pasta de mídia
if [ -d "public/media/painel" ]; then
    echo "✅ Pasta de mídia existe: public/media/painel/"
else
    echo "❌ Pasta de mídia NÃO existe. Criando..."
    mkdir -p public/media/painel
    echo "✅ Pasta criada"
fi

# 2. Verificar arquivos frontend
echo ""
echo "📁 Arquivos Frontend:"
[ -f "frontend/painel-ambientes.html" ] && echo "✅ painel-ambientes.html" || echo "❌ painel-ambientes.html FALTANDO"
[ -f "frontend/css/painel-ambientes.css" ] && echo "✅ painel-ambientes.css" || echo "❌ painel-ambientes.css FALTANDO"
[ -f "frontend/js/painel-ambientes.js" ] && echo "✅ painel-ambientes.js" || echo "❌ painel-ambientes.js FALTANDO"

# 3. Verificar arquivos backend
echo ""
echo "📁 Arquivos Backend:"
[ -f "backend/controllers/painelController.js" ] && echo "✅ painelController.js" || echo "❌ painelController.js FALTANDO"
[ -f "backend/routes/painel.js" ] && echo "✅ painel.js" || echo "❌ painel.js FALTANDO"

# 4. Verificar dependências
echo ""
echo "📦 Dependências:"
cd backend
if grep -q '"multer"' package.json; then
    echo "✅ multer no package.json"
else
    echo "⚠️  multer NÃO está no package.json"
fi

# 5. Verificar server.js
if grep -q "painelRoutes" server.js; then
    echo "✅ server.js contém painelRoutes"
else
    echo "❌ server.js NÃO contém painelRoutes"
fi

if grep -q "/api/painel" server.js; then
    echo "✅ server.js contém rotas de painel"
else
    echo "❌ server.js NÃO contém rotas de painel"
fi

# 6. Sugestões
echo ""
echo "=========================================="
echo "🚀 PRÓXIMAS AÇÕES:"
echo "=========================================="
echo ""
echo "1. Instalar dependências:"
echo "   cd backend && npm install"
echo ""
echo "2. Iniciar servidor:"
echo "   npm run dev"
echo ""
echo "3. Acessar painel:"
echo "   http://localhost:3000/painel"
echo ""
echo "4. Criar dados de teste"
echo "   - Acesse /admin"
echo "   - Crie chave, instrutor, reserva"
echo "   - Aprove a reserva"
echo ""
echo "5. Testar painel"
echo "   - Veja tabela em /painel"
echo "   - Teste login admin"
echo "   - Teste upload de mídia"
echo ""
echo "=========================================="
echo "✅ Verificação Concluída!"
echo "=========================================="
