-- ============================================
-- TABELA DE BLOQUEIOS DE CALENDÁRIO
-- Sistema de Controle de Chaves - Chavesporto
-- Data: 17/02/2026
-- ============================================

-- ============================================
-- CRIAR TIPO ENUM PARA TIPOS DE BLOQUEIO
-- ============================================
-- Se o tipo já existe, será ignorado
CREATE TYPE blockout_type AS ENUM (
  'maintenance',        -- Manutenção
  'external_event',     -- Evento externo
  'internal_event',     -- Evento interno
  'national_holiday',   -- Feriado Nacional
  'state_holiday',      -- Feriado Estadual
  'municipal_holiday'   -- Feriado Municipal
);

-- ============================================
-- TABELA PRINCIPAL DE BLOQUEIOS
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_blockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Período do bloqueio
  blockout_date DATE NOT NULL,                    -- Data do bloqueio (para single-day)
  blockout_start_date DATE NOT NULL,              -- Data de início (para períodos)
  blockout_end_date DATE NOT NULL,                -- Data de término (para períodos)
  
  -- Turno (NULL = dia inteiro)
  shift TEXT CHECK (shift IN ('matutino', 'vespertino', 'noturno', 'integral', NULL)),
  
  -- Tipo de bloqueio
  blockout_type blockout_type NOT NULL,
  
  -- Cor associada (para override, sen ão usa a cor padrão do tipo)
  color VARCHAR(7) DEFAULT NULL,                  -- Cor em hex, ex: #FF5733
  
  -- Observação sobre o bloqueio
  observation TEXT NOT NULL,
  
  -- Auditoria
  created_by UUID NOT NULL REFERENCES instructors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraint: data de início deve ser menor ou igual a data de término
  CONSTRAINT valid_date_range CHECK (blockout_start_date <= blockout_end_date)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_calendar_blockouts_date ON calendar_blockouts(blockout_date);
