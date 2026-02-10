-- ============================================
-- SCRIPT DE CRIAÇÃO DE TABELAS PARA SISTEMA DE RESERVAS
-- Chavesporto - Sistema de Controle de Chaves
-- Data: 09/02/2026
-- ============================================

-- ============================================
-- 1. TABELA DE RESERVAS DE CHAVES
-- ============================================
-- Armazena solicitações de reserva de chaves pelos instrutores
CREATE TABLE IF NOT EXISTS key_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  key_id UUID NOT NULL REFERENCES keys(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  
  -- Informações da Reserva
  reservation_start_date DATE NOT NULL,
  reservation_end_date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('matutino', 'vespertino', 'noturno', 'integral')),
  turma TEXT NOT NULL,
  motivo_detalhado TEXT NOT NULL,
  
  -- Status da Reserva
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT, -- Motivo da rejeição, se houver
  
  -- Auditoria
  approved_by UUID REFERENCES instructors(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_key_reservations_key_id ON key_reservations(key_id);
CREATE INDEX idx_key_reservations_instructor_id ON key_reservations(instructor_id);
CREATE INDEX idx_key_reservations_status ON key_reservations(status);
CREATE INDEX idx_key_reservations_dates ON key_reservations(reservation_start_date, reservation_end_date);

-- ============================================
-- 2. TABELA DE PERMISSÕES PONTUAIS
-- ============================================
-- Autoriza exceções de última hora para um dia específico
CREATE TABLE IF NOT EXISTS key_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  key_id UUID NOT NULL REFERENCES keys(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  
  -- Informações da Permissão
  permission_date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('matutino', 'vespertino', 'noturno', 'integral')),
  
  -- Quem autorizou
  authorized_by UUID NOT NULL REFERENCES instructors(id),
  authorized_at TIMESTAMP DEFAULT now(),
  
  -- Dados para auditoria
  created_at TIMESTAMP DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_key_permissions_key_id ON key_permissions(key_id);
CREATE INDEX idx_key_permissions_instructor_id ON key_permissions(instructor_id);
CREATE INDEX idx_key_permissions_date ON key_permissions(permission_date);

-- ============================================
-- 3. TABELA DE MANUTENÇÃO DE AMBIENTES
-- ============================================
-- Bloqueia chaves em períodos de manutenção
CREATE TABLE IF NOT EXISTS environment_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  key_id UUID NOT NULL REFERENCES keys(id) ON DELETE CASCADE,
  
  -- Período de Manutenção
  maintenance_start_date DATE NOT NULL,
  maintenance_end_date DATE NOT NULL,
  motivo_resumido TEXT NOT NULL, -- Ex: "Limpeza", "Reparo elétrico", etc
  
  -- Informações do Admin
  created_by UUID NOT NULL REFERENCES instructors(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_environment_maintenance_key_id ON environment_maintenance(key_id);
CREATE INDEX idx_environment_maintenance_dates ON environment_maintenance(maintenance_start_date, maintenance_end_date);

-- ============================================
-- 4. TABELA DE DISPONIBILIDADE DIÁRIA
-- ============================================
-- Cache de disponibilidade por dia/turno/chave (opcional mas recomendado para performance)
CREATE TABLE IF NOT EXISTS key_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  key_id UUID NOT NULL REFERENCES keys(id) ON DELETE CASCADE,
  
  -- Data e Turno
  availability_date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('matutino', 'vespertino', 'noturno', 'integral')),
  
  -- Status
  is_available BOOLEAN DEFAULT TRUE,
  reason TEXT, -- Ex: "Manutenção", "Reservado", etc
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Constraint: Uma entrada por chave/data/turno
  UNIQUE(key_id, availability_date, shift)
);

-- Índices
CREATE INDEX idx_key_availability_key_id ON key_availability(key_id);
CREATE INDEX idx_key_availability_date ON key_availability(availability_date);
CREATE INDEX idx_key_availability_search ON key_availability(key_id, availability_date, shift);

-- ============================================
-- 5. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE key_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE environment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_availability ENABLE ROW LEVEL SECURITY;

-- Política para key_reservations
-- Instrutores podem ver suas próprias reservas
CREATE POLICY "Instructors can see their own reservations"
  ON key_reservations FOR SELECT
  USING (
    instructor_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM instructors WHERE id = auth.uid() AND role = 'admin')
  );

-- Instrutores podem criar reservas para si
CREATE POLICY "Instructors can create their own reservations"
  ON key_reservations FOR INSERT
  WITH CHECK (instructor_id = auth.uid());

