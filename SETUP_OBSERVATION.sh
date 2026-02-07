#!/bin/bash
# ============================================================
# SCRIPT DE IMPLEMENTAÇÃO - COLUNA OBSERVATION
# ============================================================

echo "
╔══════════════════════════════════════════════════════════════════╗
║  Implementação da coluna OBSERVATION no chavesporto            ║
╚══════════════════════════════════════════════════════════════════╝
"

echo "⏳ Etapa 1: Verificando se backend está rodando..."
sleep 1

# Tentar conectar ao servidor
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin 2>/dev/null)

if [ "$response" == "200" ]; then
    echo "✅ Backend está rodando em localhost:3000"
else
    echo "❌ Backend não está disponível"
    echo "⏹️  Inicie com: npm run dev"
    exit 1
fi

echo ""
echo "⏳ Etapa 2: Verificando coluna observation no Supabase..."
sleep 1

# Rodar script de verificação
node scripts/test-observation.js 2>/dev/null | tail -20

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗
║  INSTRUÇÕES FINAIS                                               ║
╚══════════════════════════════════════════════════════════════════╝
"

echo "
1️⃣  ADICIONAR COLUNA NO SUPABASE (Se não existir)
    
    Link: https://supabase.com
    1. Projeto → SQL Editor
    2. New query
    3. Copie e execute:
    
       ALTER TABLE key_history 
       ADD COLUMN IF NOT EXISTS observation TEXT DEFAULT NULL;


2️⃣  VALIDAR QUE COLUNA FOI CRIADA
    
    Terminal:
    node scripts/setup-observation.js


3️⃣  ACESSAR O PAINEL ADMIN
    
    Browser:
    http://localhost:3000/admin
    
    Login:
    Email: admin@senai.com.br
    Senha: admin123


4️⃣  TESTAR DEVOLUÇÃO COM OBSERVAÇÃO
    
    1. Localize uma chave em uso
    2. Clique em \"↩️ Devolver\"
    3. Digite uma observação
    4. Confirme
    5. Veja no histórico a observação


═══════════════════════════════════════════════════════════════════════════════
✨ Pronto! Sistema agora suporta observações em devoluções
═══════════════════════════════════════════════════════════════════════════════
"
