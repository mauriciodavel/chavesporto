-- ============================================
-- DIAGNÓSTICO: Verificar status real da chave
-- ============================================

-- 1. Ver todas as chaves e seus status
SELECT id, environment, description, status, created_at, updated_at 
FROM keys 
WHERE environment LIKE '%Lab-02%'
ORDER BY updated_at DESC
LIMIT 10;

-- 2. Ver histórico desta chave (últimos 5 registros)
SELECT kh.id, kh.key_id, kh.instructor_id, kh.status, kh.withdrawn_at, kh.returned_at
FROM key_history kh
WHERE kh.key_id = (SELECT id FROM keys WHERE environment LIKE '%Lab-02%' LIMIT 1)
ORDER BY kh.withdrawn_at DESC
LIMIT 5;

-- 3. Ver TODAS as policies ativas
SELECT policyname, tablename, qual
FROM pg_policies
WHERE tablename IN ('keys', 'key_history', 'instructors')
ORDER BY tablename, policyname;

-- 4. Ver se RLS está REALMENTE ativado
SELECT schemaname, tablename, rowlevelSecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('keys', 'key_history', 'instructors')
ORDER BY tablename;
