-- Tabela de Instrutores
CREATE TABLE instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  technical_area TEXT,
  role TEXT DEFAULT 'instructor' CHECK (role IN ('instructor', 'admin')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);

-- Índices para tabela de instrutores
CREATE INDEX idx_instructors_matricula ON instructors(matricula);
CREATE INDEX idx_instructors_email ON instructors(email);
CREATE INDEX idx_instructors_role ON instructors(role);

-- Tabela de Chaves
CREATE TABLE keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code TEXT UNIQUE NOT NULL,
  environment TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  technical_area TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  qr_code_image BYTEA,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);

-- Índices para tabela de chaves
CREATE INDEX idx_keys_qr_code ON keys(qr_code);
CREATE INDEX idx_keys_status ON keys(status);
CREATE INDEX idx_keys_environment ON keys(environment);

-- Tabela de Histórico de Retiradas
CREATE TABLE key_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES keys(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  withdrawn_at TIMESTAMP NOT NULL DEFAULT now(),
  returned_at TIMESTAMP,
  observation TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Índices para tabela de histórico
CREATE INDEX idx_key_history_key_id ON key_history(key_id);
CREATE INDEX idx_key_history_instructor_id ON key_history(instructor_id);
CREATE INDEX idx_key_history_status ON key_history(status);
CREATE INDEX idx_key_history_withdrawn_at ON key_history(withdrawn_at);

-- Tabela de Configurações de Email
CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_email TEXT NOT NULL,
  business_hours_end TEXT DEFAULT '17:00',
  business_hours_start TEXT DEFAULT '07:00',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO email_settings (alert_email) 
VALUES ('admin@senai.com.br')
ON CONFLICT DO NOTHING;

-- Políticas de Segurança RLS (Row Level Security)
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_history ENABLE ROW LEVEL SECURITY;

-- Política para visualizar chaves
CREATE POLICY "Users can view all keys"
  ON keys FOR SELECT
  USING (deleted_at IS NULL);

-- Política para criar histórico
CREATE POLICY "Users can insert history"
  ON key_history FOR INSERT
  WITH CHECK (true);

-- Política para visualizar seu próprio histórico
CREATE POLICY "Instructors can view their own history"
  ON key_history FOR SELECT
  USING (instructor_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keys_updated_at BEFORE UPDATE ON keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_history_updated_at BEFORE UPDATE ON key_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
