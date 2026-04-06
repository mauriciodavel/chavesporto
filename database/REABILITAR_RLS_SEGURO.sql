-- ============================================
-- SCRIPT PARA REABILITAR RLS SEGURAMENTE
-- Com suporte a JWT customizado e service_role
-- Execute isto no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. REABILITAR RLS NAS TABELAS PRINCIPAIS
-- ============================================
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. LIMPAR POLÍTICAS ANTIGAS
-- ============================================

-- INSTRUCTORS - Remover antigas
DROP POLICY IF EXISTS "Everyone can view instructors" ON instructors;
DROP POLICY IF EXISTS "Users can view all instructors" ON instructors;
DROP POLICY IF EXISTS "Only admins can update instructors" ON instructors;

-- KEYS - Remover antigas
DROP POLICY IF EXISTS "Users can view all keys" ON keys;
DROP POLICY IF EXISTS "Users can insert keys" ON keys;
DROP POLICY IF EXISTS "Users can update keys" ON keys;
DROP POLICY IF EXISTS "Users can delete keys" ON keys;

-- KEY_HISTORY - Remover antigas
DROP POLICY IF EXISTS "Users can insert history" ON key_history;
DROP POLICY IF EXISTS "Instructors can view their own history" ON key_history;
DROP POLICY IF EXISTS "Users can view all history" ON key_history;
DROP POLICY IF EXISTS "Users can update history" ON key_history;
DROP POLICY IF EXISTS "Admins can update history" ON key_history;

-- ============================================
-- 3. CRIAR NOVAS POLÍTICAS - INSTRUCTORS
-- ============================================

-- SELECT: Todos podem visualizar instrutores
CREATE POLICY "Everyone can view instructors"
  ON instructors FOR SELECT
  USING (true);

-- INSERT: Apenas backend (service_role)
CREATE POLICY "Backend can insert instructors"
  ON instructors FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- UPDATE: Apenas backend (service_role)
CREATE POLICY "Backend can update instructors"
  ON instructors FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- DELETE: Apenas backend (service_role)
CREATE POLICY "Backend can delete instructors"
  ON instructors FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================
-- 4. CRIAR NOVAS POLÍTICAS - KEYS
-- ============================================

-- SELECT: Todos podem visualizar chaves não deletadas
CREATE POLICY "Everyone can view keys"
  ON keys FOR SELECT
  USING (deleted_at IS NULL);

-- INSERT: Apenas backend (service_role)
CREATE POLICY "Backend can insert keys"
  ON keys FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- UPDATE: Apenas backend (service_role)
CREATE POLICY "Backend can update keys"
  ON keys FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- DELETE: Apenas backend (service_role)
CREATE POLICY "Backend can delete keys"
  ON keys FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================
-- 5. CRIAR NOVAS POLÍTICAS - KEY_HISTORY
-- ============================================

-- SELECT: Admin vê tudo, instructor vê seu histórico
-- Importante: usar auth.jwt() ->> 'id' para JWT customizado
CREATE POLICY "Users can view history"
  ON key_history FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR instructor_id = (auth.jwt() ->> 'id')::uuid
    OR auth.role() = 'service_role'
  );

-- INSERT: Apenas backend (service_role)
CREATE POLICY "Backend can insert history"
  ON key_history FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- UPDATE: Apenas backend (service_role)
-- Exemplo: atualizar status de 'active' para 'returned'
CREATE POLICY "Backend can update history"
  ON key_history FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- DELETE: Apenas backend (service_role)
CREATE POLICY "Backend can delete history"
  ON key_history FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================
-- Para verificar se RLS está habilitado:
-- SELECT schemaname, tablename, rowlevelSecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('instructors', 'keys', 'key_history');
--
-- Para deletar UMA política específica (se necessário):
-- DROP POLICY "Policy Name" ON table_name;
--
-- Para ver todas as políticas:
-- SELECT * FROM pg_policies WHERE tablename IN ('instructors', 'keys', 'key_history');

COMMIT;
