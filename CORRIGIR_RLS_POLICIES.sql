-- ========================================
-- CORRIGIR RLS POLICIES PARA JWT CUSTOMIZADO
-- ========================================
-- Objetivo: Fazer RLS funcionar com JWT customizado que usa 'id' como claim
-- Em vez de depender de auth.uid() que retorna NULL
-- 
-- ⚠️  IMPORTANTE: Execute no Supabase SQL Editor
-- Pas acesso: https://app.supabase.com/project/[seu-projeto]/sql/new
-- ========================================

-- 1. Remover TODAS as policies antigas (com segurança)
DROP POLICY IF EXISTS "Instructors can view their own history" ON key_history;
DROP POLICY IF EXISTS "Users can insert history" ON key_history;
DROP POLICY IF EXISTS "Users can update their own history" ON key_history;
DROP POLICY IF EXISTS "Instructors can view their own history - Fixed" ON key_history;
DROP POLICY IF EXISTS "Users can insert history - Fixed" ON key_history;
DROP POLICY IF EXISTS "Users can update their own history - Fixed" ON key_history;

-- 2. Criar novas policies usando auth.jwt() ->> 'id'
-- Essa claim vem do JWT customizado gerado pelo backend

CREATE POLICY "key_history_select_own"
  ON key_history FOR SELECT
  USING (
    instructor_id = (auth.jwt() ->> 'id')::uuid 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "key_history_insert_own"
  ON key_history FOR INSERT
  WITH CHECK (
    instructor_id = (auth.jwt() ->> 'id')::uuid 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "key_history_update_own"
  ON key_history FOR UPDATE
  USING (
    instructor_id = (auth.jwt() ->> 'id')::uuid 
    OR auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    instructor_id = (auth.jwt() ->> 'id')::uuid 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- ========================================
-- VERIFICAÇÃO
-- ========================================
-- Execute isto para confirmar as policies foram criadas:
-- SELECT policyname, qual, definition FROM pg_policies 
-- WHERE tablename = 'key_history';