CREATE INDEX IF NOT EXISTS idx_calendar_blockouts_date_range ON calendar_blockouts(blockout_start_date, blockout_end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_blockouts_type ON calendar_blockouts(blockout_type);
CREATE INDEX IF NOT EXISTS idx_calendar_blockouts_shift ON calendar_blockouts(shift);

-- ============================================
-- HABILITAR RLS
-- ============================================
ALTER TABLE calendar_blockouts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- DROP POLICY IF EXISTS "Everyone can view blockouts" ON calendar_blockouts;
-- Todos podem visualizar bloqueios
CREATE POLICY "Everyone can view blockouts"
  ON calendar_blockouts FOR SELECT
  USING (TRUE);

-- DROP POLICY IF EXISTS "Only admins can create blockouts" ON calendar_blockouts;
-- Apenas admins podem criar bloqueios
CREATE POLICY "Only admins can create blockouts"
  ON calendar_blockouts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- DROP POLICY IF EXISTS "Only admins can update blockouts" ON calendar_blockouts;
-- Apenas admins podem atualizar bloqueios
CREATE POLICY "Only admins can update blockouts"
  ON calendar_blockouts FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- DROP POLICY IF EXISTS "Only admins can delete blockouts" ON calendar_blockouts;
-- Apenas admins podem deletar bloqueios
CREATE POLICY "Only admins can delete blockouts"
  ON calendar_blockouts FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_calendar_blockouts_updated_at ON calendar_blockouts;

CREATE TRIGGER update_calendar_blockouts_updated_at
BEFORE UPDATE ON calendar_blockouts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO PARA VERIFICAR SE UMA DATA ESTÁ BLOQUEADA
-- ============================================
CREATE OR REPLACE FUNCTION is_date_blocked(
  p_date DATE,
  p_shift TEXT DEFAULT NULL
) RETURNS TABLE (
  is_blocked BOOLEAN,
  blockout_id UUID,
  blockout_type blockout_type,
  observation TEXT,
  color VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as is_blocked,
    cb.id as blockout_id,
    cb.blockout_type,
    cb.observation,
    COALESCE(cb.color, get_blockout_color(cb.blockout_type)) as color
  FROM calendar_blockouts cb
  WHERE 
    cb.blockout_start_date <= p_date
    AND cb.blockout_end_date >= p_date
    AND (p_shift IS NULL OR cb.shift IS NULL OR cb.shift = p_shift)
  LIMIT 1;
  
  -- Se não encontrou bloqueio, retorna sem bloqueio
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::blockout_type, NULL, NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO PARA OBTER COR PADRÃO DO TIPO
-- ============================================
CREATE OR REPLACE FUNCTION get_blockout_color(p_type blockout_type)
RETURNS VARCHAR(7) AS $$
BEGIN
  CASE p_type
    WHEN 'maintenance'::blockout_type THEN RETURN '#FFC107';      -- Amarelo
    WHEN 'external_event'::blockout_type THEN RETURN '#17A2B8';   -- Azul claro (info)
    WHEN 'internal_event'::blockout_type THEN RETURN '#6C63FF';   -- Roxo
    WHEN 'national_holiday'::blockout_type THEN RETURN '#DC3545'; -- Vermelho
    WHEN 'state_holiday'::blockout_type THEN RETURN '#FD7E14';    -- Laranja
    WHEN 'municipal_holiday'::blockout_type THEN RETURN '#6F42C1'; -- Roxo escuro
    ELSE RETURN '#6C757D'; -- Cinza (fallback)
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- LABELS DOS TIPOS DE BLOQUEIO
-- ============================================
/*
  maintenance:        "Manutenção" (#FFC107 - Amarelo)
  external_event:     "Evento Externo" (#17A2B8 - Azul)
  internal_event:     "Evento Interno" (#6C63FF - Roxo)
  national_holiday:   "Feriado Nacional" (#DC3545 - Vermelho)
  state_holiday:      "Feriado Estadual" (#FD7E14 - Laranja)
  municipal_holiday:  "Feriado Municipal" (#6F42C1 - Roxo Escuro)
*/

-- ============================================
-- INSERIR BLOQUEIOS DE DOMINGOS
-- ============================================
-- Este script cria bloqueios automáticos para todos os domingos de 2026
-- Você pode executar APÓS a criação da tabela acima

/*
-- Para determinar o admin ID padrão:
-- SELECT id FROM instructors WHERE role = 'admin' LIMIT 1;

-- Substituir 'SEU_ADMIN_ID' por um ID real de admin

INSERT INTO calendar_blockouts 
  (blockout_date, blockout_start_date, blockout_end_date, shift, blockout_type, observation, created_by)
SELECT 
  sunday_date,
  sunday_date,
  sunday_date,
  NULL,
  'national_holiday'::blockout_type,
  'Domingo - Estabelecimento fechado',
  'SEU_ADMIN_ID'::UUID
FROM (
  -- Gerar todas as datas de domingo de 2026
  SELECT CAST(DATE '2026-01-04' + (interval '7 days' * n) as DATE) as sunday_date
  FROM generate_series(0, 52) n
) sundays
WHERE NOT EXISTS (
  SELECT 1 FROM calendar_blockouts
  WHERE blockout_date = sunday_date
  AND blockout_type = 'national_holiday'::blockout_type
)
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- DOCUMENTAÇÃO
-- ============================================
/*

### TIPOS DE BLOQUEIO:
- maintenance:        Manutenção de ambiente/equipamento
- external_event:     Evento de terceiros no campus
- internal_event:     Evento interno da instituição
- national_holiday:   Feriados nacionais
- state_holiday:      Feriados estaduais
- municipal_holiday:  Feriados municipais

### CORES PADRÃO (por tipo):
- Manutenção:       #FFC107 (Amarelo)
- Evento Externo:   #17A2B8 (Azul)
- Evento Interno:   #6C63FF (Roxo)
- Feriado Nacional: #DC3545 (Vermelho)
- Feriado Estadual: #FD7E14 (Laranja)
- Feriado Municipal:#6F42C1 (Roxo Escuro)

### EXEMPLOS DE USO:

-- Verificar se uma data está bloqueada
SELECT * FROM is_date_blocked('2026-02-17', NULL);

-- Listar todos os bloqueios de um período
SELECT * FROM calendar_blockouts 
WHERE blockout_start_date >= '2026-02-01' 
  AND blockout_end_date <= '2026-02-28'
ORDER BY blockout_start_date;

-- Listar bloqueios por tipo
SELECT * FROM calendar_blockouts 
WHERE blockout_type = 'national_holiday'::blockout_type;

### FLUXO DE BLOQUEIOS:
1. Admin acessa página de gerenciamento de bloqueios
2. Admin define:
   - Data/Período (data única ou data início ~ data fim)
   - Turno (opcional, NULL = dia inteiro)
   - Tipo de bloqueio
   - Observação
3. Sistema cria entrada em calendar_blockouts
4. Frontend consulta API para obter bloqueios
5. Calendário exibe bloqueios com cores correspondentes
6. Ao passar mouse, tooltip mostra observação

*/
