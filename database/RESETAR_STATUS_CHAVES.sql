-- ============================================
-- RESETAR STATUS DE CHAVES PRESAS EM "in_use"
-- Execute isto no Supabase SQL Editor
-- ============================================

-- Atualizar status para 'available' onde não há histórico ativo
UPDATE keys
SET status = 'available', updated_at = NOW()
WHERE id IN (
  SELECT k.id
  FROM keys k
  LEFT JOIN key_history kh ON k.id = kh.key_id AND kh.status = 'active'
  WHERE k.status = 'in_use' AND kh.id IS NULL
);

-- Alternativamente, se quiser resetar TODAS as chaves:
-- UPDATE keys SET status = 'available', updated_at = NOW() WHERE status = 'in_use';

-- Verificar resultado:
SELECT id, environment, description, status, updated_at
FROM keys
WHERE environment LIKE '%Lab-02%'
ORDER BY updated_at DESC;
