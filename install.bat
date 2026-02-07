@echo off
REM Script de instalação para Windows

echo.
echo ========================================
echo  Sistema de Controle de Chaves
echo  Instalador para Windows
echo ========================================
echo.

REM Verificar se Node.js está instalado
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado!
    echo Instale em: https://nodejs.org
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js encontrado: %NODE_VERSION%

REM Instalar dependências backend
echo.
echo [INFO] Instalando dependencias do backend...
echo.

cd backend

if exist "package.json" (
    call npm install
    if errorlevel 1 (
        echo [ERRO] Erro ao instalar dependencias
        exit /b 1
    )
    echo [OK] Dependencias instaladas com sucesso!
) else (
    echo [ERRO] Arquivo package.json nao encontrado
    exit /b 1
)

REM Criar .env se não existir
if not exist ".env" (
    echo.
    echo [INFO] Criando arquivo .env...
    copy .env.example .env
    if errorlevel 0 (
        echo [OK] Arquivo .env criado com sucesso
        echo [AVISO] IMPORTANTE: Edite o arquivo .env com suas credenciais Supabase!
    ) else (
        echo [ERRO] Erro ao criar .env
        exit /b 1
    )
) else (
    echo [OK] Arquivo .env ja existe
)

echo.
echo ========================================
echo [OK] Instalacao concluida com sucesso!
echo ========================================
echo.
echo Proximos passos:
echo 1. Edite: backend\.env com suas credenciais Supabase
echo 2. Execute: npm run dev
echo 3. Abra: http://localhost:3000
echo.
echo Documentacao:
echo - Guia Rapido: QUICK_START.md
echo - Instalacao Completa: INSTALLATION.md
echo - Manual do Usuario: USER_MANUAL.md
echo.
pause
