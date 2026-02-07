# Manual do Usuário - Sistema de Controle de Chaves

## 1. Introdução

Este sistema foi desenvolvido para gerenciar de forma eficiente a retirada e devolução de chaves de laboratórios e ambientes da escola. Cada chave possui um QR Code único que identifica sua localização e controla o acesso.

## 2. Funcionalidades por Perfil

### 2.1 Para Instrutores

#### Acessar o Sistema
1. Abra o navegador e acesse a URL da aplicação
2. Clique na aba "Instrutor"
3. Digite a sua matrícula
4. Digite sua senha
5. Clique em "Entrar"

#### Visualizar Chaves Disponíveis
Na página do dashboard você verá um painel com todas as chaves cadastradas em formato de cards. Cada card mostra:

- **Ícone da chave**: Identifica chaves
- **Nome do Ambiente**: Qual laboratório/ambiente a chave é
- **Localização**: Onde a chave fica armazenada
- **Descrição**: O que a chave controla
- **Status**: 
  - 🟢 Verde = Chave disponível para retirada
  - 🔴 Vermelho = Chave em uso
- **Botão de Ação**: Mostra "Retirar" ou "Indisponível"

#### Retirar uma Chave

1. Localize a chave que deseja retirar no painel
2. Clique no card da chave ou no botão "Retirar"
3. Une janela se abrirá pedindo para escanear o QR Code
4. Escolha uma das opções:
   - **Ativar Câmera**: Use a câmera do seu dispositivo
   - **Fazer Upload de Imagem**: Envie uma foto do QR Code
   - **Entrada Manual**: Digite o código manualmente
5. Após verificar o código, clique em "Confirmar Retirada"
6. O sistema registrará automaticamente:
   - Data e hora da retirada
   - Seu nome
   - Qual chave foi retirada

#### Devolver uma Chave

1. Clique na chave que deseja devolver
2. O sistema mostrará que a chave está em uso
3. Escaneie o QR Code novamente
4. Clique em "Devolver Chave"
5. Confirme a devolução
6. O sistema registrará:
   - Data e hora da devolução
   - Status muda para "Devolvida"

#### Visualizar Meu Histórico

Na seção "Meu Histórico de Retiradas" você pode ver:
- Todas as chaves que retirou
- Data e hora de cada retirada
- Se devolveu e quando
- Status (Devolvida ou Em Uso)

### 2.2 Para Administradores

#### Acessar o Painel Admin

1. Abra o navegador e acesse a URL da aplicação
2. Clique na aba "Admin"
3. Digite seu email
4. Digite sua senha
5. Clique em "Entrar"

Você será redirecionado para o painel de administração com um menu lateral.

#### Dashboard

Na primeira tela (Dashboard) você verá:

- **Total de Chaves**: Quantas chaves existem no sistema
- **Chaves Disponíveis**: Quantas estão livres para retirada
- **Chaves em Uso**: Quantas foram retiradas
- **Total de Instrutores**: Quantos instrutores têm acesso
- **Devoluções em Atraso**: Lista de chaves não devolvidas após o horário

#### Gerenciar Chaves

1. Clique em "🔑 Chaves" no menu lateral
2. Você verá todas as chaves cadastradas em cards

**Para Criar Uma Nova Chave:**
1. Clique no botão "+ Nova Chave"
2. Preencha os dados:
   - **Ambiente**: Nome do lab/ambiente (ex: "Lab de Eletrônica")
   - **Descrição**: O que a chave controla (ex: "Porta sala A-101")
   - **Lotação**: Onde fica armazenada (ex: "Coordenação")
   - **Área Tecnológica**: A qual área ela pertence (ex: "Eletrônica")
3. Clique em "Salvar"
4. Um QR Code será gerado automaticamente
5. Imprima este QR Code e afixe na chave

**Para Editar Uma Chave:**
1. Encontre a chave na lista
2. Clique em "Editar"
3. Altere os dados desejados
4. Clique em "Salvar"

**Para Deletar Uma Chave:**
1. Encontre a chave na lista
2. Clique em "Deletar"
3. Confirme a deleção
4. A chave será removida do sistema

**Buscar Chaves:**
- Use o campo de busca para encontrar chaves por nome, descrição ou localização

