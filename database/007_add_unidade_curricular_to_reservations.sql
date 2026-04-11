-- Adicionar campos de turma e unidade curricular à tabela key_reservations
-- Se as colunas já existirem, use ALTER TABLE ... ADD COLUMN IF NOT EXISTS

ALTER TABLE key_reservations 
ADD COLUMN IF NOT EXISTS unidade_curricular VARCHAR(150);

-- Comentário explicativo
COMMENT ON COLUMN key_reservations.unidade_curricular IS 'Unidade curricular selecionada na reserva';

-- Criar índice para melhorar performance de filtros
CREATE INDEX IF NOT EXISTS idx_key_reservations_unidade ON key_reservations(unidade_curricular);
