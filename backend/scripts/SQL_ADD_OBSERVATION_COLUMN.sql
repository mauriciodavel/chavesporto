-- ============================================================
-- SCRIPT SQL PARA ADICIONAR COLUNA OBSERVATION
-- ============================================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com → seu projeto
-- 2. Vá para: SQL Editor (lado esquerdo, ícone de código)
-- 3. Clique em "New query"
-- 4. Cole TODO o código abaixo
-- 5. Clique em "RUN" (Ctrl+Enter)
-- 6. Aguarde a confirmação de sucesso
--
-- ============================================================

-- Adicionar coluna observation se não existir
ALTER TABLE key_history 
ADD COLUMN IF NOT EXISTS observation TEXT DEFAULT NULL;

-- Verificar que a coluna foi criada
-- Use esta query para confirmar:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'key_history' AND column_name = 'observation';

-- Resultado esperado: observation | text | DEFAULT NULL

-- Atualizar registros existentes com observation = NULL (se necessário)
-- Esta query NÃO afeta registros que já têm observation preenchida
-- UPDATE key_history SET observation = NULL WHERE observation IS NULL;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
