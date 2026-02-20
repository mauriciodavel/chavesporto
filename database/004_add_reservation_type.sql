-- ============================================
-- ADICIONAR CAMPO reservation_type À TABELA
-- ============================================

-- Adicionar coluna reservation_type com valores: 'normal' ou 'blockout'
ALTER TABLE key_reservations
ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'normal' CHECK (reservation_type IN ('normal', 'blockout'));

-- Criar índice para buscar bloqueios rapidamente
CREATE INDEX IF NOT EXISTS idx_key_reservations_type_date 
ON key_reservations(reservation_type, reservation_start_date, reservation_end_date);

-- Comentário para documentação
COMMENT ON COLUMN key_reservations.reservation_type IS 'Tipo de reserva: normal = reserva de instrutor, blockout = bloqueio administrativo de ambiente';
