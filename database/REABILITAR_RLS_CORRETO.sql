-- ============================================
-- SCRIPT RLS CORRETO - COM SUPORTE A SERVICE_ROLE
-- Arquitetura correta: Backend sempre usa admin (service_role)
-- Apenas clientes frontend passam por RLS
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

-- INSTRUCTORS
DROP POLICY IF EXISTS "Everyone can view instructors" ON instructors;
DROP POLICY IF EXISTS "Backend can insert instructors" ON instructors;
DROP POLICY IF EXISTS "Backend can update instructors" ON instructors;
DROP POLICY IF EXISTS "Backend can delete instructors" ON instructors;

-- KEYS
DROP POLICY IF EXISTS "Everyone can view keys" ON keys;
DROP POLICY IF EXISTS "Backend can insert keys" ON keys;
DROP POLICY IF EXISTS "Backend can update keys" ON keys;
DROP POLICY IF EXISTS "Backend can delete keys" ON keys;
DROP POLICY IF EXISTS "Users can view all keys" ON keys;
DROP POLICY IF EXISTS "Users can insert keys" ON keys;
DROP POLICY IF EXISTS "Users can update keys" ON keys;
DROP POLICY IF EXISTS "Users can delete keys" ON keys;

-- KEY_HISTORY
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
-- 3. POLÍTICAS SIMPLES E FUNCIONAIS
-- ============================================
-- IMPORTANTE: Backend usa supabase.admin (service_role)
-- Service_role SEMPRE bypassa RLS, então essas policies 
-- só aplicam a clientes anon/frontend

-- INSTRUCTORS - Frontend pode ver, backend (service_role) bypassa
CREATE POLICY "Instructors - Frontend view only"
  ON instructors FOR SELECT
  USING (true);

-- KEYS - Frontend pode ver chaves não deletadas, backend bypassa
CREATE POLICY "Keys - Frontend view only"
  ON keys FOR SELECT
  USING (deleted_at IS NULL);

-- KEY_HISTORY - Frontend pode ver seu próprio histórico
-- Admin podem ver tudo (admin = role from JWT)
CREATE POLICY "History - View with restrictions"
  ON key_history FOR SELECT
  USING (
    -- Admin pode ver tudo
    (auth.jwt() ->> 'role') = 'admin'
    OR
    -- Ou instrutor vê seu próprio histórico
    instructor_id = (auth.jwt() ->> 'id')::uuid
  );

-- Bloquear INSERT/UPDATE/DELETE via anon key
-- Backend (service_role) bypassa isso automaticamente
CREATE POLICY "Block anon - INSERT"
  ON key_history FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block anon - UPDATE"
  ON key_history FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block anon - DELETE"
  ON key_history FOR DELETE
  USING (false);

-- ============================================
-- 4. OBSERVAÇÕES IMPORTANTES
-- ============================================
-- 1. Backend SEMPRE usa supabase.admin (service_role key)
--    → service_role AUTOMATICAMENTE bypassa todas as RLS policies
--    → Não precisa verificar auth.role() = 'service_role'
--
-- 2. Frontend/Clientes anon passam por estas policies
--    → Não podem fazer INSERT/UPDATE/DELETE (bloqueados com "false")
--    → Podem fazer SELECT com restrições
--
-- 3. JWT customizado:
--    - auth.jwt() ->> 'id' = UUID do instrutor
--    - auth.jwt() ->> 'role' = 'admin' ou 'instructor'
--
-- 4. Para verificar RLS status:
--    SELECT schemaname, tablename, rowlevelSecurity 
--    FROM pg_tables 
--    WHERE schemaname = 'public' AND tablename IN ('instructors', 'keys', 'key_history');
--
-- 5. Para ver todas as policies:
--    SELECT policyname, tablename, qual FROM pg_policies
--    WHERE tablename IN ('instructors', 'keys', 'key_history');

COMMIT;