#### Gerenciar Instrutores

1. Clique em "👥 Instrutores" no menu lateral
2. Você verá uma tabela com todos os instrutores cadastrados

**Para Cadastrar Um Novo Instrutor:**
1. Clique no botão "+ Novo Instrutor"
2. Preencha os dados:
   - **Matrícula**: Identificador único (não pode se repetem)
   - **Nome**: Nome completo
   - **Email**: Email válido
   - **Senha**: Senha para login
   - **Área Tecnológica**: Campo opcional
3. Clique em "Salvar"

**Para Editar Um Instrutor:**
1. Encontre o instrutor na tabela
2. Clique em "Editar"
3. Altere os dados desejados
4. Deixe a senha em branco se não quiser alterá-la
5. Clique em "Salvar"

**Para Deletar Um Instrutor:**
1. Encontre o instrutor na tabela
2. Clique em "Deletar"
3. Confirme a deleção

**Buscar Instrutores:**
- Use o campo de busca para encontrar por nome, matrícula ou email

#### Visualizar Histórico

1. Clique em "📋 Histórico" no menu lateral
2. Você verá uma tabela com todos os registros de retirada e devolução
3. Use o filtro para visualizar histórico de uma chave específica

A tabela mostra:
- **Chave**: Qual chave foi retirada
- **Instrutor**: Quem retirou
- **Data Retirada**: Quando foi retirada
- **Data Devolução**: Quando foi devolvida
- **Status**: Se foi devolvida ou ainda está em uso

## 3. Notificações e Alertas

### Devoluções em Atraso

O sistema envia alertas por email quando uma chave não é devolvida até o fim do expediente (17h por padrão).

**Quem recebe:**
- Emails configurados no painel de administração

**O que é informado:**
- Qual chave está em atraso
- Quem retirou
- Quando foi retirada

## 4. Dicas e Boas Práticas

### Para Instrutores

✅ **Faça:**
- Devolva as chaves assim que terminar de usá-las
- Sempre escaneie o QR Code para confirmar a retirada
- Verifique o status da chave antes de retirar
- Acompanhe seu histórico regularmente

❌ **Evite:**
- Deixar chaves de fora do horário
- Emprestar chaves para terceiros
- Danificar ou perder o QR Code
- Tentar acessar chaves indisponíveis

### Para Administradores

✅ **Faça:**
- Revise regularmente as devoluções em atraso
- Mantenha os dados dos instrutores atualizados
- Gere QR Codes com qualidade para as novas chaves
- Acompanhe o histórico para identificar padrões

❌ **Evite:**
- Deletar chaves que ainda estão em uso
- Mudar dados críticos sem avisar os instrutores
- Deixar chaves sem QR Code
- Permitir acesso a usuários não autorizados

## 5. Troubleshooting

### "Não consegui fazer login"
- Verifique se sua matrícula/email está correta
- Verifique se sua senha está correta
- Procure o administrador para confirmar seus dados

### "O QR Code não funciona"
- Verifique se a câmera está authorizada
- Tente fazer upload de uma imagem em melhor qualidade
- Procure o administrador para gerar um novo QR Code

### "A chave não aparece no painel"
- Verifique se a chave está cadastrada no sistema
- Se for uma chave nova, aguarde o administrador cadastrar
- Tente fazer logout e login novamente

### "Recebi alerta de devolução em atraso"
- Verifique se você devolveu a chave
- Se devolveu, pode ser um atraso no sistema
- Procure o administrador se o problema persistir

## 6. Contato e Suporte

Para dúvidas ou problemas técnicos, contacte:

**Administrador do Sistema:**
- Email: admin@senai.com.br
- Ramal: (conforme disponível)

**Horário de Atendimento:**
- Segunda a Sexta: 07:00 a 17:30
- Feriados: Fechado

## 7. Segurança

⚠️ **IMPORTANTE:**

- Nunca compartilhe sua senha
- Use uma senha forte (com letras, números e caracteres especiais)
- Logout sempre ao terminar de usar o sistema
- Reporte qualquer comportamento suspeito ao administrador

---

**Versão**: 1.0  
**Última Atualização**: Fevereiro 2026  
**Desenvolvido para**: SENAI - Gestão de Ambientes
