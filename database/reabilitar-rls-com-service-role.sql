-- ============================================
-- SCRIPT PARA REABILITAR RLS COM SERVICE_ROLE AWARENESS
-- Execute isto no Supabase SQL Editor quando quiser re-ativar RLS
-- ============================================

-- ============================================
-- 1. REABILITAR RLS NAS TABELAS
-- ============================================
ALTER TABLE calendar_blockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_reservations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. LIMPAR POLÍTICAS ANTIGAS
-- ============================================

-- calendar_blockouts - Remover antigas
DROP POLICY IF EXISTS "Everyone can view blockouts" ON calendar_blockouts;
DROP POLICY IF EXISTS "Only admins can create blockouts" ON calendar_blockouts;
DROP POLICY IF EXISTS "Only admins can update blockouts" ON calendar_blockouts;
DROP POLICY IF EXISTS "Only admins can delete blockouts" ON calendar_blockouts;

-- key_reservations - Remover antigas
DROP POLICY IF EXISTS "Everyone can view reservations" ON key_reservations;
DROP POLICY IF EXISTS "Only admins can create reservations" ON key_reservations;
DROP POLICY IF EXISTS "Only admins can update reservations" ON key_reservations;
DROP POLICY IF EXISTS "Only admins can delete reservations" ON key_reservations;

-- ============================================
-- 3. CRIAR NOVAS POLÍTICAS - CALENDAR_BLOCKOUTS
-- ============================================

-- SELECT: Todos podem visualizar bloqueios
CREATE POLICY "Everyone can view blockouts"
  ON calendar_blockouts FOR SELECT
  USING (true);

-- INSERT: Admin (JWT) ou backend (service_role)
CREATE POLICY "Admins and backend can create blockouts"
  ON calendar_blockouts FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );

-- UPDATE: Admin ou service_role
CREATE POLICY "Admins and backend can update blockouts"
  ON calendar_blockouts FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );

-- DELETE: Admin ou service_role
CREATE POLICY "Admins and backend can delete blockouts"
  ON calendar_blockouts FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );

-- ============================================
-- 4. CRIAR NOVAS POLÍTICAS - KEY_RESERVATIONS
-- ============================================

-- SELECT: Todos (instructores podem ver suas reservas, admin vê todas)
CREATE POLICY "Everyone can view reservations"
  ON key_reservations FOR SELECT
  USING (true); -- Ou adicionar lógica: instructor_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin'

-- INSERT: Admin ou backend (service_role)
CREATE POLICY "Admins and backend can create reservations"
  ON key_reservations FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );

-- UPDATE: Admin ou service_role
CREATE POLICY "Admins and backend can update reservations"
  ON key_reservations FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );

-- DELETE: Admin ou service_role
CREATE POLICY "Admins and backend can delete reservations"
  ON key_reservations FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.role() = 'service_role'
  );

-- ============================================
-- 5. VERIFICAR POLÍTICAS CRIADAS
-- ============================================

-- Ver policies do calendar_blockouts
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'calendar_blockouts'
ORDER BY policyname;

-- Ver policies do key_reservations
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'key_reservations'
ORDER BY policyname;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- calendar_blockouts deve ter 4 policies:
--   - Everyone can view blockouts (SELECT)
--   - Admins and backend can create blockouts (INSERT)
--   - Admins and backend can update blockouts (UPDATE)
--   - Admins and backend can delete blockouts (DELETE)
--
-- key_reservations deve ter 4 policies (mesmo padrão)
-- ============================================