-- Admins podem atualizar reservas (para aprovar/rejeitar)
CREATE POLICY "Admins can update reservations"
  ON key_reservations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM instructors WHERE id = auth.uid() AND role = 'admin'));

-- Política para key_permissions
-- Todos podem ler permissões (para saber se podem retirar)
CREATE POLICY "Everyone can view permissions"
  ON key_permissions FOR SELECT
  USING (TRUE);

-- Apenas admins podem criar permissões
CREATE POLICY "Only admins can create permissions"
  ON key_permissions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM instructors WHERE id = auth.uid() AND role = 'admin'));

-- Política para environment_maintenance
-- Todos podem ler (para saber quais chaves estão em manutenção)
CREATE POLICY "Everyone can view maintenance"
  ON environment_maintenance FOR SELECT
  USING (TRUE);

-- Apenas admins podem gerenciar manutenção
CREATE POLICY "Only admins can manage maintenance"
  ON environment_maintenance FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM instructors WHERE id = auth.uid() AND role = 'admin'));

-- Política para key_availability
-- Todos podem ler disponibilidade
CREATE POLICY "Everyone can view availability"
  ON key_availability FOR SELECT
  USING (TRUE);

-- ============================================
-- 6. FUNÇÕES AUXILIARES (OPTIONAL)
-- ============================================

-- Função para verificar se chave está disponível em um dia/turno
CREATE OR REPLACE FUNCTION is_key_available(
  p_key_id UUID,
  p_date DATE,
  p_shift TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_reservation BOOLEAN;
  v_has_maintenance BOOLEAN;
  v_has_permission BOOLEAN;
BEGIN
  -- Verificar se existe reserva aprovada
  SELECT EXISTS(
    SELECT 1 FROM key_reservations
    WHERE key_id = p_key_id
    AND reservation_start_date <= p_date
    AND reservation_end_date >= p_date
    AND shift = p_shift
    AND status = 'approved'
  ) INTO v_has_reservation;

  -- Verificar se existe manutenção agendada
  SELECT EXISTS(
    SELECT 1 FROM environment_maintenance
    WHERE key_id = p_key_id
    AND maintenance_start_date <= p_date
    AND maintenance_end_date >= p_date
  ) INTO v_has_maintenance;

  -- Verificar se existe permissão pontual
  SELECT EXISTS(
    SELECT 1 FROM key_permissions
    WHERE key_id = p_key_id
    AND permission_date = p_date
    AND shift = p_shift
  ) INTO v_has_permission;

  -- Chave disponível se:
  -- - NÃO tem reserva aprovada
  -- - NÃO tem manutenção
  -- OU tem permissão pontual
  RETURN (NOT v_has_reservation AND NOT v_has_maintenance) OR v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. TRIGGER PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_key_reservations_updated_at
BEFORE UPDATE ON key_reservations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_environment_maintenance_updated_at
BEFORE UPDATE ON environment_maintenance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_availability_updated_at
BEFORE UPDATE ON key_availability
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Exemplo de manutenção
-- INSERT INTO environment_maintenance (key_id, maintenance_start_date, maintenance_end_date, motivo_resumido, created_by)
-- VALUES (
--   'seu-key-id-aqui',
--   '2026-02-15',
--   '2026-02-16',
--   'Limpeza da sala',
--   'sua-admin-id-aqui'
-- );

-- ============================================
-- DOCUMENTAÇÃO TÉCNICA
-- ============================================
/*

### STATUS DAS RESERVAS:
- pending: Aguardando aprovação do admin
- approved: Aprovada, usuário pode retirar chave
- rejected: Rejeitada, motivo em rejection_reason

### SHIFTS:
- matutino: 7:30 - 11:30 (Devolver até 12:00)
- vespertino: 13:30 - 17:30 (Devolver até 18:00)
- noturno: 18:30 - 22:00 (Devolver até 22:30)
- integral: 08:00 - 17:00 (Devolver até 17:00)

### FLUXO DE DISPONIBILIDADE:
1. Criar manutenção (environment_maintenance) para bloquear período
2. Criar reserva (key_reservations) com datas de início e fim
3. Admin aprova/rejeita reserva
4. Se aprovada, usuário consegue retirar (validando na API)
5. Permissões pontuais (key_permissions) para exceções de última hora

### QUERIES ÚTEIS:
-- Ver todas as reservas pendentes:
SELECT kr.*, k.environment, i.name FROM key_reservations kr
JOIN keys k ON kr.key_id = k.id
JOIN instructors i ON kr.instructor_id = i.id
WHERE kr.status = 'pending'
ORDER BY kr.created_at DESC;

-- Ver se chave está disponível em um período:
SELECT is_key_available('key-uuid', '2026-02-10', 'matutino');

*/
