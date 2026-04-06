-- ============================================
-- SCRIPT PARA DESFAZER - DESABILITAR RLS
-- Retorna ao estado anterior (sem RLS ativo)
-- Execute isto no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. REMOVER TODAS AS POLÍTICAS
-- ============================================

-- INSTRUCTORS - Remover todas as políticas
DROP POLICY IF EXISTS "Everyone can view instructors" ON instructors;
DROP POLICY IF EXISTS "Backend can insert instructors" ON instructors;
DROP POLICY IF EXISTS "Backend can update instructors" ON instructors;
DROP POLICY IF EXISTS "Backend can delete instructors" ON instructors;

-- KEYS - Remover todas as políticas
DROP POLICY IF EXISTS "Everyone can view keys" ON keys;
DROP POLICY IF EXISTS "Backend can insert keys" ON keys;
DROP POLICY IF EXISTS "Backend can update keys" ON keys;
DROP POLICY IF EXISTS "Backend can delete keys" ON keys;
DROP POLICY IF EXISTS "Users can view all keys" ON keys;
DROP POLICY IF EXISTS "Users can insert keys" ON keys;
DROP POLICY IF EXISTS "Users can update keys" ON keys;
DROP POLICY IF EXISTS "Users can delete keys" ON keys;

-- KEY_HISTORY - Remover todas as políticas
DROP POLICY IF EXISTS "Users can view history" ON key_history;
DROP POLICY IF EXISTS "Backend can insert history" ON key_history;
DROP POLICY IF EXISTS "Backend can update history" ON key_history;
DROP POLICY IF EXISTS "Backend can delete history" ON key_history;
DROP POLICY IF EXISTS "Users can insert history" ON key_history;
DROP POLICY IF EXISTS "Instructors can view their own history" ON key_history;
DROP POLICY IF EXISTS "Users can view all history" ON key_history;
DROP POLICY IF EXISTS "Users can update history" ON key_history;
DROP POLICY IF EXISTS "Admins can update history" ON key_history;

-- ============================================
-- 2. DESABILITAR RLS NAS TABELAS
-- ============================================
ALTER TABLE instructors DISABLE ROW LEVEL SECURITY;
ALTER TABLE keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE key_history DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CONFIRMAÇÃO
-- ============================================
-- RLS foi desabilitado. O sistema voltará a funcionar.
-- Para verificar o status:
-- SELECT schemaname, tablename, rowlevelSecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename IN ('instructors', 'keys', 'key_history');
--
-- Se tudo estiver como FALSE na coluna "rowlevelsecurity", está correto!

COMMIT;
