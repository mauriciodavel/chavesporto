-- Tabela de Turmas
CREATE TABLE turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_turma VARCHAR(15) UNIQUE NOT NULL,
  curso TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  unidades_curriculares TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);

-- Índices para tabela de turmas
CREATE INDEX idx_turmas_codigo ON turmas(codigo_turma);
CREATE INDEX idx_turmas_ativo ON turmas(ativo);
CREATE INDEX idx_turmas_curso ON turmas(curso);

-- Trigger para updated_at
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON turmas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
