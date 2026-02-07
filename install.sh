#!/bin/bash

# Script de instalação completa do projeto

echo "🔧 Iniciando instalação do Sistema de Controle de Chaves..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null
then
    echo -e "${RED}❌ Node.js não está instalado. Instale em: https://nodejs.org${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"

# Instalar dependências backend
echo ""
echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"

cd backend

if [ -f "package.json" ]; then
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependências instaladas com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao instalar dependências${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Arquivo package.json não encontrado${NC}"
    exit 1
fi

# Criar .env se não existir
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${YELLOW}📝 Criando arquivo .env...${NC}"
    cp .env.example .env
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Arquivo .env criado${NC}"
        echo -e "${YELLOW}⚠  IMPORTANTE: Edite o arquivo .env com suas credenciais Supabase!${NC}"
    else
        echo -e "${RED}❌ Erro ao criar .env${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Arquivo .env já existe${NC}"
fi

echo ""
echo -e "${GREEN}✅ Instalação completa!${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Edite o arquivo backend/.env com suas credenciais Supabase"
echo "2. Execute: ${GREEN}npm run dev${NC}"
echo "3. Abra: http://localhost:3000"
echo ""
echo -e "${YELLOW}Documentação:${NC}"
echo "- Guia Rápido: QUICK_START.md"
echo "- Instalação Completa: INSTALLATION.md"
echo "- Manual do Usuário: USER_MANUAL.md"
echo ""
