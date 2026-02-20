-- ============================================
-- CORRIGIR POLÍTICAS RLS PARA CALENDAR_BLOCKOUTS
-- ============================================

-- DELETAR POLÍTICAS ANTIGAS QUE NÃO FUNCIONAM
DROP POLICY IF EXISTS "Only admins can create blockouts" ON calendar_blockouts;
DROP POLICY IF EXISTS "Only admins can update blockouts" ON calendar_blockouts;
DROP POLICY IF EXISTS "Only admins can delete blockouts" ON calendar_blockouts;

-- CRIAR NOVAS POLÍTICAS CORRIGIDAS COM auth.jwt()
CREATE POLICY "Only admins can create blockouts"
  ON calendar_blockouts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update blockouts"
  ON calendar_blockouts FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete blockouts"
  ON calendar_blockouts FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');
