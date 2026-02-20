-- ============================================
-- PASSO 2: DADOS DE TESTE PARA RESERVAS
-- Execute isso APÓS o script 001_create_reservations_tables.sql
-- ============================================

-- Verificar se há chaves no banco
-- Se não houver, inserir dados de teste

-- 1. Inserir chaves de teste (se não existirem)
INSERT INTO keys (environment, description, qr_code, location, status, created_at)
SELECT 'Sala Lab 001', 'Chave para Laboratório 001', 'QR-LAB-001', 'Bloco A - Sala 201', 'available', NOW()
WHERE NOT EXISTS (SELECT 1 FROM keys WHERE qr_code = 'QR-LAB-001');

INSERT INTO keys (environment, description, qr_code, location, status, created_at)
SELECT 'Sala Lab 002', 'Chave para Laboratório 002', 'QR-LAB-002', 'Bloco A - Sala 202', 'available', NOW()
WHERE NOT EXISTS (SELECT 1 FROM keys WHERE qr_code = 'QR-LAB-002');

INSERT INTO keys (environment, description, qr_code, location, status, created_at)
SELECT 'Sala Lab 003', 'Chave para Laboratório 003', 'QR-LAB-003', 'Bloco A - Sala 203', 'available', NOW()
WHERE NOT EXISTS (SELECT 1 FROM keys WHERE qr_code = 'QR-LAB-003');

INSERT INTO keys (environment, description, qr_code, location, status, created_at)
SELECT 'Sala Prática', 'Chave para Sala de Prática', 'QR-PRAT-001', 'Bloco B - Sala 101', 'available', NOW()
WHERE NOT EXISTS (SELECT 1 FROM keys WHERE qr_code = 'QR-PRAT-001');

-- 2. Mostrar as chaves criadas para referência
SELECT 
  id,
  environment,
  description,
  qr_code,
  location,
  status
FROM keys
ORDER BY created_at DESC
LIMIT 5;

-- 3. Inserir uma reserva de teste (opcional)
-- Descomente abaixo se quiser inserir uma reserva de teste
-- Substitua os UUIDs pelos IDs reais de uma chave e instrutor

/*
-- Exemplo: Criar uma reserva pendente
INSERT INTO key_reservations (
  key_id,
  instructor_id,
  reservation_start_date,
  reservation_end_date,
  shift,
  turma,
  motivo_detalhado,
  status,
  created_by_admin,
  created_at
) VALUES (
  (SELECT id FROM keys LIMIT 1),  -- Usa a primeira chave
  (SELECT id FROM instructors WHERE role = 'instructor' LIMIT 1),  -- Usa o primeiro instrutor
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '5 days',
  'matutino',
  'SENAI-TEST-001',
  'Teste de reserva via SQL',
  'pending',
  false,
  NOW()
);

-- Exemplo: Criar uma reserva aprovada
INSERT INTO key_reservations (
  key_id,
  instructor_id,
  reservation_start_date,
  reservation_end_date,
  shift,
  turma,
  motivo_detalhado,
  status,
  created_by_admin,
  approved_by_admin_id,
  approved_at,
  created_at
) VALUES (
  (SELECT id FROM keys ORDER BY created_at DESC LIMIT 1 OFFSET 1),  -- Usa a segunda chave
  (SELECT id FROM instructors WHERE role = 'instructor' LIMIT 1 OFFSET 1),  -- Usa o segundo instrutor
  CURRENT_DATE + INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '15 days',
  'vespertino',
  'SENAI-TEST-002',
  'Reserva aprovada automaticamente',
  'approved',
  true,
  (SELECT id FROM instructors WHERE role = 'admin' LIMIT 1),
  NOW(),
  NOW()
);
*/

-- 4. Listar reservas criadas
SELECT 
  r.id,
  (SELECT name FROM keys WHERE id = r.key_id) as chave,
  (SELECT name FROM instructors WHERE id = r.instructor_id) as instrutor,
  r.reservation_start_date,
  r.reservation_end_date,
  r.shift,
  r.status
FROM key_reservations r
ORDER BY r.created_at DESC;

-- ============================================
-- PRONTO!
-- ============================================
-- Você agora tem:
-- ✅ Chaves no banco para testar reservas
-- ✅ Pronto para executar os testes PowerShell
-- 
-- Próximo passo:
-- Execute o script de teste: .\test-reservations.ps1
