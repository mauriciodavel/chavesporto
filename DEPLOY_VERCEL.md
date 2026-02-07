╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║              🚀 GUIA DEPLOY - CHAVESPORTO NO VERCEL                          ║
║                                                                               ║
║              Tempo estimado: 10 MINUTOS                                      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝


═══════════════════════════════════════════════════════════════════════════════════
PASSO 1: PREPARAR REPOSITÓRIO GIT (2 min)
═══════════════════════════════════════════════════════════════════════════════════

1.1 Abra terminal na raiz do projeto
    cd "c:\Users\mauri\OneDrive\Documentos\VScode Projetos\chavesporto"

1.2 Inicializar Git (se necessário)
    git init
    git config --global user.email "seu-email@gmail.com"
    git config --global user.name "Seu Nome"

1.3 Adicionar todos os arquivos
    git add .

1.4 Fazer commit inicial
    git commit -m "Deploy inicial - Sistema Chaves Porto"


═══════════════════════════════════════════════════════════════════════════════════
PASSO 2: CRIAR REPOSITÓRIO NO GITHUB (2 min)
═══════════════════════════════════════════════════════════════════════════════════

2.1 Acesse: https://github.com/new

2.2 Preencha:
    ├─ Repository name: chavesporto
    ├─ Description: Sistema de Controle de Chaves SENAI
    ├─ Public: SIM (Vercel precisa)
    └─ Clique: Create repository

2.3 Copie o comando que aparece (será algo como):
    git remote add origin https://github.com/seu-usuario/chavesporto.git
    git branch -M main
    git push -u origin main

2.4 Cole os comandos no terminal para fazer push


═══════════════════════════════════════════════════════════════════════════════════
PASSO 3: CONECTAR VERCEL (2 min)
═══════════════════════════════════════════════════════════════════════════════════

3.1 Acesse: https://vercel.com

3.2 Clique na sua foto → Sign in (ou Sign up se não tem conta)

3.3 Clique em "New Project"

3.4 Clique em "Import Git Repository"

3.5 Conecte sua conta GitHub
    ├─ Clique no botão do GitHub
    └─ Autorize o Vercel acessar seus repositórios

3.6 Encontre "chavesporto" na lista

3.7 Clique em "Import"


═══════════════════════════════════════════════════════════════════════════════════
PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE (3 min)
═══════════════════════════════════════════════════════════════════════════════════

Após importar, você verá uma tela de "Configure Project"

4.1 Scroll down até "Environment Variables"

4.2 Adicione cada variável (Copie de .env.production):

    SUPABASE_URL
    └─ https://gxkmcqcgorkscabzuhks.supabase.co

    SUPABASE_KEY
    └─ sb_publishable_NoPNne9CTg0PAHoAwGq_Rw_Ems6S31r

    SUPABASE_SERVICE_KEY
    └─ (copie de seu arquivo .env local)

    JWT_SECRET
    └─ 15da5ebd-7d9f-47e2-ba48-bff8e7875de9

    SMTP_HOST
    └─ smtp.gmail.com

    SMTP_PORT
    └─ 587

    SMTP_USER
    └─ davelmauricio@gmail.com

    SMTP_PASS
    └─ etkl vchg cayx tkss

    ALERT_EMAIL
    └─ mdavel@findes.org.br

4.3 Clique "Deploy" quando terminar


═══════════════════════════════════════════════════════════════════════════════════
PASSO 5: MONITORAR DEPLOY (1-2 min)
═══════════════════════════════════════════════════════════════════════════════════

5.1 O Vercel vai:
    ├─ Clonar seu repositório
    ├─ Instalar dependências (npm install)
    ├─ Fazer build
    └─ Deploy na nuvem

5.2 Veja os logs em tempo real

5.3 Espere "Build complete!" e o checkmark verde


═══════════════════════════════════════════════════════════════════════════════════
PASSO 6: ACESSAR SEU PROJETO (1 min)
═══════════════════════════════════════════════════════════════════════════════════

6.1 Após deploy sucesso, você verá:
    "Congratulations! Your project has been successfully deployed."

6.2 Clique em "Visit" para abrir seu site

6.3 Acesse as URLs:
    └─ https://seu-dominio-vercel.vercel.app/
    └─ https://seu-dominio-vercel.vercel.app/admin
    └─ https://seu-dominio-vercel.vercel.app/dashboard


═══════════════════════════════════════════════════════════════════════════════════
⚠️  POSSÍVEIS PROBLEMAS E SOLUÇÕES
═══════════════════════════════════════════════════════════════════════════════════

PROBLEMA: Build falhou
   Solução:
   1. Revise os logs no Vercel
   2. Procure por "error" nos logs
   3. Verifique package.json tem todas as dependências
   4. Certifique que vercel.json está correto

PROBLEMA: API retorna erro 500
   Solução:
   1. Verifique se variáveis de ambiente foram adicionadas
   2. Teste localmente: npm run dev
   3. Revise se SUPABASE_URL e SUPABASE_KEY estão corretos

PROBLEMA: Frontend não carrega CSS
   Solução:
   1. Verifique caminhos relativos em HTML
   2. Certifique que frontend/css/admin.css existe
   3. Limpe cache: Ctrl+Shift+Delete

PROBLEMA: Login não funciona
   Solução:
   1. Verifique JWT_SECRET está correto
   2. Teste localmente antes
   3. Revise SUPABASE_SERVICE_KEY


═══════════════════════════════════════════════════════════════════════════════════
📝 APÓS DEPLOY - PRÓXIMOS PASSOS
═══════════════════════════════════════════════════════════════════════════════════

1. Teste todas as funcionalidades:
   ├─ Login de instructor
   ├─ Login de admin
   ├─ Retirar chave
   ├─ Devolver chave
   └─ Verificar histórico

2. Adicione domínio customizado (opcional):
   ├─ Vá para Settings → Domains
   ├─ Adicione seu domínio
   └─ Configure DNS

3. Configure GitHub Actions (opcional):
   └─ Auto-deploy ao fazer push


═══════════════════════════════════════════════════════════════════════════════════
🔗 LINKS IMPORTANTES
═══════════════════════════════════════════════════════════════════════════════════

GitHub:        https://github.com/seu-usuario/chavesporto
Vercel:        https://vercel.com/seu-usuario/chavesporto
Supabase:      https://supabase.com
Documentação:  https://vercel.com/docs


═══════════════════════════════════════════════════════════════════════════════════
✅ CHECKLIST FINAL
═══════════════════════════════════════════════════════════════════════════════════

[ ] Git inicializado localmente
[ ] Repositório criado no GitHub
[ ] Push realizado (git push)
[ ] Conta Vercel criada
[ ] Projeto importado no Vercel
[ ] Variáveis de ambiente adicionadas
[ ] Deploy completou com sucesso
[ ] Site acessível online
[ ] Funções básicas funcionam
[ ] Admin panel funciona
[ ] Histórico carrega corretamente


═══════════════════════════════════════════════════════════════════════════════════

🎉 Seu site agora está ao vivo!

Compartilhe a URL com os instrutores para usar o sistema.

═══════════════════════════════════════════════════════════════════════════════════
